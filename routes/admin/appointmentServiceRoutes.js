import express from "express";
import appointmentServiceController from "../../controllers/appointmentServiceController.js";

const router = express.Router();
router.post("/", appointmentServiceController.createAppointmentService);
router.get("/", appointmentServiceController.getAllAppointmentServices);
router.get(
  "/:appointment_id/:service_id",
  appointmentServiceController.getAppointmentServiceById,
);
router.put(
  "/:appointment_id/:service_id",
  appointmentServiceController.updateAppointmentService,
);
router.delete(
  "/:appointment_id/:service_id",
  appointmentServiceController.deleteAppointmentService,
);
export default router;
