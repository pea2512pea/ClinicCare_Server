import { Op } from "sequelize";
import {
  AppointmentModel,
  DoctorModel,
  PatientModel,
  ServiceModel,
} from "../models/index.js";

const getUpcomingAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const appointments = await AppointmentModel.findAll({
      where: {
        doctor_id: userId,
        appointment_date: { [Op.gte]: new Date() },
        status: { [Op.notIn]: ["cancelled", "completed", "pending"] },
      },
      include: [
        {
          model: ServiceModel,
          as: "Services",
          through: { attributes: ["duration", "price"] },
        },
        {
          model: PatientModel,
          paranoid: false,
          attributes: ["first_name", "last_name"],
        },
      ],
    });
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve appointments" });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await AppointmentModel.findByPk(id, {
      include: [
        { model: PatientModel, paranoid: false },
        { model: DoctorModel, paranoid: false },
        {
          model: ServiceModel,
          paranoid: false,
          as: "Services",
          through: { attributes: ["price", "duration"] },
        },
      ],
    });
    if (appointment) {
      res.status(200).json(appointment);
    } else {
      res.status(404).json({ error: "Appointment not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve appointment" });
  }
};

const getTodaysAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split("T")[0];
    const where = {
      appointment_date: today,
    };
    const include = [
      {
        model: ServiceModel,
        as: "Services",
        through: { attributes: ["duration", "price"] },
        paranoid: false,
      },
      {
        model: PatientModel,
        paranoid: false,
        attributes: ["first_name", "last_name"],
      },
    ];

    if (req.user.role == "doctor") {
      where.doctor_id = userId;
      where.status = { [Op.notIn]: ["cancelled", "completed", "pending"] };
    } else if (req.user.role == "admin") {
      include.push({ model: DoctorModel, paranoid: false });
    }

    const appointments = await AppointmentModel.findAll({
      where,
      include,
    });
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve today's appointments" });
  }
};

const getAppointments = async (req, res) => {
  const searchQuery = req.query.search || "";
  const page = parseInt(req.query.page) || 1;
  const limit = req.query.limit ? parseInt(req.query.limit) : 5;
  const offset = (page - 1) * limit;
  const { count, rows } = await AppointmentModel.findAndCountAll({
    where: {
      [Op.or]: [
        { appointment_date: { [Op.like]: `%${searchQuery}%` } },
        { start_time: { [Op.like]: `%${searchQuery}%` } },
        { end_time: { [Op.like]: `%${searchQuery}%` } },
        { status: { [Op.like]: `%${searchQuery}%` } },
      ],
      doctor_id: req.user.id,
    },
    include: [
      { model: PatientModel, paranoid: false, as: "Patient" },
      { model: DoctorModel, paranoid: false, as: "Doctor" },
      { model: ServiceModel, paranoid: false, as: "Services" },
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });
  const totalPages = Math.ceil(count / limit);
  res.status(200).json({ appointments: rows, totalPages });
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { status } = req.body;
    const appointment = await AppointmentModel.findOne({
      where: { id: appointmentId, doctor_id: req.user.id },
    });
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    appointment.status = status;
    await appointment.save();
    res
      .status(200)
      .json({ message: "Appointment status updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update appointment status" });
  }
};

const completeAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await AppointmentModel.findOne({
      where: { id: appointmentId, doctor_id: req.user.id },
    });
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    appointment.status = "completed";
    await appointment.save();
    res.status(200).json({ message: "Appointment completed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to complete appointment" });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const where = { id: appointmentId };
    const appointment = await AppointmentModel.findOne({
      where,
    });
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    appointment.status = "cancelled";
    await appointment.save();
    res.status(200).json({ message: "Appointment cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel appointment" });
  }
};

const approveAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await AppointmentModel.findOne({
      where: { id: appointmentId },
    });
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    appointment.status = "confirmed";
    await appointment.save();
    res.status(200).json({ message: "Appointment approved successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to approve appointment" });
  }
};

const renderTodaysAppointmentsPage = async (req, res) => {
  try {
    res.render("admin/todaysAppointment");
  } catch (error) {
    res.status(500).json({
      error: "Failed to render today's appointments page",
      details: error.message,
    });
  }
};

export default {
  getUpcomingAppointments,
  getAppointments,
  getTodaysAppointments,
  updateAppointmentStatus,
  completeAppointment,
  cancelAppointment,
  approveAppointment,
  getAppointmentById,
};
