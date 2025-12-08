import requests
import io

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

# Assume no authentication needed as per given data.
# If auth is needed, token handling should be implemented here.

def test_file_upload_for_chat_and_course_materials():
    """
    Test uploading a file as a chat attachment and as a course material,
    verify successful upload and that returned file metadata matches the upload.
    """

    chat_upload_url = f"{BASE_URL}/upload/chat-attachment"
    course_material_upload_url = f"{BASE_URL}/upload/course-material"

    # Sample file content for upload
    file_content = b"Sample file content for upload testing."
    file_name = "test_upload.txt"
    file_mimetype = "text/plain"
    files = {
        'file': (file_name, io.BytesIO(file_content), file_mimetype)
    }

    # Store uploaded file IDs to clean up if API supports deletion
    uploaded_files = []

    try:
        # Upload as chat attachment
        chat_resp = requests.post(chat_upload_url, files=files, timeout=TIMEOUT)
        assert chat_resp.status_code == 201, f"Chat attachment upload failed: {chat_resp.status_code}"

        chat_data = chat_resp.json()
        assert "fileId" in chat_data, "No fileId returned for chat attachment upload"
        assert chat_data.get("fileName") == file_name or chat_data.get("filename") == file_name, "Filename mismatch for chat attachment"

        uploaded_files.append(("chat", chat_data["fileId"] if "fileId" in chat_data else chat_data.get("id")))

        # Reset the stream before second upload
        files['file'][1].seek(0)

        # Upload as course material
        course_resp = requests.post(course_material_upload_url, files=files, timeout=TIMEOUT)
        assert course_resp.status_code == 201, f"Course material upload failed: {course_resp.status_code}"

        course_data = course_resp.json()
        assert "fileId" in course_data, "No fileId returned for course material upload"
        assert course_data.get("fileName") == file_name or course_data.get("filename") == file_name, "Filename mismatch for course material"

        uploaded_files.append(("course", course_data["fileId"] if "fileId" in course_data else course_data.get("id")))

        # Optional: Download file and verify content if endpoint exists
        # For brevity, not implemented due to no info provided

    finally:
        # Clean up: Attempt to delete uploaded files if API supports it at /upload/{type}/{fileId}
        # No info on deletion API, so we try basic DELETE endpoints
        for resource_type, file_id in uploaded_files:
            if file_id:
                delete_url = f"{BASE_URL}/upload/{resource_type}/{file_id}"
                try:
                    resp = requests.delete(delete_url, timeout=TIMEOUT)
                    # Accept 200 or 204 or 404 (already deleted)
                    assert resp.status_code in (200, 204, 404), f"Failed to delete uploaded {resource_type} file {file_id}"
                except Exception:
                    # Ignoring delete failures to not mask test issues
                    pass

test_file_upload_for_chat_and_course_materials()