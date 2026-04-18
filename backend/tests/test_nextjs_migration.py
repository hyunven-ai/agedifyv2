"""
Test suite for Agedify Next.js Migration - Backend API Tests
Tests public endpoints, admin endpoints, and new internal link suggestions API
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndPublicEndpoints:
    """Health check and public API endpoint tests"""
    
    def test_health_endpoint(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("Health endpoint: PASSED")

    def test_domains_list(self):
        """Test /api/domains returns domain list"""
        response = requests.get(f"{BASE_URL}/api/domains")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Verify domain structure
        domain = data[0]
        assert "domain_name" in domain
        assert "dr" in domain
        assert "slug" in domain
        print(f"Domains list: PASSED ({len(data)} domains)")

    def test_domain_detail_by_slug(self):
        """Test /api/domains/{slug} returns single domain"""
        # First get a domain to test
        list_response = requests.get(f"{BASE_URL}/api/domains")
        domains = list_response.json()
        if len(domains) > 0:
            test_slug = domains[0]["slug"]
            response = requests.get(f"{BASE_URL}/api/domains/{test_slug}")
            assert response.status_code == 200
            data = response.json()
            assert data["slug"] == test_slug
            assert "domain_name" in data
            assert "dr" in data
            print(f"Domain detail: PASSED (tested {test_slug})")
        else:
            pytest.skip("No domains to test")

    def test_blog_posts_list(self):
        """Test /api/blog/posts returns blog posts"""
        response = requests.get(f"{BASE_URL}/api/blog/posts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Blog posts list: PASSED ({len(data)} posts)")

    def test_blog_categories(self):
        """Test /api/blog/categories returns categories"""
        response = requests.get(f"{BASE_URL}/api/blog/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Blog categories: PASSED ({len(data)} categories)")

    def test_blog_tags(self):
        """Test /api/blog/tags returns tags"""
        response = requests.get(f"{BASE_URL}/api/blog/tags")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Blog tags: PASSED ({len(data)} tags)")


class TestAdminAuthentication:
    """Admin authentication tests"""
    
    def test_admin_login_valid(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        print("Admin login valid: PASSED")

    def test_admin_login_invalid(self):
        """Test admin login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "wrong",
            "password": "wrong"
        })
        assert response.status_code == 401
        print("Admin login invalid: PASSED (401 returned)")

    def test_admin_me_unauthorized(self):
        """Test /api/admin/me without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/admin/me")
        assert response.status_code in [401, 403]
        print("Admin me unauthorized: PASSED")


class TestInternalLinkSuggestions:
    """Test the new internal link suggestions API"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")

    def test_link_suggestions_requires_auth(self):
        """Test /api/admin/blog/link-suggestions requires auth"""
        response = requests.post(f"{BASE_URL}/api/admin/blog/link-suggestions", json={
            "content": "test",
            "title": "test"
        })
        assert response.status_code in [401, 403]
        print("Link suggestions auth required: PASSED")

    def test_link_suggestions_with_auth(self, auth_token):
        """Test link suggestions returns suggestions"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            f"{BASE_URL}/api/admin/blog/link-suggestions",
            json={
                "content": "domain SEO backlinks aged premium",
                "title": "Test Article about Domains"
            },
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
        assert isinstance(data["suggestions"], list)
        print(f"Link suggestions with auth: PASSED ({len(data['suggestions'])} suggestions)")
        
        # Verify suggestion structure if there are suggestions
        if len(data["suggestions"]) > 0:
            suggestion = data["suggestions"][0]
            assert "type" in suggestion
            assert "title" in suggestion
            assert "url" in suggestion
            assert "relevance" in suggestion
            assert "matched_keywords" in suggestion
            assert suggestion["type"] in ["blog", "domain", "category"]
            print(f"  - First suggestion: {suggestion['type']} - {suggestion['title']}")

    def test_link_suggestions_empty_content(self, auth_token):
        """Test link suggestions with empty content"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            f"{BASE_URL}/api/admin/blog/link-suggestions",
            json={
                "content": "",
                "title": ""
            },
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
        assert len(data["suggestions"]) == 0
        print("Link suggestions empty content: PASSED (0 suggestions)")

    def test_link_suggestions_excludes_current_post(self, auth_token):
        """Test that current post ID is excluded from suggestions"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        # First get existing posts
        posts_response = requests.get(
            f"{BASE_URL}/api/admin/blog/posts",
            headers=headers
        )
        posts = posts_response.json()
        
        if len(posts) > 0:
            current_post = posts[0]
            response = requests.post(
                f"{BASE_URL}/api/admin/blog/link-suggestions",
                json={
                    "content": current_post["title"],  # Use title as content to match
                    "title": "Test",
                    "current_post_id": current_post["id"]
                },
                headers=headers
            )
            assert response.status_code == 200
            data = response.json()
            # Check that current post is not in suggestions
            suggestion_urls = [s["url"] for s in data["suggestions"] if s["type"] == "blog"]
            assert f"/blog/{current_post['slug']}" not in suggestion_urls
            print("Link suggestions exclude current post: PASSED")
        else:
            pytest.skip("No posts to test exclusion")


class TestAdminDashboard:
    """Admin dashboard and stats tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")

    def test_dashboard_stats(self, auth_token):
        """Test /api/admin/dashboard returns stats"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_domains" in data
        assert "available_domains" in data
        assert "sold_domains" in data
        print(f"Dashboard stats: PASSED ({data['total_domains']} domains)")

    def test_admin_domains_list(self, auth_token):
        """Test /api/admin/domains returns domain list"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/domains", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Admin domains list: PASSED ({len(data)} domains)")

    def test_admin_blog_posts(self, auth_token):
        """Test /api/admin/blog/posts returns posts"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/blog/posts", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Admin blog posts: PASSED ({len(data)} posts)")

    def test_admin_contacts(self, auth_token):
        """Test /api/admin/contacts returns contacts"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/contacts", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Admin contacts: PASSED ({len(data)} contacts)")


class TestSEOEndpoints:
    """SEO-related endpoint tests"""
    
    def test_sitemap(self):
        """Test /api/sitemap.xml returns valid sitemap"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        assert "xml" in response.headers.get("content-type", "")
        print("Sitemap: PASSED")

    def test_robots_txt(self):
        """Test /api/robots.txt returns robots file"""
        response = requests.get(f"{BASE_URL}/api/robots.txt")
        assert response.status_code == 200
        print("Robots.txt: PASSED")

    def test_seo_settings(self):
        """Test /api/seo/settings returns settings"""
        response = requests.get(f"{BASE_URL}/api/seo/settings")
        assert response.status_code == 200
        print("SEO settings: PASSED")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
