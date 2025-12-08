import requests
import time
import json
from base64 import b64decode, b64encode
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
from websocket import create_connection, WebSocketTimeoutException

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

# Helper functions for authentication and key generation

def authenticate_user(email, password):
    url = f"{BASE_URL}/auth/login"
    payload = {"email": email, "password": password}
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    # Expect token in data["token"]
    assert "token" in data, "Authentication token not found in response."
    return data["token"]

def generate_rsa_key_pair():
    key = RSA.generate(2048)
    private_key = key.export_key()
    public_key = key.publickey().export_key()
    return private_key, public_key

def rsa_encrypt(public_key_pem, message_bytes):
    public_key = RSA.import_key(public_key_pem)
    cipher = PKCS1_OAEP.new(public_key)
    encrypted = cipher.encrypt(message_bytes)
    return encrypted

def rsa_decrypt(private_key_pem, encrypted_bytes):
    private_key = RSA.import_key(private_key_pem)
    cipher = PKCS1_OAEP.new(private_key)
    decrypted = cipher.decrypt(encrypted_bytes)
    return decrypted

def register_user(email, password, role):
    url = f"{BASE_URL}/auth/register"
    payload = {"email": email, "password": password, "role": role}
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    user = response.json()
    assert "id" in user
    return user["id"]

def delete_user(user_id, admin_token):
    url = f"{BASE_URL}/admin/users/{user_id}"
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = requests.delete(url, headers=headers, timeout=TIMEOUT)
    # May return 204 or 200 on success
    assert resp.status_code in [200, 204]

def get_admin_token():
    # Assuming an admin user exists with known credentials for test
    # In real scenario, credentials would be secure or a token provided
    admin_email = "admin@example.com"
    admin_password = "AdminPass123!"
    return authenticate_user(admin_email, admin_password)

def exchange_public_keys(token_sender, token_receiver, sender_pubkey_pem, receiver_pubkey_pem):
    # Assume there is an endpoint to register user public keys for chat encryption
    url = f"{BASE_URL}/chat/keys"
    headers_sender = {"Authorization": f"Bearer {token_sender}", "Content-Type": "application/json"}
    headers_receiver = {"Authorization": f"Bearer {token_receiver}", "Content-Type": "application/json"}

    # Register sender's public key
    resp1 = requests.post(url, headers=headers_sender, json={"publicKey": sender_pubkey_pem.decode()}, timeout=TIMEOUT)
    resp1.raise_for_status()

    # Register receiver's public key
    resp2 = requests.post(url, headers=headers_receiver, json={"publicKey": receiver_pubkey_pem.decode()}, timeout=TIMEOUT)
    resp2.raise_for_status()


def test_end_to_end_encrypted_real_time_chat():
    # Register two users: a student and a teacher
    admin_token = get_admin_token()

    student_email = f"student_{int(time.time())}@test.com"
    student_password = "StudentPass123!"
    teacher_email = f"teacher_{int(time.time())}@test.com"
    teacher_password = "TeacherPass123!"

    student_id = None
    teacher_id = None

    # Create keys for both users
    student_private_key, student_public_key = generate_rsa_key_pair()
    teacher_private_key, teacher_public_key = generate_rsa_key_pair()

    try:
        # Register student and teacher users
        student_id = register_user(student_email, student_password, role="student")
        teacher_id = register_user(teacher_email, teacher_password, role="teacher")

        # Authenticate both users to get JWT tokens
        student_token = authenticate_user(student_email, student_password)
        teacher_token = authenticate_user(teacher_email, teacher_password)

        # Register public keys for chat encryption
        exchange_public_keys(student_token, teacher_token, student_public_key, teacher_public_key)

        # Open WebSocket connections for both users (simulate client chat connection)
        # Assuming ws endpoint at /chat/ws with Bearer token authentication
        ws_url = f"ws://localhost:3001/chat/ws"

        headers_student = {"Authorization": f"Bearer {student_token}"}
        headers_teacher = {"Authorization": f"Bearer {teacher_token}"}

        # websocket-client library requires headers as list of tuples
        ws_headers_student = [("Authorization", f"Bearer {student_token}")]
        ws_headers_teacher = [("Authorization", f"Bearer {teacher_token}")]

        ws_student = create_connection(ws_url, header=ws_headers_student, timeout=TIMEOUT)
        ws_teacher = create_connection(ws_url, header=ws_headers_teacher, timeout=TIMEOUT)

        try:
            # Compose a plaintext message from student to teacher
            message_text = "Hello Teacher, this is a secret message."

            # Encrypt message with teacher's public key before sending (simulate client-side encryption)
            encrypted_msg_bytes = rsa_encrypt(teacher_public_key, message_text.encode())
            encrypted_msg_b64 = b64encode(encrypted_msg_bytes).decode()

            # Send message from student to teacher (JSON message format expected by chat system)
            outgoing_msg = {
                "type": "message",
                "toUserId": teacher_id,
                "content": encrypted_msg_b64,
                "encryption": "RSA-OAEP"
            }
            ws_student.send(json.dumps(outgoing_msg))

            # Receive on teacher side
            start_time = time.time()
            received_msg = None
            while time.time() - start_time < TIMEOUT:
                try:
                    resp = ws_teacher.recv()
                    if not resp:
                        continue
                    data = json.loads(resp)
                    if data.get("type") == "message" and data.get("fromUserId") == student_id:
                        received_msg = data
                        break
                except WebSocketTimeoutException:
                    break

            assert received_msg is not None, "Teacher did not receive the message from student."

            # The content should be an RSA-OAEP encrypted base64 string
            encrypted_received_b64 = received_msg.get("content")
            assert isinstance(encrypted_received_b64, str), "Encrypted message content missing or not string."
            encrypted_received_bytes = b64decode(encrypted_received_b64)

            # Decrypt message with teacher's private key
            decrypted_bytes = rsa_decrypt(teacher_private_key, encrypted_received_bytes)
            decrypted_text = decrypted_bytes.decode()

            # Verify decrypted message equals original plaintext message
            assert decrypted_text == message_text, "Decrypted message does not match original message."

            # Now test reply from teacher to student encrypted similarly

            reply_text = "Hello Student, I received your encrypted message safely."

            encrypted_reply_bytes = rsa_encrypt(student_public_key, reply_text.encode())
            encrypted_reply_b64 = b64encode(encrypted_reply_bytes).decode()

            outgoing_reply = {
                "type": "message",
                "toUserId": student_id,
                "content": encrypted_reply_b64,
                "encryption": "RSA-OAEP"
            }
            ws_teacher.send(json.dumps(outgoing_reply))

            # Student receives reply
            received_reply = None
            start_time = time.time()
            while time.time() - start_time < TIMEOUT:
                try:
                    resp = ws_student.recv()
                    if not resp:
                        continue
                    data = json.loads(resp)
                    if data.get("type") == "message" and data.get("fromUserId") == teacher_id:
                        received_reply = data
                        break
                except WebSocketTimeoutException:
                    break

            assert received_reply is not None, "Student did not receive the reply message from teacher."

            encrypted_reply_received_b64 = received_reply.get("content")
            assert isinstance(encrypted_reply_received_b64, str), "Encrypted reply content missing or not string."
            encrypted_reply_received_bytes = b64decode(encrypted_reply_received_b64)

            decrypted_reply_bytes = rsa_decrypt(student_private_key, encrypted_reply_received_bytes)
            decrypted_reply_text = decrypted_reply_bytes.decode()

            assert decrypted_reply_text == reply_text, "Decrypted reply message does not match original reply."

        finally:
            ws_student.close()
            ws_teacher.close()

    finally:
        # Cleanup: delete created users
        if student_id:
            try:
                delete_user(student_id, admin_token)
            except Exception:
                pass
        if teacher_id:
            try:
                delete_user(teacher_id, admin_token)
            except Exception:
                pass


test_end_to_end_encrypted_real_time_chat()
