"""
Tests for Blog CMS and SEO Features
- Blog Posts CRUD
- Categories CRUD
- Tags CRUD
- SEO Pages CRUD
- SEO Settings
- Sitemap generation
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://aged-domains-shop.preview.emergentagent.com')

# Test data prefix for cleanup
TEST_PREFIX = "TEST_"


class TestAdminAuth:
    """Test admin authentication for blog CMS"""
    
    def test_admin_login_success(self):
        """Admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "admin" in data
        assert data["admin"]["username"] == "admin"
        print(f"Admin login successful - Token: {data['access_token'][:20]}...")
    
    def test_admin_login_invalid_credentials(self):
        """Admin login with invalid credentials should fail"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


@pytest.fixture(scope="module")
def auth_token():
    """Get auth token for admin API tests"""
    response = requests.post(f"{BASE_URL}/api/admin/login", json={
        "username": "admin",
        "password": "admin123"
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Admin authentication failed")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestAdminDashboard:
    """Test admin dashboard stats with blog data"""
    
    def test_dashboard_includes_blog_stats(self, auth_headers):
        """Dashboard should include blog post stats"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=auth_headers)
        assert response.status_code == 200, f"Dashboard failed: {response.text}"
        data = response.json()
        assert "total_blog_posts" in data
        assert "published_posts" in data
        assert isinstance(data["total_blog_posts"], int)
        assert isinstance(data["published_posts"], int)
        print(f"Dashboard stats - Total posts: {data['total_blog_posts']}, Published: {data['published_posts']}")


class TestAdminCategories:
    """Test category CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self, auth_headers):
        self.headers = auth_headers
        self.created_ids = []
        yield
        # Cleanup
        for cat_id in self.created_ids:
            requests.delete(f"{BASE_URL}/api/admin/blog/categories/{cat_id}", headers=self.headers)
    
    def test_get_categories(self):
        """Get all categories"""
        response = requests.get(f"{BASE_URL}/api/admin/blog/categories", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} categories")
    
    def test_create_category(self):
        """Create a new category"""
        category_name = f"{TEST_PREFIX}SEO Guide"
        response = requests.post(
            f"{BASE_URL}/api/admin/blog/categories",
            headers=self.headers,
            json={"name": category_name, "description": "Test category for SEO guides"}
        )
        assert response.status_code == 201, f"Create category failed: {response.text}"
        data = response.json()
        assert data["name"] == category_name
        assert "id" in data
        assert "slug" in data
        self.created_ids.append(data["id"])
        print(f"Created category: {data['name']} (ID: {data['id']})")
    
    def test_delete_category(self):
        """Create and delete a category"""
        # Create
        response = requests.post(
            f"{BASE_URL}/api/admin/blog/categories",
            headers=self.headers,
            json={"name": f"{TEST_PREFIX}ToDelete"}
        )
        assert response.status_code == 201
        cat_id = response.json()["id"]
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/admin/blog/categories/{cat_id}", headers=self.headers)
        assert response.status_code == 200
        
        # Verify deletion
        response = requests.get(f"{BASE_URL}/api/admin/blog/categories", headers=self.headers)
        categories = response.json()
        assert not any(c["id"] == cat_id for c in categories)
        print("Category deleted successfully")


class TestAdminTags:
    """Test tag CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self, auth_headers):
        self.headers = auth_headers
        self.created_ids = []
        yield
        # Cleanup
        for tag_id in self.created_ids:
            requests.delete(f"{BASE_URL}/api/admin/blog/tags/{tag_id}", headers=self.headers)
    
    def test_get_tags(self):
        """Get all tags"""
        response = requests.get(f"{BASE_URL}/api/admin/blog/tags", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} tags")
    
    def test_create_tag(self):
        """Create a new tag"""
        tag_name = f"{TEST_PREFIX}Domain Tips"
        response = requests.post(
            f"{BASE_URL}/api/admin/blog/tags",
            headers=self.headers,
            json={"name": tag_name}
        )
        assert response.status_code == 201, f"Create tag failed: {response.text}"
        data = response.json()
        assert data["name"] == tag_name
        assert "id" in data
        self.created_ids.append(data["id"])
        print(f"Created tag: {data['name']} (ID: {data['id']})")
    
    def test_delete_tag(self):
        """Create and delete a tag"""
        # Create
        response = requests.post(
            f"{BASE_URL}/api/admin/blog/tags",
            headers=self.headers,
            json={"name": f"{TEST_PREFIX}ToDeleteTag"}
        )
        assert response.status_code == 201
        tag_id = response.json()["id"]
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/admin/blog/tags/{tag_id}", headers=self.headers)
        assert response.status_code == 200
        print("Tag deleted successfully")


class TestAdminBlogPosts:
    """Test blog post CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self, auth_headers):
        self.headers = auth_headers
        self.created_ids = []
        yield
        # Cleanup
        for post_id in self.created_ids:
            requests.delete(f"{BASE_URL}/api/admin/blog/posts/{post_id}", headers=self.headers)
    
    def test_get_blog_posts(self):
        """Get all admin blog posts"""
        response = requests.get(f"{BASE_URL}/api/admin/blog/posts", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} blog posts")
    
    def test_create_blog_post_draft(self):
        """Create a draft blog post"""
        post_data = {
            "title": f"{TEST_PREFIX}How to Choose Aged Domains",
            "content": "<p>This is a test blog post content about choosing aged domains.</p>",
            "excerpt": "Learn the best practices for selecting aged domains.",
            "meta_title": "Best Guide to Aged Domains",
            "meta_description": "A comprehensive guide to selecting the perfect aged domain.",
            "focus_keyword": "aged domains",
            "author": "Admin",
            "status": "draft"
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/blog/posts",
            headers=self.headers,
            json=post_data
        )
        assert response.status_code == 201, f"Create post failed: {response.text}"
        data = response.json()
        assert data["title"] == post_data["title"]
        assert data["status"] == "draft"
        assert "id" in data
        assert "slug" in data
        self.created_ids.append(data["id"])
        print(f"Created draft post: {data['title']} (ID: {data['id']})")
    
    def test_create_and_publish_blog_post(self):
        """Create a published blog post"""
        post_data = {
            "title": f"{TEST_PREFIX}Understanding Domain Metrics",
            "content": "<p>Learn about DR, DA, and other important domain metrics.</p>",
            "excerpt": "A guide to domain metrics.",
            "status": "published"
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/blog/posts",
            headers=self.headers,
            json=post_data
        )
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "published"
        assert "published_at" in data
        self.created_ids.append(data["id"])
        print(f"Created published post: {data['title']}")
    
    def test_update_blog_post(self):
        """Update an existing blog post"""
        # Create
        response = requests.post(
            f"{BASE_URL}/api/admin/blog/posts",
            headers=self.headers,
            json={"title": f"{TEST_PREFIX}ToUpdate", "content": "Original content", "status": "draft"}
        )
        assert response.status_code == 201
        post_id = response.json()["id"]
        self.created_ids.append(post_id)
        
        # Update
        update_data = {"title": f"{TEST_PREFIX}Updated Title", "status": "published"}
        response = requests.put(
            f"{BASE_URL}/api/admin/blog/posts/{post_id}",
            headers=self.headers,
            json=update_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == f"{TEST_PREFIX}Updated Title"
        assert data["status"] == "published"
        print("Blog post updated successfully")
    
    def test_delete_blog_post(self):
        """Create and delete a blog post"""
        # Create
        response = requests.post(
            f"{BASE_URL}/api/admin/blog/posts",
            headers=self.headers,
            json={"title": f"{TEST_PREFIX}ToDelete", "content": "Delete me", "status": "draft"}
        )
        assert response.status_code == 201
        post_id = response.json()["id"]
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/admin/blog/posts/{post_id}", headers=self.headers)
        assert response.status_code == 200
        
        # Verify deletion
        response = requests.get(f"{BASE_URL}/api/admin/blog/posts/{post_id}", headers=self.headers)
        assert response.status_code == 404
        print("Blog post deleted successfully")


class TestAdminSEOPages:
    """Test SEO pages CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self, auth_headers):
        self.headers = auth_headers
        self.created_ids = []
        yield
        # Cleanup
        for page_id in self.created_ids:
            requests.delete(f"{BASE_URL}/api/admin/seo/pages/{page_id}", headers=self.headers)
    
    def test_get_seo_pages(self):
        """Get all SEO pages"""
        response = requests.get(f"{BASE_URL}/api/admin/seo/pages", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} SEO pages")
    
    def test_create_seo_page(self):
        """Create a new SEO landing page"""
        page_data = {
            "title": f"{TEST_PREFIX}Buy Premium Domains",
            "slug": f"test-buy-premium-domains-{uuid.uuid4().hex[:8]}",
            "headline": "Premium Aged Domains for Your Business",
            "subheadline": "Find high-authority domains at competitive prices",
            "meta_title": "Buy Premium Aged Domains",
            "meta_description": "Browse our collection of premium aged domains.",
            "focus_keyword": "premium domains",
            "content_blocks": [
                {"type": "text", "content": "Welcome to our premium domain marketplace."},
                {"type": "heading", "content": "Why Choose Us?"}
            ],
            "faq_items": [
                {"question": "What is an aged domain?", "answer": "An aged domain has been registered for many years."},
                {"question": "Why are aged domains valuable?", "answer": "They often have existing backlinks and authority."}
            ],
            "cta_text": "Browse Domains",
            "cta_link": "/domains",
            "status": "draft"
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/seo/pages",
            headers=self.headers,
            json=page_data
        )
        assert response.status_code == 201, f"Create SEO page failed: {response.text}"
        data = response.json()
        assert data["title"] == page_data["title"]
        assert data["headline"] == page_data["headline"]
        assert len(data["faq_items"]) == 2
        assert len(data["content_blocks"]) == 2
        self.created_ids.append(data["id"])
        print(f"Created SEO page: {data['title']} (ID: {data['id']})")
    
    def test_update_seo_page(self):
        """Update an SEO page"""
        # Create
        response = requests.post(
            f"{BASE_URL}/api/admin/seo/pages",
            headers=self.headers,
            json={
                "title": f"{TEST_PREFIX}ToUpdate",
                "slug": f"test-to-update-{uuid.uuid4().hex[:8]}",
                "headline": "Original Headline",
                "status": "draft"
            }
        )
        assert response.status_code == 201
        page_id = response.json()["id"]
        self.created_ids.append(page_id)
        
        # Update
        response = requests.put(
            f"{BASE_URL}/api/admin/seo/pages/{page_id}",
            headers=self.headers,
            json={"headline": "Updated Headline", "status": "published"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["headline"] == "Updated Headline"
        assert data["status"] == "published"
        print("SEO page updated successfully")
    
    def test_delete_seo_page(self):
        """Delete an SEO page"""
        # Create
        response = requests.post(
            f"{BASE_URL}/api/admin/seo/pages",
            headers=self.headers,
            json={
                "title": f"{TEST_PREFIX}ToDelete",
                "slug": f"test-to-delete-{uuid.uuid4().hex[:8]}",
                "headline": "Delete Me",
                "status": "draft"
            }
        )
        assert response.status_code == 201
        page_id = response.json()["id"]
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/admin/seo/pages/{page_id}", headers=self.headers)
        assert response.status_code == 200
        print("SEO page deleted successfully")


class TestAdminSEOSettings:
    """Test SEO settings management"""
    
    def test_get_seo_settings(self, auth_headers):
        """Get current SEO settings"""
        response = requests.get(f"{BASE_URL}/api/admin/seo/settings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "site_title" in data
        assert "site_description" in data
        assert "robots_txt" in data
        print(f"SEO Settings - Site title: {data.get('site_title')}")
    
    def test_update_seo_settings(self, auth_headers):
        """Update SEO settings"""
        update_data = {
            "site_title": "MostDomain - Premium Domains",
            "site_description": "The best marketplace for aged domains",
            "robots_txt": "User-agent: *\nAllow: /\nSitemap: /sitemap.xml"
        }
        response = requests.put(
            f"{BASE_URL}/api/admin/seo/settings",
            headers=auth_headers,
            json=update_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["site_title"] == update_data["site_title"]
        print("SEO settings updated successfully")


class TestPublicBlogAPIs:
    """Test public blog APIs"""
    
    def test_get_public_blog_posts(self):
        """Get published blog posts"""
        response = requests.get(f"{BASE_URL}/api/blog/posts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned posts should be published
        for post in data:
            assert post.get("status") == "published"
        print(f"Found {len(data)} published blog posts")
    
    def test_get_blog_posts_count(self):
        """Get blog posts count"""
        response = requests.get(f"{BASE_URL}/api/blog/posts/count")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        print(f"Total published posts: {data['count']}")
    
    def test_get_public_categories(self):
        """Get public categories"""
        response = requests.get(f"{BASE_URL}/api/blog/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} public categories")
    
    def test_get_public_tags(self):
        """Get public tags"""
        response = requests.get(f"{BASE_URL}/api/blog/tags")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} public tags")
    
    def test_get_blog_post_by_slug(self, auth_headers):
        """Get a blog post by slug"""
        # First create a published post
        response = requests.post(
            f"{BASE_URL}/api/admin/blog/posts",
            headers=auth_headers,
            json={
                "title": f"{TEST_PREFIX}Test Slug Post",
                "slug": f"test-slug-post-{uuid.uuid4().hex[:8]}",
                "content": "Test content",
                "status": "published"
            }
        )
        if response.status_code == 201:
            post = response.json()
            slug = post["slug"]
            post_id = post["id"]
            
            # Get by slug
            response = requests.get(f"{BASE_URL}/api/blog/posts/{slug}")
            assert response.status_code == 200
            data = response.json()
            assert data["slug"] == slug
            print(f"Retrieved post by slug: {slug}")
            
            # Cleanup
            requests.delete(f"{BASE_URL}/api/admin/blog/posts/{post_id}", headers=auth_headers)
    
    def test_blog_search(self):
        """Search blog posts"""
        response = requests.get(f"{BASE_URL}/api/blog/posts", params={"search": "domain"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Search 'domain' returned {len(data)} posts")
    
    def test_blog_filter_by_category(self, auth_headers):
        """Filter blog posts by category"""
        # Get categories first
        response = requests.get(f"{BASE_URL}/api/admin/blog/categories", headers=auth_headers)
        if response.status_code == 200 and len(response.json()) > 0:
            category_id = response.json()[0]["id"]
            response = requests.get(f"{BASE_URL}/api/blog/posts", params={"category": category_id})
            assert response.status_code == 200
            print(f"Filter by category returned {len(response.json())} posts")


class TestPublicSEOAPIs:
    """Test public SEO APIs"""
    
    def test_get_public_seo_settings(self):
        """Get public SEO settings"""
        response = requests.get(f"{BASE_URL}/api/seo/settings")
        assert response.status_code == 200
        data = response.json()
        assert "site_title" in data or "site_description" in data
        print(f"Public SEO settings retrieved")
    
    def test_get_sitemap_xml(self):
        """Get sitemap.xml"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        assert "application/xml" in response.headers.get("content-type", "")
        assert "<?xml version" in response.text
        assert "<urlset" in response.text
        print("Sitemap.xml generated successfully")
    
    def test_get_robots_txt(self):
        """Get robots.txt"""
        response = requests.get(f"{BASE_URL}/api/robots.txt")
        assert response.status_code == 200
        assert "text/plain" in response.headers.get("content-type", "")
        assert "User-agent" in response.text
        print("Robots.txt retrieved successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
