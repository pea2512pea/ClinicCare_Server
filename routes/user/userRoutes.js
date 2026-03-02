
import express from 'express';
import userController from '../../controllers/userController.js';

const router = express.Router();

router.get('/appointments', userController.getAppointments);

router.get('/upcoming-appointments', userController.getUpcomingAppointments);
router.post('/appointments', userController.createAppointment);
router.get('/services/all', userController.getAllServices);
router.get('/services', userController.getServices);
router.get('/appointments/:id', userController.getAppointmentById);
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/profile/change-password', userController.changePassword);

export default router;