import os
from typing import List

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, PlainTextResponse

from app.db.database import db
from app.models.seo import SEOPageResponse, SEOSettingsBase

router = APIRouter()


@router.get("/pages/{slug}", response_model=SEOPageResponse)
async def get_seo_page_by_slug(slug: str):
    page = await db.seo_pages.find_one({"slug": slug, "status": "published"}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.get("/pages", response_model=List[SEOPageResponse])
async def get_public_seo_pages():
    pages = await db.seo_pages.find({"status": "published"}, {"_id": 0}).to_list(100)
    return pages


@router.get("/seo/settings")
async def get_public_seo_settings():
    settings = await db.seo_settings.find_one({}, {"_id": 0})
    if not settings:
        return SEOSettingsBase().model_dump()
    return settings


@router.get("/sitemap.xml")
async def get_sitemap():
    base_url = os.environ.get("SITE_URL", "")

    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    static_pages = [
        {"loc": "/", "priority": "1.0", "changefreq": "daily"},
        {"loc": "/domains", "priority": "0.9", "changefreq": "daily"},
        {"loc": "/blog", "priority": "0.8", "changefreq": "daily"},
    ]

    for page in static_pages:
        xml += '  <url>\n'
        xml += f'    <loc>{base_url}{page["loc"]}</loc>\n'
        xml += f'    <changefreq>{page["changefreq"]}</changefreq>\n'
        xml += f'    <priority>{page["priority"]}</priority>\n'
        xml += '  </url>\n'

    domains = await db.domains.find({"status": "available"}, {"slug": 1, "_id": 0}).limit(1000).to_list(1000)
    for domain in domains:
        xml += '  <url>\n'
        xml += f'    <loc>{base_url}/domain/{domain["slug"]}</loc>\n'
        xml += '    <changefreq>weekly</changefreq>\n'
        xml += '    <priority>0.7</priority>\n'
        xml += '  </url>\n'

    posts = await db.blog_posts.find({"status": "published"}, {"slug": 1, "_id": 0}).limit(1000).to_list(1000)
    for post in posts:
        xml += '  <url>\n'
        xml += f'    <loc>{base_url}/blog/{post["slug"]}</loc>\n'
        xml += '    <changefreq>weekly</changefreq>\n'
        xml += '    <priority>0.6</priority>\n'
        xml += '  </url>\n'

    seo_pages = await db.seo_pages.find({"status": "published"}, {"slug": 1, "_id": 0}).to_list(100)
    for page in seo_pages:
        xml += '  <url>\n'
        xml += f'    <loc>{base_url}/{page["slug"]}</loc>\n'
        xml += '    <changefreq>weekly</changefreq>\n'
        xml += '    <priority>0.8</priority>\n'
        xml += '  </url>\n'

    xml += '</urlset>'

    return Response(content=xml, media_type="application/xml")


@router.get("/robots.txt")
async def get_robots_txt():
    settings = await db.seo_settings.find_one({}, {"_id": 0})
    if settings and settings.get("robots_txt"):
        return PlainTextResponse(content=settings["robots_txt"])

    return PlainTextResponse(content="User-agent: *\nAllow: /\nSitemap: /sitemap.xml")
