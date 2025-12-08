import requests
import time

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

# Dummy teacher user credentials for authentication
TEACHER_EMAIL = "teacher@example.com"
TEACHER_PASSWORD = "StrongPass!23"

def authenticate_teacher():
    """Authenticate a teacher user and return the JWT access token."""
    url = f"{BASE_URL}/auth/login"
    payload = {
        "email": TEACHER_EMAIL,
        "password": TEACHER_PASSWORD
    }
    try:
        r = requests.post(url, json=payload, timeout=TIMEOUT)
        r.raise_for_status()
        data = r.json()
        assert "accessToken" in data and data["accessToken"], "No accessToken in login response"
        return data["accessToken"]
    except requests.RequestException as e:
        raise Exception(f"Authentication failed: {e}")

def create_course(headers):
    """Create a new course as a teacher and return its ID."""
    url = f"{BASE_URL}/teacher/courses"
    payload = {
        "title": f"Test Course {int(time.time())}",
        "description": "Course created for automated testing",
        "language": "Python",
        "level": "Beginner",
        "tags": ["test", "automation"]
    }
    r = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    r.raise_for_status()
    data = r.json()
    assert "id" in data and data["id"], "Course ID missing in create response"
    return data["id"]

def update_course(course_id, headers):
    """Update the course title and description."""
    url = f"{BASE_URL}/teacher/courses/{course_id}"
    payload = {
        "title": "Updated Test Course Title",
        "description": "Updated description for automated test"
    }
    r = requests.put(url, json=payload, headers=headers, timeout=TIMEOUT)
    r.raise_for_status()
    data = r.json()
    assert data.get("title") == payload["title"], "Course title was not updated"
    assert data.get("description") == payload["description"], "Course description was not updated"

def list_courses(headers):
    """Retrieve teacher's courses list."""
    url = f"{BASE_URL}/teacher/courses"
    r = requests.get(url, headers=headers, timeout=TIMEOUT)
    r.raise_for_status()
    data = r.json()
    assert isinstance(data, list), "Courses list response is not a list"
    return data

def create_submission(course_id, headers):
    """Create a dummy student submission for grading."""
    url = f"{BASE_URL}/teacher/courses/{course_id}/submissions"
    # For testing assume course accepts submissions with code, language, and studentId fields
    payload = {
        "studentId": "student-test-id",
        "code": "print('Hello, world!')",
        "language": "python"
    }
    r = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    r.raise_for_status()
    data = r.json()
    assert "id" in data and data["id"], "Submission ID missing in create response"
    return data["id"]

def get_submission(course_id, submission_id, headers):
    """Retrieve a specific submission detail."""
    url = f"{BASE_URL}/teacher/courses/{course_id}/submissions/{submission_id}"
    r = requests.get(url, headers=headers, timeout=TIMEOUT)
    r.raise_for_status()
    data = r.json()
    assert data.get("id") == submission_id, "Retrieved submission ID does not match"
    return data

def grade_submission(course_id, submission_id, headers):
    """Grade a student submission."""
    url = f"{BASE_URL}/teacher/courses/{course_id}/submissions/{submission_id}/grade"
    payload = {
        "grade": 95,
        "feedback": "Well done! Keep up the good work."
    }
    r = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    r.raise_for_status()
    data = r.json()
    assert data.get("grade") == 95, "Grade was not applied correctly"
    assert data.get("feedback") == payload["feedback"], "Feedback was not applied correctly"

def send_chat_message(course_id, message, headers):
    """Send a chat message in the teacher panel for a course."""
    url = f"{BASE_URL}/teacher/courses/{course_id}/chat/messages"
    payload = {
        "message": message
    }
    r = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    r.raise_for_status()
    data = r.json()
    assert "id" in data and data["message"] == message, "Chat message was not sent correctly"
    return data["id"]

def get_chat_messages(course_id, headers):
    """Retrieve chat messages for the course teacher panel."""
    url = f"{BASE_URL}/teacher/courses/{course_id}/chat/messages"
    r = requests.get(url, headers=headers, timeout=TIMEOUT)
    r.raise_for_status()
    data = r.json()
    assert isinstance(data, list), "Chat messages response is not a list"
    return data

def delete_course(course_id, headers):
    """Delete the course to clean up after test."""
    url = f"{BASE_URL}/teacher/courses/{course_id}"
    r = requests.delete(url, headers=headers, timeout=TIMEOUT)
    # DELETE might return 204 No Content or 200 with some message
    if r.status_code not in (200, 204):
        raise Exception(f"Failed to delete course {course_id}, status code: {r.status_code}")

def test_teacher_panel_course_and_submission_management():
    access_token = authenticate_teacher()
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    course_id = None
    submission_id = None
    chat_message_id = None
    try:
        # Create course
        course_id = create_course(headers)
        # List courses to verify presence
        courses = list_courses(headers)
        assert any(c["id"] == course_id for c in courses), "New course not found in course list"
        # Update course
        update_course(course_id, headers)
        # Create a submission for grading
        submission_id = create_submission(course_id, headers)
        # Retrieve submission details
        submission = get_submission(course_id, submission_id, headers)
        assert submission["id"] == submission_id, "Submission retrieval failed"
        # Grade the submission
        grade_submission(course_id, submission_id, headers)
        # Send a chat message
        chat_message_id = send_chat_message(course_id, "Test message from teacher panel", headers)
        # Retrieve chat messages and verify
        messages = get_chat_messages(course_id, headers)
        assert any(m["id"] == chat_message_id for m in messages), "Sent chat message not found"
    finally:
        # Cleanup created resources
        if course_id:
            try:
                delete_course(course_id, headers)
            except Exception:
                pass

test_teacher_panel_course_and_submission_management()