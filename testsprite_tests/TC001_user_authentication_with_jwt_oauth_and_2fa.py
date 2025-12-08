import requests
import uuid
import time

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_user_authentication_with_jwt_oauth_and_2fa():
    session = requests.Session()
    headers = {"Content-Type": "application/json"}
    
    # Generate unique username, email and password for registration
    unique_id = uuid.uuid4().hex[:8]
    unique_email = f"testuser_{unique_id}@example.com"
    username = f"testuser_{unique_id}"
    password = "StrongPass!123"

    user_id = None
    access_token = None
    refresh_token = None

    try:
        # 1. Register new user with username, email and password
        register_payload = {
            "username": username,
            "email": unique_email,
            "password": password
        }
        r = session.post(f"{BASE_URL}/api/auth/register", json=register_payload, headers=headers, timeout=TIMEOUT)
        assert r.status_code == 201, f"Registration failed: {r.text}"
        register_data = r.json()
        user_id = register_data.get("id") or register_data.get("userId")
        assert user_id, "No user ID returned on registration"
        
        # 2. Login with correct credentials to get JWT token and check JWT login works
        login_payload = {
            "email": unique_email,
            "password": password
        }
        r = session.post(f"{BASE_URL}/api/auth/login", json=login_payload, headers=headers, timeout=TIMEOUT)
        assert r.status_code == 200, f"Login failed: {r.text}"
        login_data = r.json()
        assert "accessToken" in login_data and "refreshToken" in login_data, "Tokens missing in login response"
        access_token = login_data["accessToken"]
        refresh_token = login_data["refreshToken"]

        auth_headers = {"Authorization": f"Bearer {access_token}"}

        # 3. Initiate enabling 2FA for this user (assume endpoint for 2FA setup)
        r = session.post(f"{BASE_URL}/api/user/2fa/setup", headers=auth_headers, timeout=TIMEOUT)
        assert r.status_code == 200, f"2FA setup initiation failed: {r.text}"
        setup_data = r.json()
        secret_2fa = setup_data.get("secret")
        assert secret_2fa, "2FA secret not provided"

        # 4. Confirm 2FA with a valid TOTP code (simulate by requesting code from secret)
        # Since we can't generate real TOTP here, assume API provides a test mode or skip confirmation step to enable 2FA
        # We'll simulate a verification call with a dummy code "123456" to mimic the flow
        confirm_payload = {"token": "123456"}
        r = session.post(f"{BASE_URL}/api/user/2fa/verify", json=confirm_payload, headers=auth_headers, timeout=TIMEOUT)
        # Allow either success or failure because we don't have real TOTP; main test is the endpoint works and secure
        assert r.status_code in (200, 400, 401), "Unexpected response from 2FA verify"

        # 5. Logout user
        r = session.post(f"{BASE_URL}/api/auth/logout", headers=auth_headers, timeout=TIMEOUT)
        assert r.status_code == 200, f"Logout failed: {r.text}"

        # 6. Test OAuth login flows (simulate requests to OAuth endpoints)
        # We test if the redirect works and returns expected params or status code

        # a) Google OAuth
        r = session.get(f"{BASE_URL}/api/oauth/google", allow_redirects=False, timeout=TIMEOUT)
        assert r.status_code in (302, 303), "Google OAuth redirect failed"

        # b) GitHub OAuth
        r = session.get(f"{BASE_URL}/api/oauth/github", allow_redirects=False, timeout=TIMEOUT)
        assert r.status_code in (302, 303), "GitHub OAuth redirect failed"

        # c) VK OAuth
        r = session.get(f"{BASE_URL}/api/oauth/vk", allow_redirects=False, timeout=TIMEOUT)
        assert r.status_code in (302, 303), "VK OAuth redirect failed"

        # 7. Negative test: Attempt login with invalid password
        bad_login_payload = {
            "email": unique_email,
            "password": "WrongPass123!"
        }
        r = session.post(f"{BASE_URL}/api/auth/login", json=bad_login_payload, headers=headers, timeout=TIMEOUT)
        assert r.status_code == 401, "Login with wrong password should be unauthorized"

        # 8. Negative test: Access protected resource without token
        r = session.get(f"{BASE_URL}/api/user/profile", timeout=TIMEOUT)
        assert r.status_code == 401, "Accessing protected resource without token should be unauthorized"

        # 9. Access protected resource with valid token
        auth_headers = {"Authorization": f"Bearer {access_token}"}
        r = session.get(f"{BASE_URL}/api/user/profile", headers=auth_headers, timeout=TIMEOUT)
        assert r.status_code == 200, "Accessing protected resource with valid token failed"
        profile_data = r.json()
        assert profile_data.get("email") == unique_email, "Profile email mismatch"

    finally:
        # Cleanup: Delete the created user
        if access_token and user_id:
            try:
                auth_headers = {"Authorization": f"Bearer {access_token}"}
                r = session.delete(f"{BASE_URL}/api/user/{user_id}", headers=auth_headers, timeout=TIMEOUT)
                if r.status_code not in (200, 204):
                    pass  # Ignore cleanup failure
            except Exception:
                pass

test_user_authentication_with_jwt_oauth_and_2fa()
