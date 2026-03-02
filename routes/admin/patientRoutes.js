import express from "express";
import patientController from "../../controllers/patientController.js";

const router = express.Router();
router.post("/", patientController.createPatient);
router.get("/", patientController.getPatients);
router.get("/:id", patientController.getPatientById);
router.put("/:id", patientController.updatePatient);
router.delete("/:id", patientController.deletePatient);
router.delete("/:id/force-delete", patientController.hardDeletePatient);
export default router;
