from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends

from app.db.database import db
from app.core.security import require_super_admin
from app.models.domain import DashboardStats

router = APIRouter(prefix="/admin")


@router.get("/dashboard", response_model=DashboardStats)
async def admin_get_dashboard(admin=Depends(require_super_admin)):
    total_domains = await db.domains.count_documents({})
    available_domains = await db.domains.count_documents({"status": "available"})
    sold_domains = await db.domains.count_documents({"status": "sold"})

    sold_domain_docs = await db.domains.find({"status": "sold"}, {"price": 1, "_id": 0}).to_list(1000)
    total_revenue = sum(d.get("price", 0) for d in sold_domain_docs)

    total_contacts = await db.contacts.count_documents({})
    pending_contacts = await db.contacts.count_documents({"status": "pending"})

    total_blog_posts = await db.blog_posts.count_documents({})
    published_posts = await db.blog_posts.count_documents({"status": "published"})

    return {
        "total_domains": total_domains,
        "available_domains": available_domains,
        "sold_domains": sold_domains,
        "total_revenue": total_revenue,
        "total_contacts": total_contacts,
        "pending_contacts": pending_contacts,
        "total_blog_posts": total_blog_posts,
        "published_posts": published_posts
    }


@router.get("/analytics")
async def get_analytics(admin=Depends(require_super_admin)):
    now = datetime.now(timezone.utc)

    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    seven_days_ago = (now - timedelta(days=7)).isoformat()

    contacts_pipeline = [
        {"$match": {"created_at": {"$gte": thirty_days_ago}}},
        {"$addFields": {"date": {"$substr": ["$created_at", 0, 10]}}},
        {"$group": {"_id": "$date", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    contacts_by_date = await db.contacts.aggregate(contacts_pipeline).to_list(100)

    domains_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    domains_by_status = await db.domains.aggregate(domains_pipeline).to_list(10)

    revenue_pipeline = [
        {"$match": {"status": "sold"}},
        {"$group": {"_id": None, "total": {"$sum": "$price"}}}
    ]
    revenue_result = await db.domains.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0

    top_domains = await db.domains.find(
        {"status": "available"},
        {"_id": 0, "domain_name": 1, "price": 1, "dr": 1}
    ).sort("price", -1).limit(5).to_list(5)

    recent_contacts = await db.contacts.count_documents({"created_at": {"$gte": seven_days_ago}})

    posts_pipeline = [
        {"$addFields": {"month": {"$substr": ["$created_at", 0, 7]}}},
        {"$group": {"_id": "$month", "count": {"$sum": 1}}},
        {"$sort": {"_id": -1}},
        {"$limit": 6}
    ]
    posts_by_month = await db.blog_posts.aggregate(posts_pipeline).to_list(6)

    return {
        "contacts_by_date": [{"date": c["_id"], "count": c["count"]} for c in contacts_by_date],
        "domains_by_status": [{"status": d["_id"], "count": d["count"]} for d in domains_by_status],
        "total_revenue": total_revenue,
        "top_domains": top_domains,
        "recent_contacts_7d": recent_contacts,
        "posts_by_month": [{"month": p["_id"], "count": p["count"]} for p in posts_by_month]
    }
