"""
Test Admin Role Management Feature (Iteration 21)
Tests: super_admin vs editor roles, access control, CRUD operations
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN_USER = "admin"
SUPER_ADMIN_PASS = "admin123"

SUPER_ADMIN_2_USER = "play"
SUPER_ADMIN_2_PASS = "play123"

TEST_EDITOR_USER = "TEST_editor_user"
TEST_EDITOR_PASS = "editor123"


@pytest.fixture(scope="module")
def super_admin_token():
    """Get super admin token"""
    response = requests.post(f"{BASE_URL}/api/admin/login", json={
        "username": SUPER_ADMIN_USER,
        "password": SUPER_ADMIN_PASS
    })
    assert response.status_code == 200, f"Super Admin login failed: {response.text}"
    return response.json()["access_token"]


@pytest.fixture(scope="module")
def super_admin_headers(super_admin_token):
    """Headers with super admin auth"""
    return {"Authorization": f"Bearer {super_admin_token}"}


@pytest.fixture(scope="module")
def editor_account(super_admin_headers):
    """Create editor account for testing and cleanup after"""
    # Create editor
    create_resp = requests.post(f"{BASE_URL}/api/admin/admins", 
        headers=super_admin_headers,
        json={
            "username": TEST_EDITOR_USER,
            "password": TEST_EDITOR_PASS,
            "role": "editor"
        }
    )
    assert create_resp.status_code == 201, f"Failed to create editor: {create_resp.text}"
    editor = create_resp.json()
    
    yield editor
    
    # Cleanup - delete editor
    requests.delete(f"{BASE_URL}/api/admin/admins/{editor['id']}", headers=super_admin_headers)


@pytest.fixture(scope="module")
def editor_token(editor_account):
    """Get editor token"""
    response = requests.post(f"{BASE_URL}/api/admin/login", json={
        "username": TEST_EDITOR_USER,
        "password": TEST_EDITOR_PASS
    })
    assert response.status_code == 200, f"Editor login failed: {response.text}"
    return response.json()["access_token"]


@pytest.fixture(scope="module")
def editor_headers(editor_token):
    """Headers with editor auth"""
    return {"Authorization": f"Bearer {editor_token}"}


class TestLoginReturnsRole:
    """Test that login returns role field"""
    
    def test_super_admin_login_returns_role(self):
        """POST /api/admin/login returns role=super_admin for super admin"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": SUPER_ADMIN_USER,
            "password": SUPER_ADMIN_PASS
        })
        assert response.status_code == 200
        data = response.json()
        assert "admin" in data
        assert data["admin"]["role"] == "super_admin"
        
    def test_editor_login_returns_role(self, editor_account):
        """POST /api/admin/login returns role=editor for editor"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": TEST_EDITOR_USER,
            "password": TEST_EDITOR_PASS
        })
        assert response.status_code == 200
        data = response.json()
        assert "admin" in data
        assert data["admin"]["role"] == "editor"


class TestGetMeReturnsRole:
    """Test GET /api/admin/me returns role"""
    
    def test_super_admin_me_returns_role(self, super_admin_headers):
        """GET /api/admin/me returns role for super admin"""
        response = requests.get(f"{BASE_URL}/api/admin/me", headers=super_admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "super_admin"
        
    def test_editor_me_returns_role(self, editor_headers):
        """GET /api/admin/me returns role for editor"""
        response = requests.get(f"{BASE_URL}/api/admin/me", headers=editor_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "editor"


class TestAdminCRUDWithRole:
    """Test admin CRUD operations with role field"""
    
    def test_create_admin_with_super_admin_role(self, super_admin_headers):
        """POST /api/admin/admins - create admin with role=super_admin"""
        test_username = "TEST_new_super_admin"
        response = requests.post(f"{BASE_URL}/api/admin/admins",
            headers=super_admin_headers,
            json={
                "username": test_username,
                "password": "testpass123",
                "role": "super_admin"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["role"] == "super_admin"
        assert data["username"] == test_username
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/admins/{data['id']}", headers=super_admin_headers)
        
    def test_create_admin_with_editor_role(self, super_admin_headers):
        """POST /api/admin/admins - create admin with role=editor"""
        test_username = "TEST_new_editor"
        response = requests.post(f"{BASE_URL}/api/admin/admins",
            headers=super_admin_headers,
            json={
                "username": test_username,
                "password": "testpass123",
                "role": "editor"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["role"] == "editor"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/admins/{data['id']}", headers=super_admin_headers)
        
    def test_update_admin_role(self, super_admin_headers):
        """PUT /api/admin/admins/{id} - update admin role"""
        # Create test admin
        create_resp = requests.post(f"{BASE_URL}/api/admin/admins",
            headers=super_admin_headers,
            json={
                "username": "TEST_role_change",
                "password": "testpass123",
                "role": "editor"
            }
        )
        assert create_resp.status_code == 201
        admin_id = create_resp.json()["id"]
        
        # Update role to super_admin
        update_resp = requests.put(f"{BASE_URL}/api/admin/admins/{admin_id}",
            headers=super_admin_headers,
            json={"role": "super_admin"}
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["role"] == "super_admin"
        
        # Update role back to editor
        update_resp2 = requests.put(f"{BASE_URL}/api/admin/admins/{admin_id}",
            headers=super_admin_headers,
            json={"role": "editor"}
        )
        assert update_resp2.status_code == 200
        assert update_resp2.json()["role"] == "editor"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/admins/{admin_id}", headers=super_admin_headers)
        
    def test_prevent_self_demotion(self, super_admin_headers, super_admin_token):
        """PUT /api/admin/admins/{id} - prevent self-demotion from super_admin"""
        # Get current admin ID
        me_resp = requests.get(f"{BASE_URL}/api/admin/me", headers=super_admin_headers)
        current_admin_id = me_resp.json()["id"]
        
        # Try to demote self to editor
        response = requests.put(f"{BASE_URL}/api/admin/admins/{current_admin_id}",
            headers=super_admin_headers,
            json={"role": "editor"}
        )
        assert response.status_code == 400
        assert "Cannot demote your own account" in response.json()["detail"]


class TestEditorAccessDenied:
    """Test that editor gets 403 on protected endpoints"""
    
    def test_editor_cannot_access_domains(self, editor_headers):
        """Editor gets 403 on GET /api/admin/domains"""
        response = requests.get(f"{BASE_URL}/api/admin/domains", headers=editor_headers)
        assert response.status_code == 403
        assert "Super Admin access required" in response.json()["detail"]
        
    def test_editor_cannot_access_contacts(self, editor_headers):
        """Editor gets 403 on GET /api/admin/contacts"""
        response = requests.get(f"{BASE_URL}/api/admin/contacts", headers=editor_headers)
        assert response.status_code == 403
        
    def test_editor_cannot_access_admins_list(self, editor_headers):
        """Editor gets 403 on GET /api/admin/admins"""
        response = requests.get(f"{BASE_URL}/api/admin/admins", headers=editor_headers)
        assert response.status_code == 403
        
    def test_editor_cannot_access_dashboard(self, editor_headers):
        """Editor gets 403 on GET /api/admin/dashboard"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=editor_headers)
        assert response.status_code == 403
        
    def test_editor_cannot_access_seo_pages(self, editor_headers):
        """Editor gets 403 on GET /api/admin/seo/pages"""
        response = requests.get(f"{BASE_URL}/api/admin/seo/pages", headers=editor_headers)
        assert response.status_code == 403
        
    def test_editor_cannot_access_seo_settings(self, editor_headers):
        """Editor gets 403 on GET /api/admin/seo/settings"""
        response = requests.get(f"{BASE_URL}/api/admin/seo/settings", headers=editor_headers)
        assert response.status_code == 403
        
    def test_editor_cannot_access_domain_analytics(self, editor_headers):
        """Editor gets 403 on GET /api/admin/domain-analytics"""
        response = requests.get(f"{BASE_URL}/api/admin/domain-analytics", headers=editor_headers)
        assert response.status_code == 403


class TestEditorAccessAllowed:
    """Test that editor can access permitted endpoints"""
    
    def test_editor_can_access_blog_posts(self, editor_headers):
        """Editor gets 200 on GET /api/admin/blog/posts"""
        response = requests.get(f"{BASE_URL}/api/admin/blog/posts", headers=editor_headers)
        assert response.status_code == 200
        
    def test_editor_can_access_categories(self, editor_headers):
        """Editor gets 200 on GET /api/admin/blog/categories"""
        response = requests.get(f"{BASE_URL}/api/admin/blog/categories", headers=editor_headers)
        assert response.status_code == 200
        
    def test_editor_can_access_tags(self, editor_headers):
        """Editor gets 200 on GET /api/admin/blog/tags"""
        response = requests.get(f"{BASE_URL}/api/admin/blog/tags", headers=editor_headers)
        assert response.status_code == 200
        
    def test_editor_can_access_gallery(self, editor_headers):
        """Editor gets 200 on GET /api/admin/gallery"""
        response = requests.get(f"{BASE_URL}/api/admin/gallery", headers=editor_headers)
        assert response.status_code == 200
        
    def test_editor_can_change_password(self, editor_headers):
        """Editor gets 200 on PUT /api/admin/change-password (with valid data)"""
        response = requests.put(f"{BASE_URL}/api/admin/change-password",
            headers=editor_headers,
            json={
                "current_password": TEST_EDITOR_PASS,
                "new_password": TEST_EDITOR_PASS  # Same password to not break other tests
            }
        )
        # 200 if successful, 400 if same password (depends on implementation)
        assert response.status_code in [200, 400]


class TestSuperAdminAccessAllowed:
    """Verify super admin can access all endpoints"""
    
    def test_super_admin_can_access_domains(self, super_admin_headers):
        """Super admin gets 200 on GET /api/admin/domains"""
        response = requests.get(f"{BASE_URL}/api/admin/domains", headers=super_admin_headers)
        assert response.status_code == 200
        
    def test_super_admin_can_access_contacts(self, super_admin_headers):
        """Super admin gets 200 on GET /api/admin/contacts"""
        response = requests.get(f"{BASE_URL}/api/admin/contacts", headers=super_admin_headers)
        assert response.status_code == 200
        
    def test_super_admin_can_access_dashboard(self, super_admin_headers):
        """Super admin gets 200 on GET /api/admin/dashboard"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=super_admin_headers)
        assert response.status_code == 200
        
    def test_super_admin_can_access_admins_list(self, super_admin_headers):
        """Super admin gets 200 on GET /api/admin/admins"""
        response = requests.get(f"{BASE_URL}/api/admin/admins", headers=super_admin_headers)
        assert response.status_code == 200
        # Verify role field in response
        data = response.json()
        assert isinstance(data, list)
        for admin in data:
            assert "role" in admin


class TestAdminListShowsRole:
    """Test that admin list endpoint returns role field"""
    
    def test_admins_list_includes_role(self, super_admin_headers):
        """GET /api/admin/admins returns role for each admin"""
        response = requests.get(f"{BASE_URL}/api/admin/admins", headers=super_admin_headers)
        assert response.status_code == 200
        admins = response.json()
        
        for admin in admins:
            assert "role" in admin
            assert admin["role"] in ["super_admin", "editor"]
            
    def test_existing_admins_have_super_admin_role(self, super_admin_headers):
        """Existing admins (admin, play) should have super_admin role"""
        response = requests.get(f"{BASE_URL}/api/admin/admins", headers=super_admin_headers)
        assert response.status_code == 200
        admins = response.json()
        
        admin_user = next((a for a in admins if a["username"] == "admin"), None)
        play_user = next((a for a in admins if a["username"] == "play"), None)
        
        if admin_user:
            assert admin_user["role"] == "super_admin"
        if play_user:
            assert play_user["role"] == "super_admin"
