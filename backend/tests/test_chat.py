"""Backend tests for AI chat & support chat (iteration 2)."""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get("EXPO_BACKEND_URL", "https://tpt-food-shop.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "thaiphuoctrong133@gmail.com"
ADMIN_PASSWORD = "0372585241Trong."


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def customer():
    email = f"test_chat_{uuid.uuid4().hex[:8]}@test.com"
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "Test@1234", "name": "TEST Chat Cust", "phone": "0900000000"
    }, timeout=30)
    assert r.status_code == 200, f"register failed: {r.text}"
    data = r.json()
    return {"token": data["access_token"], "id": data["user"]["id"], "email": email}


def _h(tok):
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


# ---------- AI chat ----------
class TestChatAI:
    def test_ai_send_and_persist(self, customer):
        r = requests.post(f"{API}/chat/ai", headers=_h(customer["token"]), json={"message": "Xin chào, có phở gà không?"}, timeout=60)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "user_message" in body and "ai_message" in body
        assert body["user_message"]["role"] == "user"
        assert body["ai_message"]["role"] == "assistant"
        assert isinstance(body["ai_message"]["text"], str) and len(body["ai_message"]["text"]) > 0

    def test_ai_history_returns_persisted(self, customer):
        r = requests.get(f"{API}/chat/ai/history", headers=_h(customer["token"]), timeout=30)
        assert r.status_code == 200
        msgs = r.json()
        assert len(msgs) >= 2
        roles = {m["role"] for m in msgs}
        assert "user" in roles and "assistant" in roles

    def test_ai_empty_message_400(self, customer):
        r = requests.post(f"{API}/chat/ai", headers=_h(customer["token"]), json={"message": "  "}, timeout=30)
        assert r.status_code == 400

    def test_ai_requires_auth(self):
        r = requests.post(f"{API}/chat/ai", json={"message": "hi"}, timeout=15)
        assert r.status_code == 401


# ---------- Support chat ----------
class TestSupportChat:
    def test_customer_send_support(self, customer):
        r = requests.post(f"{API}/chat/support", headers=_h(customer["token"]), json={"text": "Cần hỗ trợ đơn hàng"}, timeout=15)
        assert r.status_code == 200
        m = r.json()
        assert m["sender"] == "customer"
        assert m["user_id"] == customer["id"]

    def test_customer_my_history(self, customer):
        r = requests.get(f"{API}/chat/support/my", headers=_h(customer["token"]), timeout=15)
        assert r.status_code == 200
        msgs = r.json()
        assert len(msgs) >= 1
        assert all(m["user_id"] == customer["id"] for m in msgs)

    def test_admin_my_forbidden(self, admin_token):
        r = requests.get(f"{API}/chat/support/my", headers=_h(admin_token), timeout=15)
        assert r.status_code == 403

    def test_admin_needs_user_id(self, admin_token):
        r = requests.post(f"{API}/chat/support", headers=_h(admin_token), json={"text": "hello"}, timeout=15)
        assert r.status_code == 400

    def test_admin_invalid_user_id_404(self, admin_token):
        r = requests.post(f"{API}/chat/support", headers=_h(admin_token),
                          json={"text": "hi", "user_id": "nonexistent-id-xyz"}, timeout=15)
        assert r.status_code == 404

    def test_admin_reply_to_customer(self, admin_token, customer):
        r = requests.post(f"{API}/chat/support", headers=_h(admin_token),
                          json={"text": "Chào bạn, quán hỗ trợ ngay!", "user_id": customer["id"]}, timeout=15)
        assert r.status_code == 200
        m = r.json()
        assert m["sender"] == "admin"
        assert m["user_id"] == customer["id"]

    def test_customer_sees_admin_reply(self, customer):
        r = requests.get(f"{API}/chat/support/my", headers=_h(customer["token"]), timeout=15)
        assert r.status_code == 200
        msgs = r.json()
        senders = {m["sender"] for m in msgs}
        assert "admin" in senders and "customer" in senders

    def test_admin_conversations_list(self, admin_token, customer):
        r = requests.get(f"{API}/chat/support/conversations", headers=_h(admin_token), timeout=15)
        assert r.status_code == 200
        convs = r.json()
        assert isinstance(convs, list)
        ids = [c["user_id"] for c in convs]
        assert customer["id"] in ids
        target = next(c for c in convs if c["user_id"] == customer["id"])
        assert target["count"] >= 2
        assert target.get("user_email") == customer["email"]
        assert "last_message" in target and "last_sender" in target

    def test_admin_conversation_detail(self, admin_token, customer):
        r = requests.get(f"{API}/chat/support/{customer['id']}", headers=_h(admin_token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["id"] == customer["id"]
        assert isinstance(data["messages"], list) and len(data["messages"]) >= 2

    def test_customer_forbidden_conversations(self, customer):
        r = requests.get(f"{API}/chat/support/conversations", headers=_h(customer["token"]), timeout=15)
        assert r.status_code == 403

    def test_customer_forbidden_conversation_detail(self, customer):
        r = requests.get(f"{API}/chat/support/{customer['id']}", headers=_h(customer["token"]), timeout=15)
        assert r.status_code == 403

    def test_empty_text_400(self, customer):
        r = requests.post(f"{API}/chat/support", headers=_h(customer["token"]), json={"text": "  "}, timeout=15)
        assert r.status_code == 400
