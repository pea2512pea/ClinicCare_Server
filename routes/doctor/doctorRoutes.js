
import express from 'express';
import staffControllers from '../../controllers/staffController.js';

const router = express.Router();

router.get('/appointments', staffControllers.getAppointments);
router.get('/appointments/today', staffControllers.getTodaysAppointments);
router.get('/upcoming-appointments', staffControllers.getUpcomingAppointments);
router.put('/appointments/:id/status', staffControllers.updateAppointmentStatus);
router.post('/appointments/:id/complete', staffControllers.completeAppointment);
router.post('/appointments/:id/cancel', staffControllers.cancelAppointment);
router.get('/appointments/:id', staffControllers.getAppointmentById);

export default router;