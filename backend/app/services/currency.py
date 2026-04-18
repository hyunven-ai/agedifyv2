import logging
import asyncio
from datetime import datetime, timezone, timedelta
import httpx

from app.db.database import db

logger = logging.getLogger(__name__)

EXCHANGE_API_URL = "https://open.er-api.com/v6/latest/USD"

SUPPORTED_CURRENCIES = [
    {"code": "USD", "symbol": "$", "name": "US Dollar"},
    {"code": "IDR", "symbol": "Rp", "name": "Indonesian Rupiah"},
    {"code": "EUR", "symbol": "\u20ac", "name": "Euro"},
    {"code": "GBP", "symbol": "\u00a3", "name": "British Pound"},
    {"code": "SGD", "symbol": "S$", "name": "Singapore Dollar"},
]

FALLBACK_RATES = {"USD": 1, "IDR": 15500, "EUR": 0.92, "GBP": 0.79, "SGD": 1.34}

_bg_task = None


async def fetch_live_rates():
    """Fetch live exchange rates from ExchangeRate API."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(EXCHANGE_API_URL)
        resp.raise_for_status()
        data = resp.json()
        if data.get("result") != "success":
            raise ValueError(f"API returned non-success: {data.get('result')}")
        return data["rates"]


async def update_rates():
    """Fetch live rates and cache them in MongoDB."""
    try:
        api_rates = await fetch_live_rates()
        rates = {}
        for cur in SUPPORTED_CURRENCIES:
            code = cur["code"]
            rates[code] = api_rates.get(code, FALLBACK_RATES.get(code, 1))

        doc = {
            "key": "exchange_rates",
            "rates": rates,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "source": "open.er-api.com",
        }
        await db.settings.update_one(
            {"key": "exchange_rates"}, {"$set": doc}, upsert=True
        )
        logger.info(f"Exchange rates updated: {rates}")
        return rates
    except Exception as e:
        logger.warning(f"Failed to fetch live rates: {e}")
        return None


async def get_cached_rates():
    """Get cached rates from MongoDB, fetch if missing or stale (>24h)."""
    cached = await db.settings.find_one({"key": "exchange_rates"}, {"_id": 0})
    if cached:
        updated_at = datetime.fromisoformat(cached["updated_at"])
        age = datetime.now(timezone.utc) - updated_at
        if age < timedelta(hours=24):
            return cached
        # Stale, refresh in background but return cached for now
        fresh = await update_rates()
        if fresh:
            return await db.settings.find_one({"key": "exchange_rates"}, {"_id": 0})
        return cached
    # No cache at all, fetch now
    await update_rates()
    cached = await db.settings.find_one({"key": "exchange_rates"}, {"_id": 0})
    return cached


async def get_currencies_response():
    """Build the currencies response with live rates."""
    cached = await get_cached_rates()
    rates = cached["rates"] if cached else FALLBACK_RATES
    updated_at = cached["updated_at"] if cached else None
    source = cached.get("source", "fallback") if cached else "fallback"

    currencies = []
    for cur in SUPPORTED_CURRENCIES:
        currencies.append({
            **cur,
            "rate": rates.get(cur["code"], 1),
        })

    return {
        "currencies": currencies,
        "default": "USD",
        "last_updated": updated_at,
        "source": source,
    }


async def _rate_refresh_loop():
    """Background loop to refresh rates every 24 hours."""
    while True:
        await asyncio.sleep(86400)  # 24 hours
        logger.info("Scheduled exchange rate refresh")
        await update_rates()


async def start_currency_service():
    """Initialize currency service: fetch rates and start background refresh."""
    global _bg_task
    await update_rates()
    _bg_task = asyncio.create_task(_rate_refresh_loop())
    logger.info("Currency service started with 24h auto-refresh")
