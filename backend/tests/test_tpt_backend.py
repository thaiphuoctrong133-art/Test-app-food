"""Backend tests for Tpt Vietnamese Food Shop"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://tpt-food-shop.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "thaiphuoctrong133@gmail.com"
ADMIN_PASSWORD = "0372585241Trong."


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "admin"
    return data["access_token"]


@pytest.fixture(scope="module")
def customer_creds():
    uniq = uuid.uuid4().hex[:8]
    return {
        "email": f"TEST_khach_{uniq}@test.com",
        "password": "Test@1234",
        "name": f"TEST User {uniq}",
        "phone": "0912345678",
    }


@pytest.fixture(scope="module")
def customer_token(session, customer_creds):
    r = session.post(f"{API}/auth/register", json=customer_creds)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "customer"
    assert data["user"]["email"] == customer_creds["email"].lower()
    return data["access_token"]


# ==================== Health ====================
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert "Tpt" in r.json().get("message", "")


# ==================== Auth ====================
class TestAuth:
    def test_register_duplicate_returns_400(self, session, customer_creds, customer_token):
        # customer_token fixture creates it; try register again
        r = session.post(f"{API}/auth/register", json=customer_creds)
        assert r.status_code == 400

    def test_login_customer_success(self, session, customer_creds, customer_token):
        r = session.post(f"{API}/auth/login", json={
            "email": customer_creds["email"], "password": customer_creds["password"]
        })
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "customer"

    def test_login_wrong_password_returns_401(self, session, customer_creds, customer_token):
        r = session.post(f"{API}/auth/login", json={
            "email": customer_creds["email"], "password": "WrongPass!"
        })
        assert r.status_code == 401

    def test_login_admin_success(self, admin_token):
        assert admin_token and isinstance(admin_token, str)

    def test_me_with_jwt(self, session, customer_token, customer_creds):
        r = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 200
        assert r.json()["email"] == customer_creds["email"].lower()

    def test_me_no_token_returns_401(self, session):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ==================== Menu ====================
class TestMenu:
    def test_menu_public_returns_8_items(self, session):
        r = session.get(f"{API}/menu")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) == 8, f"Expected 8 seeded items, got {len(items)}"
        cats = {i["category"] for i in items}
        assert cats == {"Phở", "Bánh mì", "Bún", "Bánh bèo"}, f"cats={cats}"
        for i in items:
            assert "id" in i and "name" in i and "price" in i and "image_url" in i
            assert "_id" not in i

    def test_menu_item_by_id(self, session):
        items = session.get(f"{API}/menu").json()
        first_id = items[0]["id"]
        r = session.get(f"{API}/menu/{first_id}")
        assert r.status_code == 200
        assert r.json()["id"] == first_id

    def test_menu_item_not_found(self, session):
        r = session.get(f"{API}/menu/does-not-exist")
        assert r.status_code == 404


# ==================== Orders ====================
class TestOrders:
    def test_create_order_and_verify_my_orders(self, session, customer_token):
        menu = session.get(f"{API}/menu").json()
        m = menu[0]
        payload = {
            "items": [{
                "menu_id": m["id"], "name": m["name"], "price": m["price"],
                "quantity": 2, "image_url": m["image_url"],
            }],
            "total": m["price"] * 2,
            "address": "123 TEST Street, Hanoi",
            "phone": "0912345678",
            "note": "TEST order",
        }
        r = session.post(f"{API}/orders", json=payload,
                         headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["status"] == "pending"
        assert created["total"] == m["price"] * 2
        assert "_id" not in created
        assert "id" in created

        # Verify via /orders/my
        r2 = session.get(f"{API}/orders/my",
                         headers={"Authorization": f"Bearer {customer_token}"})
        assert r2.status_code == 200
        order_ids = [o["id"] for o in r2.json()]
        assert created["id"] in order_ids

    def test_create_order_without_auth_returns_401(self, session):
        r = requests.post(f"{API}/orders", json={
            "items": [], "total": 0, "address": "x", "phone": "x"
        })
        assert r.status_code == 401


# ==================== Admin ====================
class TestAdmin:
    def test_admin_stats(self, session, admin_token):
        r = session.get(f"{API}/admin/stats", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        data = r.json()
        assert data["total_menu"] == 8
        assert data["total_customers"] >= 1
        assert data["total_orders"] >= 1
        assert "total_revenue" in data

    def test_admin_customers(self, session, admin_token):
        r = session.get(f"{API}/admin/customers", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        customers = r.json()
        assert isinstance(customers, list)
        assert all(c.get("role") == "customer" for c in customers)
        assert all("password_hash" not in c for c in customers)
        assert all("_id" not in c for c in customers)

    def test_admin_orders_and_update_status(self, session, admin_token):
        r = session.get(f"{API}/admin/orders", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        orders = r.json()
        assert len(orders) >= 1
        oid = orders[0]["id"]
        r2 = session.patch(f"{API}/admin/orders/{oid}",
                           json={"status": "confirmed"},
                           headers={"Authorization": f"Bearer {admin_token}"})
        assert r2.status_code == 200

        # Verify status was persisted
        orders2 = session.get(f"{API}/admin/orders",
                              headers={"Authorization": f"Bearer {admin_token}"}).json()
        updated = next(o for o in orders2 if o["id"] == oid)
        assert updated["status"] == "confirmed"

    def test_admin_update_invalid_status(self, session, admin_token):
        orders = session.get(f"{API}/admin/orders",
                             headers={"Authorization": f"Bearer {admin_token}"}).json()
        oid = orders[0]["id"]
        r = session.patch(f"{API}/admin/orders/{oid}",
                          json={"status": "invalid_bogus"},
                          headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 400

    def test_admin_update_missing_order(self, session, admin_token):
        r = session.patch(f"{API}/admin/orders/missing-id",
                          json={"status": "confirmed"},
                          headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 404

    def test_non_admin_forbidden_stats(self, session, customer_token):
        r = session.get(f"{API}/admin/stats",
                        headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 403

    def test_non_admin_forbidden_customers(self, session, customer_token):
        r = session.get(f"{API}/admin/customers",
                        headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 403

    def test_non_admin_forbidden_orders(self, session, customer_token):
        r = session.get(f"{API}/admin/orders",
                        headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 403
