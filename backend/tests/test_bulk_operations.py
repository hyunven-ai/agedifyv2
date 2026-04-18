"""
Tests for Admin Bulk Operations - Feature 1
Tests bulk-delete and bulk-status endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://aged-domains-shop.preview.emergentagent.com')


class TestBulkOperations:
    """Test bulk operations for admin domains"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "admin", "password": "admin123"}
        )
        assert response.status_code == 200, "Failed to login"
        self.token = response.json()["access_token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    def test_bulk_status_endpoint_exists(self):
        """Test POST /api/admin/domains/bulk-status returns success"""
        response = requests.post(
            f"{BASE_URL}/api/admin/domains/bulk-status",
            json={"ids": ["fake-id-123"], "status": "available"},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "updated" in data
        print(f"✓ bulk-status endpoint works: {data}")

    def test_bulk_status_validates_status_value(self):
        """Test bulk-status rejects invalid status values"""
        response = requests.post(
            f"{BASE_URL}/api/admin/domains/bulk-status",
            json={"ids": ["fake-id"], "status": "invalid-status"},
            headers=self.headers
        )
        assert response.status_code == 400
        print("✓ bulk-status rejects invalid status")

    def test_bulk_status_requires_ids(self):
        """Test bulk-status requires ids array"""
        response = requests.post(
            f"{BASE_URL}/api/admin/domains/bulk-status",
            json={"ids": [], "status": "available"},
            headers=self.headers
        )
        assert response.status_code == 400
        print("✓ bulk-status requires non-empty ids")

    def test_bulk_delete_endpoint_exists(self):
        """Test POST /api/admin/domains/bulk-delete returns success"""
        response = requests.post(
            f"{BASE_URL}/api/admin/domains/bulk-delete",
            json={"ids": ["fake-id-456"]},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "deleted" in data
        print(f"✓ bulk-delete endpoint works: {data}")

    def test_bulk_delete_requires_ids(self):
        """Test bulk-delete requires ids array"""
        response = requests.post(
            f"{BASE_URL}/api/admin/domains/bulk-delete",
            json={"ids": []},
            headers=self.headers
        )
        assert response.status_code == 400
        print("✓ bulk-delete requires non-empty ids")

    def test_bulk_status_available(self):
        """Test setting status to 'available'"""
        response = requests.post(
            f"{BASE_URL}/api/admin/domains/bulk-status",
            json={"ids": ["test-id"], "status": "available"},
            headers=self.headers
        )
        assert response.status_code == 200
        print("✓ bulk-status accepts 'available' status")

    def test_bulk_status_sold(self):
        """Test setting status to 'sold'"""
        response = requests.post(
            f"{BASE_URL}/api/admin/domains/bulk-status",
            json={"ids": ["test-id"], "status": "sold"},
            headers=self.headers
        )
        assert response.status_code == 200
        print("✓ bulk-status accepts 'sold' status")

    def test_bulk_operations_require_auth(self):
        """Test bulk operations require authentication"""
        # Test without auth header - 401 or 403 are both valid auth rejection
        response = requests.post(
            f"{BASE_URL}/api/admin/domains/bulk-status",
            json={"ids": ["test"], "status": "available"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403 but got {response.status_code}"
        
        response = requests.post(
            f"{BASE_URL}/api/admin/domains/bulk-delete",
            json={"ids": ["test"]}
        )
        assert response.status_code in [401, 403], f"Expected 401/403 but got {response.status_code}"
        print("✓ bulk operations require authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
