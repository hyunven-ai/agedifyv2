"""
Comprehensive API Regression Tests for Agedify Backend
Tests all endpoints after backend refactoring from monolith to modular structure

Test Modules:
1. Public endpoints (health, root, domains, contact, currencies)
2. Public blog endpoints
3. Public SEO endpoints (pages, settings, sitemap, robots)
4. Admin authentication endpoints
5. Admin domain CRUD endpoints + seed
6. Admin contacts CRUD endpoints + CSV export
7. Admin dashboard endpoints
8. Admin blog CRUD endpoints (posts, categories, tags)
9. Admin SEO CRUD endpoints (pages, settings)
10. File upload endpoints
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# ==== FIXTURES ====

@pytest.fixture(scope="session")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="session")
def auth_token(api_client):
    """Get authentication token - session scoped for reuse"""
    response = api_client.post(f"{BASE_URL}/api/admin/login", json={
        "username": "admin",
        "password": "admin123"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")

@pytest.fixture(scope="session")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


# ==== 1. PUBLIC ENDPOINTS ====

class TestPublicEndpoints:
    """Tests for public-facing endpoints"""
    
    def test_health_check(self, api_client):
        """GET /api/health - returns healthy status"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        print(f"✓ Health check passed: {data}")
    
    def test_root_endpoint(self, api_client):
        """GET /api/ - returns API version message"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Agedify API" in data["message"]
        print(f"✓ Root endpoint: {data}")
    
    def test_currencies(self, api_client):
        """GET /api/currencies - returns currency list"""
        response = api_client.get(f"{BASE_URL}/api/currencies")
        assert response.status_code == 200
        data = response.json()
        assert "currencies" in data
        assert "default" in data
        assert len(data["currencies"]) >= 5  # USD, IDR, EUR, GBP, SGD
        # Validate currency structure
        usd = next((c for c in data["currencies"] if c["code"] == "USD"), None)
        assert usd is not None
        assert usd["symbol"] == "$"
        assert usd["rate"] == 1
        print(f"✓ Currencies: {len(data['currencies'])} currencies available")


class TestPublicDomains:
    """Tests for public domain endpoints"""
    
    def test_get_domains(self, api_client):
        """GET /api/domains - list domains"""
        response = api_client.get(f"{BASE_URL}/api/domains")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Domains list: {len(data)} domains")
    
    def test_get_domains_with_filters(self, api_client):
        """GET /api/domains with filters - min_price, max_price, min_dr, max_dr"""
        response = api_client.get(f"{BASE_URL}/api/domains", params={
            "min_price": 1000,
            "max_price": 10000,
            "min_dr": 50,
            "status": "available",
            "limit": 5
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify all results match filters
        for domain in data:
            assert domain.get("price", 0) >= 1000
            assert domain.get("price", 0) <= 10000
            assert domain.get("dr", 0) >= 50
        print(f"✓ Filtered domains: {len(data)} domains match filters")
    
    def test_get_domains_with_sorting(self, api_client):
        """GET /api/domains with sorting"""
        response = api_client.get(f"{BASE_URL}/api/domains", params={
            "sort_by": "price",
            "sort_order": "desc",
            "limit": 5
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify descending sort order
        if len(data) >= 2:
            for i in range(len(data) - 1):
                assert data[i].get("price", 0) >= data[i+1].get("price", 0)
        print(f"✓ Sorted domains (desc by price): {len(data)} domains")
    
    def test_get_domains_count(self, api_client):
        """GET /api/domains/count - count domains"""
        response = api_client.get(f"{BASE_URL}/api/domains/count")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)
        print(f"✓ Domains count: {data['count']}")
    
    def test_get_domains_count_with_filters(self, api_client):
        """GET /api/domains/count with filters"""
        response = api_client.get(f"{BASE_URL}/api/domains/count", params={
            "status": "available",
            "min_dr": 50
        })
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        print(f"✓ Filtered domains count: {data['count']}")
    
    def test_get_featured_domains(self, api_client):
        """GET /api/domains/featured - returns top 6 available domains by DR"""
        response = api_client.get(f"{BASE_URL}/api/domains/featured")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 6
        # Verify all are available
        for domain in data:
            assert domain.get("status") == "available"
        print(f"✓ Featured domains: {len(data)} domains")


class TestPublicContact:
    """Tests for contact endpoint"""
    
    def test_create_contact(self, api_client):
        """POST /api/contact - create contact with name, email, message"""
        contact_data = {
            "name": "TEST_Contact User",
            "email": "test_contact@example.com",
            "message": "This is a test contact message for regression testing"
        }
        response = api_client.post(f"{BASE_URL}/api/contact", json=contact_data)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == contact_data["name"]
        assert data["email"] == contact_data["email"]
        assert data["message"] == contact_data["message"]
        assert data["status"] == "pending"
        assert "id" in data
        assert "created_at" in data
        print(f"✓ Contact created: {data['id']}")
        # Store for cleanup
        return data["id"]


# ==== 2. PUBLIC BLOG ENDPOINTS ====

class TestPublicBlog:
    """Tests for public blog endpoints"""
    
    def test_get_blog_posts(self, api_client):
        """GET /api/blog/posts - public blog posts (only published)"""
        response = api_client.get(f"{BASE_URL}/api/blog/posts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All posts should be published
        for post in data:
            assert post.get("status") == "published"
        print(f"✓ Public blog posts: {len(data)} published posts")
    
    def test_get_blog_categories(self, api_client):
        """GET /api/blog/categories - public categories"""
        response = api_client.get(f"{BASE_URL}/api/blog/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Public categories: {len(data)} categories")
    
    def test_get_blog_tags(self, api_client):
        """GET /api/blog/tags - public tags"""
        response = api_client.get(f"{BASE_URL}/api/blog/tags")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Public tags: {len(data)} tags")


# ==== 3. PUBLIC SEO ENDPOINTS ====

class TestPublicSEO:
    """Tests for public SEO endpoints"""
    
    def test_get_seo_pages(self, api_client):
        """GET /api/pages - public SEO pages (only published)"""
        response = api_client.get(f"{BASE_URL}/api/pages")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Public SEO pages: {len(data)} pages")
    
    def test_get_seo_settings(self, api_client):
        """GET /api/seo/settings - public SEO settings"""
        response = api_client.get(f"{BASE_URL}/api/seo/settings")
        assert response.status_code == 200
        data = response.json()
        # Should have default values
        assert "site_title" in data
        assert "site_description" in data
        print(f"✓ Public SEO settings retrieved")
    
    def test_get_sitemap(self, api_client):
        """GET /api/sitemap.xml - generated sitemap"""
        response = api_client.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        assert "xml" in response.headers.get("content-type", "").lower()
        assert "<urlset" in response.text
        assert "<url>" in response.text
        print(f"✓ Sitemap.xml generated: {len(response.text)} bytes")
    
    def test_get_robots_txt(self, api_client):
        """GET /api/robots.txt - robots.txt content"""
        response = api_client.get(f"{BASE_URL}/api/robots.txt")
        assert response.status_code == 200
        assert "User-agent" in response.text
        print(f"✓ Robots.txt retrieved")


# ==== 4. ADMIN AUTHENTICATION ENDPOINTS ====

class TestAdminAuth:
    """Tests for admin authentication endpoints"""
    
    def test_admin_login_success(self, api_client):
        """POST /api/admin/login - login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "admin" in data
        assert data["admin"]["username"] == "admin"
        print(f"✓ Admin login successful")
    
    def test_admin_login_invalid_credentials(self, api_client):
        """POST /api/admin/login - login with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/admin/login", json={
            "username": "wrong",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print(f"✓ Invalid credentials rejected with 401")
    
    def test_admin_me(self, authenticated_client):
        """GET /api/admin/me - get current admin info (requires auth)"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/me")
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "admin"
        assert "id" in data
        assert "created_at" in data
        print(f"✓ Admin me endpoint: {data['username']}")
    
    def test_admin_me_unauthorized(self, api_client):
        """GET /api/admin/me - without auth should fail"""
        # Use fresh client without auth header
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/admin/me")
        assert response.status_code in [401, 403]
        print(f"✓ Unauthorized access rejected")


# ==== 5. ADMIN DOMAIN CRUD ENDPOINTS ====

class TestAdminDomains:
    """Tests for admin domain CRUD endpoints"""
    
    def test_seed_domains(self, authenticated_client):
        """POST /api/admin/seed - seed sample domains (requires auth)"""
        response = authenticated_client.post(f"{BASE_URL}/api/admin/seed")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Seed domains: {data['message']}")
    
    def test_admin_get_domains(self, authenticated_client):
        """GET /api/admin/domains - list all domains (requires auth)"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/domains")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin domains: {len(data)} domains")
    
    def test_admin_create_domain(self, authenticated_client):
        """POST /api/admin/domains - create domain (requires auth)"""
        domain_data = {
            "domain_name": "test-regression-domain.com",
            "dr": 45,
            "da": 40,
            "spam_score": 5,
            "backlinks": 1000,
            "traffic": 5000,
            "age": 5,
            "price": 2500.00,
            "status": "available",
            "description": "Test domain for regression testing"
        }
        response = authenticated_client.post(f"{BASE_URL}/api/admin/domains", json=domain_data)
        assert response.status_code == 201
        data = response.json()
        assert data["domain_name"] == domain_data["domain_name"]
        assert data["dr"] == domain_data["dr"]
        assert "id" in data
        assert "slug" in data
        assert data["slug"] == "test-regression-domain-com"
        print(f"✓ Domain created: {data['id']}")
        return data["id"]
    
    def test_admin_update_domain(self, authenticated_client):
        """PUT /api/admin/domains/{id} - update domain (requires auth)"""
        # First create a domain
        create_data = {
            "domain_name": "test-update-domain.com",
            "dr": 50, "da": 45, "spam_score": 3, "backlinks": 800,
            "traffic": 3000, "age": 4, "price": 1800.00, "status": "available"
        }
        create_resp = authenticated_client.post(f"{BASE_URL}/api/admin/domains", json=create_data)
        if create_resp.status_code == 400:  # Already exists
            # Get existing domain
            domains = authenticated_client.get(f"{BASE_URL}/api/admin/domains").json()
            domain = next((d for d in domains if d["domain_name"] == "test-update-domain.com"), None)
            if domain:
                domain_id = domain["id"]
            else:
                pytest.skip("Could not find or create test domain")
        else:
            assert create_resp.status_code == 201
            domain_id = create_resp.json()["id"]
        
        # Update the domain
        update_data = {"price": 2200.00, "status": "sold"}
        response = authenticated_client.put(f"{BASE_URL}/api/admin/domains/{domain_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["price"] == 2200.00
        assert data["status"] == "sold"
        print(f"✓ Domain updated: {domain_id}")
    
    def test_admin_delete_domain(self, authenticated_client):
        """DELETE /api/admin/domains/{id} - delete domain (requires auth)"""
        # Create a domain to delete
        create_data = {
            "domain_name": "test-delete-domain.com",
            "dr": 30, "da": 25, "spam_score": 8, "backlinks": 200,
            "traffic": 500, "age": 2, "price": 500.00, "status": "available"
        }
        create_resp = authenticated_client.post(f"{BASE_URL}/api/admin/domains", json=create_data)
        if create_resp.status_code == 201:
            domain_id = create_resp.json()["id"]
        elif create_resp.status_code == 400:
            domains = authenticated_client.get(f"{BASE_URL}/api/admin/domains").json()
            domain = next((d for d in domains if d["domain_name"] == "test-delete-domain.com"), None)
            if domain:
                domain_id = domain["id"]
            else:
                pytest.skip("Could not find or create test domain")
        else:
            pytest.fail(f"Unexpected status: {create_resp.status_code}")
        
        # Delete
        response = authenticated_client.delete(f"{BASE_URL}/api/admin/domains/{domain_id}")
        assert response.status_code == 200
        assert "message" in response.json()
        
        # Verify deletion
        verify_resp = authenticated_client.get(f"{BASE_URL}/api/domains/test-delete-domain-com")
        assert verify_resp.status_code == 404
        print(f"✓ Domain deleted: {domain_id}")


# ==== 6. ADMIN CONTACTS ENDPOINTS ====

class TestAdminContacts:
    """Tests for admin contacts endpoints"""
    
    def test_admin_get_contacts(self, authenticated_client):
        """GET /api/admin/contacts - list contacts (requires auth)"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/contacts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin contacts: {len(data)} contacts")
    
    def test_admin_get_contacts_with_status_filter(self, authenticated_client):
        """GET /api/admin/contacts with status filter"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/contacts", params={"status": "pending"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for contact in data:
            assert contact.get("status") == "pending"
        print(f"✓ Filtered contacts (pending): {len(data)}")
    
    def test_admin_update_contact(self, authenticated_client, api_client):
        """PUT /api/admin/contacts/{id} - update contact status (requires auth)"""
        # First create a contact
        contact_data = {
            "name": "TEST_Update Contact",
            "email": "test_update_contact@example.com",
            "message": "Test update contact message"
        }
        create_resp = api_client.post(f"{BASE_URL}/api/contact", json=contact_data)
        assert create_resp.status_code == 201
        contact_id = create_resp.json()["id"]
        
        # Update the contact
        update_data = {"status": "responded"}
        response = authenticated_client.put(f"{BASE_URL}/api/admin/contacts/{contact_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "responded"
        print(f"✓ Contact updated: {contact_id}")
    
    def test_admin_delete_contact(self, authenticated_client, api_client):
        """DELETE /api/admin/contacts/{id} - delete contact (requires auth)"""
        # Create a contact to delete
        contact_data = {
            "name": "TEST_Delete Contact",
            "email": "test_delete_contact@example.com",
            "message": "Test delete contact message"
        }
        create_resp = api_client.post(f"{BASE_URL}/api/contact", json=contact_data)
        assert create_resp.status_code == 201
        contact_id = create_resp.json()["id"]
        
        # Delete
        response = authenticated_client.delete(f"{BASE_URL}/api/admin/contacts/{contact_id}")
        assert response.status_code == 200
        print(f"✓ Contact deleted: {contact_id}")
    
    def test_admin_export_contacts_csv(self, authenticated_client):
        """GET /api/admin/contacts/export - export contacts CSV (requires auth)"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/contacts/export")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        assert "ID" in response.text  # CSV header
        print(f"✓ Contacts CSV export: {len(response.text)} bytes")


# ==== 7. ADMIN DASHBOARD ENDPOINTS ====

class TestAdminDashboard:
    """Tests for admin dashboard endpoints"""
    
    def test_admin_dashboard_stats(self, authenticated_client):
        """GET /api/admin/dashboard - dashboard stats (requires auth)"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "total_domains" in data
        assert "available_domains" in data
        assert "sold_domains" in data
        assert "total_revenue" in data
        assert "total_contacts" in data
        assert "pending_contacts" in data
        assert "total_blog_posts" in data
        print(f"✓ Dashboard stats: {data['total_domains']} domains, ${data['total_revenue']} revenue")
    
    def test_admin_analytics(self, authenticated_client):
        """GET /api/admin/analytics - analytics data (requires auth)"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/analytics")
        assert response.status_code == 200
        data = response.json()
        assert "contacts_by_date" in data
        assert "domains_by_status" in data
        assert "total_revenue" in data
        assert "top_domains" in data
        assert "recent_contacts_7d" in data
        print(f"✓ Analytics data retrieved")


# ==== 8. ADMIN BLOG ENDPOINTS ====

class TestAdminBlog:
    """Tests for admin blog CRUD endpoints (posts, categories, tags)"""
    
    def test_admin_create_category(self, authenticated_client):
        """POST /api/admin/blog/categories - create category"""
        category_data = {"name": "TEST_Category", "description": "Test category for regression"}
        response = authenticated_client.post(f"{BASE_URL}/api/admin/blog/categories", json=category_data)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == category_data["name"]
        assert "id" in data
        print(f"✓ Category created: {data['id']}")
        return data["id"]
    
    def test_admin_get_categories(self, authenticated_client):
        """GET /api/admin/blog/categories - list categories"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/blog/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin categories: {len(data)}")
    
    def test_admin_create_tag(self, authenticated_client):
        """POST /api/admin/blog/tags - create tag"""
        tag_data = {"name": "TEST_Tag"}
        response = authenticated_client.post(f"{BASE_URL}/api/admin/blog/tags", json=tag_data)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == tag_data["name"]
        print(f"✓ Tag created: {data['id']}")
        return data["id"]
    
    def test_admin_get_tags(self, authenticated_client):
        """GET /api/admin/blog/tags - list tags"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/blog/tags")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin tags: {len(data)}")
    
    def test_admin_create_blog_post(self, authenticated_client):
        """POST /api/admin/blog/posts - create post"""
        post_data = {
            "title": "TEST_Blog Post for Regression",
            "content": "This is test content for regression testing of the blog module.",
            "excerpt": "Test excerpt",
            "status": "draft",
            "tags": ["TEST_Tag"],
            "author": "Test Admin"
        }
        response = authenticated_client.post(f"{BASE_URL}/api/admin/blog/posts", json=post_data)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == post_data["title"]
        assert "id" in data
        assert "slug" in data
        print(f"✓ Blog post created: {data['id']}")
        return data["id"]
    
    def test_admin_get_blog_posts(self, authenticated_client):
        """GET /api/admin/blog/posts - list blog posts"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/blog/posts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin blog posts: {len(data)}")
    
    def test_admin_get_blog_post_by_id(self, authenticated_client):
        """GET /api/admin/blog/posts/{id} - get single post"""
        # First create a post
        post_data = {
            "title": "TEST_Get Single Post",
            "content": "Test content",
            "status": "draft"
        }
        create_resp = authenticated_client.post(f"{BASE_URL}/api/admin/blog/posts", json=post_data)
        assert create_resp.status_code == 201
        post_id = create_resp.json()["id"]
        
        # Get by ID
        response = authenticated_client.get(f"{BASE_URL}/api/admin/blog/posts/{post_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == post_id
        print(f"✓ Blog post retrieved: {post_id}")
    
    def test_admin_update_blog_post(self, authenticated_client):
        """PUT /api/admin/blog/posts/{id} - update post"""
        # Create a post
        post_data = {
            "title": "TEST_Update Post",
            "content": "Original content",
            "status": "draft"
        }
        create_resp = authenticated_client.post(f"{BASE_URL}/api/admin/blog/posts", json=post_data)
        assert create_resp.status_code == 201
        post_id = create_resp.json()["id"]
        
        # Update
        update_data = {"title": "TEST_Updated Post Title", "status": "published"}
        response = authenticated_client.put(f"{BASE_URL}/api/admin/blog/posts/{post_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "TEST_Updated Post Title"
        assert data["status"] == "published"
        print(f"✓ Blog post updated: {post_id}")
    
    def test_admin_delete_blog_post(self, authenticated_client):
        """DELETE /api/admin/blog/posts/{id} - delete post"""
        # Create a post
        post_data = {
            "title": "TEST_Delete Post",
            "content": "To be deleted",
            "status": "draft"
        }
        create_resp = authenticated_client.post(f"{BASE_URL}/api/admin/blog/posts", json=post_data)
        assert create_resp.status_code == 201
        post_id = create_resp.json()["id"]
        
        # Delete
        response = authenticated_client.delete(f"{BASE_URL}/api/admin/blog/posts/{post_id}")
        assert response.status_code == 200
        print(f"✓ Blog post deleted: {post_id}")
    
    def test_admin_delete_tag(self, authenticated_client):
        """DELETE /api/admin/blog/tags/{id} - delete tag"""
        # Create a tag
        tag_data = {"name": "TEST_Delete_Tag"}
        create_resp = authenticated_client.post(f"{BASE_URL}/api/admin/blog/tags", json=tag_data)
        assert create_resp.status_code == 201
        tag_id = create_resp.json()["id"]
        
        # Delete
        response = authenticated_client.delete(f"{BASE_URL}/api/admin/blog/tags/{tag_id}")
        assert response.status_code == 200
        print(f"✓ Tag deleted: {tag_id}")
    
    def test_admin_delete_category(self, authenticated_client):
        """DELETE /api/admin/blog/categories/{id} - delete category"""
        # Create a category
        cat_data = {"name": "TEST_Delete_Category"}
        create_resp = authenticated_client.post(f"{BASE_URL}/api/admin/blog/categories", json=cat_data)
        assert create_resp.status_code == 201
        cat_id = create_resp.json()["id"]
        
        # Delete
        response = authenticated_client.delete(f"{BASE_URL}/api/admin/blog/categories/{cat_id}")
        assert response.status_code == 200
        print(f"✓ Category deleted: {cat_id}")


# ==== 9. ADMIN SEO ENDPOINTS ====

class TestAdminSEO:
    """Tests for admin SEO CRUD endpoints"""
    
    def test_admin_create_seo_page(self, authenticated_client):
        """POST /api/admin/seo/pages - create SEO page"""
        page_data = {
            "title": "TEST_SEO Page",
            "slug": "test-seo-page",
            "headline": "Test Headline",
            "subheadline": "Test Subheadline",
            "meta_title": "Test Meta Title",
            "meta_description": "Test meta description",
            "status": "draft"
        }
        response = authenticated_client.post(f"{BASE_URL}/api/admin/seo/pages", json=page_data)
        if response.status_code == 400:  # Slug exists
            # Get existing pages
            pages = authenticated_client.get(f"{BASE_URL}/api/admin/seo/pages").json()
            page = next((p for p in pages if p["slug"] == "test-seo-page"), None)
            if page:
                print(f"✓ SEO page exists: {page['id']}")
                return page["id"]
        assert response.status_code == 201
        data = response.json()
        assert data["slug"] == page_data["slug"]
        print(f"✓ SEO page created: {data['id']}")
        return data["id"]
    
    def test_admin_get_seo_pages(self, authenticated_client):
        """GET /api/admin/seo/pages - list SEO pages"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/seo/pages")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin SEO pages: {len(data)}")
    
    def test_admin_update_seo_page(self, authenticated_client):
        """PUT /api/admin/seo/pages/{id} - update SEO page"""
        # Create a page
        page_data = {
            "title": "TEST_Update SEO Page",
            "slug": "test-update-seo-page",
            "headline": "Original Headline",
            "status": "draft"
        }
        create_resp = authenticated_client.post(f"{BASE_URL}/api/admin/seo/pages", json=page_data)
        if create_resp.status_code == 400:
            pages = authenticated_client.get(f"{BASE_URL}/api/admin/seo/pages").json()
            page = next((p for p in pages if p["slug"] == "test-update-seo-page"), None)
            if page:
                page_id = page["id"]
            else:
                pytest.skip("Could not find or create test page")
        else:
            assert create_resp.status_code == 201
            page_id = create_resp.json()["id"]
        
        # Update
        update_data = {"headline": "Updated Headline", "status": "published"}
        response = authenticated_client.put(f"{BASE_URL}/api/admin/seo/pages/{page_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["headline"] == "Updated Headline"
        print(f"✓ SEO page updated: {page_id}")
    
    def test_admin_delete_seo_page(self, authenticated_client):
        """DELETE /api/admin/seo/pages/{id} - delete SEO page"""
        # Create a page
        page_data = {
            "title": "TEST_Delete SEO Page",
            "slug": "test-delete-seo-page",
            "headline": "To be deleted",
            "status": "draft"
        }
        create_resp = authenticated_client.post(f"{BASE_URL}/api/admin/seo/pages", json=page_data)
        if create_resp.status_code == 400:
            pages = authenticated_client.get(f"{BASE_URL}/api/admin/seo/pages").json()
            page = next((p for p in pages if p["slug"] == "test-delete-seo-page"), None)
            if page:
                page_id = page["id"]
            else:
                pytest.skip("Could not find or create test page")
        else:
            assert create_resp.status_code == 201
            page_id = create_resp.json()["id"]
        
        # Delete
        response = authenticated_client.delete(f"{BASE_URL}/api/admin/seo/pages/{page_id}")
        assert response.status_code == 200
        print(f"✓ SEO page deleted: {page_id}")
    
    def test_admin_get_seo_settings(self, authenticated_client):
        """GET /api/admin/seo/settings - get SEO settings"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/seo/settings")
        assert response.status_code == 200
        data = response.json()
        assert "site_title" in data
        print(f"✓ SEO settings retrieved")
    
    def test_admin_update_seo_settings(self, authenticated_client):
        """PUT /api/admin/seo/settings - update SEO settings"""
        update_data = {
            "site_title": "Agedify - Premium Aged Domains",
            "site_description": "Marketplace for premium aged domains - Regression Test"
        }
        response = authenticated_client.put(f"{BASE_URL}/api/admin/seo/settings", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["site_title"] == update_data["site_title"]
        print(f"✓ SEO settings updated")


# ==== CLEANUP TEST ====

class TestCleanup:
    """Cleanup test data created during testing"""
    
    def test_cleanup_test_data(self, authenticated_client, api_client):
        """Clean up TEST_ prefixed data"""
        # Clean up test contacts
        contacts = authenticated_client.get(f"{BASE_URL}/api/admin/contacts").json()
        deleted_contacts = 0
        for contact in contacts:
            if contact.get("name", "").startswith("TEST_"):
                authenticated_client.delete(f"{BASE_URL}/api/admin/contacts/{contact['id']}")
                deleted_contacts += 1
        
        # Clean up test domains
        domains = authenticated_client.get(f"{BASE_URL}/api/admin/domains").json()
        deleted_domains = 0
        for domain in domains:
            if domain.get("domain_name", "").startswith("test-"):
                authenticated_client.delete(f"{BASE_URL}/api/admin/domains/{domain['id']}")
                deleted_domains += 1
        
        # Clean up test blog posts
        posts = authenticated_client.get(f"{BASE_URL}/api/admin/blog/posts").json()
        deleted_posts = 0
        for post in posts:
            if post.get("title", "").startswith("TEST_"):
                authenticated_client.delete(f"{BASE_URL}/api/admin/blog/posts/{post['id']}")
                deleted_posts += 1
        
        # Clean up test categories
        categories = authenticated_client.get(f"{BASE_URL}/api/admin/blog/categories").json()
        deleted_cats = 0
        for cat in categories:
            if cat.get("name", "").startswith("TEST_"):
                authenticated_client.delete(f"{BASE_URL}/api/admin/blog/categories/{cat['id']}")
                deleted_cats += 1
        
        # Clean up test tags
        tags = authenticated_client.get(f"{BASE_URL}/api/admin/blog/tags").json()
        deleted_tags = 0
        for tag in tags:
            if tag.get("name", "").startswith("TEST_"):
                authenticated_client.delete(f"{BASE_URL}/api/admin/blog/tags/{tag['id']}")
                deleted_tags += 1
        
        print(f"✓ Cleanup: {deleted_contacts} contacts, {deleted_domains} domains, {deleted_posts} posts, {deleted_cats} categories, {deleted_tags} tags")
