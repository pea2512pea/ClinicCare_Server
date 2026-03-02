import { Op } from "sequelize";
import {
  AppointmentModel,
  AppointmentServicesModel,
  DoctorModel,
} from "../models/index.js";

const createDoctor = async (req, res) => {
  try {
    const {
      citizen_id,
      first_name,
      last_name,
      specialty,
      phone,
      email,
      user_name,
      password,
      role,
    } = req.body;
    await DoctorModel.create({
      citizen_id,
      first_name,
      last_name,
      specialty,
      phone,
      email,
      user_name,
      password,
      role,
    });
    res.json({ message: "Doctor created successfully" });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(500).json({ error: "Citizen ID must be unique" });
    } else if (error.name === "SequelizeValidationError") {
      const validationErrors = error.errors
        .map((err) => err.message)
        .join(", ");
      return res.status(500).json({ error: validationErrors });
    } else {
      return res.status(500).json({ error: "Failed to create doctor" });
    }
  }
};

const getDoctors = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const offset = (page - 1) * limit;

    const whereCondition = searchQuery
      ? {
          [Op.or]: [
            { first_name: { [Op.like]: `%${searchQuery}%` } },
            { last_name: { [Op.like]: `%${searchQuery}%` } },
            { citizen_id: { [Op.like]: `%${searchQuery}%` } },
            { specialty: { [Op.like]: `%${searchQuery}%` } },
          ],
        }
      : {};

    const { count, rows } = await DoctorModel.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({ doctors: rows, totalPages });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve doctors" });
  }
};

const findAllDoctors = async () => {
  try {
    const doctors = await DoctorModel.findAll({
      order: [["createdAt", "DESC"]],
    });
    return doctors;
  } catch (error) {
    throw new Error("Failed to retrieve doctors");
  }
};

const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await DoctorModel.findByPk(id);
    console.log(doctor);

    if (doctor) {
      res.status(200).json(doctor);
    } else {
      res.status(404).json({ error: "Doctor not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to retrieve doctor", details: error.message });
  }
};

const updateDoctor = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      citizen_id,
      first_name,
      last_name,
      specialty,
      phone,
      email,
      user_name,
      password,
      role,
    } = req.body;

    if (req.user.role == "admin" && userId == id && role !== "admin") {
      return res
        .status(403)
        .json({ error: "Admin cannot change their own role to non-admin" });
    }
    if (req.user.role == "admin" && userId !== id && role === "admin") {
      return res
        .status(403)
        .json({ error: "Admin cannot change other admin's role to admin" });
    }

    const doctor = await DoctorModel.findByPk(id);

    if (doctor) {
      doctor.citizen_id = citizen_id;
      doctor.first_name = first_name;
      doctor.last_name = last_name;
      doctor.specialty = specialty;
      doctor.phone = phone;
      doctor.email = email;
      doctor.user_name = user_name;
      doctor.password = password;
      doctor.role = role;
      await doctor.save();
      res.json({ message: "Doctor updated successfully", doctor });
    } else {
      res.status(404).json({ error: "Doctor not found" });
    }
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(500).json({ error: "Citizen ID must be unique" });
    } else if (error.name === "SequelizeValidationError") {
      const validationErrors = error.errors
        .map((err) => err.message)
        .join(", ");
      return res.status(500).json({ error: validationErrors });
    }
    res
      .status(500)
      .json({ error: "Failed to update doctor" });
  }
};

const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await DoctorModel.findByPk(id);
    if (doctor) {
      await doctor.destroy();
      const appointments = await AppointmentModel.findAll({
        where: { doctor_id: id },
        paranoid: false,
      });
      console.log(appointments);

      for (const appointment of appointments) {
        const thisAppointment = await AppointmentModel.findAll({
          where: { id: appointment.id },
          paranoid: false,
        });
        for (const appointment of thisAppointment) {
          if (appointment.status === "completed") {
            continue;
          }
          appointment.status = "cancelled";
          await appointment.save();
        }
      }
      res.json({
        message:
          "Doctor deleted successfully and associated appointments are now cancelled",
      });
    } else {
      res.status(404).json({ error: "Doctor not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete doctor" });
  }
};

const hardDeleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await DoctorModel.findByPk(id, { paranoid: false });
    if (doctor) {
      const appointments = await AppointmentModel.findAll({
        where: { doctor_id: id },
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
      await doctor.destroy({ force: true });
      res.status(200).json({ message: "Doctor permanently deleted" });
    } else {
      res.status(404).json({ error: "Doctor not found" });
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to permanently delete doctor",
    });
  }
};

export default {
  createDoctor,
  getDoctors,
  findAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  hardDeleteDoctor,
};
