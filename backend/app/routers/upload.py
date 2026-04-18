import os
import uuid
from datetime import datetime, timezone

import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.core.config import UPLOAD_DIR, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE
from app.core.security import get_current_admin
from app.services.cloudinary_service import (
    USE_CLOUDINARY,
    upload_to_cloudinary,
    delete_from_cloudinary,
    list_cloudinary_images,
)

router = APIRouter()


# =====================================================
# GET /api/admin/gallery
# List semua gambar (dari Cloudinary atau local)
# =====================================================

@router.get("/admin/gallery")
async def list_gallery_images(admin: dict = Depends(get_current_admin)):
    if USE_CLOUDINARY:
        try:
            images = await list_cloudinary_images()
            return {"images": images, "total": len(images), "storage": "cloudinary"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cloudinary error: {str(e)}")

    # Fallback: local filesystem
    images = []
    if UPLOAD_DIR.exists():
        for f in sorted(UPLOAD_DIR.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True):
            if f.is_file() and f.suffix.lower() in ('.jpg', '.jpeg', '.png', '.gif', '.webp'):
                stat = f.stat()
                images.append({
                    "filename": f.name,
                    "url": f"/api/uploads/{f.name}",
                    "public_id": None,
                    "size": stat.st_size,
                    "uploaded_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
                    "content_type": f"image/{f.suffix.lstrip('.').replace('jpg', 'jpeg')}",
                    "storage": "local",
                })
    return {"images": images, "total": len(images), "storage": "local"}


# =====================================================
# POST /api/upload/image
# Upload gambar ke Cloudinary atau local
# =====================================================

@router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    admin: dict = Depends(get_current_admin)
):
    # Validasi tipe file
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )

    # Baca konten file
    contents = await file.read()

    # Validasi ukuran file
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024 * 1024)}MB"
        )

    # Upload ke Cloudinary jika dikonfigurasi
    if USE_CLOUDINARY:
        try:
            result = await upload_to_cloudinary(
                file_bytes=contents,
                filename=file.filename or "upload.jpg",
                content_type=file.content_type,
            )
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {str(e)}")

    # Fallback: simpan ke local filesystem
    file_ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = UPLOAD_DIR / unique_filename

    async with aiofiles.open(file_path, 'wb') as out_file:
        await out_file.write(contents)

    return {
        "url": f"/api/uploads/{unique_filename}",
        "public_id": None,
        "filename": unique_filename,
        "size": len(contents),
        "content_type": file.content_type,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "storage": "local",
    }


# =====================================================
# DELETE /api/upload/image/{identifier}
# Hapus gambar dari Cloudinary atau local
# =====================================================

@router.delete("/upload/image/{filename}")
async def delete_image(
    filename: str,
    admin: dict = Depends(get_current_admin)
):
    if USE_CLOUDINARY:
        # Untuk Cloudinary, `filename` bisa berisi public_id yang di-encode
        # Coba decode slash yang di-encode sebagai "__"
        public_id = filename.replace("__", "/")
        try:
            success = await delete_from_cloudinary(public_id)
            if not success:
                raise HTTPException(status_code=404, detail="Image not found on Cloudinary")
            return {"message": "Image deleted successfully", "storage": "cloudinary"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cloudinary delete failed: {str(e)}")

    # Fallback: hapus dari local filesystem
    if ".." in filename or "/" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    file_path.unlink()
    return {"message": "File deleted successfully", "storage": "local"}
