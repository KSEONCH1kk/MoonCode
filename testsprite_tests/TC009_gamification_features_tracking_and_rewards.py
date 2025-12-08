import requests
import time

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_gamification_features_tracking_and_rewards():
    register_payload = {
        "email": "testgamifyuser@example.com",
        "password": "StrongP@ssw0rd!",
        "name": "testgamifyuser"
    }
    headers = {"Content-Type": "application/json"}

    resp_register = requests.post(
        f"{BASE_URL}/api/auth/register",
        json=register_payload,
        headers=headers,
        timeout=TIMEOUT,
    )
    assert resp_register.status_code == 201, f"Registration failed: {resp_register.text}"
    user_id = resp_register.json().get("userId")
    assert user_id, "User ID not returned after registration"

    login_payload = {
        "email": register_payload["email"],
        "password": register_payload["password"]
    }
    resp_login = requests.post(
        f"{BASE_URL}/api/auth/login",
        json=login_payload,
        headers=headers,
        timeout=TIMEOUT
    )
    assert resp_login.status_code == 200, f"Login failed: {resp_login.text}"
    token = resp_login.json().get("token")
    assert token, "Token not received on login"

    auth_headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    try:
        for day in range(3):
            resp_activity = requests.post(
                f"{BASE_URL}/api/user/activity",
                json={"activity_type": "daily_login"},
                headers=auth_headers,
                timeout=TIMEOUT
            )
            assert resp_activity.status_code == 200, f"Activity tracking failed: {resp_activity.text}"
            time.sleep(1)

        resp_streak_freeze = requests.post(
            f"{BASE_URL}/api/user/gamification/streak-freeze",
            headers=auth_headers,
            timeout=TIMEOUT
        )
        assert resp_streak_freeze.status_code == 200, f"Streak freeze activation failed: {resp_streak_freeze.text}"

        resp_gamification = requests.get(
            f"{BASE_URL}/api/user/gamification",
            headers=auth_headers,
            timeout=TIMEOUT
        )
        assert resp_gamification.status_code == 200, f"Fetching gamification data failed: {resp_gamification.text}"
        data = resp_gamification.json()

        assert "daily_streak" in data, "daily_streak not in gamification data"
        assert data["daily_streak"] >= 3, f"Expected daily streak >= 3, got {data['daily_streak']}"
        assert "achievements" in data and isinstance(data["achievements"], list), "Achievements missing or invalid"
        assert "gems" in data and isinstance(data["gems"], int), "Gems missing or invalid"
        assert "streak_freeze_active" in data, "streak_freeze_active missing"
        assert data["streak_freeze_active"] is True, "Streak freeze not activated properly"

    finally:
        resp_delete = requests.delete(
            f"{BASE_URL}/api/user/{user_id}",
            headers=auth_headers,
            timeout=TIMEOUT
        )
        assert resp_delete.status_code in (200, 204), f"User cleanup failed: {resp_delete.text}"

test_gamification_features_tracking_and_rewards()
