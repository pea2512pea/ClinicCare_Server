import express from "express";
import appointmentsController from "../../controllers/appointmentsController.js";

const router = express.Router();
router.post("/", appointmentsController.createAppointment);
router.get("/", appointmentsController.getAppointments);
router.get("/:id", appointmentsController.getAppointmentById);
router.put("/:id", appointmentsController.updateAppointment);
router.delete("/:id", appointmentsController.deleteAppointment);
export default router;
