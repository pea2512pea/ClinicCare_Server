import { Op } from "sequelize";
import {
  AppointmentModel,
  AppointmentServicesModel,
  DoctorModel,
  PatientModel,
} from "../models/index.js";

const createPatient = async (req, res) => {
  try {
    const { citizen_id, first_name, last_name, phone, email, password } =
      req.body;
    const newPatient = await PatientModel.create({
      citizen_id,
      first_name,
      last_name,
      phone,
      email,
      password,
    });
    res.status(201).json(newPatient);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(500).json({ error: "Citizen ID must be unique" });
    } else if (error.name === "SequelizeValidationError") {
      const validationErrors = error.errors
        .map((err) => err.message)
        .join(", ");
      return res.status(500).json({ error: validationErrors });
    } else {
      return res.status(500).json({ error: "Failed to create patient" });
    }
  }
};

const getPatients = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const offset = (page - 1) * limit;
    const { count, rows } = await PatientModel.findAndCountAll({
      where: {
        [Op.or]: [
          { first_name: { [Op.like]: `%${searchQuery}%` } },
          { last_name: { [Op.like]: `%${searchQuery}%` } },
          { citizen_id: { [Op.like]: `%${searchQuery}%` } },
          { email: { [Op.like]: `%${searchQuery}%` } },
        ],
      },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({ patients: rows, totalPages });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve patients" });
  }
};

const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await PatientModel.findByPk(id, {
      include: [
        {
          model: AppointmentModel,
          as: "Appointments",
          include: [
            {
              model: PatientModel,
              as: "Patient",
              attributes: ["id", "first_name", "last_name"],
            },
            {
              model: DoctorModel,
              as: "Doctor",
              attributes: ["id", "first_name", "last_name"],
            },
          ],
        },
      ],
    });
    if (patient) {
      res.status(200).json(patient);
    } else {
      res.status(404).json({ error: "Patient not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve patient" });
  }
};

const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { citizen_id, first_name, last_name, phone, email, password } =
      req.body;
    const patient = await PatientModel.findByPk(id);
    if (patient) {
      patient.citizen_id = citizen_id;
      patient.first_name = first_name;
      patient.last_name = last_name;
      patient.phone = phone;
      if (email) {
        patient.email = email;
      }
      if (password) {
        patient.password = password;
      }
      await patient.save();
      res
        .status(200)
        .json({ message: "Patient updated successfully", patient });
    } else {
      res.status(404).json({ error: "Patient not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update patient", details: error.message });
  }
};

const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await PatientModel.findByPk(id);
    if (patient) {
      await patient.destroy();
      const appointments = await AppointmentModel.findAll({
        where: { patient_id: id },
        paranoid: false,
      });
      for (const appointment of appointments) {
        if (appointment.status === "completed") {
          continue;
        }
        appointment.status = "cancelled";
        await appointment.save();
      }
      res.status(200).json({
        message:
          "Patient deleted successfully and associated appointments are now cancelled",
      });
    } else {
      res.status(404).json({ error: "Patient not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete patient" });
  }
};

const hardDeletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await PatientModel.findByPk(id, { paranoid: false });
    if (patient) {
      const appointments = await AppointmentModel.findAll({
        where: { patient_id: id },
      });
      for (const appointment of appointments) {
        const appointmentServices = await AppointmentServicesModel.findAll({
          where: { appointment_id: appointment.id },
        });
        for (const appointmentService of appointmentServices) {
          await appointmentService.destroy({ force: true });
        }
        await appointment.destroy({ force: true });
      }
      await patient.destroy({ force: true });
      res.status(200).json({ message: "Patient permanently deleted" });
    } else {
      res.status(404).json({ error: "Patient not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to permanently delete patient" });
  }
};

export default {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  hardDeletePatient,
};
