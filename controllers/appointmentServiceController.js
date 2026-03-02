import { AppointmentServicesModel, AppointmentModel, ServiceModel, DoctorModel, PatientModel } from "../models/index.js";
import { Op } from 'sequelize';

const createAppointmentService = async (req, res) => {
    try {
        const { appointment_id, service_id, price, duration } = req.body;
        if (!appointment_id || !service_id) {
            return res.status(400).json({ error: "Appointment ID and Service ID are required" });
        }
        const appointment = await AppointmentModel.findByPk(appointment_id);
        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }
        const service = await ServiceModel.findByPk(service_id);
        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }
        const newAppointmentService = await AppointmentServicesModel.create({ 
            appointment_id: appointment.id, 
            service_id, 
            price, 
            duration 
        });
        res.status(201).json(newAppointmentService);
    } catch (error) {
        res.status(500).json({ error: "Failed to create appointment service" });
    }
};

const getAllAppointmentServices = async (req, res) => {
    try {
        const appointmentServices = await AppointmentServicesModel.findAll({
            include: [
                { model: AppointmentModel },
                { model: ServiceModel, paranoid: false }
            ]
        });
        res.status(200).json(appointmentServices);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve appointment services" });
    }
};

const getAppointmentServiceById = async (req, res) => {
    try {
        const { appointment_id, service_id } = req.params;
        const appointmentService = await AppointmentServicesModel.findOne({
            where: { appointment_id, service_id },
            include: [
                { model: AppointmentModel },
                { model: ServiceModel, paranoid: false }
            ]
        });
        if (appointmentService) {
            res.status(200).json(appointmentService);
        } else {
            res.status(404).json({ error: "Appointment service not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve appointment service" });
    }
};

const updateAppointmentService = async (req, res) => {
    try {
        
        const { appointment_id, service_id } = req.params;
        const { new_appointment_id, new_service_id } = req.body;
        if (!new_appointment_id || !new_service_id) {
            return res.status(400).json({ error: "New appointment ID and new service ID are required" });
        }
        const appointmentService = await AppointmentServicesModel.findOne({
            where: { appointment_id, service_id }
        });
        if (appointmentService) {
            appointmentService.appointment_id = new_appointment_id;
            appointmentService.service_id = new_service_id;
            const service = await ServiceModel.findByPk(new_service_id);
            if (!service) {
                return res.status(404).json({ error: "New service not found" });
            }
            appointmentService.price = service.price;
            appointmentService.duration = service.duration;
            const updatedAppointmentService = await appointmentService.save();
            res.status(200).json(updatedAppointmentService);
        } else {
            res.status(404).json({ error: 'Appointment service not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update appointment service' });
    }
};

const deleteAppointmentService = async (req, res) => {
    try {
        const { appointment_id, service_id } = req.params;
        const appointmentService = await AppointmentServicesModel.findOne({
            where: { appointment_id, service_id },
            paranoid: false
        });
        if (appointmentService) {
            await appointmentService.destroy({ force: true });
            res.status(200).json({ message: 'Appointment service deleted successfully' });
        } else {
            res.status(404).json({ error: 'Appointment service not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete appointment service' });
    }
};

export default {
    createAppointmentService,
    getAllAppointmentServices,
    getAppointmentServiceById,
    updateAppointmentService,
    deleteAppointmentService
};