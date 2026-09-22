"""
doctor_caregiver_api.py — Doctor-Caregiver Connection Management API
=====================================================================
Handles bidirectional connection requests between doctors and caregivers.
Doctor sends request → Caregiver accepts/declines → Connection established.
Screening output is never a clinical diagnosis.
"""
from __future__ import annotations

from typing import Any, Dict, List
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from services import auth_service
from services.audit_service import record

router = APIRouter(prefix="/doctor-caregiver", tags=["doctor-caregiver"])


class ConnectCaregiverRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=150, description="Caregiver email address")


class RespondDoctorRequest(BaseModel):
    relationship_id: str = Field(..., min_length=1, max_length=100, description="Relationship ID")
    action: str = Field(..., description="'accept' or 'decline'")


# ── Doctor endpoints ──────────────────────────────────────────────────────────

@router.post("/connect-caregiver", response_model=Dict[str, Any])
def connect_caregiver(payload: ConnectCaregiverRequest, authorization: str = Header(...)) -> Dict[str, Any]:
    """Doctor sends a connection request to a caregiver by email."""
    doctor = auth_service.require_doctor(authorization)
    return auth_service.link_caregiver_by_email(doctor["id"], payload.email)


@router.get("/my-caregivers", response_model=Dict[str, Any])
def get_my_caregivers(authorization: str = Header(...)) -> Dict[str, Any]:
    """Doctor views all connected caregivers (enriched with patient counts)."""
    doctor = auth_service.require_doctor(authorization)
    caregivers = auth_service.get_doctor_caregivers(doctor["id"])
    connected = [c for c in caregivers if c.get("status") == "connected"]
    pending = [c for c in caregivers if c.get("status") == "pending_caregiver_approval"]
    return {
        "doctor_id": doctor["id"],
        "connected_caregivers": connected,
        "pending_requests": pending,
        "connected_count": len(connected),
        "pending_count": len(pending),
    }


@router.get("/my-sent-requests", response_model=Dict[str, Any])
def get_sent_requests(authorization: str = Header(...)) -> Dict[str, Any]:
    """Doctor views pending caregiver connection requests they've sent."""
    doctor = auth_service.require_doctor(authorization)
    requests = auth_service.get_doctor_sent_caregiver_requests(doctor["id"])
    return {
        "doctor_id": doctor["id"],
        "pending_requests": requests,
        "count": len(requests),
    }


# ── Caregiver endpoints ───────────────────────────────────────────────────────

@router.get("/my-doctor-requests", response_model=Dict[str, Any])
def get_doctor_requests(authorization: str = Header(...)) -> Dict[str, Any]:
    """Caregiver views pending connection requests from doctors."""
    caregiver = auth_service.require_care_team(authorization)
    if caregiver.get("role") != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can view doctor connection requests.")
    requests = auth_service.get_caregiver_doctor_requests(caregiver["id"])
    return {
        "caregiver_id": caregiver["id"],
        "doctor_requests": requests,
        "count": len(requests),
    }


@router.post("/respond-doctor-request", response_model=Dict[str, Any])
def respond_doctor_request(payload: RespondDoctorRequest, authorization: str = Header(...)) -> Dict[str, Any]:
    """Caregiver accepts or declines a doctor connection request."""
    caregiver = auth_service.require_care_team(authorization)
    if caregiver.get("role") != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can respond to doctor connection requests.")
    return auth_service.respond_to_doctor_link_request(caregiver["id"], payload.relationship_id, payload.action)


@router.get("/connected-doctors", response_model=Dict[str, Any])
def get_connected_doctors(authorization: str = Header(...)) -> Dict[str, Any]:
    """Caregiver views their connected doctors."""
    from core.storage import doctor_caregivers_store
    caregiver = auth_service.require_care_team(authorization)
    if caregiver.get("role") != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can view connected doctors.")

    records = doctor_caregivers_store.read()
    if not isinstance(records, list):
        records = []

    connected = [r for r in records if r.get("caregiver_id") == caregiver["id"] and r.get("status") == "connected"]
    return {
        "caregiver_id": caregiver["id"],
        "connected_doctors": connected,
        "count": len(connected),
    }
