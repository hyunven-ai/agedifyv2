from datetime import datetime, timezone
from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app.db.database import db
from app.core.security import require_super_admin
from app.models.seo import (
    SEOPageCreate, SEOPageUpdate, SEOPageResponse,
    SEOSettingsBase, SEOSettingsUpdate,
)

router = APIRouter(prefix="/admin/seo")


# ==================== SEO PAGES ====================

@router.get("/pages", response_model=List[SEOPageResponse])
async def admin_get_seo_pages(admin=Depends(require_super_admin)):
    pages = await db.seo_pages.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return pages


@router.get("/pages/{page_id}", response_model=SEOPageResponse)
async def admin_get_seo_page(page_id: str, admin=Depends(require_super_admin)):
    page = await db.seo_pages.find_one({"id": page_id}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="SEO page not found")
    return page


@router.post("/pages", response_model=SEOPageResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_seo_page(page: SEOPageCreate, admin=Depends(require_super_admin)):
    page_dict = page.model_dump()
    page_dict["id"] = str(uuid.uuid4())
    page_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    page_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    existing = await db.seo_pages.find_one({"slug": page.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")

    await db.seo_pages.insert_one(page_dict)
    if "_id" in page_dict:
        del page_dict["_id"]

    return page_dict


@router.put("/pages/{page_id}", response_model=SEOPageResponse)
async def admin_update_seo_page(page_id: str, page: SEOPageUpdate, admin=Depends(require_super_admin)):
    update_data = {k: v for k, v in page.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = await db.seo_pages.update_one(
        {"id": page_id},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="SEO page not found")

    updated_page = await db.seo_pages.find_one({"id": page_id}, {"_id": 0})
    return updated_page


@router.delete("/pages/{page_id}")
async def admin_delete_seo_page(page_id: str, admin=Depends(require_super_admin)):
    result = await db.seo_pages.delete_one({"id": page_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="SEO page not found")

    return {"message": "SEO page deleted successfully"}


# ==================== SEO SETTINGS ====================

@router.get("/settings")
async def admin_get_seo_settings(admin=Depends(require_super_admin)):
    settings = await db.seo_settings.find_one({}, {"_id": 0})
    if not settings:
        return SEOSettingsBase().model_dump()
    return settings


@router.put("/settings")
async def admin_update_seo_settings(settings: SEOSettingsUpdate, admin=Depends(require_super_admin)):
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}

    existing = await db.seo_settings.find_one({})
    if existing:
        await db.seo_settings.update_one({}, {"$set": update_data})
    else:
        default = SEOSettingsBase().model_dump()
        default.update(update_data)
        default["id"] = str(uuid.uuid4())
        await db.seo_settings.insert_one(default)

    updated = await db.seo_settings.find_one({}, {"_id": 0})
    return updated
