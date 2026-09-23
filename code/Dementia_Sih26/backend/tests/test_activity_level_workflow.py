"""
test_activity_level_workflow.py
================================
Unit and integration tests for Caregiver Activity Support Level assignment workflow.
"""
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
import pytest
from main import app
from core.storage import users_store, patient_caregivers_store, results_store
from services import auth_service


class TestActivityLevelWorkflow:
    def setup_method(self):
        self.client = TestClient(app)
        self.users = users_store.read()
        self.rels = patient_caregivers_store.read()

        # Seed patient and caregiver
        self.patient_id = "test-patient-activity-001"
        self.caregiver_id = "test-caregiver-activity-001"
        self.unauth_caregiver_id = "test-caregiver-unauth-001"

        now = auth_service.utcnow_iso()
        self.users[self.patient_id] = {
            "id": self.patient_id,
            "full_name": "Test Patient",
            "email": "test.patient@example.com",
            "password_hash": auth_service.hash_password("Passw0rd123!"),
            "role": "patient",
            "created_at": now,
        }
        self.users[self.caregiver_id] = {
            "id": self.caregiver_id,
            "full_name": "Test Caregiver",
            "email": "test.caregiver@example.com",
            "password_hash": auth_service.hash_password("Passw0rd123!"),
            "role": "caregiver",
            "created_at": now,
        }
        self.users[self.unauth_caregiver_id] = {
            "id": self.unauth_caregiver_id,
            "full_name": "Unauth Caregiver",
            "email": "unauth.caregiver@example.com",
            "password_hash": auth_service.hash_password("Passw0rd123!"),
            "role": "caregiver",
            "created_at": now,
        }
        users_store.write(self.users)

        # Grant relationship between patient and caregiver
        self.rels.append({
            "id": "rel-activity-001",
            "patient_id": self.patient_id,
            "caregiver_id": self.caregiver_id,
            "status": "connected",
            "access_granted": True,
            "created_at": now,
        })
        patient_caregivers_store.write(self.rels)

        # Set consent
        from core.storage import consent_store
        consents = consent_store.read()
        consents[self.patient_id] = {"share_with_care_team": True}
        consent_store.write(consents)

        # Login tokens
        res_cg = self.client.post("/api/auth/login", json={"email": "test.caregiver@example.com", "password": "Passw0rd123!", "role": "caregiver"})
        self.cg_token = res_cg.json()["token"]

        res_pt = self.client.post("/api/auth/login", json={"email": "test.patient@example.com", "password": "Passw0rd123!", "role": "patient"})
        self.pt_token = res_pt.json()["token"]

        res_unauth = self.client.post("/api/auth/login", json={"email": "unauth.caregiver@example.com", "password": "Passw0rd123!", "role": "caregiver"})
        self.unauth_token = res_unauth.json()["token"]

    def teardown_method(self):
        users = users_store.read()
        users.pop(self.patient_id, None)
        users.pop(self.caregiver_id, None)
        users.pop(self.unauth_caregiver_id, None)
        users_store.write(users)

        rels = [r for r in patient_caregivers_store.read() if r.get("id") != "rel-activity-001"]
        patient_caregivers_store.write(rels)

    def test_caregiver_assigns_and_reassesses_activity_level(self):
        headers_cg = {"Authorization": f"Bearer {self.cg_token}"}
        headers_pt = {"Authorization": f"Bearer {self.pt_token}"}
        headers_unauth = {"Authorization": f"Bearer {self.unauth_token}"}

        # 1. Initially patient has no activity level
        res_me = self.client.get("/api/dashboard/my-activity-level", headers=headers_pt)
        assert res_me.status_code == 200
        assert res_me.json()["activity_level"] is None

        # 2. Caregiver assigns Level 2 (Guided Cognitive Practice)
        res_assign = self.client.post(
            f"/api/dashboard/patient/{self.patient_id}/activity-level",
            headers=headers_cg,
            json={"activity_level": 2, "notes": "Patient benefits from guided familiar items."}
        )
        assert res_assign.status_code == 200
        data = res_assign.json()
        assert data["activity_level"] == 2
        assert "Level 2" in data["activity_level_label"]

        # 3. Patient checks their activity level
        res_me2 = self.client.get("/api/dashboard/my-activity-level", headers=headers_pt)
        assert res_me2.status_code == 200
        assert res_me2.json()["activity_level"] == 2

        # 4. Patient detail includes activity level for caregiver
        res_detail = self.client.get(f"/api/dashboard/patient/{self.patient_id}", headers=headers_cg)
        assert res_detail.status_code == 200
        assert res_detail.json()["activity_level"] == 2

        # 5. Caregiver reassesses to Level 1
        res_reassess = self.client.post(
            f"/api/dashboard/patient/{self.patient_id}/activity-level",
            headers=headers_cg,
            json={"activity_level": 1}
        )
        assert res_reassess.status_code == 200
        assert res_reassess.json()["activity_level"] == 1

        # 6. Patient queries and sees Level 1
        res_me3 = self.client.get("/api/dashboard/my-activity-level", headers=headers_pt)
        assert res_me3.json()["activity_level"] == 1

        # 7. Unauthorized caregiver is blocked
        res_blocked = self.client.post(
            f"/api/dashboard/patient/{self.patient_id}/activity-level",
            headers=headers_unauth,
            json={"activity_level": 3}
        )
        assert res_blocked.status_code == 403
