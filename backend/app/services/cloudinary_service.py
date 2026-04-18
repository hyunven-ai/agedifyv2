import os
import io
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

# Cek apakah Cloudinary dikonfigurasi
CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")

USE_CLOUDINARY = bool(CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET)

if USE_CLOUDINARY:
    try:
        import cloudinary
        import cloudinary.uploader
        import cloudinary.api

        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME,
            api_key=CLOUDINARY_API_KEY,
            api_secret=CLOUDINARY_API_SECRET,
            secure=True,
        )
        logger.info("✅ Cloudinary configured successfully")
    except ImportError:
        logger.warning("⚠️ cloudinary package not installed. Falling back to local storage.")
        USE_CLOUDINARY = False
else:
    logger.info("ℹ️ Cloudinary env vars not set. Using local file storage.")


async def upload_to_cloudinary(file_bytes: bytes, filename: str, content_type: str) -> dict:
    """
    Upload file ke Cloudinary.
    Returns dict dengan: url, public_id, filename, size, content_type
    """
    import cloudinary.uploader

    # Buat nama folder & public_id yang aman
    name_without_ext = filename.rsplit(".", 1)[0] if "." in filename else filename
    safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in name_without_ext)
    public_id = f"agedify/uploads/{safe_name}"

    result = cloudinary.uploader.upload(
        io.BytesIO(file_bytes),
        public_id=public_id,
        resource_type="image",
        overwrite=False,
        unique_filename=True,
        format=filename.rsplit(".", 1)[-1] if "." in filename else "jpg",
    )

    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "filename": result.get("original_filename", filename),
        "size": result.get("bytes", len(file_bytes)),
        "content_type": content_type,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "width": result.get("width"),
        "height": result.get("height"),
        "storage": "cloudinary",
    }


async def delete_from_cloudinary(public_id: str) -> bool:
    """Hapus gambar dari Cloudinary berdasarkan public_id."""
    import cloudinary.uploader

    result = cloudinary.uploader.destroy(public_id, resource_type="image")
    return result.get("result") == "ok"


async def list_cloudinary_images(folder: str = "agedify/uploads", max_results: int = 100) -> list:
    """List semua gambar di folder Cloudinary."""
    import cloudinary.api

    result = cloudinary.api.resources(
        type="upload",
        prefix=folder,
        max_results=max_results,
        resource_type="image",
    )

    images = []
    for resource in result.get("resources", []):
        images.append({
            "filename": resource["public_id"].split("/")[-1],
            "url": resource["secure_url"],
            "public_id": resource["public_id"],
            "size": resource.get("bytes", 0),
            "uploaded_at": resource.get("created_at", ""),
            "content_type": f"image/{resource.get('format', 'jpeg')}",
            "width": resource.get("width"),
            "height": resource.get("height"),
            "storage": "cloudinary",
        })

    return images
