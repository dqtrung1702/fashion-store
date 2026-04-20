from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
from models import LoginRequest, UserCreate, User, UserUpdate, Token
from security import hash_password, verify_password, create_access_token, verify_token

router = APIRouter()

def serialize_user(user_doc):
    serialized = dict(user_doc)
    serialized["_id"] = str(serialized["_id"])
    return serialized

@router.post("/register", response_model=User)
async def register(user_data: UserCreate):
    db = get_db()
    
    # Check if email already exists
    existing_user = db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_username = db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    user_doc = {
        "email": user_data.email,
        "username": user_data.username,
        "full_name": user_data.full_name,
        "password": hashed_password,
        "is_admin": False,
        "is_active": True,
        "created_at": __import__("datetime").datetime.utcnow()
    }
    
    result = db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    return User(**serialize_user(user_doc))

@router.post("/login", response_model=Token)
async def login(credentials: LoginRequest):
    db = get_db()
    
    user = db.users.find_one(
        {"$or": [{"email": credentials.username}, {"username": credentials.username}]}
    )
    if not user or not verify_password(credentials.password, user.get("password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
        )
    
    access_token = create_access_token({"user_id": str(user["_id"])})
    
    return Token(
        access_token=access_token,
        user=User(**serialize_user(user))
    )


@router.get("/me", response_model=User)
async def get_current_user(user_id: str = Depends(verify_token)):
    db = get_db()
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return User(**serialize_user(user))


@router.patch("/me", response_model=User)
async def update_current_user(
    payload: UserUpdate,
    user_id: str = Depends(verify_token),
):
    db = get_db()
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    updates = {}
    if payload.full_name is not None:
        next_full_name = payload.full_name.strip()
        if not next_full_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Full name cannot be empty"
            )
        updates["full_name"] = next_full_name

    if payload.email is not None:
        next_email = str(payload.email).strip().lower()
        existing_user = db.users.find_one({"email": next_email, "_id": {"$ne": ObjectId(user_id)}})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        updates["email"] = next_email

    if not updates:
        return User(**serialize_user(user))

    updates["updated_at"] = datetime.utcnow()
    db.users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})
    updated_user = db.users.find_one({"_id": ObjectId(user_id)})
    return User(**serialize_user(updated_user))

@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}
