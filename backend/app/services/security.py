import hashlib
import secrets

def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with a random salt."""
    salt = secrets.token_hex(16)
    iterations = 100_000
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    return f"pbkdf2:sha256:{iterations}${salt}${derived.hex()}"

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against stored PBKDF2 hash using constant-time comparison."""
    try:
        method, salt, key = hashed.split("$")
        algo, subalgo, iterations_str = method.split(":")
        iterations = int(iterations_str)
        derived = hashlib.pbkdf2_hmac(subalgo, password.encode("utf-8"), salt.encode("utf-8"), iterations)
        return secrets.compare_digest(derived.hex(), key)
    except Exception:
        return False
