from datetime import datetime, timezone
from typing import List, Optional
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.db.database import db
from app.core.security import get_current_admin, create_blog_slug
from app.models.blog import (
    BlogPostCreate, BlogPostUpdate, BlogPostResponse,
    CategoryCreate, CategoryResponse,
    TagCreate, TagResponse,
)

router = APIRouter(prefix="/admin/blog")


# ==================== BLOG POSTS ====================

@router.get("/posts", response_model=List[BlogPostResponse])
async def admin_get_blog_posts(
    admin=Depends(get_current_admin),
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    query = {}
    if status:
        query["status"] = status

    pipeline = [
        {"$match": query},
        {"$sort": {"created_at": -1}},
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


@router.get("/posts/{post_id}", response_model=BlogPostResponse)
async def admin_get_blog_post(post_id: str, admin=Depends(get_current_admin)):
    pipeline = [
        {"$match": {"id": post_id}},
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


@router.post("/posts", response_model=BlogPostResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_blog_post(post: BlogPostCreate, admin=Depends(get_current_admin)):
    post_dict = post.model_dump()
    post_dict["id"] = str(uuid.uuid4())
    post_dict["slug"] = post.slug or create_blog_slug(post.title)
    post_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    post_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    if post.status == "published":
        post_dict["published_at"] = datetime.now(timezone.utc).isoformat()

    existing = await db.blog_posts.find_one({"slug": post_dict["slug"]})
    if existing:
        post_dict["slug"] = f"{post_dict['slug']}-{str(uuid.uuid4())[:8]}"

    await db.blog_posts.insert_one(post_dict)
    if "_id" in post_dict:
        del post_dict["_id"]

    return post_dict


@router.put("/posts/{post_id}", response_model=BlogPostResponse)
async def admin_update_blog_post(post_id: str, post: BlogPostUpdate, admin=Depends(get_current_admin)):
    update_data = {k: v for k, v in post.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    if update_data.get("status") == "published":
        existing = await db.blog_posts.find_one({"id": post_id}, {"_id": 0})
        if existing and not existing.get("published_at"):
            update_data["published_at"] = datetime.now(timezone.utc).isoformat()

    if "title" in update_data and "slug" not in update_data:
        update_data["slug"] = create_blog_slug(update_data["title"])

    result = await db.blog_posts.update_one(
        {"id": post_id},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")

    updated_post = await db.blog_posts.find_one({"id": post_id}, {"_id": 0})
    return updated_post


@router.delete("/posts/{post_id}")
async def admin_delete_blog_post(post_id: str, admin=Depends(get_current_admin)):
    result = await db.blog_posts.delete_one({"id": post_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")

    return {"message": "Blog post deleted successfully"}


# ==================== CATEGORIES ====================

@router.get("/categories", response_model=List[CategoryResponse])
async def admin_get_categories(admin=Depends(get_current_admin)):
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)

    count_pipeline = [
        {"$group": {"_id": "$category_id", "count": {"$sum": 1}}}
    ]
    counts = await db.blog_posts.aggregate(count_pipeline).to_list(100)
    count_map = {c["_id"]: c["count"] for c in counts}

    for cat in categories:
        cat["post_count"] = count_map.get(cat["id"], 0)

    return categories


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_category(category: CategoryCreate, admin=Depends(get_current_admin)):
    cat_dict = category.model_dump()
    cat_dict["id"] = str(uuid.uuid4())
    cat_dict["slug"] = category.slug or create_blog_slug(category.name)
    cat_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    cat_dict["post_count"] = 0

    await db.categories.insert_one(cat_dict)
    if "_id" in cat_dict:
        del cat_dict["_id"]

    return cat_dict


@router.delete("/categories/{category_id}")
async def admin_delete_category(category_id: str, admin=Depends(get_current_admin)):
    result = await db.categories.delete_one({"id": category_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")

    await db.blog_posts.update_many({"category_id": category_id}, {"$set": {"category_id": None}})

    return {"message": "Category deleted successfully"}


# ==================== TAGS ====================

@router.get("/tags", response_model=List[TagResponse])
async def admin_get_tags(admin=Depends(get_current_admin)):
    tags = await db.tags.find({}, {"_id": 0}).to_list(100)

    count_pipeline = [
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}}
    ]
    counts = await db.blog_posts.aggregate(count_pipeline).to_list(100)
    count_map = {c["_id"]: c["count"] for c in counts}

    for tag in tags:
        tag["post_count"] = count_map.get(tag["name"], 0)

    return tags


@router.post("/tags", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_tag(tag: TagCreate, admin=Depends(get_current_admin)):
    tag_dict = tag.model_dump()
    tag_dict["id"] = str(uuid.uuid4())
    tag_dict["slug"] = tag.slug or create_blog_slug(tag.name)
    tag_dict["post_count"] = 0

    await db.tags.insert_one(tag_dict)
    if "_id" in tag_dict:
        del tag_dict["_id"]

    return tag_dict


@router.delete("/tags/{tag_id}")
async def admin_delete_tag(tag_id: str, admin=Depends(get_current_admin)):
    tag = await db.tags.find_one({"id": tag_id}, {"_id": 0})
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    await db.tags.delete_one({"id": tag_id})

    await db.blog_posts.update_many({"tags": tag["name"]}, {"$pull": {"tags": tag["name"]}})

    return {"message": "Tag deleted successfully"}


# ==================== INTERNAL LINK SUGGESTIONS ====================

class LinkSuggestionRequest(BaseModel):
    content: str = ""
    title: str = ""
    current_post_id: Optional[str] = None


@router.post("/link-suggestions")
async def get_internal_link_suggestions(
    req: LinkSuggestionRequest,
    admin=Depends(get_current_admin)
):
    text = f"{req.title} {req.content}".lower()
    text = re.sub(r'<[^>]+>', ' ', text)
    words = set(re.findall(r'\b[a-z]{3,}\b', text))
    stop_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'has', 'her',
                  'was', 'one', 'our', 'out', 'with', 'this', 'that', 'from', 'they', 'been',
                  'have', 'many', 'some', 'them', 'than', 'its', 'over', 'such', 'will', 'also',
                  'into', 'your', 'just', 'more', 'other', 'about', 'which', 'their', 'would',
                  'make', 'like', 'time', 'very', 'when', 'what', 'there', 'could'}
    keywords = words - stop_words

    suggestions = []

    # Search blog posts
    posts = await db.blog_posts.find(
        {"status": "published", "id": {"$ne": req.current_post_id or ""}},
        {"_id": 0, "id": 1, "title": 1, "slug": 1, "excerpt": 1, "tags": 1}
    ).limit(100).to_list(100)

    for post in posts:
        post_words = set(re.findall(r'\b[a-z]{3,}\b', post["title"].lower()))
        post_tags = set(t.lower() for t in post.get("tags", []))
        matches = keywords & (post_words | post_tags)
        if matches:
            suggestions.append({
                "type": "blog",
                "title": post["title"],
                "url": f"/blog/{post['slug']}",
                "excerpt": post.get("excerpt", "")[:100],
                "relevance": len(matches),
                "matched_keywords": list(matches)[:5]
            })

    # Search domains
    domains = await db.domains.find(
        {"status": "available"},
        {"_id": 0, "domain_name": 1, "slug": 1, "dr": 1, "da": 1, "description": 1}
    ).limit(100).to_list(100)

    for domain in domains:
        domain_words = set(re.findall(r'\b[a-z]{3,}\b', domain["domain_name"].lower()))
        desc_words = set(re.findall(r'\b[a-z]{3,}\b', (domain.get("description") or "").lower()))
        matches = keywords & (domain_words | desc_words)
        if matches:
            suggestions.append({
                "type": "domain",
                "title": domain["domain_name"],
                "url": f"/domain/{domain['slug']}",
                "excerpt": f"DR {domain.get('dr', 0)} | DA {domain.get('da', 0)}",
                "relevance": len(matches),
                "matched_keywords": list(matches)[:5]
            })

    # Search categories
    categories = await db.categories.find({}, {"_id": 0, "name": 1, "slug": 1}).to_list(50)
    for cat in categories:
        cat_words = set(re.findall(r'\b[a-z]{3,}\b', cat["name"].lower()))
        matches = keywords & cat_words
        if matches:
            suggestions.append({
                "type": "category",
                "title": cat["name"],
                "url": f"/blog?category={cat.get('slug', '')}",
                "excerpt": f"Blog category",
                "relevance": len(matches),
                "matched_keywords": list(matches)[:5]
            })

    suggestions.sort(key=lambda x: x["relevance"], reverse=True)
    return {"suggestions": suggestions[:15]}
