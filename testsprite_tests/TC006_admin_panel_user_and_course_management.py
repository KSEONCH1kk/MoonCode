import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

# Admin credentials (should exist in the system)
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "StrongAdminPassword123!"

def admin_panel_user_and_course_management():
    session = requests.Session()

    # Authenticate as admin to get JWT token
    auth_resp = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=TIMEOUT
    )
    assert auth_resp.status_code == 200, f"Admin login failed: {auth_resp.text}"
    token = auth_resp.json().get("token")
    assert token, "No token received for admin login"

    headers = {"Authorization": f"Bearer {token}"}

    # --- USER MANAGEMENT ---

    # Create a new user (to test create)
    user_payload = {
        "email": "testuser@example.com",
        "password": "TestUserPass123!",
        "role": "student",
        "name": "Test User"
    }
    create_user_resp = session.post(
        f"{BASE_URL}/api/admin/users",
        headers=headers,
        json=user_payload,
        timeout=TIMEOUT
    )
    assert create_user_resp.status_code == 201, f"User creation failed: {create_user_resp.text}"
    created_user = create_user_resp.json()
    user_id = created_user.get("id")
    assert user_id, "Created user no id returned"
    assert created_user.get("email") == user_payload["email"]
    assert created_user.get("role") == user_payload["role"]

    try:
        # Retrieve user list and confirm the user is listed
        users_list_resp = session.get(f"{BASE_URL}/api/admin/users", headers=headers, timeout=TIMEOUT)
        assert users_list_resp.status_code == 200, f"Fetching users list failed: {users_list_resp.text}"
        users_list = users_list_resp.json()
        assert any(u["id"] == user_id for u in users_list), "Created user not found in user list"

        # Update the user's role to "teacher"
        update_payload = {"role": "teacher", "name": "Updated Test User"}
        update_user_resp = session.put(
            f"{BASE_URL}/api/admin/users/{user_id}",
            headers=headers,
            json=update_payload,
            timeout=TIMEOUT
        )
        assert update_user_resp.status_code == 200, f"User update failed: {update_user_resp.text}"
        updated_user = update_user_resp.json()
        assert updated_user.get("role") == "teacher"
        assert updated_user.get("name") == "Updated Test User"

        # --- COURSE MANAGEMENT ---

        # Create a new course
        course_payload = {
            "title": "Test Course",
            "description": "A course created during admin testing",
            "published": False
        }
        create_course_resp = session.post(
            f"{BASE_URL}/api/admin/courses",
            headers=headers,
            json=course_payload,
            timeout=TIMEOUT
        )
        assert create_course_resp.status_code == 201, f"Course creation failed: {create_course_resp.text}"
        created_course = create_course_resp.json()
        course_id = created_course.get("id")
        assert course_id, "Created course no id returned"
        assert created_course.get("title") == course_payload["title"]

        try:
            # Retrieve course list and confirm the course is listed
            courses_list_resp = session.get(f"{BASE_URL}/api/admin/courses", headers=headers, timeout=TIMEOUT)
            assert courses_list_resp.status_code == 200, f"Fetching courses list failed: {courses_list_resp.text}"
            courses_list = courses_list_resp.json()
            assert any(c["id"] == course_id for c in courses_list), "Created course not found in course list"

            # Update the course to publish it
            update_course_payload = {
                "title": "Test Course Updated",
                "description": "Updated description",
                "published": True
            }
            update_course_resp = session.put(
                f"{BASE_URL}/api/admin/courses/{course_id}",
                headers=headers,
                json=update_course_payload,
                timeout=TIMEOUT
            )
            assert update_course_resp.status_code == 200, f"Course update failed: {update_course_resp.text}"
            updated_course = update_course_resp.json()
            assert updated_course.get("published") is True
            assert updated_course.get("title") == update_course_payload["title"]

            # --- SYSTEM SETTINGS MANAGEMENT ---

            # Get current system settings
            settings_resp = session.get(f"{BASE_URL}/api/admin/settings", headers=headers, timeout=TIMEOUT)
            assert settings_resp.status_code == 200, f"Fetching system settings failed: {settings_resp.text}"
            current_settings = settings_resp.json()
            assert isinstance(current_settings, dict), "Settings response not a dict"

            # Update a system setting (e.g., siteName)
            new_site_name = "Test Educational Platform"
            new_settings_payload = {**current_settings, "siteName": new_site_name}
            update_settings_resp = session.put(
                f"{BASE_URL}/api/admin/settings",
                headers=headers,
                json=new_settings_payload,
                timeout=TIMEOUT
            )
            assert update_settings_resp.status_code == 200, f"Updating settings failed: {update_settings_resp.text}"
            updated_settings = update_settings_resp.json()
            assert updated_settings.get("siteName") == new_site_name

        finally:
            # Cleanup course
            del_course_resp = session.delete(
                f"{BASE_URL}/api/admin/courses/{course_id}", headers=headers, timeout=TIMEOUT
            )
            assert del_course_resp.status_code == 204, f"Deleting course failed: {del_course_resp.text}"

    finally:
        # Cleanup user
        del_user_resp = session.delete(
            f"{BASE_URL}/api/admin/users/{user_id}", headers=headers, timeout=TIMEOUT
        )
        assert del_user_resp.status_code == 204, f"Deleting user failed: {del_user_resp.text}"


admin_panel_user_and_course_management()