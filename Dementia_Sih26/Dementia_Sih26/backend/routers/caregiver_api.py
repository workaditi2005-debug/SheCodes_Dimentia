"""
caregiver_api.py — Patient-Caregiver Relationship Management API
=================================================================
Enforces patient autonomy over caregiver appointments, invitations, and revocations.
Strictly separates patient-caregiver relationships from doctor-patient relationships.
Screening output is never a clinical diagnosis.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from services import auth_service
from services.audit_service import record

router = APIRouter(prefix="/caregivers", tags=["caregivers"])


class CaregiverAssignRequest(BaseModel):
    caregiver_identity: str = Field(..., min_length=3, max_length=150, description="Caregiver email address or user ID")


class CaregiverRevokeRequest(BaseModel):
    caregiver_id: str = Field(..., min_length=1, max_length=100, description="Caregiver user ID to revoke access for")


class LinkPatientByEmailRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=150, description="Patient email address")


class RespondLinkRequest(BaseModel):
    relationship_id: str = Field(..., min_length=1, max_length=100, description="Relationship ID")
    action: str = Field(..., description="'accept' or 'decline'")


@router.get("/my-caregivers", response_model=Dict[str, Any])
def get_my_caregivers(authorization: str = Header(...)) -> Dict[str, Any]:
    """Retrieve all caregivers associated with the authenticated patient."""
    user = auth_service.require_user(authorization)
    if user.get("role") != "patient":
        raise HTTPException(status_code=403, detail="Only patients can view their assigned caregivers.")

    relationships = auth_service.get_patient_caregiver_relationships(patient_id=user["id"], active_only=False)
    record(
        event="care_team.caregivers_read",
        actor_id=user["id"],
        actor_role=user.get("role"),
        subject_id=user["id"],
        outcome="success",
        metadata={"count": len(relationships)},
    )
    return {
        "patient_id": user["id"],
        "caregivers": relationships,
        "active_count": sum(1 for r in relationships if r.get("status") == "connected" and r.get("access_granted", True)),
    }


@router.post("/assign", response_model=Dict[str, Any])
def assign_caregiver(payload: CaregiverAssignRequest, authorization: str = Header(...)) -> Dict[str, Any]:
    """Patient assigns/invites a caregiver by email or user ID."""
    user = auth_service.require_user(authorization)
    if user.get("role") != "patient":
        raise HTTPException(status_code=403, detail="Only patients can assign caregivers.")

    relationship = auth_service.assign_caregiver_to_patient(user["id"], payload.caregiver_identity)
    return {
        "message": "Caregiver assigned successfully.",
        "relationship": relationship,
    }


@router.post("/revoke", response_model=Dict[str, Any])
def revoke_caregiver(payload: CaregiverRevokeRequest, authorization: str = Header(...)) -> Dict[str, Any]:
    """Patient revokes access for an assigned caregiver."""
    user = auth_service.require_user(authorization)
    if user.get("role") != "patient":
        raise HTTPException(status_code=403, detail="Only patients can revoke caregiver access.")

    result = auth_service.revoke_caregiver_from_patient(user["id"], payload.caregiver_id)
    return result


@router.post("/link-patient-by-email", response_model=Dict[str, Any])
def link_patient_by_email_endpoint(payload: LinkPatientByEmailRequest, authorization: str = Header(...)) -> Dict[str, Any]:
    """Caregiver sends a connection request to a registered patient by email."""
    caregiver = auth_service.require_care_team(authorization)
    if caregiver.get("role") != "caregiver":
        raise HTTPException(status_code=403, detail="Only registered caregivers can send patient connection requests.")

    return auth_service.link_patient_by_email(caregiver["id"], payload.email)


@router.get("/my-sent-requests", response_model=Dict[str, Any])
def get_my_sent_requests_endpoint(authorization: str = Header(...)) -> Dict[str, Any]:
    """Caregiver views pending link requests sent to patients."""
    caregiver = auth_service.require_care_team(authorization)
    if caregiver.get("role") != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can view sent requests.")

    requests = auth_service.get_caregiver_sent_requests(caregiver["id"])
    return {
        "caregiver_id": caregiver["id"],
        "pending_requests": requests,
        "count": len(requests),
    }


@router.post("/respond-link-request", response_model=Dict[str, Any])
def respond_link_request_endpoint(payload: RespondLinkRequest, authorization: str = Header(...)) -> Dict[str, Any]:
    """Patient accepts or declines a caregiver link request."""
    patient = auth_service.require_user(authorization)
    if patient.get("role") != "patient":
        raise HTTPException(status_code=403, detail="Only patients can respond to caregiver link requests.")

    return auth_service.respond_to_patient_link_request(patient["id"], payload.relationship_id, payload.action)

