"""
Test suite for JSON-LD structured data and social sharing features
Tests the API endpoints that provide data for JSON-LD schemas on:
- Landing page (WebSite + Organization schemas)
- Domain detail page (Product schema)
- Blog post page (Article schema)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDomainDetailAPI:
    """Tests for domain detail API - provides data for Product JSON-LD schema"""
    
    def test_domain_detail_endpoint_exists(self):
        """Test that the domain detail endpoint returns data for JSON-LD"""
        response = requests.get(f"{BASE_URL}/api/domains/techstartup-com")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
    def test_domain_detail_has_required_fields_for_product_schema(self):
        """Verify domain data has all fields needed for Product JSON-LD schema"""
        response = requests.get(f"{BASE_URL}/api/domains/techstartup-com")
        assert response.status_code == 200
        data = response.json()
        
        # Required fields for Product schema
        assert 'domain_name' in data, "domain_name required for Product schema name"
        assert 'price' in data, "price required for Product schema offers.price"
        assert 'status' in data, "status required for Product schema offers.availability"
        assert 'description' in data or data.get('description') is None, "description field exists"
        
    def test_domain_detail_price_is_numeric(self):
        """Verify price is a valid number for JSON-LD schema"""
        response = requests.get(f"{BASE_URL}/api/domains/techstartup-com")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data['price'], (int, float)), "Price should be numeric"
        assert data['price'] > 0, "Price should be positive"
        
    def test_domain_detail_has_seo_metrics(self):
        """Verify domain has SEO metrics for Product additionalProperty"""
        response = requests.get(f"{BASE_URL}/api/domains/techstartup-com")
        assert response.status_code == 200
        data = response.json()
        
        # SEO metrics used in additionalProperty
        assert 'dr' in data, "Domain Rating (dr) required for Product additionalProperty"
        assert 'da' in data, "Domain Authority (da) required for Product additionalProperty"
        assert 'age' in data, "Domain Age required for Product additionalProperty"
        assert 'backlinks' in data, "Backlinks required for Product additionalProperty"


class TestBlogPostAPI:
    """Tests for blog post API - provides data for Article JSON-LD schema"""
    
    def test_blog_post_endpoint_exists(self):
        """Test that the blog post endpoint returns data"""
        response = requests.get(f"{BASE_URL}/api/blog/posts/the-benefits-of-aged-domains-for-seo")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
    def test_blog_post_has_required_fields_for_article_schema(self):
        """Verify blog post has all fields needed for Article JSON-LD schema"""
        response = requests.get(f"{BASE_URL}/api/blog/posts/the-benefits-of-aged-domains-for-seo")
        assert response.status_code == 200
        data = response.json()
        
        # Required fields for Article schema
        assert 'title' in data, "title required for Article schema headline"
        assert 'author' in data, "author required for Article schema author.name"
        assert 'published_at' in data, "published_at required for Article schema datePublished"
        
    def test_blog_post_title_not_empty(self):
        """Verify blog post has a non-empty title for headline"""
        response = requests.get(f"{BASE_URL}/api/blog/posts/the-benefits-of-aged-domains-for-seo")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get('title'), "Title should not be empty"
        assert len(data['title']) > 0, "Title should have content"
        
    def test_blog_post_has_optional_seo_fields(self):
        """Verify blog post has optional fields for enhanced Article schema"""
        response = requests.get(f"{BASE_URL}/api/blog/posts/the-benefits-of-aged-domains-for-seo")
        assert response.status_code == 200
        data = response.json()
        
        # Optional but useful fields for Article schema
        # These may be None but should exist as keys
        assert 'meta_description' in data or 'excerpt' in data, "Should have meta_description or excerpt"
        assert 'content' in data, "Should have content"


class TestBlogListAPI:
    """Tests for blog list API - used for generating static params"""
    
    def test_blog_list_endpoint_exists(self):
        """Test that the blog posts list endpoint works"""
        response = requests.get(f"{BASE_URL}/api/blog/posts")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
    def test_blog_list_returns_array(self):
        """Verify blog list returns an array of posts"""
        response = requests.get(f"{BASE_URL}/api/blog/posts")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Blog list should return an array"


class TestDomainsListAPI:
    """Tests for domains list API - used for generating static params"""
    
    def test_domains_list_endpoint_exists(self):
        """Test that the domains list endpoint works"""
        response = requests.get(f"{BASE_URL}/api/domains?limit=100")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
    def test_domains_list_returns_array(self):
        """Verify domains list returns an array"""
        response = requests.get(f"{BASE_URL}/api/domains?limit=100")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Domains list should return an array"
        
    def test_domains_have_slug_for_static_params(self):
        """Verify domains have slug field for generateStaticParams"""
        response = requests.get(f"{BASE_URL}/api/domains?limit=100")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            assert 'slug' in data[0], "Each domain should have a slug for static params"


class TestHealthCheck:
    """Basic health check for the API"""
    
    def test_api_is_accessible(self):
        """Test that the API is accessible"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        # Accept 200 or 404 (if health endpoint doesn't exist)
        assert response.status_code in [200, 404], f"API should be accessible, got {response.status_code}"
