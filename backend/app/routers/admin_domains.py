from datetime import datetime, timezone
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.db.database import db
from app.core.security import require_super_admin, create_slug
from app.models.domain import DomainCreate, DomainUpdate, DomainResponse

router = APIRouter(prefix="/admin")


class BulkDeleteRequest(BaseModel):
    ids: List[str]


class BulkStatusRequest(BaseModel):
    ids: List[str]
    status: str


@router.get("/domains", response_model=List[DomainResponse])
async def admin_get_all_domains(
    admin=Depends(require_super_admin),
    skip: int = 0,
    limit: int = 50
):
    domains = await db.domains.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return domains


@router.post("/domains", response_model=DomainResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_domain(domain: DomainCreate, admin=Depends(require_super_admin)):
    domain_dict = domain.model_dump()
    domain_dict["id"] = str(uuid.uuid4())
    domain_dict["slug"] = create_slug(domain.domain_name)
    domain_dict["created_at"] = datetime.now(timezone.utc).isoformat()

    existing = await db.domains.find_one({"domain_name": domain.domain_name})
    if existing:
        raise HTTPException(status_code=400, detail="Domain already exists")

    await db.domains.insert_one(domain_dict)
    if "_id" in domain_dict:
        del domain_dict["_id"]
    return domain_dict


@router.put("/domains/{domain_id}", response_model=DomainResponse)
async def admin_update_domain(domain_id: str, domain: DomainUpdate, admin=Depends(require_super_admin)):
    update_data = {k: v for k, v in domain.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")

    if "domain_name" in update_data:
        update_data["slug"] = create_slug(update_data["domain_name"])

    result = await db.domains.update_one(
        {"id": domain_id},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Domain not found")

    updated_domain = await db.domains.find_one({"id": domain_id}, {"_id": 0})
    return updated_domain


@router.delete("/domains/{domain_id}")
async def admin_delete_domain(domain_id: str, admin=Depends(require_super_admin)):
    result = await db.domains.delete_one({"id": domain_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Domain not found")

    return {"message": "Domain deleted successfully"}


@router.post("/seed")
async def seed_data(admin=Depends(require_super_admin)):
    sample_domains = [
        {"domain_name": "techstartup.com", "dr": 65, "da": 58, "spam_score": 3, "backlinks": 2500, "traffic": 15000, "age": 8, "price": 4500, "status": "available", "description": "Premium tech domain with strong backlink profile"},
        {"domain_name": "digitalmarketing.io", "dr": 72, "da": 65, "spam_score": 5, "backlinks": 4200, "traffic": 28000, "age": 6, "price": 7500, "status": "available", "description": "High authority marketing domain"},
        {"domain_name": "seotools.net", "dr": 55, "da": 48, "spam_score": 8, "backlinks": 1800, "traffic": 8500, "age": 10, "price": 2800, "status": "available", "description": "Aged SEO niche domain"},
        {"domain_name": "cryptofinance.org", "dr": 68, "da": 61, "spam_score": 2, "backlinks": 3100, "traffic": 22000, "age": 5, "price": 6200, "status": "available", "description": "Finance niche with crypto focus"},
        {"domain_name": "healthwellness.co", "dr": 45, "da": 42, "spam_score": 12, "backlinks": 1200, "traffic": 6000, "age": 7, "price": 1900, "status": "sold", "description": "Health niche aged domain"},
        {"domain_name": "ecommerceplus.com", "dr": 78, "da": 71, "spam_score": 1, "backlinks": 5500, "traffic": 45000, "age": 12, "price": 12000, "status": "available", "description": "Premium ecommerce domain with excellent metrics"},
        {"domain_name": "aitech.solutions", "dr": 52, "da": 47, "spam_score": 6, "backlinks": 980, "traffic": 4500, "age": 3, "price": 3500, "status": "available", "description": "Modern AI technology domain"},
        {"domain_name": "businessgrowth.net", "dr": 61, "da": 55, "spam_score": 4, "backlinks": 2100, "traffic": 12000, "age": 9, "price": 4200, "status": "sold", "description": "Business coaching niche"},
    ]

    inserted_count = 0
    for domain_data in sample_domains:
        existing = await db.domains.find_one({"domain_name": domain_data["domain_name"]})
        if not existing:
            domain_data["id"] = str(uuid.uuid4())
            domain_data["slug"] = create_slug(domain_data["domain_name"])
            domain_data["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.domains.insert_one(domain_data)
            inserted_count += 1

    return {"message": f"Seeded {inserted_count} domains"}


@router.post("/domains/bulk-delete")
async def bulk_delete_domains(req: BulkDeleteRequest, admin=Depends(require_super_admin)):
    if not req.ids:
        raise HTTPException(status_code=400, detail="No domain IDs provided")
    result = await db.domains.delete_many({"id": {"$in": req.ids}})
    return {"message": f"Deleted {result.deleted_count} domains", "deleted": result.deleted_count}


@router.post("/domains/bulk-status")
async def bulk_update_status(req: BulkStatusRequest, admin=Depends(require_super_admin)):
    if not req.ids:
        raise HTTPException(status_code=400, detail="No domain IDs provided")
    if req.status not in ("available", "sold"):
        raise HTTPException(status_code=400, detail="Status must be 'available' or 'sold'")
    result = await db.domains.update_many({"id": {"$in": req.ids}}, {"$set": {"status": req.status}})
    return {"message": f"Updated {result.modified_count} domains to '{req.status}'", "updated": result.modified_count}
