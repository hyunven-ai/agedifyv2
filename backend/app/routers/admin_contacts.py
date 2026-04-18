import io
import csv
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.db.database import db
from app.core.security import require_super_admin
from app.models.contact import ContactResponse, ContactUpdate

router = APIRouter(prefix="/admin")


@router.get("/contacts/export")
async def export_contacts_csv(admin=Depends(require_super_admin)):
    contacts = await db.contacts.find({}, {"_id": 0}).sort("created_at", -1).limit(10000).to_list(10000)

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["ID", "Name", "Email", "Message", "Status", "Created At"])

    for contact in contacts:
        writer.writerow([
            contact.get("id", ""),
            contact.get("name", ""),
            contact.get("email", ""),
            contact.get("message", "").replace("\n", " "),
            contact.get("status", "new"),
            contact.get("created_at", "")
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=contacts_export.csv"}
    )


@router.get("/contacts", response_model=List[ContactResponse])
async def admin_get_contacts(
    admin=Depends(require_super_admin),
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    query = {}
    if status:
        query["status"] = status

    contacts = await db.contacts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return contacts


@router.put("/contacts/{contact_id}", response_model=ContactResponse)
async def admin_update_contact(contact_id: str, contact: ContactUpdate, admin=Depends(require_super_admin)):
    update_data = {k: v for k, v in contact.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")

    result = await db.contacts.update_one(
        {"id": contact_id},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")

    updated_contact = await db.contacts.find_one({"id": contact_id}, {"_id": 0})
    return updated_contact


@router.delete("/contacts/{contact_id}")
async def admin_delete_contact(contact_id: str, admin=Depends(require_super_admin)):
    result = await db.contacts.delete_one({"id": contact_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")

    return {"message": "Contact deleted successfully"}
