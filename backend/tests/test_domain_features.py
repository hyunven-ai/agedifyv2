"""
Backend API Tests for Domain Features - Indexed and Discount fields
Testing new features: indexed pages column, discount_percentage field
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDomainAPIEndpoints:
    """Test domain endpoints with indexed and discount_percentage fields"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for admin operations"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        return data["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Return headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    # ==================== PUBLIC ENDPOINTS ====================
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")
    
    def test_get_public_domains_returns_indexed_field(self):
        """Verify GET /api/domains returns indexed field in response"""
        response = requests.get(f"{BASE_URL}/api/domains")
        assert response.status_code == 200
        domains = response.json()
        assert len(domains) > 0, "No domains found"
        
        # Check first domain has indexed field
        first_domain = domains[0]
        assert "indexed" in first_domain, "indexed field missing from domain response"
        assert isinstance(first_domain["indexed"], int), "indexed should be an integer"
        print(f"✓ GET /api/domains returns indexed field: {first_domain['indexed']}")
    
    def test_get_public_domains_returns_discount_percentage_field(self):
        """Verify GET /api/domains returns discount_percentage field in response"""
        response = requests.get(f"{BASE_URL}/api/domains")
        assert response.status_code == 200
        domains = response.json()
        
        first_domain = domains[0]
        assert "discount_percentage" in first_domain, "discount_percentage field missing from domain response"
        assert isinstance(first_domain["discount_percentage"], (int, float)), "discount_percentage should be numeric"
        print(f"✓ GET /api/domains returns discount_percentage field: {first_domain['discount_percentage']}")
    
    def test_get_domain_by_slug_returns_indexed_and_discount(self):
        """Verify GET /api/domains/{slug} returns indexed and discount_percentage"""
        # First get a domain slug
        response = requests.get(f"{BASE_URL}/api/domains")
        assert response.status_code == 200
        domains = response.json()
        
        test_slug = "testdiscount-com"  # The test domain created by main agent
        response = requests.get(f"{BASE_URL}/api/domains/{test_slug}")
        assert response.status_code == 200, f"Domain not found: {test_slug}"
        
        domain = response.json()
        assert "indexed" in domain, "indexed field missing"
        assert "discount_percentage" in domain, "discount_percentage field missing"
        assert domain["indexed"] == 1500, f"Expected indexed=1500, got {domain['indexed']}"
        assert domain["discount_percentage"] == 20.0, f"Expected discount_percentage=20.0, got {domain['discount_percentage']}"
        print(f"✓ Domain {test_slug} has indexed={domain['indexed']}, discount_percentage={domain['discount_percentage']}")
    
    def test_get_featured_domains_returns_indexed_field(self):
        """Verify GET /api/domains/featured returns indexed field"""
        response = requests.get(f"{BASE_URL}/api/domains/featured")
        assert response.status_code == 200
        domains = response.json()
        
        if len(domains) > 0:
            for domain in domains:
                assert "indexed" in domain, f"indexed field missing from {domain['domain_name']}"
                assert "discount_percentage" in domain, f"discount_percentage field missing from {domain['domain_name']}"
            print(f"✓ GET /api/domains/featured returns indexed and discount_percentage for {len(domains)} domains")
        else:
            print("⚠ No featured domains available")
    
    # ==================== ADMIN ENDPOINTS ====================
    
    def test_admin_login(self):
        """Test admin login endpoint"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "admin" in data
        print("✓ Admin login successful")
    
    def test_admin_get_domains_returns_indexed_and_discount(self, auth_headers):
        """Verify GET /api/admin/domains returns indexed and discount_percentage"""
        response = requests.get(f"{BASE_URL}/api/admin/domains", headers=auth_headers)
        assert response.status_code == 200
        domains = response.json()
        
        if len(domains) > 0:
            first_domain = domains[0]
            assert "indexed" in first_domain, "indexed field missing from admin domain response"
            assert "discount_percentage" in first_domain, "discount_percentage field missing from admin domain response"
            print(f"✓ Admin GET /api/admin/domains returns indexed and discount_percentage")
    
    def test_admin_create_domain_with_indexed_and_discount(self, auth_headers):
        """Test POST /api/admin/domains accepts indexed and discount_percentage fields"""
        unique_id = str(int(time.time()))
        payload = {
            "domain_name": f"TEST_discount_domain_{unique_id}.com",
            "dr": 50,
            "da": 45,
            "pa": 40,
            "spam_score": 5,
            "backlinks": 1000,
            "traffic": 5000,
            "age": 3,
            "price": 2500.0,
            "discount_percentage": 15.0,
            "indexed": 2000,
            "status": "available",
            "description": "Test domain with discount and indexed fields"
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/domains", json=payload, headers=auth_headers)
        assert response.status_code == 201, f"Create failed: {response.text}"
        
        domain = response.json()
        assert domain["indexed"] == 2000, f"Expected indexed=2000, got {domain['indexed']}"
        assert domain["discount_percentage"] == 15.0, f"Expected discount_percentage=15.0, got {domain['discount_percentage']}"
        assert domain["pa"] == 40, f"Expected pa=40, got {domain['pa']}"
        
        # Store domain ID for cleanup
        self.created_domain_id = domain["id"]
        print(f"✓ Created domain with indexed={domain['indexed']}, discount_percentage={domain['discount_percentage']}")
        
        # Verify persistence via GET
        get_response = requests.get(f"{BASE_URL}/api/domains/{domain['slug']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["indexed"] == 2000
        assert fetched["discount_percentage"] == 15.0
        print("✓ Created domain persisted correctly")
        
        return domain["id"]
    
    def test_admin_update_domain_indexed_and_discount(self, auth_headers):
        """Test PUT /api/admin/domains/{id} updates indexed and discount_percentage"""
        # First create a domain
        unique_id = str(int(time.time()))
        create_payload = {
            "domain_name": f"TEST_update_domain_{unique_id}.com",
            "dr": 45,
            "da": 40,
            "pa": 35,
            "backlinks": 800,
            "traffic": 3000,
            "age": 2,
            "price": 1500.0,
            "indexed": 500,
            "discount_percentage": 0
        }
        
        create_response = requests.post(f"{BASE_URL}/api/admin/domains", json=create_payload, headers=auth_headers)
        assert create_response.status_code == 201, f"Create failed: {create_response.text}"
        created_domain = create_response.json()
        domain_id = created_domain["id"]
        
        # Update indexed and discount_percentage
        update_payload = {
            "indexed": 3500,
            "discount_percentage": 25.0
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/admin/domains/{domain_id}",
            json=update_payload,
            headers=auth_headers
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        
        updated_domain = update_response.json()
        assert updated_domain["indexed"] == 3500, f"Expected indexed=3500, got {updated_domain['indexed']}"
        assert updated_domain["discount_percentage"] == 25.0, f"Expected discount_percentage=25.0, got {updated_domain['discount_percentage']}"
        
        # Verify persistence via GET
        get_response = requests.get(f"{BASE_URL}/api/domains/{created_domain['slug']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["indexed"] == 3500, "Updated indexed not persisted"
        assert fetched["discount_percentage"] == 25.0, "Updated discount_percentage not persisted"
        print(f"✓ Updated domain indexed={fetched['indexed']}, discount_percentage={fetched['discount_percentage']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/domains/{domain_id}", headers=auth_headers)
    
    def test_discount_calculation_logic(self):
        """Verify discount is returned correctly and can be calculated"""
        response = requests.get(f"{BASE_URL}/api/domains/testdiscount-com")
        assert response.status_code == 200
        
        domain = response.json()
        original_price = domain["price"]
        discount_percentage = domain["discount_percentage"]
        
        # Calculate expected discounted price
        expected_discounted_price = original_price * (1 - discount_percentage / 100)
        
        # Verify values
        assert original_price == 3000.0, f"Expected price=3000.0, got {original_price}"
        assert discount_percentage == 20.0, f"Expected discount_percentage=20.0, got {discount_percentage}"
        assert expected_discounted_price == 2400.0, f"Expected discounted price=2400.0, got {expected_discounted_price}"
        print(f"✓ Discount calculation: ${original_price} - {discount_percentage}% = ${expected_discounted_price}")
    
    def test_domain_with_zero_discount(self):
        """Verify domains without discount have discount_percentage=0"""
        response = requests.get(f"{BASE_URL}/api/domains/techstartup-com")
        assert response.status_code == 200
        
        domain = response.json()
        assert domain["discount_percentage"] == 0.0 or domain["discount_percentage"] == 0, \
            f"Expected discount_percentage=0 for non-discounted domain, got {domain['discount_percentage']}"
        print(f"✓ Non-discounted domain has discount_percentage={domain['discount_percentage']}")
    
    def test_domain_with_pa_field(self):
        """Verify PA (Page Authority) field is returned correctly"""
        response = requests.get(f"{BASE_URL}/api/domains/testdiscount-com")
        assert response.status_code == 200
        
        domain = response.json()
        assert "pa" in domain, "pa field missing from domain response"
        assert domain["pa"] == 42, f"Expected pa=42, got {domain['pa']}"
        print(f"✓ Domain has pa={domain['pa']}")


class TestDomainValidation:
    """Test validation for indexed and discount_percentage fields"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get authentication token for admin operations"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        return {"Authorization": f"Bearer {response.json()['access_token']}"}
    
    def test_discount_percentage_max_validation(self, auth_headers):
        """Verify discount_percentage cannot exceed 100"""
        unique_id = str(int(time.time()))
        payload = {
            "domain_name": f"TEST_invalid_discount_{unique_id}.com",
            "dr": 50,
            "da": 45,
            "backlinks": 1000,
            "traffic": 5000,
            "age": 3,
            "price": 2500.0,
            "discount_percentage": 150.0,  # Invalid - should be max 100
            "indexed": 1000
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/domains", json=payload, headers=auth_headers)
        # Should return 422 validation error
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("✓ discount_percentage > 100 validation works")
    
    def test_indexed_negative_validation(self, auth_headers):
        """Verify indexed cannot be negative"""
        unique_id = str(int(time.time()))
        payload = {
            "domain_name": f"TEST_invalid_indexed_{unique_id}.com",
            "dr": 50,
            "da": 45,
            "backlinks": 1000,
            "traffic": 5000,
            "age": 3,
            "price": 2500.0,
            "indexed": -100  # Invalid - should be min 0
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/domains", json=payload, headers=auth_headers)
        # Should return 422 validation error
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("✓ indexed < 0 validation works")


class TestCleanup:
    """Cleanup test domains created during testing"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get authentication token for admin operations"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        return {"Authorization": f"Bearer {response.json()['access_token']}"}
    
    def test_cleanup_test_domains(self, auth_headers):
        """Clean up test domains created by this test suite"""
        response = requests.get(f"{BASE_URL}/api/admin/domains", headers=auth_headers)
        assert response.status_code == 200
        
        domains = response.json()
        deleted_count = 0
        for domain in domains:
            if domain["domain_name"].startswith("TEST_"):
                delete_response = requests.delete(
                    f"{BASE_URL}/api/admin/domains/{domain['id']}",
                    headers=auth_headers
                )
                if delete_response.status_code == 200:
                    deleted_count += 1
        
        print(f"✓ Cleaned up {deleted_count} test domains")
