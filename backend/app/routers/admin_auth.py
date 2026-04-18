from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
import uuid
from datetime import datetime, timezone

from app.db.database import db
from app.core.security import (
    verify_password, create_access_token, get_current_admin, pwd_context,
    require_super_admin,
)
from app.models.admin import (
    AdminLogin, AdminResponse, TokenResponse, ChangePasswordRequest, AdminCreate,
    AdminUpdate, VALID_ROLES,
)

router = APIRouter(prefix="/admin")


@router.post("/setup")
async def setup_admin(data: AdminCreate):
    existing = await db.admins.find_one({}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=403, detail="Admin already exists. Use login instead.")

    admin = {
        "id": str(uuid.uuid4()),
        "username": data.username,
        "password": pwd_context.hash(data.password),
        "role": "super_admin",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admins.insert_one(admin)
    return {"message": f"Admin '{data.username}' created successfully"}


@router.post("/login", response_model=TokenResponse)
async def admin_login(login_data: AdminLogin):
    admin = await db.admins.find_one({"username": login_data.username}, {"_id": 0})

    if not admin or not verify_password(login_data.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(admin["id"])

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin": {
            "id": admin["id"],
            "username": admin["username"],
            "role": admin.get("role", "super_admin"),
            "created_at": admin["created_at"]
        }
    }


@router.get("/me", response_model=AdminResponse)
async def get_current_admin_info(admin=Depends(get_current_admin)):
    return {
        "id": admin["id"],
        "username": admin["username"],
        "role": admin.get("role", "super_admin"),
        "created_at": admin["created_at"]
    }


@router.put("/change-password")
async def change_admin_password(
    request: ChangePasswordRequest,
    admin: dict = Depends(get_current_admin)
):
    if not pwd_context.verify(request.current_password, admin["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    new_hash = pwd_context.hash(request.new_password)

    await db.admins.update_one(
        {"id": admin["id"]},
        {"$set": {"password": new_hash}}
    )

    return {"message": "Password changed successfully"}


# ==================== MANAGE ADMINS (Super Admin only) ====================

@router.get("/admins", response_model=List[AdminResponse])
async def list_admins(admin=Depends(require_super_admin)):
    admins = await db.admins.find({}, {"_id": 0, "password": 0}).to_list(100)
    for a in admins:
        a.setdefault("role", "super_admin")
    return admins


@router.post("/admins", response_model=AdminResponse, status_code=201)
async def create_admin(data: AdminCreate, admin=Depends(require_super_admin)):
    existing = await db.admins.find_one({"username": data.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    role = data.role if data.role in VALID_ROLES else "editor"

    new_admin = {
        "id": str(uuid.uuid4()),
        "username": data.username,
        "password": pwd_context.hash(data.password),
        "role": role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admins.insert_one(new_admin)
    return {"id": new_admin["id"], "username": new_admin["username"], "role": role, "created_at": new_admin["created_at"]}


@router.put("/admins/{admin_id}", response_model=AdminResponse)
async def update_admin(admin_id: str, data: AdminUpdate, admin=Depends(require_super_admin)):
    target = await db.admins.find_one({"id": admin_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Admin not found")

    update_fields = {}
    if data.username is not None:
        dup = await db.admins.find_one({"username": data.username, "id": {"$ne": admin_id}}, {"_id": 0})
        if dup:
            raise HTTPException(status_code=400, detail="Username already exists")
        update_fields["username"] = data.username

    if data.password is not None:
        update_fields["password"] = pwd_context.hash(data.password)

    if data.role is not None:
        if data.role not in VALID_ROLES:
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")
        if admin_id == admin["id"] and data.role != "super_admin":
            raise HTTPException(status_code=400, detail="Cannot demote your own account")
        update_fields["role"] = data.role

    if not update_fields:
        raise HTTPException(status_code=400, detail="No data to update")

    await db.admins.update_one({"id": admin_id}, {"$set": update_fields})
    updated = await db.admins.find_one({"id": admin_id}, {"_id": 0, "password": 0})
    updated.setdefault("role", "super_admin")
    return updated


@router.delete("/admins/{admin_id}")
async def delete_admin(admin_id: str, admin=Depends(require_super_admin)):
    if admin_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    result = await db.admins.delete_one({"id": admin_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")

    return {"message": "Admin deleted successfully"}
