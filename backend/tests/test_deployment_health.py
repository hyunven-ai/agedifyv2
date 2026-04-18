"""
Test suite for deployment health and API proxy functionality.
Focuses on: health endpoints, API routing, admin auth, domain/blog retrieval
"""
import pytest
import requests
import os

# Use preview URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthEndpoints:
    """Health check endpoints for both backend and frontend"""
    
    def test_backend_health(self):
        """Backend /api/health returns 200 with healthy status"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert response.status_code == 200, f"Backend health check failed: {response.status_code}"
        data = response.json()
        assert data.get("status") == "healthy", f"Expected healthy status, got: {data}"
        assert "timestamp" in data
        print(f"✓ Backend health: {data}")
    
    def test_frontend_health(self):
        """Frontend /health returns 200"""
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        assert response.status_code == 200, f"Frontend health check failed: {response.status_code}"
        data = response.json()
        assert data.get("status") == "healthy", f"Expected healthy status, got: {data}"
        print(f"✓ Frontend health: {data}")


class TestAPIProxyRouting:
    """Test that API calls are correctly proxied through Next.js to FastAPI"""
    
    def test_get_domains(self):
        """GET /api/domains returns domain list"""
        response = requests.get(f"{BASE_URL}/api/domains", timeout=10)
        assert response.status_code == 200, f"Domains API failed: {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list of domains"
        print(f"✓ GET /api/domains returned {len(data)} domains")
        
        # Verify domain structure if data exists
        if data:
            domain = data[0]
            assert "domain_name" in domain, "Domain missing 'domain_name' field"
            assert "slug" in domain, "Domain missing 'slug' field"
            assert "price" in domain, "Domain missing 'price' field"
            print(f"✓ Domain structure verified: {domain.get('domain_name')}")
    
    def test_get_blog_posts(self):
        """GET /api/blog/posts returns blog posts"""
        response = requests.get(f"{BASE_URL}/api/blog/posts", timeout=10)
        assert response.status_code == 200, f"Blog posts API failed: {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list of blog posts"
        print(f"✓ GET /api/blog/posts returned {len(data)} posts")
        
        # Verify post structure if data exists
        if data:
            post = data[0]
            assert "title" in post, "Post missing 'title' field"
            assert "slug" in post, "Post missing 'slug' field"
            print(f"✓ Blog post structure verified: {post.get('title')[:50]}...")
    
    def test_get_currencies(self):
        """GET /api/currencies returns currency data"""
        response = requests.get(f"{BASE_URL}/api/currencies", timeout=10)
        assert response.status_code == 200, f"Currencies API failed: {response.status_code}"
        data = response.json()
        assert "currencies" in data, "Expected 'currencies' key in response"
        assert isinstance(data["currencies"], list), "Expected currencies to be a list"
        print(f"✓ GET /api/currencies returned {len(data['currencies'])} currencies")
    
    def test_get_seo_settings(self):
        """GET /api/seo/settings returns SEO settings"""
        response = requests.get(f"{BASE_URL}/api/seo/settings", timeout=10)
        assert response.status_code == 200, f"SEO settings API failed: {response.status_code}"
        data = response.json()
        assert isinstance(data, dict), "Expected SEO settings object"
        print(f"✓ GET /api/seo/settings returned settings")
    
    def test_get_featured_domains(self):
        """GET /api/domains/featured returns featured domains"""
        response = requests.get(f"{BASE_URL}/api/domains/featured", timeout=10)
        assert response.status_code == 200, f"Featured domains API failed: {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list of featured domains"
        print(f"✓ GET /api/domains/featured returned {len(data)} featured domains")


class TestAdminAuthentication:
    """Admin login and authenticated endpoints"""
    
    def test_admin_login_success(self):
        """POST /api/admin/login with valid credentials returns token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "admin", "password": "admin123"},
            timeout=10
        )
        assert response.status_code == 200, f"Admin login failed: {response.status_code}, {response.text}"
        data = response.json()
        assert "access_token" in data, "Login response missing 'access_token'"
        assert "admin" in data, "Login response missing 'admin'"
        assert data["admin"].get("username") == "admin"
        assert data["admin"].get("role") == "super_admin"
        print(f"✓ Admin login successful, role: {data['admin'].get('role')}")
        return data["access_token"]
    
    def test_admin_login_invalid_credentials(self):
        """POST /api/admin/login with invalid credentials returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "invalid", "password": "wrong"},
            timeout=10
        )
        assert response.status_code == 401, f"Expected 401, got: {response.status_code}"
        print(f"✓ Invalid login correctly returns 401")
    
    def test_admin_dashboard_with_auth(self):
        """GET /api/admin/dashboard with token returns dashboard data"""
        # First login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "admin", "password": "admin123"},
            timeout=10
        )
        assert login_response.status_code == 200, "Login failed"
        token = login_response.json()["access_token"]
        
        # Access dashboard with token
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=headers, timeout=10)
        assert response.status_code == 200, f"Dashboard access failed: {response.status_code}"
        data = response.json()
        
        # Verify dashboard structure
        expected_fields = ["total_domains", "total_contacts"]
        for field in expected_fields:
            assert field in data, f"Dashboard missing '{field}' field"
        print(f"✓ Admin dashboard accessible: {data}")
    
    def test_admin_dashboard_without_auth(self):
        """GET /api/admin/dashboard without token returns 401 or 403"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", timeout=10)
        assert response.status_code in [401, 403], f"Expected 401/403, got: {response.status_code}"
        print(f"✓ Dashboard correctly requires authentication (status: {response.status_code})")
    
    def test_admin_me_endpoint(self):
        """GET /api/admin/me with token returns admin info"""
        # Login first
        login_response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "admin", "password": "admin123"},
            timeout=10
        )
        token = login_response.json()["access_token"]
        
        # Get admin info
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/admin/me", headers=headers, timeout=10)
        assert response.status_code == 200, f"/admin/me failed: {response.status_code}"
        data = response.json()
        assert data.get("username") == "admin"
        assert data.get("role") == "super_admin"
        print(f"✓ GET /api/admin/me returned admin: {data.get('username')}, role: {data.get('role')}")


class TestSSREndpoints:
    """Test Server-Side Rendered pages"""
    
    def test_homepage_loads(self):
        """Homepage (/) returns 200"""
        response = requests.get(f"{BASE_URL}/", timeout=15)
        assert response.status_code == 200, f"Homepage failed: {response.status_code}"
        assert "text/html" in response.headers.get("content-type", "")
        print(f"✓ Homepage loaded, content-type: {response.headers.get('content-type')}")
    
    def test_domains_page_loads(self):
        """Domains page (/domains) returns 200"""
        response = requests.get(f"{BASE_URL}/domains", timeout=15)
        assert response.status_code == 200, f"Domains page failed: {response.status_code}"
        print(f"✓ Domains page loaded")
    
    def test_blog_page_loads(self):
        """Blog page (/blog) returns 200"""
        response = requests.get(f"{BASE_URL}/blog", timeout=15)
        assert response.status_code == 200, f"Blog page failed: {response.status_code}"
        print(f"✓ Blog page loaded")
    
    def test_admin_login_page_loads(self):
        """Admin login page (/admin/login) returns 200"""
        response = requests.get(f"{BASE_URL}/admin/login", timeout=15)
        assert response.status_code == 200, f"Admin login page failed: {response.status_code}"
        print(f"✓ Admin login page loaded")
    
    def test_domain_detail_ssr(self):
        """SSR domain detail page loads with metadata"""
        # Get a domain slug first
        domains_response = requests.get(f"{BASE_URL}/api/domains?limit=1", timeout=10)
        if domains_response.status_code == 200 and domains_response.json():
            slug = domains_response.json()[0]["slug"]
            response = requests.get(f"{BASE_URL}/domain/{slug}", timeout=15)
            assert response.status_code == 200, f"Domain detail page failed: {response.status_code}"
            print(f"✓ Domain detail page /domain/{slug} loaded")
        else:
            pytest.skip("No domains available to test")
    
    def test_blog_post_ssr(self):
        """SSR blog post page loads with metadata"""
        # Get a blog post slug first
        posts_response = requests.get(f"{BASE_URL}/api/blog/posts?limit=1", timeout=10)
        if posts_response.status_code == 200 and posts_response.json():
            slug = posts_response.json()[0]["slug"]
            response = requests.get(f"{BASE_URL}/blog/{slug}", timeout=15)
            assert response.status_code == 200, f"Blog post page failed: {response.status_code}"
            print(f"✓ Blog post page /blog/{slug} loaded")
        else:
            pytest.skip("No blog posts available to test")


class TestRoutesManifest:
    """Test that routes-manifest.json contains correct rewrite destination"""
    
    def test_routes_manifest_has_localhost(self):
        """Verify routes-manifest.json contains localhost:8001, not stale preview URL"""
        import json
        manifest_path = "/app/frontend/.next/routes-manifest.json"
        
        try:
            with open(manifest_path, "r") as f:
                manifest = json.load(f)
        except FileNotFoundError:
            pytest.skip("routes-manifest.json not found - Next.js may not be built")
        
        # Check rewrites
        rewrites = manifest.get("rewrites", {})
        after_files = rewrites.get("afterFiles", [])
        
        found_api_rewrite = False
        for rewrite in after_files:
            if rewrite.get("source") == "/api/:path*":
                found_api_rewrite = True
                destination = rewrite.get("destination", "")
                assert "localhost:8001" in destination, f"Expected localhost:8001 in destination, got: {destination}"
                assert "preview.emergentagent.com" not in destination, f"Found stale preview URL in destination: {destination}"
                print(f"✓ API rewrite destination: {destination}")
        
        assert found_api_rewrite, "No API rewrite found in routes-manifest.json"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
