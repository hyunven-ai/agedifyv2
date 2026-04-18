"""
Test suite for live currency exchange rates feature.
Tests GET /api/currencies endpoint with live rates from open.er-api.com
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestCurrencyEndpoint:
    """Tests for /api/currencies endpoint with live exchange rates"""
    
    def test_currencies_endpoint_returns_200(self):
        """GET /api/currencies returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/currencies")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Currencies endpoint returns 200")
    
    def test_currencies_response_structure(self):
        """Response contains required fields: currencies, default, last_updated, source"""
        response = requests.get(f"{BASE_URL}/api/currencies")
        data = response.json()
        
        assert "currencies" in data, "Missing 'currencies' field"
        assert "default" in data, "Missing 'default' field"
        assert "last_updated" in data, "Missing 'last_updated' field"
        assert "source" in data, "Missing 'source' field"
        
        assert data["default"] == "USD", f"Default should be USD, got {data['default']}"
        assert data["source"] == "open.er-api.com", f"Source should be open.er-api.com, got {data['source']}"
        print(f"✓ Response structure correct, source={data['source']}")
    
    def test_last_updated_is_iso_format(self):
        """last_updated field is in ISO format timestamp"""
        response = requests.get(f"{BASE_URL}/api/currencies")
        data = response.json()
        
        last_updated = data.get("last_updated")
        assert last_updated is not None, "last_updated is None"
        
        # Try to parse as ISO format
        try:
            parsed = datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
            print(f"✓ last_updated is valid ISO format: {last_updated}")
        except ValueError as e:
            pytest.fail(f"last_updated is not valid ISO format: {last_updated}, error: {e}")
    
    def test_all_five_currencies_present(self):
        """Response contains all 5 supported currencies: USD, IDR, EUR, GBP, SGD"""
        response = requests.get(f"{BASE_URL}/api/currencies")
        data = response.json()
        
        currencies = data.get("currencies", [])
        currency_codes = [c["code"] for c in currencies]
        
        expected_codes = ["USD", "IDR", "EUR", "GBP", "SGD"]
        for code in expected_codes:
            assert code in currency_codes, f"Missing currency: {code}"
        
        assert len(currencies) == 5, f"Expected 5 currencies, got {len(currencies)}"
        print(f"✓ All 5 currencies present: {currency_codes}")
    
    def test_currency_object_structure(self):
        """Each currency object has code, symbol, name, and rate fields"""
        response = requests.get(f"{BASE_URL}/api/currencies")
        data = response.json()
        
        for currency in data.get("currencies", []):
            assert "code" in currency, f"Missing 'code' in currency: {currency}"
            assert "symbol" in currency, f"Missing 'symbol' in currency: {currency}"
            assert "name" in currency, f"Missing 'name' in currency: {currency}"
            assert "rate" in currency, f"Missing 'rate' in currency: {currency}"
        
        print("✓ All currency objects have required fields")
    
    def test_usd_rate_is_exactly_1(self):
        """USD rate should be exactly 1 (base currency)"""
        response = requests.get(f"{BASE_URL}/api/currencies")
        data = response.json()
        
        usd = next((c for c in data["currencies"] if c["code"] == "USD"), None)
        assert usd is not None, "USD currency not found"
        assert usd["rate"] == 1, f"USD rate should be 1, got {usd['rate']}"
        assert usd["symbol"] == "$", f"USD symbol should be $, got {usd['symbol']}"
        print(f"✓ USD rate is exactly 1")
    
    def test_idr_rate_is_live_not_hardcoded(self):
        """IDR rate should be approximately 16000-18000 (live rate, not old hardcoded 15500)"""
        response = requests.get(f"{BASE_URL}/api/currencies")
        data = response.json()
        
        idr = next((c for c in data["currencies"] if c["code"] == "IDR"), None)
        assert idr is not None, "IDR currency not found"
        
        rate = idr["rate"]
        # Old hardcoded rate was exactly 15500
        assert rate != 15500, f"IDR rate appears to be old hardcoded value 15500"
        # Live rate should be in realistic range
        assert 14000 <= rate <= 20000, f"IDR rate {rate} is outside realistic range (14000-20000)"
        assert idr["symbol"] == "Rp", f"IDR symbol should be Rp, got {idr['symbol']}"
        print(f"✓ IDR rate is live: {rate} (not hardcoded 15500)")
    
    def test_eur_rate_is_realistic(self):
        """EUR rate should be approximately 0.8-1.0"""
        response = requests.get(f"{BASE_URL}/api/currencies")
        data = response.json()
        
        eur = next((c for c in data["currencies"] if c["code"] == "EUR"), None)
        assert eur is not None, "EUR currency not found"
        
        rate = eur["rate"]
        assert 0.7 <= rate <= 1.1, f"EUR rate {rate} is outside realistic range (0.7-1.1)"
        assert eur["symbol"] == "€", f"EUR symbol should be €, got {eur['symbol']}"
        print(f"✓ EUR rate is realistic: {rate}")
    
    def test_gbp_rate_is_realistic(self):
        """GBP rate should be approximately 0.7-0.9"""
        response = requests.get(f"{BASE_URL}/api/currencies")
        data = response.json()
        
        gbp = next((c for c in data["currencies"] if c["code"] == "GBP"), None)
        assert gbp is not None, "GBP currency not found"
        
        rate = gbp["rate"]
        assert 0.6 <= rate <= 1.0, f"GBP rate {rate} is outside realistic range (0.6-1.0)"
        assert gbp["symbol"] == "£", f"GBP symbol should be £, got {gbp['symbol']}"
        print(f"✓ GBP rate is realistic: {rate}")
    
    def test_sgd_rate_is_realistic(self):
        """SGD rate should be approximately 1.2-1.4"""
        response = requests.get(f"{BASE_URL}/api/currencies")
        data = response.json()
        
        sgd = next((c for c in data["currencies"] if c["code"] == "SGD"), None)
        assert sgd is not None, "SGD currency not found"
        
        rate = sgd["rate"]
        assert 1.1 <= rate <= 1.6, f"SGD rate {rate} is outside realistic range (1.1-1.6)"
        assert sgd["symbol"] == "S$", f"SGD symbol should be S$, got {sgd['symbol']}"
        print(f"✓ SGD rate is realistic: {rate}")


class TestHealthEndpoint:
    """Tests for /api/health endpoint"""
    
    def test_health_endpoint_returns_200(self):
        """GET /api/health returns 200 healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") == "healthy", f"Expected healthy status, got {data.get('status')}"
        print("✓ Health endpoint returns healthy status")


class TestDomainsWithCurrency:
    """Tests for domains endpoint to verify prices are available for currency conversion"""
    
    def test_domains_endpoint_returns_prices(self):
        """GET /api/domains returns domains with prices for currency conversion"""
        response = requests.get(f"{BASE_URL}/api/domains?limit=5")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        domains = response.json()
        assert isinstance(domains, list), "Expected list of domains"
        
        if domains:
            domain = domains[0]
            assert "price" in domain, "Domain should have price field"
            assert domain["price"] > 0, "Domain price should be positive"
            print(f"✓ Domains have prices (first domain price: ${domain['price']})")
        else:
            print("✓ Domains endpoint works (no domains in database)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
