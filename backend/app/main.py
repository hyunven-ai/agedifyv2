import os
import logging
from datetime import datetime, timezone
import uuid

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

from app.core.config import UPLOAD_DIR
from app.core.security import hash_password
from app.db.database import db, client
from app.routers import (
    public, blog, seo, upload,
    admin_auth, admin_domains, admin_contacts,
    admin_dashboard, admin_blog, admin_seo,
    admin_csv, analytics,
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Agedify API", version="1.0.0")


@app.get("/health")
async def root_health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


# Include all routers under /api prefix
app.include_router(public.router, prefix="/api")
app.include_router(blog.router, prefix="/api")
app.include_router(seo.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(admin_auth.router, prefix="/api")
app.include_router(admin_domains.router, prefix="/api")
app.include_router(admin_contacts.router, prefix="/api")
app.include_router(admin_dashboard.router, prefix="/api")
app.include_router(admin_blog.router, prefix="/api")
app.include_router(admin_seo.router, prefix="/api")
app.include_router(admin_csv.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

# Mount static files for uploads
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    try:
        admin = await db.admins.find_one({"username": "admin"})
        if not admin:
            admin_doc = {
                "id": str(uuid.uuid4()),
                "username": "admin",
                "password": hash_password("admin123"),
                "role": "super_admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.admins.insert_one(admin_doc)
            logger.info("Default admin created: admin / admin123")

        # Migrate existing admins without role to super_admin
        await db.admins.update_many(
            {"role": {"$exists": False}},
            {"$set": {"role": "super_admin"}}
        )
    except Exception as e:
        logger.warning(f"Startup DB operations failed (non-fatal): {e}")

    # Start currency auto-refresh service
    try:
        from app.services.currency import start_currency_service
        await start_currency_service()
    except Exception as e:
        logger.warning(f"Currency service startup failed (non-fatal): {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
