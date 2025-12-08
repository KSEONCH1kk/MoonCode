import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_multi_language_code_execution_and_linting():
    """
    Validate that the code execution service correctly runs and lints code submissions in all supported programming languages,
    providing accurate output and feedback.
    """
    # Define test cases for supported languages with code snippets expected to run and lint successfully
    # and some with linting errors.
    languages_tests = [
        {
            "language": "python",
            "code": "print('Hello, World!')",
            "expect_success": True,
            "expected_output": "Hello, World!\n",
        },
        {
            "language": "python",
            "code": "def foo( ): print('Indentation error')\n  print('extra indent')",
            "expect_success": False,
            "expected_output_contains": "IndentationError",
        },
        {
            "language": "javascript",
            "code": "console.log('Hello, JS!');",
            "expect_success": True,
            "expected_output": "Hello, JS!\n",
        },
        {
            "language": "javascript",
            "code": "function test() { console.log('Missing brace')",
            "expect_success": False,
            "expected_output_contains": "SyntaxError",
        },
        {
            "language": "typescript",
            "code": "const greet: string = 'Hello TS!'; console.log(greet);",
            "expect_success": True,
            "expected_output": "Hello TS!\n",
        },
        {
            "language": "typescript",
            "code": "let x: number = 'string';",
            "expect_success": False,
            "expected_output_contains": "TypeError",
        },
        {
            "language": "java",
            "code": (
                "public class Main {"
                " public static void main(String[] args) {"
                " System.out.println(\"Hello Java!\");"
                " }"
                "}"
            ),
            "expect_success": True,
            "expected_output": "Hello Java!\n",
        },
        {
            "language": "java",
            "code": (
                "public class Main {"
                " public static void main(String[] args) {"
                " System.out.println(\"Unclosed string);"
                " }"
                "}"
            ),
            "expect_success": False,
            "expected_output_contains": "error",
        },
        {
            "language": "c",
            "code": (
                "#include <stdio.h>\n"
                "int main() {\n"
                " printf(\"Hello C!\\n\");\n"
                " return 0;\n"
                "}"
            ),
            "expect_success": True,
            "expected_output": "Hello C!\n",
        },
        {
            "language": "c",
            "code": (
                "#include <stdio.h>\n"
                "int main() {\n"
                " printf(\"Missing semicolon\\n\")\n"
                " return 0;\n"
                "}"
            ),
            "expect_success": False,
            "expected_output_contains": "error",
        },
        {
            "language": "cpp",
            "code": (
                "#include <iostream>\n"
                "int main() {\n"
                " std::cout << \"Hello C++!\" << std::endl;\n"
                " return 0;\n"
                "}"
            ),
            "expect_success": True,
            "expected_output": "Hello C++!\n",
        },
        {
            "language": "cpp",
            "code": (
                "#include <iostream>\n"
                "int main() {\n"
                " std::cout << \"Missing brace\" << std::endl;\n"
                # missing closing brace
            ),
            "expect_success": False,
            "expected_output_contains": "error",
        },
    ]

    url = f"{BASE_URL}/api/code-execution/execute"
    headers = {
        "Content-Type": "application/json"
    }

    for test in languages_tests:
        payload = {
            "language": test["language"],
            "sourceCode": test["code"],
            "options": {
                "lint": True,
                "execute": True
            }
        }
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        except requests.RequestException as e:
            assert False, f"Request failed for language {test['language']}: {e}"

        assert response.status_code == 200, f"Expected 200 OK but got {response.status_code} for language {test['language']}"

        try:
            resp_json = response.json()
        except Exception as e:
            assert False, f"Response is not valid JSON for language {test['language']}: {e}"

        # Validate structure
        assert "executionResult" in resp_json, f"Missing executionResult field in response for language {test['language']}"
        assert "lintResult" in resp_json, f"Missing lintResult field in response for language {test['language']}"

        execution = resp_json["executionResult"]
        lint = resp_json["lintResult"]

        # Check execution success
        if test["expect_success"]:
            assert execution.get("success") is True, f"Expected execution success for {test['language']}"
            output = execution.get("output", "")
            # Validate exact output if provided
            if "expected_output" in test:
                assert output == test["expected_output"], f"Expected output '{test['expected_output']}' but got '{output}' for language {test['language']}"
            # Lint warnings/errors should be empty or only warnings for valid code
            assert lint.get("errors") == [] or lint.get("errors") is None, f"Expected no lint errors for {test['language']}, got {lint.get('errors')}"
        else:
            # For failure cases expect success False or lint errors
            exec_success = execution.get("success")
            lint_errors = lint.get("errors")
            output = execution.get("output", "") or ""
            # At least one of lint errors or execution failure expected
            assert (exec_success is False) or (lint_errors and len(lint_errors) > 0), f"Expected execution or lint failure for {test['language']}"
            # Check output contains expected error substring if specified
            if "expected_output_contains" in test:
                found_error = False
                # Check output and lint errors text for the error substring
                substr = test["expected_output_contains"]
                if substr.lower() in output.lower():
                    found_error = True
                elif lint_errors:
                    for err in lint_errors:
                        if substr.lower() in err.lower():
                            found_error = True
                            break
                assert found_error, f"Expected error containing '{substr}' not found in output or lint errors for {test['language']}"

test_multi_language_code_execution_and_linting()
