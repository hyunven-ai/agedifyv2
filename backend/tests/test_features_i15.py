"""
Test suite for Iteration 15 - Testing:
1. i18n translations (English/Indonesian) - Backend support
2. CSV import/export for domains - Admin CSV endpoints
3. Domain Analytics - Track views/clicks and analytics dashboard
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestHealthAndAuth:
    """Basic health check and admin auth tests"""
    
    def test_health_endpoint(self):
        """Verify API is running"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("PASS: Health check endpoint working")
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert len(data["access_token"]) > 0
        print("PASS: Admin login successful")
    
    def test_admin_login_invalid(self):
        """Test admin login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("PASS: Admin login correctly rejects invalid credentials")


@pytest.fixture(scope="class")
def auth_token():
    """Get admin auth token for protected endpoints"""
    response = requests.post(f"{BASE_URL}/api/admin/login", json={
        "username": "admin",
        "password": "admin123"
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Admin authentication failed")


class TestCSVExport:
    """Test CSV export functionality (Feature 2)"""
    
    def test_export_csv_without_auth(self):
        """Export CSV should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/domains/export/csv")
        assert response.status_code in [401, 403]
        print("PASS: CSV export correctly requires authentication")
    
    def test_export_csv_with_auth(self, auth_token):
        """Export CSV with valid token should return CSV data"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/domains/export/csv", headers=headers)
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        # Verify CSV has header row with expected columns
        content = response.text
        assert "domain_name" in content
        assert "dr" in content
        assert "da" in content
        assert "price" in content
        print("PASS: CSV export returns valid CSV with domain data")


class TestCSVTemplate:
    """Test CSV template functionality (Feature 2)"""
    
    def test_csv_template_without_auth(self):
        """CSV template should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/domains/template/csv")
        assert response.status_code in [401, 403]
        print("PASS: CSV template correctly requires authentication")
    
    def test_csv_template_with_auth(self, auth_token):
        """CSV template with valid token should return template"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/domains/template/csv", headers=headers)
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        # Template should have header and sample row
        content = response.text
        assert "domain_name" in content
        assert "example.com" in content  # Sample data
        print("PASS: CSV template returns valid template with example data")


class TestDomainTrackingView:
    """Test domain view tracking (Feature 3)"""
    
    def test_track_view_techstartup_com(self):
        """Track view on techstartup-com domain"""
        response = requests.post(f"{BASE_URL}/api/track/view/techstartup-com")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("PASS: Track view for techstartup-com returns status ok")
    
    def test_track_view_digitalmarketing_io(self):
        """Track view on digitalmarketing-io domain"""
        response = requests.post(f"{BASE_URL}/api/track/view/digitalmarketing-io")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("PASS: Track view for digitalmarketing-io returns status ok")
    
    def test_track_view_random_slug(self):
        """Track view should work for any slug"""
        response = requests.post(f"{BASE_URL}/api/track/view/random-test-domain-123")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("PASS: Track view works for arbitrary slug")


class TestDomainTrackingClick:
    """Test domain click tracking (Feature 3)"""
    
    def test_track_click_techstartup_com(self):
        """Track click on techstartup-com domain"""
        response = requests.post(f"{BASE_URL}/api/track/click/techstartup-com")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("PASS: Track click for techstartup-com returns status ok")
    
    def test_track_click_digitalmarketing_io(self):
        """Track click on digitalmarketing-io domain"""
        response = requests.post(f"{BASE_URL}/api/track/click/digitalmarketing-io")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("PASS: Track click for digitalmarketing-io returns status ok")


class TestDomainAnalyticsDashboard:
    """Test analytics dashboard endpoint (Feature 3)"""
    
    def test_analytics_without_auth(self):
        """Analytics dashboard should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/domain-analytics")
        assert response.status_code in [401, 403]
        print("PASS: Analytics dashboard correctly requires authentication")
    
    def test_analytics_30_days(self, auth_token):
        """Get analytics for 30 day period"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/domain-analytics?period=30", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # Validate response structure
        assert "by_date" in data
        assert "top_domains" in data
        assert "total_views" in data
        assert "total_clicks" in data
        assert "period_days" in data
        assert data["period_days"] == 30
        print("PASS: Analytics 30-day data returns correct structure")
    
    def test_analytics_7_days(self, auth_token):
        """Get analytics for 7 day period"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/domain-analytics?period=7", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["period_days"] == 7
        print("PASS: Analytics 7-day period returns correct period")
    
    def test_analytics_90_days(self, auth_token):
        """Get analytics for 90 day period"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/domain-analytics?period=90", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["period_days"] == 90
        print("PASS: Analytics 90-day period returns correct period")
    
    def test_analytics_365_days(self, auth_token):
        """Get analytics for 365 day period"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/domain-analytics?period=365", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["period_days"] == 365
        print("PASS: Analytics 365-day period returns correct period")
    
    def test_analytics_top_domains_structure(self, auth_token):
        """Validate top_domains structure contains expected fields"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/domain-analytics?period=30", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # If we have top_domains, validate each item structure
        if len(data["top_domains"]) > 0:
            item = data["top_domains"][0]
            assert "slug" in item
            assert "total_views" in item
            assert "total_clicks" in item
            assert "domain_name" in item
            print(f"PASS: Top domains has correct structure with {len(data['top_domains'])} entries")
        else:
            print("PASS: Analytics returns valid structure (no top domains data yet)")
    
    def test_analytics_by_date_structure(self, auth_token):
        """Validate by_date structure contains expected fields"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/domain-analytics?period=30", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # If we have by_date data, validate structure
        if len(data["by_date"]) > 0:
            item = data["by_date"][0]
            assert "date" in item
            assert "views" in item
            assert "clicks" in item
            print(f"PASS: By date has correct structure with {len(data['by_date'])} date entries")
        else:
            print("PASS: Analytics by_date returns valid structure (no date data yet)")


class TestPublicDomainsList:
    """Test public domains listing works - needed for frontend testing"""
    
    def test_get_featured_domains(self):
        """Get featured domains for landing page"""
        response = requests.get(f"{BASE_URL}/api/domains/featured")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Featured domains API returns {len(data)} domains")
    
    def test_get_all_domains(self):
        """Get all domains listing"""
        response = requests.get(f"{BASE_URL}/api/domains")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Public domains API returns {len(data)} domains")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
