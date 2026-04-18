"""
Test Admin Management CRUD APIs and Internal Link Suggestions
Features: P1 - Manage Admins CRUD, P2 - Internal Link Suggestions
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"
TEST_ADMIN_PREFIX = "TEST_admin_"


class TestAdminAuth:
    """Test admin login and authentication"""
    
    def test_admin_login_success(self):
        """Login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "admin" in data
        assert data["admin"]["username"] == ADMIN_USERNAME
    
    def test_admin_login_invalid_credentials(self):
        """Login with invalid credentials should return 401"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "wrong_user",
            "password": "wrong_pass"
        })
        assert response.status_code == 401


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin API calls"""
    response = requests.post(f"{BASE_URL}/api/admin/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Authentication failed - cannot continue tests")


@pytest.fixture(scope="module")
def current_admin_id(auth_token):
    """Get the current logged-in admin ID"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = requests.get(f"{BASE_URL}/api/admin/me", headers=headers)
    if response.status_code == 200:
        return response.json()["id"]
    pytest.skip("Cannot get current admin info")


class TestAdminManagement:
    """P1: Test Manage Admins CRUD Operations"""
    
    def test_list_admins_returns_list(self, auth_token):
        """GET /api/admin/admins - Should return list of admins without passwords"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/admins", headers=headers)
        
        assert response.status_code == 200
        admins = response.json()
        assert isinstance(admins, list)
        assert len(admins) >= 1  # At least the current admin
        
        # Verify password is not exposed
        for admin in admins:
            assert "password" not in admin
            assert "id" in admin
            assert "username" in admin
            assert "created_at" in admin
    
    def test_list_admins_unauthorized(self):
        """GET /api/admin/admins - Should return 401/403 without token"""
        response = requests.get(f"{BASE_URL}/api/admin/admins")
        assert response.status_code in [401, 403]
    
    def test_create_admin_success(self, auth_token):
        """POST /api/admin/admins - Create a new admin"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        unique_name = f"{TEST_ADMIN_PREFIX}{uuid.uuid4().hex[:8]}"
        
        response = requests.post(f"{BASE_URL}/api/admin/admins", headers=headers, json={
            "username": unique_name,
            "password": "testpassword123"
        })
        
        assert response.status_code == 201, f"Failed to create admin: {response.text}"
        data = response.json()
        assert data["username"] == unique_name
        assert "id" in data
        assert "created_at" in data
        assert "password" not in data
        
        # Clean up: delete the created admin
        admin_id = data["id"]
        requests.delete(f"{BASE_URL}/api/admin/admins/{admin_id}", headers=headers)
    
    def test_create_admin_duplicate_username(self, auth_token):
        """POST /api/admin/admins - Duplicate username should return 400"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Try to create admin with existing username 'admin'
        response = requests.post(f"{BASE_URL}/api/admin/admins", headers=headers, json={
            "username": "admin",
            "password": "somepassword123"
        })
        
        assert response.status_code == 400
        assert "already exists" in response.json().get("detail", "").lower()
    
    def test_create_admin_short_password(self, auth_token):
        """POST /api/admin/admins - Password < 6 chars should fail validation"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        unique_name = f"{TEST_ADMIN_PREFIX}{uuid.uuid4().hex[:8]}"
        
        response = requests.post(f"{BASE_URL}/api/admin/admins", headers=headers, json={
            "username": unique_name,
            "password": "12345"  # Only 5 chars
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_update_admin_username(self, auth_token):
        """PUT /api/admin/admins/{id} - Update admin username"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First create an admin to update
        original_name = f"{TEST_ADMIN_PREFIX}{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/admin/admins", headers=headers, json={
            "username": original_name,
            "password": "testpassword123"
        })
        assert create_response.status_code == 201
        admin_id = create_response.json()["id"]
        
        # Update the username
        new_name = f"{TEST_ADMIN_PREFIX}{uuid.uuid4().hex[:8]}"
        update_response = requests.put(f"{BASE_URL}/api/admin/admins/{admin_id}", headers=headers, json={
            "username": new_name
        })
        
        assert update_response.status_code == 200
        updated_data = update_response.json()
        assert updated_data["username"] == new_name
        assert updated_data["id"] == admin_id
        
        # Verify persistence with GET
        list_response = requests.get(f"{BASE_URL}/api/admin/admins", headers=headers)
        admins = list_response.json()
        updated_admin = next((a for a in admins if a["id"] == admin_id), None)
        assert updated_admin is not None
        assert updated_admin["username"] == new_name
        
        # Clean up
        requests.delete(f"{BASE_URL}/api/admin/admins/{admin_id}", headers=headers)
    
    def test_update_admin_password(self, auth_token):
        """PUT /api/admin/admins/{id} - Update admin password"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create an admin
        unique_name = f"{TEST_ADMIN_PREFIX}{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/admin/admins", headers=headers, json={
            "username": unique_name,
            "password": "oldpassword123"
        })
        assert create_response.status_code == 201
        admin_id = create_response.json()["id"]
        
        # Update password
        update_response = requests.put(f"{BASE_URL}/api/admin/admins/{admin_id}", headers=headers, json={
            "password": "newpassword456"
        })
        
        assert update_response.status_code == 200
        
        # Verify new password works by logging in
        login_response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": unique_name,
            "password": "newpassword456"
        })
        assert login_response.status_code == 200
        
        # Clean up
        requests.delete(f"{BASE_URL}/api/admin/admins/{admin_id}", headers=headers)
    
    def test_update_admin_no_data(self, auth_token, current_admin_id):
        """PUT /api/admin/admins/{id} - No data to update should return 400"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.put(f"{BASE_URL}/api/admin/admins/{current_admin_id}", headers=headers, json={})
        
        assert response.status_code == 400
        assert "no data" in response.json().get("detail", "").lower()
    
    def test_update_admin_not_found(self, auth_token):
        """PUT /api/admin/admins/{id} - Non-existent admin should return 404"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        fake_id = str(uuid.uuid4())
        
        response = requests.put(f"{BASE_URL}/api/admin/admins/{fake_id}", headers=headers, json={
            "username": "newname"
        })
        
        assert response.status_code == 404
    
    def test_delete_admin_success(self, auth_token):
        """DELETE /api/admin/admins/{id} - Delete another admin"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create an admin to delete
        unique_name = f"{TEST_ADMIN_PREFIX}{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/admin/admins", headers=headers, json={
            "username": unique_name,
            "password": "testpassword123"
        })
        assert create_response.status_code == 201
        admin_id = create_response.json()["id"]
        
        # Delete the admin
        delete_response = requests.delete(f"{BASE_URL}/api/admin/admins/{admin_id}", headers=headers)
        assert delete_response.status_code == 200
        assert "deleted" in delete_response.json().get("message", "").lower()
        
        # Verify admin no longer exists
        list_response = requests.get(f"{BASE_URL}/api/admin/admins", headers=headers)
        admins = list_response.json()
        deleted_admin = next((a for a in admins if a["id"] == admin_id), None)
        assert deleted_admin is None
    
    def test_delete_self_prevented(self, auth_token, current_admin_id):
        """DELETE /api/admin/admins/{id} - Cannot delete yourself"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.delete(f"{BASE_URL}/api/admin/admins/{current_admin_id}", headers=headers)
        
        assert response.status_code == 400
        assert "cannot delete your own" in response.json().get("detail", "").lower()
    
    def test_delete_admin_not_found(self, auth_token):
        """DELETE /api/admin/admins/{id} - Non-existent admin should return 404"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        fake_id = str(uuid.uuid4())
        
        response = requests.delete(f"{BASE_URL}/api/admin/admins/{fake_id}", headers=headers)
        
        assert response.status_code == 404


class TestInternalLinkSuggestions:
    """P2: Test Internal Link Suggestions API"""
    
    def test_link_suggestions_returns_suggestions(self, auth_token):
        """POST /api/admin/blog/link-suggestions - Returns matching suggestions"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(f"{BASE_URL}/api/admin/blog/link-suggestions", headers=headers, json={
            "title": "SEO Tips for Aged Domains",
            "content": "This article discusses SEO strategies and domain authority benefits"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
        assert isinstance(data["suggestions"], list)
    
    def test_link_suggestions_structure(self, auth_token):
        """POST /api/admin/blog/link-suggestions - Verify suggestion structure"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(f"{BASE_URL}/api/admin/blog/link-suggestions", headers=headers, json={
            "title": "Domain Authority Guide",
            "content": "Learn about domain rating, backlinks, and SEO metrics"
        })
        
        assert response.status_code == 200
        suggestions = response.json().get("suggestions", [])
        
        if len(suggestions) > 0:
            suggestion = suggestions[0]
            assert "type" in suggestion
            assert suggestion["type"] in ["blog", "domain", "category"]
            assert "title" in suggestion
            assert "url" in suggestion
            assert "relevance" in suggestion
            assert "matched_keywords" in suggestion
    
    def test_link_suggestions_empty_content(self, auth_token):
        """POST /api/admin/blog/link-suggestions - Empty content still works"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(f"{BASE_URL}/api/admin/blog/link-suggestions", headers=headers, json={
            "title": "",
            "content": ""
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
        assert isinstance(data["suggestions"], list)
    
    def test_link_suggestions_excludes_current_post(self, auth_token):
        """POST /api/admin/blog/link-suggestions - Should exclude current post"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First get a blog post ID - API returns list directly
        posts_response = requests.get(f"{BASE_URL}/api/admin/blog/posts", headers=headers)
        if posts_response.status_code == 200:
            posts_data = posts_response.json()
            # Handle both list and dict with 'posts' key
            posts = posts_data if isinstance(posts_data, list) else posts_data.get("posts", [])
            
            if len(posts) > 0:
                current_post = posts[0]
                
                response = requests.post(f"{BASE_URL}/api/admin/blog/link-suggestions", headers=headers, json={
                    "title": current_post.get("title", "Test"),
                    "content": "Some content about domains",
                    "current_post_id": current_post.get("id")
                })
                
                assert response.status_code == 200
                suggestions = response.json().get("suggestions", [])
                
                # Verify current post is not in suggestions
                for s in suggestions:
                    if s["type"] == "blog":
                        assert s["url"] != f"/blog/{current_post.get('slug')}"
    
    def test_link_suggestions_unauthorized(self):
        """POST /api/admin/blog/link-suggestions - Should require auth"""
        response = requests.post(f"{BASE_URL}/api/admin/blog/link-suggestions", json={
            "title": "Test",
            "content": "Test content"
        })
        
        assert response.status_code in [401, 403]


class TestAdminManagementEdgeCases:
    """Edge cases and additional validations"""
    
    def test_update_to_duplicate_username(self, auth_token):
        """PUT /api/admin/admins/{id} - Changing to existing username should fail"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create a test admin
        unique_name = f"{TEST_ADMIN_PREFIX}{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/admin/admins", headers=headers, json={
            "username": unique_name,
            "password": "testpassword123"
        })
        assert create_response.status_code == 201
        admin_id = create_response.json()["id"]
        
        # Try to update to 'admin' (existing username)
        update_response = requests.put(f"{BASE_URL}/api/admin/admins/{admin_id}", headers=headers, json={
            "username": "admin"
        })
        
        assert update_response.status_code == 400
        assert "already exists" in update_response.json().get("detail", "").lower()
        
        # Clean up
        requests.delete(f"{BASE_URL}/api/admin/admins/{admin_id}", headers=headers)


@pytest.fixture(scope="module", autouse=True)
def cleanup_test_admins(auth_token):
    """Clean up any test admins after all tests complete"""
    yield
    # Teardown: Delete all TEST_ prefixed admins
    headers = {"Authorization": f"Bearer {auth_token}"}
    try:
        response = requests.get(f"{BASE_URL}/api/admin/admins", headers=headers)
        if response.status_code == 200:
            for admin in response.json():
                if admin["username"].startswith(TEST_ADMIN_PREFIX):
                    requests.delete(f"{BASE_URL}/api/admin/admins/{admin['id']}", headers=headers)
    except:
        pass
