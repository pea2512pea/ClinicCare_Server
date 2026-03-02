import express from "express";
import reportsController from "../../controllers/reportsController.js";
import staffController from "../../controllers/staffController.js";
import appointmentServiceRoutes from "./appointmentServiceRoutes.js";
import appointmentRoutes from "./appointmentsRoutes.js";
import doctorRoutes from "./doctorRoutes.js";
import patientRoutes from "./patientRoutes.js";
import serviceRoutes from "./serviceRoutes.js";

const router = express.Router();

router.get("/dashboard", reportsController.getDashboardData);
router.get("/reports/appointments", reportsController.getAppointmentsReport);
router.get("/reports/income", reportsController.getIncomeOfService);
router.get("/appointments/today", staffController.getTodaysAppointments);
router.post("/appointments/:id/approve", staffController.approveAppointment);
router.post("/appointments/:id/reject", staffController.cancelAppointment);

router.use("/patients", patientRoutes);
router.use("/doctors", doctorRoutes);
router.use("/services", serviceRoutes);
router.use("/appointment-services", appointmentServiceRoutes);
router.use("/appointments", appointmentRoutes);

export default router;
