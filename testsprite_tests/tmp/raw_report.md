
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** school
- **Date:** 2025-12-08
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001
- **Test Name:** user_authentication_with_jwt_oauth_and_2fa
- **Test Code:** [TC001_user_authentication_with_jwt_oauth_and_2fa.py](./TC001_user_authentication_with_jwt_oauth_and_2fa.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 113, in <module>
  File "<string>", line 30, in test_user_authentication_with_jwt_oauth_and_2fa
AssertionError: Registration failed: {"error":"Все поля обязательны"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e9d918e8-3034-4e0b-ad20-622afbbe2d62/531e1896-8441-4d24-b320-f15488ee68e3
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002
- **Test Name:** end_to_end_encrypted_real_time_chat
- **Test Code:** [TC002_end_to_end_encrypted_real_time_chat.py](./TC002_end_to_end_encrypted_real_time_chat.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 5, in <module>
ModuleNotFoundError: No module named 'Crypto'

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e9d918e8-3034-4e0b-ad20-622afbbe2d62/0d3fdc3f-1c90-4219-a4f9-1a8c35840f74
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003
- **Test Name:** student_dashboard_course_and_profile_management
- **Test Code:** [TC003_student_dashboard_course_and_profile_management.py](./TC003_student_dashboard_course_and_profile_management.py)
- **Test Error:** Traceback (most recent call last):
  File "<string>", line 20, in student_dashboard_course_and_profile_management
AssertionError: Login failed: {"error":"Not found"}

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 94, in <module>
  File "<string>", line 92, in student_dashboard_course_and_profile_management
AssertionError: Test failed due to exception

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e9d918e8-3034-4e0b-ad20-622afbbe2d62/fabaf2cb-fb59-42f1-a612-f9af8a99a293
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004
- **Test Name:** interactive_learning_platform_functionality
- **Test Code:** [TC004_interactive_learning_platform_functionality.py](./TC004_interactive_learning_platform_functionality.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 167, in <module>
  File "<string>", line 22, in interactive_learning_platform_functionality
AssertionError: Course creation failed: {"error":"Not found"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e9d918e8-3034-4e0b-ad20-622afbbe2d62/7870f994-30f4-474e-8799-aedccb19d901
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005
- **Test Name:** teacher_panel_course_and_submission_management
- **Test Code:** [TC005_teacher_panel_course_and_submission_management.py](./TC005_teacher_panel_course_and_submission_management.py)
- **Test Error:** Traceback (most recent call last):
  File "<string>", line 20, in authenticate_teacher
  File "/var/task/requests/models.py", line 1024, in raise_for_status
    raise HTTPError(http_error_msg, response=self)
requests.exceptions.HTTPError: 404 Client Error: Not Found for url: http://localhost:3001/auth/login

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 168, in <module>
  File "<string>", line 132, in test_teacher_panel_course_and_submission_management
  File "<string>", line 25, in authenticate_teacher
Exception: Authentication failed: 404 Client Error: Not Found for url: http://localhost:3001/auth/login

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e9d918e8-3034-4e0b-ad20-622afbbe2d62/cb009234-cb38-4eae-8f3b-095dc0e625e1
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006
- **Test Name:** admin_panel_user_and_course_management
- **Test Code:** [TC006_admin_panel_user_and_course_management.py](./TC006_admin_panel_user_and_course_management.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 147, in <module>
  File "<string>", line 19, in admin_panel_user_and_course_management
AssertionError: Admin login failed: {"error":"Неверный email или пароль"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e9d918e8-3034-4e0b-ad20-622afbbe2d62/4a6695ed-8280-43f4-8f2c-89e9b1dec229
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007
- **Test Name:** multi_language_code_execution_and_linting
- **Test Code:** [TC007_multi_language_code_execution_and_linting.py](./TC007_multi_language_code_execution_and_linting.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 186, in <module>
  File "<string>", line 142, in test_multi_language_code_execution_and_linting
AssertionError: Expected 200 OK but got 404 for language python

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e9d918e8-3034-4e0b-ad20-622afbbe2d62/d44bd683-c264-44dc-9ae6-f41dc32d0af2
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008
- **Test Name:** user_profile_and_settings_management
- **Test Code:** [TC008_user_profile_and_settings_management.py](./TC008_user_profile_and_settings_management.py)
- **Test Error:** Traceback (most recent call last):
  File "<string>", line 36, in test_user_profile_and_settings_management
  File "<string>", line 15, in authenticate
  File "/var/task/requests/models.py", line 1024, in raise_for_status
    raise HTTPError(http_error_msg, response=self)
requests.exceptions.HTTPError: 404 Client Error: Not Found for url: http://localhost:3001/auth/login

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 155, in <module>
  File "<string>", line 39, in test_user_profile_and_settings_management
AssertionError: Authentication failed: 404 Client Error: Not Found for url: http://localhost:3001/auth/login

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e9d918e8-3034-4e0b-ad20-622afbbe2d62/d72745e4-9ce9-4e38-a7d4-0634234a85b4
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009
- **Test Name:** gamification_features_tracking_and_rewards
- **Test Code:** [TC009_gamification_features_tracking_and_rewards.py](./TC009_gamification_features_tracking_and_rewards.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 82, in <module>
  File "<string>", line 21, in test_gamification_features_tracking_and_rewards
AssertionError: Registration failed: {"error":"Пользователь с таким email уже существует"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e9d918e8-3034-4e0b-ad20-622afbbe2d62/8291199f-bcf6-4a0d-a526-5433498a19a9
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010
- **Test Name:** file_upload_for_chat_and_course_materials
- **Test Code:** [TC010_file_upload_for_chat_and_course_materials.py](./TC010_file_upload_for_chat_and_course_materials.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 71, in <module>
  File "<string>", line 33, in test_file_upload_for_chat_and_course_materials
AssertionError: Chat attachment upload failed: 404

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e9d918e8-3034-4e0b-ad20-622afbbe2d62/ce195661-20f5-4357-81a0-b41afa1a8b67
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **0.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---