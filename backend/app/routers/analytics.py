from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends

from app.db.database import db
from app.core.security import require_super_admin

router = APIRouter()


@router.post("/track/view/{slug}")
async def track_domain_view(slug: str):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.domain_analytics.update_one(
        {"slug": slug, "date": today},
        {"$inc": {"views": 1}, "$setOnInsert": {"clicks": 0}},
        upsert=True,
    )
    return {"status": "ok"}


@router.post("/track/click/{slug}")
async def track_domain_click(slug: str):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.domain_analytics.update_one(
        {"slug": slug, "date": today},
        {"$inc": {"clicks": 1}, "$setOnInsert": {"views": 0}},
        upsert=True,
    )
    return {"status": "ok"}


@router.get("/admin/domain-analytics")
async def get_domain_analytics(
    period: Optional[str] = "30",
    admin=Depends(require_super_admin),
):
    days = int(period) if period and period.isdigit() else 30
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")

    pipeline_by_date = [
        {"$match": {"date": {"$gte": start_date}}},
        {"$group": {
            "_id": "$date",
            "views": {"$sum": "$views"},
            "clicks": {"$sum": "$clicks"},
        }},
        {"$sort": {"_id": 1}},
        {"$project": {"_id": 0, "date": "$_id", "views": 1, "clicks": 1}},
    ]
    by_date = await db.domain_analytics.aggregate(pipeline_by_date).to_list(1000)

    pipeline_top = [
        {"$match": {"date": {"$gte": start_date}}},
        {"$group": {
            "_id": "$slug",
            "total_views": {"$sum": "$views"},
            "total_clicks": {"$sum": "$clicks"},
        }},
        {"$sort": {"total_views": -1}},
        {"$limit": 10},
        {"$project": {"_id": 0, "slug": "$_id", "total_views": 1, "total_clicks": 1}},
    ]
    top_domains = await db.domain_analytics.aggregate(pipeline_top).to_list(10)

    # Enrich with domain names (batch query)
    slugs = [td["slug"] for td in top_domains]
    domains_map = {}
    if slugs:
        domain_docs = await db.domains.find({"slug": {"$in": slugs}}, {"_id": 0, "slug": 1, "domain_name": 1}).to_list(len(slugs))
        domains_map = {d["slug"]: d["domain_name"] for d in domain_docs}
    for td in top_domains:
        td["domain_name"] = domains_map.get(td["slug"], td["slug"])

    totals_pipeline = [
        {"$match": {"date": {"$gte": start_date}}},
        {"$group": {
            "_id": None,
            "total_views": {"$sum": "$views"},
            "total_clicks": {"$sum": "$clicks"},
        }},
    ]
    totals_list = await db.domain_analytics.aggregate(totals_pipeline).to_list(1)
    totals = totals_list[0] if totals_list else {"total_views": 0, "total_clicks": 0}

    return {
        "by_date": by_date,
        "top_domains": top_domains,
        "total_views": totals.get("total_views", 0),
        "total_clicks": totals.get("total_clicks", 0),
        "period_days": days,
    }
