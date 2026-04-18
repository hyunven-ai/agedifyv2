"""
Test cases for:
- Feature 2: CSV Export/Import/Template endpoints
- Feature 3: Analytics tracking and dashboard endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasics:
    """Basic health checks"""
    
    def test_health_check(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("PASS: Health check passed")


class TestAdminAuth:
    """Admin authentication for authenticated endpoints"""
    
    def test_admin_login(self):
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        print(f"PASS: Admin login successful, token type: {data.get('token_type', 'N/A')}")
        return data["access_token"]


class TestCSVEndpoints:
    """Feature 2: CSV Export/Import/Template endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        # Get auth token
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if response.status_code == 200:
            self.token = response.json().get("access_token")
        else:
            pytest.skip("Could not authenticate as admin")
    
    def test_export_csv_without_auth(self):
        """Export CSV should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/domains/export/csv")
        assert response.status_code in [401, 403]
        print(f"PASS: Export CSV requires authentication (status: {response.status_code})")
    
    def test_export_csv_with_auth(self):
        """Export CSV should return valid CSV data"""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{BASE_URL}/api/admin/domains/export/csv", headers=headers)
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        content = response.text
        # Check CSV has header row
        assert "domain_name" in content.lower()
        assert "dr" in content.lower()
        assert "da" in content.lower()
        print(f"PASS: Export CSV returned valid CSV data, size: {len(content)} bytes")
    
    def test_get_csv_template_without_auth(self):
        """CSV Template should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/domains/template/csv")
        assert response.status_code in [401, 403]
        print(f"PASS: CSV Template requires authentication (status: {response.status_code})")
    
    def test_get_csv_template_with_auth(self):
        """CSV Template should return valid template"""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{BASE_URL}/api/admin/domains/template/csv", headers=headers)
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        content = response.text
        # Template should have header and example row
        assert "domain_name" in content.lower()
        assert "example.com" in content.lower()
        print(f"PASS: CSV Template returned valid template, content preview: {content[:200]}")
    
    def test_import_csv_without_auth(self):
        """Import CSV should require authentication"""
        files = {'file': ('test.csv', 'domain_name,dr,da\ntest.com,50,45', 'text/csv')}
        response = requests.post(f"{BASE_URL}/api/admin/domains/import/csv", files=files)
        assert response.status_code in [401, 403]
        print(f"PASS: Import CSV requires authentication (status: {response.status_code})")


class TestAnalyticsTracking:
    """Feature 3: Analytics tracking endpoints (public, no auth needed)"""
    
    def test_track_view_techstartup(self):
        """Track domain view for techstartup-com"""
        response = requests.post(f"{BASE_URL}/api/track/view/techstartup-com")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("PASS: Track view for techstartup-com succeeded")
    
    def test_track_click_techstartup(self):
        """Track domain click for techstartup-com"""
        response = requests.post(f"{BASE_URL}/api/track/click/techstartup-com")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("PASS: Track click for techstartup-com succeeded")
    
    def test_track_view_digitalmarketing(self):
        """Track domain view for digitalmarketing-io"""
        response = requests.post(f"{BASE_URL}/api/track/view/digitalmarketing-io")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("PASS: Track view for digitalmarketing-io succeeded")
    
    def test_track_click_digitalmarketing(self):
        """Track domain click for digitalmarketing-io"""
        response = requests.post(f"{BASE_URL}/api/track/click/digitalmarketing-io")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("PASS: Track click for digitalmarketing-io succeeded")
    
    def test_track_view_random_slug(self):
        """Track view for a random slug - should still work"""
        random_slug = f"test-domain-{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/track/view/{random_slug}")
        assert response.status_code == 200
        print(f"PASS: Track view for random slug '{random_slug}' succeeded")


class TestAnalyticsDashboard:
    """Feature 3: Analytics dashboard endpoint (requires admin auth)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        # Get auth token
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if response.status_code == 200:
            self.token = response.json().get("access_token")
        else:
            pytest.skip("Could not authenticate as admin")
    
    def test_analytics_dashboard_without_auth(self):
        """Analytics dashboard should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/domain-analytics")
        assert response.status_code in [401, 403]
        print(f"PASS: Analytics dashboard requires authentication (status: {response.status_code})")
    
    def test_analytics_dashboard_default_period(self):
        """Get analytics with default period (30 days)"""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{BASE_URL}/api/admin/domain-analytics", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "total_views" in data
        assert "total_clicks" in data
        assert "by_date" in data
        assert "top_domains" in data
        assert "period_days" in data
        
        print(f"PASS: Analytics dashboard (30d): views={data['total_views']}, clicks={data['total_clicks']}, period={data['period_days']}d")
    
    def test_analytics_dashboard_7_days(self):
        """Get analytics with 7 day period"""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{BASE_URL}/api/admin/domain-analytics?period=7", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["period_days"] == 7
        print(f"PASS: Analytics dashboard (7d): views={data['total_views']}, clicks={data['total_clicks']}")
    
    def test_analytics_dashboard_90_days(self):
        """Get analytics with 90 day period"""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{BASE_URL}/api/admin/domain-analytics?period=90", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["period_days"] == 90
        print(f"PASS: Analytics dashboard (90d): views={data['total_views']}, clicks={data['total_clicks']}")
    
    def test_analytics_dashboard_365_days(self):
        """Get analytics with 365 day (1 year) period"""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{BASE_URL}/api/admin/domain-analytics?period=365", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["period_days"] == 365
        print(f"PASS: Analytics dashboard (365d): views={data['total_views']}, clicks={data['total_clicks']}")
    
    def test_analytics_top_domains_structure(self):
        """Verify top domains structure in analytics"""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{BASE_URL}/api/admin/domain-analytics", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        top_domains = data.get("top_domains", [])
        if len(top_domains) > 0:
            # Verify structure of top domain entries
            first_domain = top_domains[0]
            assert "slug" in first_domain
            assert "domain_name" in first_domain
            assert "total_views" in first_domain
            assert "total_clicks" in first_domain
            print(f"PASS: Top domains structure verified, count: {len(top_domains)}")
            for d in top_domains[:3]:
                print(f"  - {d['domain_name']}: {d['total_views']} views, {d['total_clicks']} clicks")
        else:
            print("INFO: No top domains data yet (expected if new data)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
