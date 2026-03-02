import { Op } from "sequelize";
import {
  AppointmentModel,
  AppointmentServicesModel,
  ServiceModel,
} from "../models/index.js";

const createService = async (req, res) => {
  try {
    const { service_name, price, duration } = req.body;
    await ServiceModel.create({ service_name, price, duration });
    res.status(201).json({ message: "Service created successfully" });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const validationErrors = error.errors
        .map((err) => err.message)
        .join(", ");
      return res.status(500).json({ error: validationErrors });
    }
    res.status(500).json({ error: "Failed to create service" });
  }
};

const getAllServices = async (req, res) => {
  try {
    const { count, rows } = await ServiceModel.findAndCountAll({
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / 5);
    res.status(200).json({ services: rows, totalPages });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve services" });
  }
};

const getServices = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const exclude = req.query.exclude
      ? req.query.exclude.split(",").map((id) => parseInt(id))
      : [];
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const offset = (page - 1) * limit;

    const { count, rows } = await ServiceModel.findAndCountAll({
      where: {
        service_name: { [Op.like]: `%${searchQuery}%` },
        id: { [Op.notIn]: exclude },
      },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      services: rows,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve services" });
  }
};

const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await ServiceModel.findByPk(id);
    if (service) {
      res.status(200).json(service);
    } else {
      res.status(404).json({ error: "Service not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve service" });
  }
};

const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { service_name, price, duration } = req.body;
    const service = await ServiceModel.findByPk(id);
    if (service) {
      service.service_name = service_name;
      service.price = price;
      service.duration = duration;
      await service.save();
      res
        .status(200)
        .json({ message: "Service updated successfully", service });
    } else {
      res.status(404).json({ error: "Service not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update service", details: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await ServiceModel.findByPk(id);
    if (service) {
      const appointmentsWithService = await AppointmentServicesModel.findAll({
        where: { service_id: id },
      });
      for (const appointmentService of appointmentsWithService) {
        const appointment = await AppointmentModel.findByPk(
          appointmentService.appointment_id,
        );
        if (appointment && appointment.status !== "completed") {
          appointment.status = "cancelled";
          await appointment.save();
        }
      }
      await service.destroy();
      res.status(200).json({ message: "Service deleted successfully" });
    } else {
      res.status(404).json({ error: "Service not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete service" });
  }
};

const hardDeleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await ServiceModel.findByPk(id, { paranoid: false });
    if (service) {
      const appointmentsWithService = await AppointmentServicesModel.findAll({
        where: { service_id: id },
      });
      for (const appointmentService of appointmentsWithService) {
        const appointment = await AppointmentModel.findByPk(
          appointmentService.appointment_id,
        );
        if (appointment) {
          await appointment.destroy({ force: true });
        }
        await appointmentService.destroy({ force: true });
      }
      await service.destroy({ force: true });
      res.status(200).json({ message: "Service permanently deleted" });
    } else {
      res.status(404).json({ error: "Service not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to permanently delete service" });
  }
};

export default {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  hardDeleteService,
  getAllServices,
};
