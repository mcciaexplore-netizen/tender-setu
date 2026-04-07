# CPPP Scraper

Python scraper for India's Central Public Procurement Portal (CPPP) at `etenders.gov.in`.

## Features

- Navigates the CPPP tenders-by-organisation page
- Uses Selenium with Chrome headless support
- Attempts CAPTCHA solving with Tesseract OCR and retries up to 3 times
- Parses tender listings with BeautifulSoup4
- Handles pagination across result pages
- Writes tender data to JSON
- Posts scraped records to `http://localhost:3000/api/scrapers/ingest`
- Logs to both console and `logs/cppp_scraper.log`
- Continues processing if one tender fails

## Output Schema

Each tender is written as:

```json
{
  "title": "",
  "referenceNumber": "",
  "issuingAuthority": "",
  "department": "",
  "estimatedValue": null,
  "emdAmount": null,
  "publishedDate": "ISO date",
  "submissionDeadline": "ISO date",
  "tenderDocUrl": "",
  "sourceUrl": "",
  "sourcePortal": "CPPP"
}
```

## Requirements

System dependencies:

- Google Chrome
- ChromeDriver compatible with your Chrome version, available in `PATH` or discoverable by Selenium
- Tesseract OCR installed on the machine

Python dependencies are listed in `requirements.txt`.

## Setup

```bash
cd backend/scrapers/cppp
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

If Tesseract is not in your shell `PATH`, set:

```bash
export TESSERACT_CMD=/absolute/path/to/tesseract
```

Common macOS install example:

```bash
brew install tesseract
```

## Configuration

Settings live in `config.py` and can also be overridden with environment variables:

- `CPPP_HEADLESS=true`
- `CPPP_MAX_PAGES=0` (`0` means all pages)
- `CPPP_DELAY_BETWEEN_REQUESTS=3`
- `CPPP_CAPTCHA_MAX_RETRIES=3`
- `CPPP_PAGE_LOAD_TIMEOUT=45`
- `CPPP_OUTPUT_DIR=/absolute/output/path`
- `CPPP_API_ENDPOINT=http://localhost:3000/api/scrapers/ingest`
- `TESSERACT_CMD=/absolute/path/to/tesseract`

## Run

```bash
cd backend/scrapers/cppp
python scraper.py
```

## Logs and Output

- Logs: `backend/scrapers/cppp/logs/cppp_scraper.log`
- JSON output: `backend/scrapers/cppp/output/cppp_tenders_YYYYMMDD_HHMMSS.json`

## Notes

- CAPTCHA OCR can fail intermittently. The scraper refreshes and retries automatically.
- CPPP markup may change over time, so selectors in `scraper.py` are written defensively.
- If the ingest API is unavailable, the scraper logs the POST failure and still preserves the JSON file.
