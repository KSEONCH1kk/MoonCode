import requests
import io

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

# Dummy credentials for test user (assumed to exist or register separately if needed)
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "TestPassword123!"

def authenticate(email, password):
    url = f"{BASE_URL}/auth/login"
    payload = {"email": email, "password": password}
    resp = requests.post(url, json=payload, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    assert "accessToken" in data and data["accessToken"], "Authentication failed: no accessToken returned"
    return data["accessToken"]

def test_user_profile_and_settings_management():
    token = None
    user_id = None
    headers = {}
    avatar_file_path = "test_avatar.png"
    
    # Prepare a small dummy avatar image content (1x1 PNG)
    dummy_avatar_content = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
        b"\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
        b"\x00\x00\x00\nIDATx\xdacd\xf8\x0f\x00\x01\x05\x01\x02"
        b"\xf2\x57\xdc\x8c\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    
    # Step 0: Authenticate user
    try:
        token = authenticate(TEST_USER_EMAIL, TEST_USER_PASSWORD)
        headers = {"Authorization": f"Bearer {token}"}
    except Exception as e:
        assert False, f"Authentication failed: {e}"
    
    # Step 1: Get current user profile to obtain user ID
    try:
        resp = requests.get(f"{BASE_URL}/user/profile", headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
        profile = resp.json()
        user_id = profile.get("id")
        assert user_id, "User ID missing in profile data"
    except Exception as e:
        assert False, f"Fetching user profile failed: {e}"
    
    # Setup data for profile update
    updated_profile = {
        "fullName": "Test User Updated",
        "bio": "Updated bio for test user.",
        "location": "Test City",
        "website": "https://example.com/testuser"
    }
    
    # Step 2: Update user profile
    try:
        resp = requests.put(f"{BASE_URL}/user/profile", json=updated_profile, headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
        updated = resp.json()
        for k, v in updated_profile.items():
            assert updated.get(k) == v, f"Profile update failed for field {k}"
    except Exception as e:
        assert False, f"Updating user profile failed: {e}"
    
    # Step 3: Upload avatar
    try:
        files = {"avatar": ("avatar.png", io.BytesIO(dummy_avatar_content), "image/png")}
        resp = requests.post(f"{BASE_URL}/user/avatar", headers=headers, files=files, timeout=TIMEOUT)
        resp.raise_for_status()
        avatar_resp = resp.json()
        assert "avatarUrl" in avatar_resp and avatar_resp["avatarUrl"], "Avatar upload response missing 'avatarUrl'"
    except Exception as e:
        assert False, f"Avatar upload failed: {e}"
    
    # Step 4: Configure Two-Factor Authentication (2FA)
    # Step 4a: Enable 2FA - assume API returns a QR code or secret for setup
    try:
        resp = requests.post(f"{BASE_URL}/user/2fa/setup", headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
        twofa_setup = resp.json()
        assert "secret" in twofa_setup or "qrCode" in twofa_setup, "2FA setup response missing secret or qrCode"
        secret = twofa_setup.get("secret")
        
        # For test: simulate generating a valid token from secret (here mocked as '123456')
        valid_token = "123456"
        
        # Step 4b: Verify 2FA token to enable 2FA
        resp_verify = requests.post(
            f"{BASE_URL}/user/2fa/verify",
            headers=headers,
            json={"token": valid_token},
            timeout=TIMEOUT,
        )
        resp_verify.raise_for_status()
        verify_resp = resp_verify.json()
        assert verify_resp.get("enabled") is True, "2FA not enabled after verification"
    except Exception as e:
        assert False, f"2FA configuration failed: {e}"
    
    # Step 5: Set theme preferences
    theme_settings = {
        "theme": "dark",       # Assuming "dark" and "light" possible values
        "fontSize": 16         # Example additional preference
    }
    try:
        resp = requests.put(f"{BASE_URL}/user/settings/theme", json=theme_settings, headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
        updated_theme = resp.json()
        for k, v in theme_settings.items():
            assert updated_theme.get(k) == v, f"Theme preference update failed for {k}"
    except Exception as e:
        assert False, f"Updating theme preferences failed: {e}"
    
    # Step 6: Manage notification settings
    notification_settings = {
        "emailNotifications": True,
        "pushNotifications": False,
        "newsletterSubscribed": True
    }
    try:
        resp = requests.put(f"{BASE_URL}/user/settings/notifications", json=notification_settings, headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
        updated_notifications = resp.json()
        for k, v in notification_settings.items():
            assert updated_notifications.get(k) == v, f"Notification setting update failed for {k}"
    except Exception as e:
        assert False, f"Updating notification settings failed: {e}"
    
    # Step 7: Retrieve profile and settings again to verify persistence
    try:
        resp = requests.get(f"{BASE_URL}/user/profile", headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
        profile_check = resp.json()
        for k, v in updated_profile.items():
            assert profile_check.get(k) == v, f"Profile field {k} not persisted"

        resp = requests.get(f"{BASE_URL}/user/settings/theme", headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
        theme_check = resp.json()
        for k, v in theme_settings.items():
            assert theme_check.get(k) == v, f"Theme setting {k} not persisted"

        resp = requests.get(f"{BASE_URL}/user/settings/notifications", headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
        notif_check = resp.json()
        for k, v in notification_settings.items():
            assert notif_check.get(k) == v, f"Notification setting {k} not persisted"
    except Exception as e:
        assert False, f"Persistence verification failed: {e}"

test_user_profile_and_settings_management()