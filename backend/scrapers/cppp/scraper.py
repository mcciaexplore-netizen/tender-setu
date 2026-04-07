from __future__ import annotations

import json
import logging
import re
import time
from dataclasses import dataclass
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urljoin

import pytesseract
import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageFilter, ImageOps
from requests import RequestException
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException, TimeoutException, WebDriverException
from selenium.webdriver import ChromeOptions
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

import config


@dataclass
class TenderRecord:
    title: str = ""
    referenceNumber: str = ""
    issuingAuthority: str = ""
    department: str = ""
    estimatedValue: float | None = None
    emdAmount: float | None = None
    publishedDate: str | None = None
    submissionDeadline: str | None = None
    tenderDocUrl: str = ""
    sourceUrl: str = ""
    sourcePortal: str = config.SOURCE_PORTAL

    def to_dict(self) -> dict[str, Any]:
        return {
            "title": self.title,
            "referenceNumber": self.referenceNumber,
            "issuingAuthority": self.issuingAuthority,
            "department": self.department,
            "estimatedValue": self.estimatedValue,
            "emdAmount": self.emdAmount,
            "publishedDate": self.publishedDate,
            "submissionDeadline": self.submissionDeadline,
            "tenderDocUrl": self.tenderDocUrl,
            "sourceUrl": self.sourceUrl,
            "sourcePortal": self.sourcePortal,
        }


class CPPPScraper:
    def __init__(self) -> None:
        self.logger = self._build_logger()
        self.driver = self._build_driver()
        self.wait = WebDriverWait(self.driver, config.PAGE_LOAD_TIMEOUT)
        self.session = requests.Session()
        self.results: list[dict[str, Any]] = []
        self.seen_keys: set[str] = set()

        if config.TESSERACT_CMD:
            pytesseract.pytesseract.tesseract_cmd = config.TESSERACT_CMD

    def _build_logger(self) -> logging.Logger:
        logger = logging.getLogger("cppp_scraper")
        if logger.handlers:
            return logger

        logger.setLevel(logging.INFO)
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            "%Y-%m-%d %H:%M:%S",
        )

        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)

        file_handler = logging.FileHandler(config.LOG_DIR / "cppp_scraper.log")
        file_handler.setFormatter(formatter)

        logger.addHandler(console_handler)
        logger.addHandler(file_handler)
        logger.propagate = False
        return logger

    def _build_driver(self) -> webdriver.Chrome:
        options = ChromeOptions()
        if config.HEADLESS:
            options.add_argument("--headless=new")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1600,2400")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--lang=en-IN")

        try:
            driver = webdriver.Chrome(options=options)
        except WebDriverException:
            driver = webdriver.Chrome(service=Service(), options=options)

        driver.set_page_load_timeout(config.PAGE_LOAD_TIMEOUT)
        return driver

    def run(self) -> None:
        try:
            self.logger.info("Opening CPPP portal: %s", config.START_URL)
            self.driver.get(config.START_URL)
            self.wait_for_results_page()
            self.scrape_pages()
            output_path = self.save_results()
            self.post_results()
            self.logger.info("Scraping finished. %s tenders saved to %s", len(self.results), output_path)
        finally:
            self.driver.quit()
            self.session.close()

    def wait_for_results_page(self) -> None:
        if self._results_are_visible():
            return

        if not self.solve_captcha_with_retries():
            raise RuntimeError("Failed to solve CAPTCHA after maximum retries")

        self.wait.until(lambda driver: self._results_are_visible())
        time.sleep(config.DELAY_BETWEEN_REQUESTS)

    def _results_are_visible(self) -> bool:
        current_html = self.driver.page_source.lower()
        if "captcha" in current_html and not self._contains_listing_content(current_html):
            return False

        try:
            listing_candidates = self.driver.find_elements(
                By.CSS_SELECTOR,
                "table tr, div[class*='tender'], div[class*='list'], div[id*='list']",
            )
            return len(listing_candidates) > 5
        except WebDriverException:
            return False

    def _contains_listing_content(self, html: str) -> bool:
        markers = ["published date", "closing date", "organisation chain", "tender reference number"]
        return any(marker in html for marker in markers)

    def solve_captcha_with_retries(self) -> bool:
        for attempt in range(1, config.CAPTCHA_MAX_RETRIES + 1):
            try:
                captcha_text = self._read_captcha_text()
                if not captcha_text:
                    raise ValueError("OCR returned an empty CAPTCHA string")

                self.logger.info("Submitting CAPTCHA attempt %s with OCR text '%s'", attempt, captcha_text)
                self._submit_captcha(captcha_text)
                time.sleep(config.DELAY_BETWEEN_REQUESTS)

                if self._results_are_visible():
                    self.logger.info("CAPTCHA solved on attempt %s", attempt)
                    return True

                self.logger.warning("CAPTCHA attempt %s did not reach results page", attempt)
                self._refresh_captcha()
            except Exception as exc:  # noqa: BLE001
                self.logger.warning("CAPTCHA attempt %s failed: %s", attempt, exc)
                self._refresh_captcha()

        return False

    def _read_captcha_text(self) -> str:
        captcha_image = self._find_first(
            [
                (By.CSS_SELECTOR, "img[src*='captcha']"),
                (By.CSS_SELECTOR, "img[id*='captcha']"),
                (
                    By.XPATH,
                    "//img[contains(translate(@alt, 'CAPTCHA', 'captcha'), 'captcha') "
                    "or contains(translate(@title, 'CAPTCHA', 'captcha'), 'captcha') "
                    "or contains(translate(@src, 'CAPTCHA', 'captcha'), 'captcha')]",
                ),
            ]
        )
        png_bytes = captcha_image.screenshot_as_png
        image = Image.open(BytesIO(png_bytes))
        image = image.convert("L")
        image = ImageOps.autocontrast(image)
        image = image.filter(ImageFilter.MedianFilter(size=3))
        image = image.point(lambda pixel: 255 if pixel > 160 else 0)
        raw_text = pytesseract.image_to_string(
            image,
            config="--psm 8 --oem 3 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        )
        return re.sub(r"[^A-Z0-9]", "", raw_text.upper())

    def _submit_captcha(self, captcha_text: str) -> None:
        input_box = self._find_first(
            [
                (By.CSS_SELECTOR, "input[name*='captcha']"),
                (By.CSS_SELECTOR, "input[id*='captcha']"),
                (
                    By.XPATH,
                    "//input[contains(translate(@placeholder, 'CAPTCHA', 'captcha'), 'captcha') "
                    "or contains(translate(@name, 'CAPTCHA', 'captcha'), 'captcha') "
                    "or contains(translate(@id, 'CAPTCHA', 'captcha'), 'captcha')]",
                ),
            ]
        )
        input_box.clear()
        input_box.send_keys(captcha_text)

        submit_button = self._find_optional(
            [
                (By.CSS_SELECTOR, "input[type='submit']"),
                (By.CSS_SELECTOR, "button[type='submit']"),
                (
                    By.XPATH,
                    "//a[contains(., 'Search') or contains(., 'Submit') or contains(., 'View') or contains(., 'Go')]",
                ),
            ]
        )
        if submit_button is not None:
            submit_button.click()
            return

        input_box.submit()

    def _refresh_captcha(self) -> None:
        refresh_button = self._find_optional(
            [
                (By.CSS_SELECTOR, "img[title*='Refresh']"),
                (By.CSS_SELECTOR, "a[title*='Refresh']"),
                (By.XPATH, "//a[contains(., 'Refresh') or contains(., 'reload') or contains(., 'Reload')]"),
                (By.XPATH, "//img[contains(translate(@src, 'REFRESH', 'refresh'), 'refresh')]"),
            ]
        )
        if refresh_button is not None:
            refresh_button.click()
            time.sleep(1)
            return

        self.driver.refresh()
        time.sleep(config.DELAY_BETWEEN_REQUESTS)

    def _find_first(self, locators: list[tuple[str, str]]) -> WebElement:
        for by, value in locators:
            try:
                return self.wait.until(EC.presence_of_element_located((by, value)))
            except TimeoutException:
                continue
        raise NoSuchElementException(f"Unable to find any element for locators: {locators}")

    def _find_optional(self, locators: list[tuple[str, str]]) -> WebElement | None:
        for by, value in locators:
            try:
                elements = self.driver.find_elements(by, value)
                if elements:
                    return elements[0]
            except WebDriverException:
                continue
        return None

    def scrape_pages(self) -> None:
        page_number = 1
        while True:
            if config.MAX_PAGES and page_number > config.MAX_PAGES:
                self.logger.info("Reached configured max pages limit: %s", config.MAX_PAGES)
                break

            self.logger.info("Parsing page %s", page_number)
            self.parse_current_page(page_number)

            if not self.go_to_next_page(page_number):
                break

            page_number += 1
            time.sleep(config.DELAY_BETWEEN_REQUESTS)

    def parse_current_page(self, page_number: int) -> None:
        soup = BeautifulSoup(self.driver.page_source, "html.parser")
        containers = self.extract_listing_containers(soup)
        self.logger.info("Found %s listing containers on page %s", len(containers), page_number)

        for index, container in enumerate(containers, start=1):
            try:
                record = self.parse_tender(container)
                if not record.title and not record.referenceNumber:
                    raise ValueError("Tender record missing both title and reference number")

                dedupe_key = f"{record.referenceNumber}|{record.title}|{record.submissionDeadline}"
                if dedupe_key in self.seen_keys:
                    continue

                self.seen_keys.add(dedupe_key)
                self.results.append(record.to_dict())
            except Exception as exc:  # noqa: BLE001
                self.logger.exception("Failed to parse tender %s on page %s: %s", index, page_number, exc)

    def extract_listing_containers(self, soup: BeautifulSoup) -> list[Any]:
        table_rows: list[Any] = []
        for table in soup.select("table"):
            rows = table.select("tr")
            if len(rows) < 2:
                continue

            data_rows = [row for row in rows if row.find_all("td")]
            if len(data_rows) >= 2:
                table_rows.extend(data_rows)

        if table_rows:
            return table_rows

        selectors = [
            "div.tender, div.tenderRow, div.listing, div.result, div[class*='tender'], div[class*='Tender']",
            "li[class*='tender'], li[class*='Tender'], li[class*='listing']",
        ]
        for selector in selectors:
            nodes = soup.select(selector)
            if nodes:
                return nodes

        return []

    def parse_tender(self, container: Any) -> TenderRecord:
        text_lines = self._extract_text_lines(container)
        full_text = "\n".join(text_lines)
        title = self._extract_title(container, text_lines)
        reference_number = self._extract_field(
            text_lines,
            ["tender reference number", "reference number", "tender id", "tender no"],
        )
        issuing_authority = self._extract_field(
            text_lines,
            ["organisation chain", "organization chain", "organisation name", "organization name"],
        )
        department = self._extract_field(text_lines, ["department", "ministry", "division"])
        estimated_value = self._parse_money(
            self._extract_field(text_lines, ["tender value", "value", "estimated value"])
        )
        emd_amount = self._parse_money(
            self._extract_field(text_lines, ["emd amount", "emd", "earnest money deposit"])
        )
        published_date = self._parse_date(
            self._extract_field(text_lines, ["published date", "publishing date", "published on"])
        )
        submission_deadline = self._parse_date(
            self._extract_field(
                text_lines,
                ["closing date", "closing date and time", "bid submission closing date", "submission end date"],
            )
        )

        if not department and issuing_authority and "/" in issuing_authority:
            department = issuing_authority.split("/")[-1].strip()

        tender_doc_url = self._extract_document_link(container)
        if not reference_number:
            reference_number = self._extract_reference_from_text(full_text)

        return TenderRecord(
            title=title,
            referenceNumber=reference_number,
            issuingAuthority=issuing_authority,
            department=department,
            estimatedValue=estimated_value,
            emdAmount=emd_amount,
            publishedDate=published_date,
            submissionDeadline=submission_deadline,
            tenderDocUrl=tender_doc_url,
            sourceUrl=self.driver.current_url,
        )

    def _extract_text_lines(self, container: Any) -> list[str]:
        raw_lines = [segment.strip() for segment in container.get_text("\n", strip=True).splitlines()]
        return [line for line in raw_lines if line]

    def _extract_title(self, container: Any, text_lines: list[str]) -> str:
        for selector in ["a", "strong", "b", "span"]:
            node = container.select_one(selector)
            if node:
                text = self._clean_label(node.get_text(" ", strip=True))
                if len(text) > 8:
                    return text

        for line in text_lines:
            cleaned = self._clean_label(line)
            if not any(keyword in cleaned.lower() for keyword in ["published date", "closing date", "emd", "value"]):
                return cleaned
        return ""

    def _extract_field(self, text_lines: Iterable[str], labels: list[str]) -> str:
        normalized_labels = [label.lower() for label in labels]
        text_list = list(text_lines)
        for index, line in enumerate(text_list):
            lowered = line.lower()
            for label in normalized_labels:
                if label not in lowered:
                    continue

                parts = re.split(r":|\|", line, maxsplit=1)
                if len(parts) > 1:
                    candidate = self._clean_label(parts[1])
                    if candidate:
                        return candidate

                suffix = line[lowered.find(label) + len(label) :]
                candidate = self._clean_label(suffix)
                if candidate:
                    return candidate

                if index + 1 < len(text_list):
                    candidate = self._clean_label(text_list[index + 1])
                    if candidate:
                        return candidate
        return ""

    def _extract_reference_from_text(self, text: str) -> str:
        patterns = [
            r"(?:Tender\s+ID|Tender\s+No\.?|Reference\s+Number)\s*[:\-]?\s*([A-Z0-9\-/]+)",
            r"\b[A-Z]{2,}(?:/[A-Z0-9\-]+){1,}\b",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip() if match.lastindex else match.group(0).strip()
        return ""

    def _extract_document_link(self, container: Any) -> str:
        anchors = container.select("a[href]")
        priority_terms = ["download", "document", "tender", "nit", "pdf"]
        for anchor in anchors:
            href = anchor.get("href", "").strip()
            label = anchor.get_text(" ", strip=True).lower()
            if not href:
                continue
            if any(term in label for term in priority_terms) or href.lower().endswith(".pdf"):
                return urljoin(self.driver.current_url, href)

        if anchors:
            return urljoin(self.driver.current_url, anchors[0].get("href", "").strip())
        return ""

    def _parse_money(self, value: str) -> float | None:
        if not value:
            return None

        cleaned = value.replace(",", "")
        match = re.search(r"(\d+(?:\.\d+)?)", cleaned)
        if not match:
            return None

        try:
            return float(match.group(1))
        except ValueError:
            return None

    def _parse_date(self, value: str) -> str | None:
        if not value:
            return None

        cleaned = re.sub(r"\s+", " ", value).strip()
        formats = [
            "%d-%b-%Y %I:%M %p",
            "%d-%b-%Y %H:%M",
            "%d-%m-%Y %H:%M",
            "%d-%m-%Y %I:%M %p",
            "%d/%m/%Y %H:%M",
            "%d/%m/%Y %I:%M %p",
            "%d-%b-%Y",
            "%d-%m-%Y",
            "%d/%m/%Y",
            "%d-%b-%Y %I:%M:%S %p",
            "%d-%m-%Y %I:%M:%S %p",
        ]
        for date_format in formats:
            try:
                parsed = datetime.strptime(cleaned, date_format)
                return parsed.isoformat()
            except ValueError:
                continue
        return None

    def _clean_label(self, value: str) -> str:
        return re.sub(r"\s+", " ", value.replace("\xa0", " ")).strip(" :-\t")

    def go_to_next_page(self, current_page: int) -> bool:
        next_button = self._find_next_button(current_page)
        if next_button is None:
            self.logger.info("No next-page control found after page %s", current_page)
            return False

        current_url = self.driver.current_url
        before_marker = self._current_page_marker()
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", next_button)
        self.driver.execute_script("arguments[0].click();", next_button)

        try:
            self.wait.until(
                lambda driver: driver.current_url != current_url or self._current_page_marker() != before_marker
            )
            return True
        except TimeoutException:
            self.logger.warning("Timed out waiting for page navigation after page %s", current_page)
            return False

    def _find_next_button(self, current_page: int) -> WebElement | None:
        candidates = [
            (By.LINK_TEXT, "Next"),
            (By.PARTIAL_LINK_TEXT, "Next"),
            (By.XPATH, "//a[contains(@title, 'Next') or normalize-space()='>' or normalize-space()='>>']"),
            (By.XPATH, f"//a[normalize-space()='{current_page + 1}']"),
            (By.XPATH, f"//button[normalize-space()='{current_page + 1}']"),
        ]
        return self._find_optional(candidates)

    def _current_page_marker(self) -> str:
        html = self.driver.page_source
        match = re.search(r"(?:Page|page)\s*(\d+)", html)
        if match:
            return match.group(1)
        return html[:500]

    def save_results(self) -> Path:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = config.OUTPUT_DIR / f"cppp_tenders_{timestamp}.json"
        with output_path.open("w", encoding="utf-8") as handle:
            json.dump(self.results, handle, indent=2, ensure_ascii=False)
        return output_path

    def post_results(self) -> None:
        if not self.results:
            self.logger.info("No tender records collected; skipping API ingest")
            return

        payload = {"sourcePortal": config.SOURCE_PORTAL, "records": self.results}
        try:
            response = self.session.post(config.API_ENDPOINT, json=payload, timeout=30)
            response.raise_for_status()
            self.logger.info("Posted %s tenders to %s", len(self.results), config.API_ENDPOINT)
        except RequestException as exc:
            self.logger.error("Failed to POST results to ingest API: %s", exc)


if __name__ == "__main__":
    scraper = CPPPScraper()
    scraper.run()
