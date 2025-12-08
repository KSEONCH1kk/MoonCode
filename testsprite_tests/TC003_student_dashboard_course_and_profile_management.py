import requests
import traceback

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

# Dummy test user credentials (should be replaced with valid test user credentials)
TEST_USER_EMAIL = "student_test@example.com"
TEST_USER_PASSWORD = "TestPass123!"

def student_dashboard_course_and_profile_management():
    session = requests.Session()
    try:
        # 1. Authenticate the user to get a JWT token
        auth_resp = session.post(
            f"{BASE_URL}/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD},
            timeout=TIMEOUT
        )
        assert auth_resp.status_code == 200, f"Login failed: {auth_resp.text}"
        auth_data = auth_resp.json()
        token = auth_data.get("token")
        assert token, "No token returned from login"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # 2. Get student dashboard data (courses, challenges, solutions, ratings, chat access, profile)
        dashboard_resp = session.get(f"{BASE_URL}/dashboard/student", headers=headers, timeout=TIMEOUT)
        assert dashboard_resp.status_code == 200, f"Failed to get dashboard: {dashboard_resp.text}"
        dashboard_data = dashboard_resp.json()

        # Validate enrolled courses presence
        assert "enrolledCourses" in dashboard_data, "Missing enrolledCourses in dashboard response"
        enrolled_courses = dashboard_data["enrolledCourses"]
        assert isinstance(enrolled_courses, list), "enrolledCourses should be a list"

        # Validate challenges presence
        assert "challenges" in dashboard_data, "Missing challenges in dashboard response"
        challenges = dashboard_data["challenges"]
        assert isinstance(challenges, list), "challenges should be a list"

        # Validate solutions presence
        assert "solutions" in dashboard_data, "Missing solutions in dashboard response"
        solutions = dashboard_data["solutions"]
        assert isinstance(solutions, list), "solutions should be a list"

        # Validate ratings presence
        assert "ratings" in dashboard_data, "Missing ratings in dashboard response"
        ratings = dashboard_data["ratings"]
        assert isinstance(ratings, dict), "ratings should be a dictionary"

        # Validate chat access info presence
        assert "chatAccess" in dashboard_data, "Missing chatAccess in dashboard response"
        chat_access = dashboard_data["chatAccess"]
        assert isinstance(chat_access, dict), "chatAccess should be a dictionary"
        # Confirm chatAccess contains at least allowed boolean and contact list or similar
        assert "enabled" in chat_access, "chatAccess missing 'enabled' field"
        assert isinstance(chat_access["enabled"], bool), "'enabled' in chatAccess should be bool"

        # Validate profile management info presence
        assert "profile" in dashboard_data, "Missing profile in dashboard response"
        profile = dashboard_data["profile"]
        assert isinstance(profile, dict), "profile should be a dictionary"
        # Profile expected fields (at least email, name)
        assert "email" in profile and profile["email"] == TEST_USER_EMAIL, "Profile email mismatch or missing"
        assert "name" in profile, "Profile 'name' field missing"

        # 3. Profile management: test updating profile fields

        # Backup current profile data for restoration
        original_name = profile.get("name")
        updated_name = original_name + " Updated" if original_name else "Test User Updated"

        update_payload = {"name": updated_name}

        update_resp = session.put(f"{BASE_URL}/user/profile", headers=headers, json=update_payload, timeout=TIMEOUT)
        assert update_resp.status_code == 200, f"Profile update failed: {update_resp.text}"
        update_data = update_resp.json()
        assert update_data.get("name") == updated_name, "Profile name not updated properly"

        # 4. Confirm changes persisted - get profile again
        profile_resp = session.get(f"{BASE_URL}/user/profile", headers=headers, timeout=TIMEOUT)
        assert profile_resp.status_code == 200, f"Failed to get profile after update: {profile_resp.text}"
        refreshed_profile = profile_resp.json()
        assert refreshed_profile.get("name") == updated_name, "Profile update not persisted"

        # 5. Restore original profile name
        restore_resp = session.put(f"{BASE_URL}/user/profile", headers=headers, json={"name": original_name}, timeout=TIMEOUT)
        assert restore_resp.status_code == 200, f"Restoring profile name failed: {restore_resp.text}"

    except Exception:
        traceback.print_exc()
        assert False, "Test failed due to exception"

student_dashboard_course_and_profile_management()