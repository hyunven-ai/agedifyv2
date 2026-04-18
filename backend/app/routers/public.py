from datetime import datetime, timezone
from typing import List, Optional
import uuid

from fastapi import APIRouter, HTTPException, status

from app.db.database import db
from app.core.security import create_slug
from app.models.domain import DomainResponse
from app.models.contact import ContactCreate, ContactResponse

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Agedify API v1.0"}


@router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


def _build_domain_query(
    search=None, min_price=None, max_price=None,
    min_dr=None, max_dr=None, min_da=None, max_da=None,
    min_pa=None, max_pa=None, min_age=None, max_age=None,
    min_traffic=None, max_traffic=None,
    min_backlinks=None, max_backlinks=None,
    tld=None, language=None, status=None,
):
    query = {}
    if search:
        query["domain_name"] = {"$regex": search, "$options": "i"}
    for field, lo, hi in [
        ("price", min_price, max_price),
        ("dr", min_dr, max_dr),
        ("da", min_da, max_da),
        ("pa", min_pa, max_pa),
        ("age", min_age, max_age),
        ("traffic", min_traffic, max_traffic),
        ("backlinks", min_backlinks, max_backlinks),
    ]:
        if lo is not None:
            query[field] = {"$gte": lo}
        if hi is not None:
            query[field] = {**query.get(field, {}), "$lte": hi}
    if tld:
        query["tld"] = {"$regex": f"^{tld}$", "$options": "i"}
    if language:
        query["language"] = {"$regex": f"^{language}$", "$options": "i"}
    if status:
        query["status"] = status
    return query


@router.get("/domains", response_model=List[DomainResponse])
async def get_public_domains(
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_dr: Optional[int] = None,
    max_dr: Optional[int] = None,
    min_da: Optional[int] = None,
    max_da: Optional[int] = None,
    min_pa: Optional[int] = None,
    max_pa: Optional[int] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    min_traffic: Optional[int] = None,
    max_traffic: Optional[int] = None,
    min_backlinks: Optional[int] = None,
    max_backlinks: Optional[int] = None,
    tld: Optional[str] = None,
    language: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "asc",
    skip: int = 0,
    limit: int = 20
):
    query = _build_domain_query(
        search=search, min_price=min_price, max_price=max_price,
        min_dr=min_dr, max_dr=max_dr, min_da=min_da, max_da=max_da,
        min_pa=min_pa, max_pa=max_pa, min_age=min_age, max_age=max_age,
        min_traffic=min_traffic, max_traffic=max_traffic,
        min_backlinks=min_backlinks, max_backlinks=max_backlinks,
        tld=tld, language=language, status=status,
    )

    sort_direction = 1 if sort_order == "asc" else -1
    sort_field = "domain_name"

    if sort_by in ["domain_name", "dr", "da", "pa", "price", "age", "backlinks", "traffic", "spam_score"]:
        sort_field = sort_by

    cursor = db.domains.find(query, {"_id": 0})
    if sort_by:
        cursor = cursor.sort(sort_field, sort_direction)

    domains = await cursor.skip(skip).limit(limit).to_list(limit)
    return domains


@router.get("/domains/count")
async def get_domains_count(
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_dr: Optional[int] = None,
    max_dr: Optional[int] = None,
    min_da: Optional[int] = None,
    max_da: Optional[int] = None,
    min_pa: Optional[int] = None,
    max_pa: Optional[int] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    min_traffic: Optional[int] = None,
    max_traffic: Optional[int] = None,
    min_backlinks: Optional[int] = None,
    max_backlinks: Optional[int] = None,
    tld: Optional[str] = None,
    language: Optional[str] = None,
    status: Optional[str] = None
):
    query = _build_domain_query(
        search=search, min_price=min_price, max_price=max_price,
        min_dr=min_dr, max_dr=max_dr, min_da=min_da, max_da=max_da,
        min_pa=min_pa, max_pa=max_pa, min_age=min_age, max_age=max_age,
        min_traffic=min_traffic, max_traffic=max_traffic,
        min_backlinks=min_backlinks, max_backlinks=max_backlinks,
        tld=tld, language=language, status=status,
    )
    count = await db.domains.count_documents(query)
    return {"count": count}


@router.get("/domains/featured", response_model=List[DomainResponse])
async def get_featured_domains():
    domains = await db.domains.find(
        {"status": "available"},
        {"_id": 0}
    ).sort("dr", -1).limit(6).to_list(6)
    return domains


@router.get("/domains/{slug}", response_model=DomainResponse)
async def get_domain_by_slug(slug: str):
    domain = await db.domains.find_one({"slug": slug}, {"_id": 0})
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    return domain


@router.post("/contact", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(contact: ContactCreate):
    contact_dict = contact.model_dump()
    contact_dict["id"] = str(uuid.uuid4())
    contact_dict["status"] = "pending"
    contact_dict["created_at"] = datetime.now(timezone.utc).isoformat()

    await db.contacts.insert_one(contact_dict)
    if "_id" in contact_dict:
        del contact_dict["_id"]
    return contact_dict


@router.get("/currencies")
async def get_currencies():
    from app.services.currency import get_currencies_response
    return await get_currencies_response()
