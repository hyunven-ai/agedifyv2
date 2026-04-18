"""
Tests for New Features - Iteration 13
Features:
1. Domain Comparison & Advanced Filters (PA, Traffic, Backlinks, TLD, Language)
2. Admin Gallery API endpoints
"""

import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token for admin"""
    response = api_client.post(f"{BASE_URL}/api/admin/login", json={
        "username": "admin",
        "password": "admin123"
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token") or data.get("token")
    pytest.skip("Authentication failed - skipping authenticated tests")

@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Authentication headers"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestHealthAndBasicEndpoints:
    """Basic health check and API availability"""
    
    def test_health_check(self, api_client):
        """Health endpoint should return healthy status"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")

    def test_root_endpoint(self, api_client):
        """Root endpoint should return API info"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ Root endpoint passed")


class TestAdvancedDomainFilters:
    """Test new advanced filter parameters: PA, Traffic, Backlinks, TLD, Language"""
    
    def test_get_all_domains_no_filter(self, api_client):
        """Basic domains endpoint should work"""
        response = api_client.get(f"{BASE_URL}/api/domains")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} domains without filters")
    
    def test_filter_by_min_dr(self, api_client):
        """Filter domains by minimum DR"""
        response = api_client.get(f"{BASE_URL}/api/domains?min_dr=50")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for domain in data:
            assert domain.get("dr", 0) >= 50, f"DR {domain.get('dr')} is less than 50"
        print(f"✓ min_dr filter: {len(data)} domains with DR >= 50")
    
    def test_filter_by_tld_com(self, api_client):
        """Filter domains by TLD .com"""
        response = api_client.get(f"{BASE_URL}/api/domains?tld=.com")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for domain in data:
            # TLD stored in domain or inferred from domain_name
            domain_name = domain.get("domain_name", "")
            tld = domain.get("tld", "")
            assert domain_name.endswith(".com") or tld.lower() == ".com", \
                f"Domain {domain_name} with TLD {tld} doesn't match .com"
        print(f"✓ tld filter: {len(data)} .com domains")
    
    def test_filter_by_tld_io(self, api_client):
        """Filter domains by TLD .io"""
        response = api_client.get(f"{BASE_URL}/api/domains?tld=.io")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ tld filter: {len(data)} .io domains")
    
    def test_filter_by_language_english(self, api_client):
        """Filter domains by language English"""
        response = api_client.get(f"{BASE_URL}/api/domains?language=English")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for domain in data:
            lang = domain.get("language", "")
            assert lang.lower() == "english", f"Domain language {lang} doesn't match English"
        print(f"✓ language filter: {len(data)} English domains")
    
    def test_filter_by_min_pa(self, api_client):
        """Filter domains by minimum PA (Page Authority)"""
        response = api_client.get(f"{BASE_URL}/api/domains?min_pa=20")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for domain in data:
            pa = domain.get("pa", 0)
            assert pa >= 20 or pa is None, f"PA {pa} is less than 20"
        print(f"✓ min_pa filter: {len(data)} domains with PA >= 20")
    
    def test_filter_by_traffic_range(self, api_client):
        """Filter domains by traffic range"""
        response = api_client.get(f"{BASE_URL}/api/domains?min_traffic=1000")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for domain in data:
            traffic = domain.get("traffic", 0)
            if traffic is not None:
                assert traffic >= 1000, f"Traffic {traffic} is less than 1000"
        print(f"✓ min_traffic filter: {len(data)} domains with traffic >= 1000")
    
    def test_filter_by_backlinks_range(self, api_client):
        """Filter domains by backlinks range"""
        response = api_client.get(f"{BASE_URL}/api/domains?min_backlinks=100")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for domain in data:
            backlinks = domain.get("backlinks", 0)
            if backlinks is not None:
                assert backlinks >= 100, f"Backlinks {backlinks} is less than 100"
        print(f"✓ min_backlinks filter: {len(data)} domains with backlinks >= 100")
    
    def test_combined_filters_high_authority(self, api_client):
        """Test combined filters simulating 'High Authority' preset"""
        response = api_client.get(f"{BASE_URL}/api/domains?min_dr=50&min_da=40&status=available")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for domain in data:
            assert domain.get("dr", 0) >= 50
            assert domain.get("da", 0) >= 40
            assert domain.get("status") == "available"
        print(f"✓ High Authority preset: {len(data)} domains with DR>=50, DA>=40, available")
    
    def test_combined_filters_with_tld_and_price(self, api_client):
        """Test combining TLD filter with price filter"""
        response = api_client.get(f"{BASE_URL}/api/domains?min_dr=50&tld=.com")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Combined tld+dr filter: {len(data)} .com domains with DR>=50")
    
    def test_domains_count_with_filters(self, api_client):
        """Count endpoint should accept same filter params"""
        response = api_client.get(f"{BASE_URL}/api/domains/count?min_dr=50&tld=.com")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        print(f"✓ Count with filters: {data['count']} domains")


class TestDomainBySlug:
    """Test domain detail endpoint for comparison feature"""
    
    def test_get_domain_by_slug_techstartup(self, api_client):
        """Get domain by slug for comparison"""
        response = api_client.get(f"{BASE_URL}/api/domains/techstartup-com")
        assert response.status_code == 200
        data = response.json()
        assert "domain_name" in data
        assert "dr" in data
        assert "da" in data
        assert "price" in data
        print(f"✓ Got domain: {data.get('domain_name')} with DR={data.get('dr')}")
    
    def test_get_domain_by_slug_digitalmarketing(self, api_client):
        """Get another domain for comparison"""
        response = api_client.get(f"{BASE_URL}/api/domains/digitalmarketing-io")
        assert response.status_code == 200
        data = response.json()
        assert "domain_name" in data
        print(f"✓ Got domain: {data.get('domain_name')}")
    
    def test_get_domain_by_slug_seotools(self, api_client):
        """Get third domain for comparison"""
        response = api_client.get(f"{BASE_URL}/api/domains/seotools-net")
        assert response.status_code == 200
        data = response.json()
        assert "domain_name" in data
        print(f"✓ Got domain: {data.get('domain_name')}")
    
    def test_get_domain_by_slug_cryptofinance(self, api_client):
        """Get fourth domain for comparison"""
        response = api_client.get(f"{BASE_URL}/api/domains/cryptofinance-org")
        assert response.status_code == 200
        data = response.json()
        assert "domain_name" in data
        print(f"✓ Got domain: {data.get('domain_name')}")
    
    def test_get_domain_not_found(self, api_client):
        """Non-existent domain should return 404"""
        response = api_client.get(f"{BASE_URL}/api/domains/nonexistent-domain-xyz123")
        assert response.status_code == 404
        print("✓ Non-existent domain returns 404")


class TestAdminAuthentication:
    """Test admin authentication for gallery access"""
    
    def test_admin_login_success(self, api_client):
        """Admin login should return access_token"""
        response = api_client.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data or "token" in data
        print("✓ Admin login successful")
    
    def test_admin_login_invalid_credentials(self, api_client):
        """Invalid credentials should return 401"""
        response = api_client.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 403]
        print("✓ Invalid credentials rejected")


class TestAdminGalleryAPI:
    """Test admin gallery endpoints"""
    
    def test_gallery_requires_auth(self, api_client):
        """Gallery endpoint should require authentication"""
        response = api_client.get(f"{BASE_URL}/api/admin/gallery")
        assert response.status_code == 401 or response.status_code == 403
        print("✓ Gallery endpoint requires auth")
    
    def test_gallery_list_images(self, api_client, auth_headers):
        """Get list of images from gallery"""
        response = api_client.get(f"{BASE_URL}/api/admin/gallery", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "images" in data
        assert "total" in data
        assert isinstance(data["images"], list)
        print(f"✓ Gallery contains {data['total']} images")
        
        # Validate image structure
        if data["images"]:
            img = data["images"][0]
            assert "filename" in img
            assert "url" in img
            assert "size" in img
            print(f"✓ First image: {img['filename']} ({img['size']} bytes)")
    
    def test_gallery_image_url_format(self, api_client, auth_headers):
        """Gallery image URLs should be properly formatted"""
        response = api_client.get(f"{BASE_URL}/api/admin/gallery", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        for img in data.get("images", []):
            url = img.get("url", "")
            assert url.startswith("/api/uploads/"), f"Invalid URL format: {url}"
        print("✓ All image URLs properly formatted")


class TestAdminMe:
    """Test admin profile endpoint"""
    
    def test_admin_me_requires_auth(self, api_client):
        """Admin me endpoint should require authentication"""
        response = api_client.get(f"{BASE_URL}/api/admin/me")
        assert response.status_code == 401 or response.status_code == 403
        print("✓ Admin/me requires auth")
    
    def test_admin_me_with_auth(self, api_client, auth_headers):
        """Admin me endpoint should return admin info"""
        response = api_client.get(f"{BASE_URL}/api/admin/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "username" in data
        print(f"✓ Admin me: {data.get('username')}")


class TestSortingParams:
    """Test sorting by new fields"""
    
    def test_sort_by_pa(self, api_client):
        """Sort domains by PA"""
        response = api_client.get(f"{BASE_URL}/api/domains?sort_by=pa&sort_order=desc")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Sorted by PA desc: {len(data)} domains")
    
    def test_sort_by_backlinks(self, api_client):
        """Sort domains by backlinks"""
        response = api_client.get(f"{BASE_URL}/api/domains?sort_by=backlinks&sort_order=desc")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Sorted by backlinks desc: {len(data)} domains")
    
    def test_sort_by_traffic(self, api_client):
        """Sort domains by traffic"""
        response = api_client.get(f"{BASE_URL}/api/domains?sort_by=traffic&sort_order=desc")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Sorted by traffic desc: {len(data)} domains")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
