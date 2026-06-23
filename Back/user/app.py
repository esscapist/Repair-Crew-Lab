from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from datetime import datetime, timedelta
import hashlib
import jwt
from database import get_user_by_email, get_user_by_id, create_user, authenticate_user

app = FastAPI(title="Supporting Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "8f7a2b9c3e1d4a5f6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 30


def create_access_token(user_id, email):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"user_id": user_id, "email": email, "exp": expire, "type": "access"}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id, email):
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"user_id": user_id, "email": email, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except:
        return None


@app.get("/")
async def root():
    return {"service": "Supporting Service", "status": "running"}


@app.post("/api/register")
async def register(request: Request):
    data = await request.json()

    print(f"РЕГИСТРАЦИЯ")
    print(f"fullName: {data.get('fullName')}")
    print(f"email: {data.get('email')}")

    full_name = data.get('fullName')
    email = data.get('email')
    password = data.get('password')

    if not full_name or not email or not password:
        raise HTTPException(status_code=400, detail="Все поля обязательны")

    if get_user_by_email(email):
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")

    user = create_user(full_name, email, password)

    access_token = create_access_token(user['id'], user['email'])
    refresh_token = create_refresh_token(user['id'], user['email'])

    return {
        "success": True,
        "message": "Регистрация успешна",
        "data": {
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "user": user
        }
    }


@app.post("/api/login")
async def login(request: Request):
    data = await request.json()

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email и пароль обязательны")

    user = authenticate_user(email, password)
    if not user:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    access_token = create_access_token(user['id'], user['email'])
    refresh_token = create_refresh_token(user['id'], user['email'])

    return {
        "success": True,
        "message": "Вход выполнен",
        "data": {
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "user": user
        }
    }


@app.post("/api/verify-token")
async def verify_token_endpoint(request: Request):
    data = await request.json()
    token = data.get('token')

    if not token:
        return {"valid": False, "error": "Token required"}

    payload = verify_token(token)
    if not payload or payload.get('type') != 'access':
        return {"valid": False, "error": "Invalid token"}

    return {"valid": True, "user_id": payload['user_id'], "email": payload['email']}


@app.post("/api/refresh-token")
async def refresh_token(request: Request):
    data = await request.json()
    refresh_token_str = data.get('refresh_token')

    if not refresh_token_str:
        raise HTTPException(status_code=400, detail="Refresh token required")

    payload = verify_token(refresh_token_str)
    if not payload or payload.get('type') != 'refresh':
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = get_user_by_id(payload['user_id'])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access = create_access_token(user['id'], user['email'])
    new_refresh = create_refresh_token(user['id'], user['email'])

    return {
        "success": True,
        "data": {
            "accessToken": new_access,
            "refreshToken": new_refresh
        }
    }

@app.get("/api/me")
async def get_me(request: Request):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        raise HTTPException(status_code=401, detail="Token missing")

    token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header
    payload = verify_token(token)

    if not payload or payload.get('type') != 'access':
        raise HTTPException(status_code=401, detail="Invalid token")

    user = get_user_by_id(payload['user_id'])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "success": True,
        "data": {
            "id": user['id'],
            "fullName": user['full_name'],
            "email": user['email'],
            "created_at": str(user['created_at'])
        }
    }

@app.get("/api/hash/{str}")
async def hash_string(str: str):
    hash_result = hashlib.sha256(str.encode()).hexdigest()
    return {"request": str, "result": hash_result}

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
