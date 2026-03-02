import { Op } from "sequelize";
import {
  AppointmentModel,
  AppointmentServicesModel,
  DoctorModel,
  PatientModel,
  ServiceModel,
} from "../models/index.js";

const getUpcomingAppointments = async (req, res) => {
  try {
    const userId = req.user.id;

    const appointments = await AppointmentModel.findAll({
      where: {
        [Op.and]: [
          { status: { [Op.in]: ["pending", "confirmed"] } },
          { appointment_date: { [Op.gte]: new Date() } },
          { patient_id: userId },
        ],
      },
      include: [
        {
          model: DoctorModel,
          paranoid: false,
          attributes: ["first_name", "last_name"],
        },
        {
          model: ServiceModel,
          as: "Services",
          through: {
            attributes: ["price", "duration"],
          },
        },
      ],
    });
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve appointments" });
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
        { status: { [Op.like]: `%${searchQuery}%` } },
      ],
      patient_id: req.user.id,
    },
    include: [
      { model: PatientModel, paranoid: false, as: "Patient" },
      { model: DoctorModel, paranoid: false, as: "Doctor" },
      {
        model: ServiceModel,
        as: "Services",
        through: {
          attributes: ["price", "duration"],
        },
        paranoid: false,
      },
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });
  const totalPages = Math.ceil(count / limit);
  res.status(200).json({ appointments: rows, totalPages });
};

const createAppointment = async (req, res) => {
  try {
    const { appointment_date, start_time, end_time, service_ids } = req.body;
    const getServices = await ServiceModel.findAll({
      where: { id: service_ids },
    });
    const totalDurationNew = getServices.reduce(
      (total, service) => total + (service.duration || 0),
      0,
    );
    const newAppointmentStart = new Date(`${appointment_date}T${start_time}`);
    const newAppointmentEnd = new Date(
      newAppointmentStart.getTime() + totalDurationNew * 60000,
    );
    const existingPatientAppointments = await AppointmentModel.findAll({
      where: {
        patient_id: req.user.id,
        appointment_date,
      },
    });

    if (existingPatientAppointments.length > 0) {
      for (const appointment of existingPatientAppointments) {
        const appointmentServices = await AppointmentServicesModel.findAll({
          where: { appointment_id: appointment.id },
        });
        const totalDuration = appointmentServices.reduce(
          (total, service) => total + (service.duration || 0),
          0,
        );
        const appointmentStart = new Date(
          `${appointment.appointment_date}T${appointment.start_time}`,
        );
        const appointmentEnd = new Date(
          appointmentStart.getTime() + totalDuration * 60000,
        );

        if (
          newAppointmentStart < appointmentEnd &&
          newAppointmentEnd > appointmentStart
        ) {
          return res.status(400).json({
            error:
              "You have another appointment that overlaps with the requested time",
          });
        } else if (
          newAppointmentStart.getTime() === appointmentStart.getTime() ||
          newAppointmentEnd.getTime() === appointmentEnd.getTime()
        ) {
          return res.status(400).json({
            error:
              "You have another appointment that overlaps with the requested time",
          });
        }
      }
    }

    const doctors = await DoctorModel.findAll({});
    for (const doctor of doctors) {
      const existingAppointment = await AppointmentModel.findOne({
        where: {
          doctor_id: doctor.id,
          appointment_date,
        },
      });
      if (existingAppointment) {
        const appointmentServices = await AppointmentServicesModel.findAll({
          where: { appointment_id: existingAppointment.id },
        });
        const totalDuration = appointmentServices.reduce(
          (total, service) => total + (service.duration || 0),
          0,
        );
        const appointmentStart = new Date(
          `${existingAppointment.appointment_date}T${existingAppointment.start_time}`,
        );
        const appointmentEnd = new Date(
          appointmentStart.getTime() + totalDuration * 60000,
        );
        if (
          (newAppointmentStart < appointmentEnd &&
            newAppointmentEnd > appointmentStart) ||
          newAppointmentStart.getTime() === appointmentStart.getTime()
        ) {
          continue;
        } else if (
          newAppointmentStart.getTime() === appointmentStart.getTime() ||
          newAppointmentEnd.getTime() === appointmentEnd.getTime()
        ) {
          continue;
        }
      }
      const appointment = await AppointmentModel.create({
        doctor_id: doctor.id,
        patient_id: req.user.id,
        appointment_date,
        start_time,
        status: "pending",
      });
      await AppointmentServicesModel.bulkCreate(
        service_ids.map((serviceId) => ({
          appointment_id: appointment.id,
          service_id: serviceId,
          price: getServices.find((s) => s.id === serviceId)?.price || 0,
          duration: getServices.find((s) => s.id === serviceId)?.duration || 0,
        })),
      );
      return res
        .status(201)
        .json({ message: "Appointment created successfully", appointment });
    }
    res
      .status(400)
      .json({ error: "No available doctors at the requested time" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to create appointment", details: error.message });
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

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const patient = await PatientModel.findByPk(userId, {
      attributes: ["first_name", "last_name", "citizen_id", "phone", "email"],
    });
    if (patient) {
      res.status(200).json(patient);
    } else {
      res.status(404).json({ error: "Patient not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to retrieve profile", details: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, citizen_id, phone } = req.body;
    const patient = await PatientModel.findByPk(userId);
    if (patient) {
      patient.first_name = first_name;
      patient.last_name = last_name;
      patient.citizen_id = citizen_id;
      patient.phone = phone;
      await patient.save();
      res
        .status(200)
        .json({ message: "Profile updated successfully", patient });
    } else {
      res.status(404).json({ error: "Patient not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update profile", details: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;
    const patient = await PatientModel.findByPk(userId);
    if (patient) {
      if (patient.password !== current_password) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      patient.password = new_password;
      await patient.save();
      res.status(200).json({ message: "Password changed successfully" });
    } else {
      res.status(404).json({ error: "Patient not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to change password", details: error.message });
  }
};

export default {
  getUpcomingAppointments,
  createAppointment,
  getAppointments,
  getAllServices,
  getServices,
  getAppointmentById,
  getProfile,
  updateProfile,
  changePassword,
};
