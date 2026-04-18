#!/usr/bin/env python3

import requests
import sys
from datetime import datetime
import json

class MostDomainAPITester:
    def __init__(self, base_url="https://aged-domains-shop.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_domain_id = None
        self.created_contact_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}" if not endpoint.startswith('api/') else f"{self.base_url}/{endpoint}"
        
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response text: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ FAILED - Exception: {str(e)}")
            return False, {}

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n" + "="*50)
        print("TESTING HEALTH ENDPOINTS")
        print("="*50)
        
        self.run_test("API Root", "GET", "", 200)
        self.run_test("Health Check", "GET", "health", 200)

    def test_public_domain_endpoints(self):
        """Test public domain endpoints"""
        print("\n" + "="*50)
        print("TESTING PUBLIC DOMAIN ENDPOINTS")
        print("="*50)
        
        # Test public domains list
        success, domains = self.run_test("Get Public Domains", "GET", "domains", 200)
        
        # Test domains count
        self.run_test("Get Domains Count", "GET", "domains/count", 200)
        
        # Test featured domains
        success_featured, featured = self.run_test("Get Featured Domains", "GET", "domains/featured", 200)
        
        # Test domain by slug if we have domains
        if success_featured and featured and len(featured) > 0:
            slug = featured[0].get('slug')
            if slug:
                self.run_test(f"Get Domain by Slug ({slug})", "GET", f"domains/{slug}", 200)

    def test_contact_endpoint(self):
        """Test contact submission"""
        print("\n" + "="*50)
        print("TESTING CONTACT ENDPOINT")
        print("="*50)
        
        contact_data = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "email": "test@example.com",
            "message": "Test message for domain inquiry"
        }
        
        success, response = self.run_test("Submit Contact Form", "POST", "contact", 201, contact_data)
        if success and 'id' in response:
            self.created_contact_id = response['id']

    def test_admin_login(self):
        """Test admin authentication"""
        print("\n" + "="*50)
        print("TESTING ADMIN AUTHENTICATION")
        print("="*50)
        
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        success, response = self.run_test("Admin Login", "POST", "admin/login", 200, login_data)
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   🔑 Token acquired: {self.token[:20]}...")
            
            # Test current admin info
            self.run_test("Get Current Admin", "GET", "admin/me", 200)
            return True
        return False

    def test_admin_dashboard(self):
        """Test admin dashboard stats"""
        print("\n" + "="*50)
        print("TESTING ADMIN DASHBOARD")
        print("="*50)
        
        if not self.token:
            print("❌ Skipped - No admin token available")
            return
            
        self.run_test("Get Dashboard Stats", "GET", "admin/dashboard", 200)

    def test_admin_domains_crud(self):
        """Test admin domain CRUD operations"""
        print("\n" + "="*50)
        print("TESTING ADMIN DOMAIN CRUD")
        print("="*50)
        
        if not self.token:
            print("❌ Skipped - No admin token available")
            return

        # Get all domains first
        success, domains = self.run_test("Admin Get All Domains", "GET", "admin/domains", 200)

        # Create a new domain
        new_domain = {
            "domain_name": f"test-domain-{datetime.now().strftime('%H%M%S')}.com",
            "dr": 75,
            "da": 68,
            "backlinks": 5000,
            "traffic": 25000,
            "age": 5,
            "price": 8500.00,
            "status": "available",
            "description": "Test domain for API testing"
        }
        
        success, response = self.run_test("Create Domain", "POST", "admin/domains", 201, new_domain)
        if success and 'id' in response:
            self.created_domain_id = response['id']
            
            # Update the domain
            update_data = {
                "price": 9000.00,
                "status": "sold",
                "description": "Updated test domain description"
            }
            
            self.run_test("Update Domain", "PUT", f"admin/domains/{self.created_domain_id}", 200, update_data)
            
            # Delete the domain
            self.run_test("Delete Domain", "DELETE", f"admin/domains/{self.created_domain_id}", 200)

    def test_admin_contacts_crud(self):
        """Test admin contacts operations"""
        print("\n" + "="*50)
        print("TESTING ADMIN CONTACTS CRUD") 
        print("="*50)
        
        if not self.token:
            print("❌ Skipped - No admin token available")
            return

        # Get all contacts
        self.run_test("Admin Get All Contacts", "GET", "admin/contacts", 200)
        
        # If we created a contact earlier, try to update it
        if self.created_contact_id:
            update_data = {"status": "resolved"}
            self.run_test("Update Contact Status", "PUT", f"admin/contacts/{self.created_contact_id}", 200, update_data)

    def test_seed_data(self):
        """Test seeding sample data"""
        print("\n" + "="*50)
        print("TESTING SEED DATA")
        print("="*50)
        
        if not self.token:
            print("❌ Skipped - No admin token available")
            return
            
        self.run_test("Seed Sample Data", "POST", "admin/seed", 200)

    def run_all_tests(self):
        """Run all API tests in order"""
        print("🚀 Starting MostDomain API Test Suite")
        print(f"🔗 Testing against: {self.base_url}")
        print(f"⏰ Started at: {datetime.now().isoformat()}")
        
        # Test in logical order
        self.test_health_endpoints()
        self.test_public_domain_endpoints()
        self.test_contact_endpoint()
        
        # Admin tests require authentication
        if self.test_admin_login():
            self.test_admin_dashboard()
            self.test_seed_data()
            self.test_admin_domains_crud()
            self.test_admin_contacts_crud()
        else:
            print("\n❌ Admin tests skipped due to login failure")

        # Print final results
        print("\n" + "="*60)
        print("📊 FINAL TEST RESULTS")
        print("="*60)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print(f"⏰ Completed at: {datetime.now().isoformat()}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = MostDomainAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())