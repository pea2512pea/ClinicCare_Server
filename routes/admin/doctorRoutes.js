import express from "express";
import doctorController from "../../controllers/doctorController.js";

const router = express.Router();
router.post("/", doctorController.createDoctor);
router.get("/", doctorController.getDoctors);
router.get("/:id", doctorController.getDoctorById);
router.put("/:id", doctorController.updateDoctor);
router.delete("/:id", doctorController.deleteDoctor);
router.delete("/:id/force-delete", doctorController.hardDeleteDoctor);
export default router;
