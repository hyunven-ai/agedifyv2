"""
Backend API Tests for i18n, ISR, and Next.js Image optimization features
Testing: Backend API endpoints, health check, domains, admin dashboard, blog APIs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasicAPIs:
    """Health and basic API endpoint tests"""
    
    def test_health_check(self):
        """Verify health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✅ Health check passed: {data}")
    
    def test_domains_list(self):
        """Verify domains list endpoint returns data"""
        response = requests.get(f"{BASE_URL}/api/domains")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✅ Domains list returned {len(data)} domains")
    
    def test_domains_count(self):
        """Verify domains count endpoint"""
        response = requests.get(f"{BASE_URL}/api/domains/count")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert data["count"] > 0
        print(f"✅ Domains count: {data['count']}")

class TestDomainDetailAPIs:
    """Tests for domain detail endpoints - used by ISR pages"""
    
    def test_domain_by_slug(self):
        """Verify domain detail by slug - critical for ISR"""
        # First get a domain slug
        domains = requests.get(f"{BASE_URL}/api/domains?limit=1").json()
        if len(domains) > 0:
            slug = domains[0].get("slug")
            response = requests.get(f"{BASE_URL}/api/domains/{slug}")
            assert response.status_code == 200
            data = response.json()
            assert data.get("domain_name")
            assert data.get("dr") is not None
            assert data.get("da") is not None
            print(f"✅ Domain detail for '{slug}' returned: {data.get('domain_name')}")
    
    def test_domain_not_found(self):
        """Verify 404 for non-existent domain"""
        response = requests.get(f"{BASE_URL}/api/domains/non-existent-domain-xyz123")
        assert response.status_code == 404
        print("✅ Domain not found returns 404")

class TestBlogAPIs:
    """Tests for blog endpoints - used by ISR blog pages"""
    
    def test_blog_posts_list(self):
        """Verify blog posts list"""
        response = requests.get(f"{BASE_URL}/api/blog/posts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Blog posts returned {len(data)} posts")
    
    def test_blog_post_by_slug(self):
        """Verify blog post detail by slug - critical for ISR"""
        posts = requests.get(f"{BASE_URL}/api/blog/posts").json()
        if len(posts) > 0:
            slug = posts[0].get("slug")
            response = requests.get(f"{BASE_URL}/api/blog/posts/{slug}")
            assert response.status_code == 200
            data = response.json()
            assert data.get("title")
            assert data.get("slug")
            print(f"✅ Blog post detail for '{slug}' returned: {data.get('title')}")
    
    def test_blog_categories(self):
        """Verify blog categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/blog/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Blog categories returned {len(data)} categories")
    
    def test_blog_tags(self):
        """Verify blog tags endpoint"""
        response = requests.get(f"{BASE_URL}/api/blog/tags")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Blog tags returned {len(data)} tags")

class TestAdminAPIs:
    """Admin API tests"""
    
    def test_admin_login_success(self):
        """Verify admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data or "access_token" in data
        print("✅ Admin login successful")
        return data.get("token") or data.get("access_token")
    
    def test_admin_login_invalid(self):
        """Verify admin login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✅ Invalid admin login returns 401")
    
    def test_admin_dashboard_unauthorized(self):
        """Verify admin dashboard requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code in [401, 403]
        print("✅ Admin dashboard requires authentication")
    
    def test_admin_dashboard_authorized(self):
        """Verify admin dashboard with valid token"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json().get("token") or login_response.json().get("access_token")
        
        # Access dashboard
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_domains" in data or "totalDomains" in data or isinstance(data, dict)
        print(f"✅ Admin dashboard accessible with token: {data}")

class TestDomainFilterAPIs:
    """Tests for domain filtering and sorting - used by Domains page"""
    
    def test_domains_with_pagination(self):
        """Verify domains pagination"""
        response = requests.get(f"{BASE_URL}/api/domains?skip=0&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5
        print(f"✅ Domains pagination works: returned {len(data)} domains")
    
    def test_domains_with_search(self):
        """Verify domains search filter"""
        response = requests.get(f"{BASE_URL}/api/domains?search=tech")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Domains search works: returned {len(data)} results")
    
    def test_domains_with_price_filter(self):
        """Verify domains price filter"""
        response = requests.get(f"{BASE_URL}/api/domains?min_price=1000&max_price=10000")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for domain in data:
            assert domain.get("price", 0) >= 1000
            assert domain.get("price", 0) <= 10000
        print(f"✅ Domains price filter works: returned {len(data)} results")
    
    def test_domains_with_sorting(self):
        """Verify domains sorting"""
        response = requests.get(f"{BASE_URL}/api/domains?sort_by=price&sort_order=desc")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) >= 2:
            assert data[0].get("price", 0) >= data[1].get("price", 0)
        print(f"✅ Domains sorting works: returned {len(data)} results")

class TestSEOAPIs:
    """SEO-related API tests"""
    
    def test_sitemap(self):
        """Verify sitemap endpoint"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        assert "xml" in response.headers.get("content-type", "")
        print("✅ Sitemap returns XML")
    
    def test_robots_txt(self):
        """Verify robots.txt endpoint"""
        response = requests.get(f"{BASE_URL}/api/robots.txt")
        assert response.status_code == 200
        print("✅ Robots.txt accessible")
    
    def test_seo_settings(self):
        """Verify SEO settings endpoint"""
        response = requests.get(f"{BASE_URL}/api/seo/settings")
        # May or may not require auth
        assert response.status_code in [200, 401, 403]
        print(f"✅ SEO settings endpoint returns {response.status_code}")

class TestContactAPI:
    """Contact form API tests"""
    
    def test_contact_submit(self):
        """Verify contact form submission"""
        response = requests.post(f"{BASE_URL}/api/contact", json={
            "name": "TEST_User",
            "email": "test@example.com",
            "message": "This is a test message from automated testing"
        })
        assert response.status_code in [200, 201]
        print("✅ Contact form submission works")

class TestFeaturedDomains:
    """Featured domains API tests"""
    
    def test_featured_domains(self):
        """Verify featured domains endpoint"""
        response = requests.get(f"{BASE_URL}/api/domains/featured")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Featured domains returned {len(data)} domains")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
