import csv
import io
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import StreamingResponse

from app.db.database import db
from app.core.security import require_super_admin, create_slug

router = APIRouter(prefix="/admin")

CSV_COLUMNS = [
    "domain_name", "dr", "da", "pa", "spam_score", "backlinks",
    "traffic", "age", "price", "discount_percentage", "indexed",
    "language", "tld", "registrar", "status", "description"
]


@router.get("/domains/export/csv")
async def export_domains_csv(admin=Depends(require_super_admin)):
    domains = await db.domains.find({}, {"_id": 0}).limit(10000).to_list(10000)

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=CSV_COLUMNS, extrasaction="ignore")
    writer.writeheader()
    for d in domains:
        writer.writerow(d)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=agedify_domains_{datetime.now().strftime('%Y%m%d')}.csv"},
    )


@router.get("/domains/template/csv")
async def get_csv_template(admin=Depends(require_super_admin)):
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=CSV_COLUMNS)
    writer.writeheader()
    writer.writerow({
        "domain_name": "example.com", "dr": "50", "da": "45", "pa": "40",
        "spam_score": "3", "backlinks": "1000", "traffic": "5000", "age": "5",
        "price": "2500", "discount_percentage": "0", "indexed": "500",
        "language": "English", "tld": ".com", "registrar": "Namecheap",
        "status": "available", "description": "Example domain description",
    })
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=agedify_import_template.csv"},
    )


@router.post("/domains/import/csv")
async def import_domains_csv(file: UploadFile = File(...), admin=Depends(require_super_admin)):
    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    imported = 0
    skipped = 0
    errors = []

    for i, row in enumerate(reader, start=2):
        domain_name = row.get("domain_name", "").strip()
        if not domain_name:
            errors.append(f"Row {i}: Missing domain_name")
            continue

        existing = await db.domains.find_one({"domain_name": domain_name})
        if existing:
            skipped += 1
            continue

        try:
            doc = {
                "id": str(uuid.uuid4()),
                "domain_name": domain_name,
                "slug": create_slug(domain_name),
                "dr": int(row.get("dr", 0) or 0),
                "da": int(row.get("da", 0) or 0),
                "pa": int(row.get("pa", 0) or 0),
                "spam_score": int(row.get("spam_score", 0) or 0),
                "backlinks": int(row.get("backlinks", 0) or 0),
                "traffic": int(row.get("traffic", 0) or 0),
                "age": int(row.get("age", 0) or 0),
                "price": float(row.get("price", 0) or 0),
                "discount_percentage": float(row.get("discount_percentage", 0) or 0),
                "indexed": int(row.get("indexed", 0) or 0),
                "language": row.get("language", "").strip(),
                "tld": row.get("tld", "").strip(),
                "registrar": row.get("registrar", "").strip(),
                "status": row.get("status", "available").strip() or "available",
                "description": row.get("description", "").strip(),
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.domains.insert_one(doc)
            imported += 1
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    return {
        "message": f"Import complete: {imported} imported, {skipped} skipped (duplicates)",
        "imported": imported,
        "skipped": skipped,
        "errors": errors[:20],
    }
