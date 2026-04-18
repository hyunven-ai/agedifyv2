from typing import List, Optional

from fastapi import APIRouter, HTTPException

from app.db.database import db
from app.models.blog import BlogPostResponse, CategoryResponse, TagResponse

router = APIRouter(prefix="/blog")


@router.get("/posts", response_model=List[BlogPostResponse])
async def get_public_blog_posts(
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 10
):
    query = {"status": "published"}

    if category:
        query["category_id"] = category
    if tag:
        query["tags"] = {"$in": [tag]}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}}
        ]

    pipeline = [
        {"$match": query},
        {"$sort": {"published_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {"$lookup": {
            "from": "categories",
            "localField": "category_id",
            "foreignField": "id",
            "as": "category_arr"
        }},
        {"$addFields": {
            "category": {"$arrayElemAt": ["$category_arr", 0]}
        }},
        {"$project": {"_id": 0, "category_arr": 0, "category._id": 0}}
    ]

    posts = await db.blog_posts.aggregate(pipeline).to_list(limit)
    return posts


@router.get("/posts/count")
async def get_blog_posts_count(
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None
):
    query = {"status": "published"}

    if category:
        query["category_id"] = category
    if tag:
        query["tags"] = {"$in": [tag]}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}}
        ]

    count = await db.blog_posts.count_documents(query)
    return {"count": count}


@router.get("/posts/{slug}", response_model=BlogPostResponse)
async def get_blog_post_by_slug(slug: str):
    pipeline = [
        {"$match": {"slug": slug, "status": "published"}},
        {"$lookup": {
            "from": "categories",
            "localField": "category_id",
            "foreignField": "id",
            "as": "category_arr"
        }},
        {"$addFields": {
            "category": {"$arrayElemAt": ["$category_arr", 0]}
        }},
        {"$project": {"_id": 0, "category_arr": 0, "category._id": 0}}
    ]

    posts = await db.blog_posts.aggregate(pipeline).to_list(1)
    if not posts:
        raise HTTPException(status_code=404, detail="Blog post not found")

    return posts[0]


@router.get("/categories", response_model=List[CategoryResponse])
async def get_public_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)

    count_pipeline = [
        {"$match": {"status": "published"}},
        {"$group": {"_id": "$category_id", "count": {"$sum": 1}}}
    ]
    counts = await db.blog_posts.aggregate(count_pipeline).to_list(100)
    count_map = {c["_id"]: c["count"] for c in counts}

    for cat in categories:
        cat["post_count"] = count_map.get(cat["id"], 0)

    return categories


@router.get("/tags", response_model=List[TagResponse])
async def get_public_tags():
    tags = await db.tags.find({}, {"_id": 0}).to_list(100)

    count_pipeline = [
        {"$match": {"status": "published"}},
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}}
    ]
    counts = await db.blog_posts.aggregate(count_pipeline).to_list(100)
    count_map = {c["_id"]: c["count"] for c in counts}

    for tag in tags:
        tag["post_count"] = count_map.get(tag["name"], 0)

    return tags
