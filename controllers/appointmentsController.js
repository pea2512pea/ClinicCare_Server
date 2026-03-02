import { Op } from "sequelize";
import {
  AppointmentModel,
  AppointmentServicesModel,
  DoctorModel,
  PatientModel,
  ServiceModel,
} from "../models/index.js";

const createAppointment = async (req, res) => {
  try {
    const {
      appointment_date,
      start_time,
      status,
      patient_id,
      doctor_id,
      serviceIds,
      remark,
    } = req.body;

    const getServices = await ServiceModel.findAll({
      where: { id: serviceIds },
    });
    const totalDurationNew = getServices.reduce(
      (total, service) => total + (service.duration || 0),
      0,
    );
    const newAppointmentStart = new Date(`${appointment_date}T${start_time}`);
    const newAppointmentEnd = new Date(
      newAppointmentStart.getTime() + totalDurationNew * 60000,
    );

    const existingAppointments = await AppointmentModel.findAll({
      where: {
        [Op.or]: [{ patient_id: patient_id }, { doctor_id: doctor_id }],
        appointment_date,
      },
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
    if (existingAppointments.length > 0) {
      for (const appointment of existingAppointments) {
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
          if (
            appointment.patient_id == patient_id &&
            appointment.doctor_id == doctor_id
          ) {
            return res.status(400).json({
              error:
                "Both patient and doctor have another appointment that overlaps with the requested time",
            });
          } else if (appointment.patient_id == patient_id) {
            return res.status(400).json({
              error:
                "Patient has another appointment that overlaps with the requested time",
            });
          } else if (appointment.doctor_id == doctor_id) {
            return res.status(400).json({
              error:
                "Doctor has another appointment that overlaps with the requested time",
            });
          } else {
            return res.status(400).json({
              error: "An appointment overlaps with the requested time",
            });
          }
        } else if (
          newAppointmentStart.getTime() === appointmentStart.getTime() ||
          newAppointmentEnd.getTime() === appointmentEnd.getTime()
        ) {
          if (
            appointment.patient_id == patient_id &&
            appointment.doctor_id == doctor_id
          ) {
            return res.status(400).json({
              error:
                "Both patient and doctor have another appointment that overlaps with the requested time",
            });
          } else if (appointment.patient_id == patient_id) {
            return res.status(400).json({
              error:
                "Patient has another appointment that overlaps with the requested time",
            });
          } else if (appointment.doctor_id == doctor_id) {
            return res.status(400).json({
              error:
                "Doctor has another appointment that overlaps with the requested time",
            });
          } else {
            return res.status(400).json({
              error: "An appointment overlaps with the requested time",
            });
          }
        }
      }
    }

    const appointment = await AppointmentModel.create({
      appointment_date,
      start_time,
      status,
      remark,
      patient_id: patient_id,
      doctor_id: doctor_id,
    });
    await AppointmentServicesModel.bulkCreate(
      serviceIds.map((serviceId) => ({
        appointment_id: appointment.id,
        service_id: serviceId,
        price: getServices.find((s) => s.id === serviceId)?.price || 0,
        duration: getServices.find((s) => s.id === serviceId)?.duration || 0,
      })),
    );
    res.status(201).json(appointment);
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const validationErrors = error.errors
        .map((err) => err.message)
        .join(", ");
      return res.status(500).json({ error: validationErrors });
    }
    res
      .status(500)
      .json({ error: "Failed to create appointment" });
  }
};

const getAppointments = async (req, res) => {
  try {
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
      },
      include: [
        {
          model: PatientModel,
          paranoid: false,
          as: "Patient",
        },
        { model: DoctorModel, paranoid: false, as: "Doctor" },
        {
          model: ServiceModel,
          paranoid: false,
          as: "Services",
          through: { attributes: ["price", "duration"] },
        },
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({ appointments: rows, totalPages });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to retrieve appointments", error: error.message });
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

const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      appointment_date,
      start_time,
      status,
      patient_id,
      doctor_id,
      serviceIds,
      remark,
    } = req.body;
    const getServices = await ServiceModel.findAll({
      where: { id: serviceIds },
    });
    const totalDurationNew = getServices.reduce(
      (total, service) => total + (service.duration || 0),
      0,
    );
    const newAppointmentStart = new Date(`${appointment_date}T${start_time}`);
    const newAppointmentEnd = new Date(
      newAppointmentStart.getTime() + totalDurationNew * 60000,
    );

    const existingAppointments = await AppointmentModel.findAll({
      where: {
        doctor_id: doctor_id,
        appointment_date,
        id: { [Op.ne]: id },
      },
    });

    if (existingAppointments.length > 0) {
      for (const appointment of existingAppointments) {
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
          if (appointment.doctor_id == doctor_id) {
            return res.status(400).json({
              error:
                "Doctor has another appointment that overlaps with the requested time",
            });
          } else if (appointment.patient_id == patient_id) {
            return res.status(400).json({
              error:
                "Patient has another appointment that overlaps with the requested time",
            });
          } else {
            return res.status(400).json({
              error: "An appointment overlaps with the requested time",
            });
          }
        } else if (
          newAppointmentStart.getTime() === appointmentStart.getTime() ||
          newAppointmentEnd.getTime() === appointmentEnd.getTime()
        ) {
          if (appointment.doctor_id == doctor_id) {
            return res.status(400).json({
              error:
                "Doctor has another appointment that overlaps with the requested time",
            });
          } else if (appointment.patient_id == patient_id) {
            return res.status(400).json({
              error:
                "Patient has another appointment that overlaps with the requested time",
            });
          } else {
            return res.status(400).json({
              error: "An appointment overlaps with the requested time",
            });
          }
        }
      }
    }

    const appointment = await AppointmentModel.findByPk(id);
    if (appointment) {
      appointment.appointment_date = appointment_date;
      appointment.start_time = start_time;
      appointment.status = status;
      appointment.patient_id = patient_id;
      appointment.doctor_id = doctor_id;
      appointment.remark = remark;
      const appointmentUpdated = await appointment.save();
      if (serviceIds) {
        await AppointmentServicesModel.destroy({
          where: { appointment_id: id },
        });
        await AppointmentServicesModel.bulkCreate(
          serviceIds.map((serviceId) => ({
            appointment_id: id,
            service_id: serviceId,
            price: getServices.find((s) => s.id === serviceId)?.price || 0,
            duration:
              getServices.find((s) => s.id === serviceId)?.duration || 0,
          })),
        );
      }
      res.status(200).json(appointmentUpdated);
    } else {
      res.status(404).json({ error: "Appointment not found" });
    }
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const validationErrors = error.errors
        .map((err) => err.message)
        .join(", ");
      return res.status(500).json({ error: validationErrors });
    }
    res
      .status(500)
      .json({ error: "Failed to update appointment" });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await AppointmentModel.findByPk(id, {
      paranoid: false,
    });
    if (appointment) {
      const appointmentService = await AppointmentServicesModel.findOne({
        where: { appointment_id: id },
      });
      if (appointmentService) {
        await appointmentService.destroy();
      }
      await appointment.removeServices();
      await appointment.destroy({ force: true });
      res.status(200).json({ message: "Appointment deleted successfully" });
    } else {
      res.status(404).json({ error: "Appointment not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete appointment" });
  }
};

export default {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
};
