import requests
import time

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def interactive_learning_platform_functionality():
    """
    Ensure that the interactive learning platform supports lessons, quizzes,
    practice exercises, progress tracking, and discussion features as expected.
    """
    headers = {
        "Content-Type": "application/json"
    }

    # 1. Create a dummy course to attach lessons, quizzes, exercises, discussions
    course_payload = {
        "title": "Test Course for Interactive Learning",
        "description": "Course created for testing interactive learning platform features."
    }
    course_resp = requests.post(f"{BASE_URL}/courses", json=course_payload, headers=headers, timeout=TIMEOUT)
    assert course_resp.status_code == 201, f"Course creation failed: {course_resp.text}"
    course_id = course_resp.json().get("id")
    assert course_id is not None, "Created course ID is None"

    try:
        # 2. Add a lesson to the course
        lesson_payload = {
            "title": "Lesson 1: Basics",
            "content": "Introduction to basics of programming.",
            "courseId": course_id
        }
        lesson_resp = requests.post(f"{BASE_URL}/lessons", json=lesson_payload, headers=headers, timeout=TIMEOUT)
        assert lesson_resp.status_code == 201, f"Lesson creation failed: {lesson_resp.text}"
        lesson_id = lesson_resp.json().get("id")
        assert lesson_id is not None, "Created lesson ID is None"

        # 3. Add a quiz linked to the lesson
        quiz_payload = {
            "lessonId": lesson_id,
            "title": "Quiz 1: Basics Quiz",
            "questions": [
                {
                    "question": "What does CPU stand for?",
                    "options": ["Central Processing Unit", "Central Programming Unit", "Computer Personal Unit"],
                    "answer": "Central Processing Unit"
                }
            ]
        }
        quiz_resp = requests.post(f"{BASE_URL}/quizzes", json=quiz_payload, headers=headers, timeout=TIMEOUT)
        assert quiz_resp.status_code == 201, f"Quiz creation failed: {quiz_resp.text}"
        quiz_id = quiz_resp.json().get("id")
        assert quiz_id is not None, "Created quiz ID is None"

        # 4. Add a practice exercise to the lesson
        exercise_payload = {
            "lessonId": lesson_id,
            "title": "Practice Exercise 1",
            "description": "Write a hello world program.",
            "language": "python",
            "starterCode": "print('Hello, World!')"
        }
        exercise_resp = requests.post(f"{BASE_URL}/exercises", json=exercise_payload, headers=headers, timeout=TIMEOUT)
        assert exercise_resp.status_code == 201, f"Exercise creation failed: {exercise_resp.text}"
        exercise_id = exercise_resp.json().get("id")
        assert exercise_id is not None, "Created exercise ID is None"

        # 5. Simulate student progress tracking: mark lesson as completed
        progress_payload = {
            "courseId": course_id,
            "lessonId": lesson_id,
            "status": "completed"
        }
        progress_resp = requests.post(f"{BASE_URL}/progress", json=progress_payload, headers=headers, timeout=TIMEOUT)
        assert progress_resp.status_code == 200, f"Progress update failed: {progress_resp.text}"
        progress_data = progress_resp.json()
        assert progress_data.get("status") == "completed", "Progress status mismatch"

        # 6. Create a discussion thread linked to the lesson
        discussion_payload = {
            "lessonId": lesson_id,
            "title": "Discussion on Lesson 1",
            "initialPost": "What did you find most interesting about this lesson?"
        }
        discussion_resp = requests.post(f"{BASE_URL}/discussions", json=discussion_payload, headers=headers, timeout=TIMEOUT)
        assert discussion_resp.status_code == 201, f"Discussion creation failed: {discussion_resp.text}"
        discussion_id = discussion_resp.json().get("id")
        assert discussion_id is not None, "Created discussion ID is None"

        # 7. Post a message to the discussion thread
        message_payload = {
            "discussionId": discussion_id,
            "author": "test_student",
            "message": "I loved the explanation about CPUs."
        }
        message_resp = requests.post(f"{BASE_URL}/discussions/{discussion_id}/messages", json=message_payload, headers=headers, timeout=TIMEOUT)
        assert message_resp.status_code == 201, f"Message post failed: {message_resp.text}"
        message_id = message_resp.json().get("id")
        assert message_id is not None, "Created message ID is None"

        # 8. Retrieve course content and verify embedded features
        course_content_resp = requests.get(f"{BASE_URL}/courses/{course_id}/content", headers=headers, timeout=TIMEOUT)
        assert course_content_resp.status_code == 200, f"Failed getting course content: {course_content_resp.text}"
        content = course_content_resp.json()

        # Validate lessons, quizzes, exercises, discussions exist
        lessons = content.get("lessons", [])
        assert any(l.get("id") == lesson_id for l in lessons), "Lesson not found in course content"
        quizzes = content.get("quizzes", [])
        assert any(q.get("id") == quiz_id for q in quizzes), "Quiz not found in course content"
        exercises = content.get("exercises", [])
        assert any(e.get("id") == exercise_id for e in exercises), "Exercise not found in course content"
        discussions = content.get("discussions", [])
        assert any(d.get("id") == discussion_id for d in discussions), "Discussion not found in course content"

        # 9. Retrieve progress for the course and validate
        progress_check_resp = requests.get(f"{BASE_URL}/progress?courseId={course_id}", headers=headers, timeout=TIMEOUT)
        assert progress_check_resp.status_code == 200, f"Failed getting progress: {progress_check_resp.text}"
        progress_list = progress_check_resp.json()
        assert any(p.get("lessonId") == lesson_id and p.get("status") == "completed" for p in progress_list), "Lesson progress not tracked"

    finally:
        # Cleanup: delete created resources in reverse order
        # Delete discussion messages
        try:
            if 'discussion_id' in locals():
                requests.delete(f"{BASE_URL}/discussions/{discussion_id}/messages/{message_id}", headers=headers, timeout=TIMEOUT)
        except Exception:
            pass
        # Delete discussion thread
        try:
            if 'discussion_id' in locals():
                requests.delete(f"{BASE_URL}/discussions/{discussion_id}", headers=headers, timeout=TIMEOUT)
        except Exception:
            pass
        # Delete progress
        try:
            if 'course_id' in locals():
                requests.delete(f"{BASE_URL}/progress?courseId={course_id}&lessonId={lesson_id}", headers=headers, timeout=TIMEOUT)
        except Exception:
            pass
        # Delete exercise
        try:
            if 'exercise_id' in locals():
                requests.delete(f"{BASE_URL}/exercises/{exercise_id}", headers=headers, timeout=TIMEOUT)
        except Exception:
            pass
        # Delete quiz
        try:
            if 'quiz_id' in locals():
                requests.delete(f"{BASE_URL}/quizzes/{quiz_id}", headers=headers, timeout=TIMEOUT)
        except Exception:
            pass
        # Delete lesson
        try:
            if 'lesson_id' in locals():
                requests.delete(f"{BASE_URL}/lessons/{lesson_id}", headers=headers, timeout=TIMEOUT)
        except Exception:
            pass
        # Delete course
        try:
            if 'course_id' in locals():
                requests.delete(f"{BASE_URL}/courses/{course_id}", headers=headers, timeout=TIMEOUT)
        except Exception:
            pass

interactive_learning_platform_functionality()