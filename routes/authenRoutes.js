import authController from '../controllers/authController.js';
import express from 'express';

const router = express.Router();

router.get('/', authController.checkAuth);
router.post('/user', authController.loginPatient);
router.post('/staff', authController.loginStaff);
router.post('/register-patient', authController.registerPatient);
router.post('/logout', authController.logout);

export default router;