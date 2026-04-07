from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
LOG_DIR = BASE_DIR / "logs"
OUTPUT_DIR = Path(os.getenv("CPPP_OUTPUT_DIR", BASE_DIR / "output"))

HEADLESS = os.getenv("CPPP_HEADLESS", "true").strip().lower() in {"1", "true", "yes", "on"}
MAX_PAGES = int(os.getenv("CPPP_MAX_PAGES", "0"))
DELAY_BETWEEN_REQUESTS = float(os.getenv("CPPP_DELAY_BETWEEN_REQUESTS", "3"))
CAPTCHA_MAX_RETRIES = int(os.getenv("CPPP_CAPTCHA_MAX_RETRIES", "3"))
PAGE_LOAD_TIMEOUT = int(os.getenv("CPPP_PAGE_LOAD_TIMEOUT", "45"))
API_ENDPOINT = os.getenv("CPPP_API_ENDPOINT", "http://localhost:3000/api/scrapers/ingest")
SOURCE_PORTAL = "CPPP"
START_URL = (
    "https://etenders.gov.in/eprocure/app?"
    "page=FrontEndTendersByOrganisation&service=page"
)
TESSERACT_CMD = os.getenv("TESSERACT_CMD", "")

LOG_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
