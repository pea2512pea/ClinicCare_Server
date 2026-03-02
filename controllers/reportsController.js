import { Op, Sequelize } from "sequelize";
import {
  AppointmentModel,
  DoctorModel,
  PatientModel,
  ServiceModel,
} from "../models/index.js";

const getDashboardData = async (req, res) => {
  try {
    const totalDoctors = await DoctorModel.count();
    const totalPatients = await PatientModel.count();
    const appointmentsToday = await AppointmentModel.findAll({
      where: {
        appointment_date: new Date().toISOString().split("T")[0],
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
    const todayAppointments = appointmentsToday.length;
    const pendingAppointments = await AppointmentModel.count({
      where: {
        status: "pending",
      },
    });

    const recentAppointments = await AppointmentModel.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      include: [
        { model: PatientModel, paranoid: false },
        { model: DoctorModel, paranoid: false },
      ],
    });

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const topDoctors = await DoctorModel.findAll({
      attributes: [
        "id",
        "first_name",
        "last_name",
        [
          Sequelize.fn("COUNT", Sequelize.col("Appointments.id")),
          "appointmentCount",
        ],
      ],
      include: [
        {
          model: AppointmentModel,
          attributes: [],
        },
      ],
      group: ["Doctor.id"],
      order: [[Sequelize.literal("appointmentCount"), "DESC"]],
      where: {
        "$Appointments.appointment_date$": {
          [Op.gte]: lastMonth,
        },
      },
      limit: 5,
      subQuery: false,
    });

    res.status(200).json({
      totalDoctors,
      totalPatients,
      todayAppointments,
      pendingAppointments,
      recentAppointments,
      appointmentsToday,
      topDoctors,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve dashboard data",
      error: error.message,
    });
  }
};

const getAppointmentsReport = async (req, res) => {
  try {
    const { status, service_ids, startDate, endDate, doctor_id } = req.query;
    const where = {};
    if (status) {
      where.status = status;
    }
    if (doctor_id) {
      where.doctor_id = doctor_id;
    }
    if (startDate && endDate) {
      where.appointment_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }
    const include = [
      { model: PatientModel, paranoid: false },
      { model: DoctorModel, paranoid: false },
    ];
    if (service_ids) {
      include.push({
        model: ServiceModel,
        where: {
          id: {
            [Op.in]: service_ids.split(",").map((id) => parseInt(id)),
          },
        },
        as: "Services",
        through: { attributes: ["price", "duration"] },
        paranoid: false,
      });
    } else {
      include.push({
        model: ServiceModel,
        as: "Services",
        through: { attributes: ["price", "duration"] },
        paranoid: false,
      });
    }
    const appointments = await AppointmentModel.findAll({
      where,
      include,
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve appointments report",
      error: error.message,
    });
  }
};

const getIncomeOfService = async (req, res) => {
  try {
    const { service_ids, startDate, endDate } = req.query;
    const where = {};

    if (startDate && endDate) {
      where.appointment_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const parsedServiceIds = service_ids
      ? service_ids.split(",").map((id) => parseInt(id))
      : null;

    const appointments = await AppointmentModel.findAll({
      where,
      include: [
        { model: PatientModel, paranoid: false },
        { model: DoctorModel, paranoid: false },
        {
          model: ServiceModel,
          as: "Services",
          // Filter services at the query level if service_ids provided
          where: parsedServiceIds
            ? { id: { [Op.in]: parsedServiceIds } }
            : undefined,
          through: { attributes: ["price", "duration"] },
          paranoid: false,
        },
      ],
      order: [["appointment_date", "DESC"]],
    });

    const serviceRevenue = {};

    // Process everything in ONE pass through the appointments
    appointments.forEach((appointment) => {
      appointment.Services.forEach((service) => {
        const sId = service.id;
        const price = parseFloat(service.AppointmentServices?.price || 0);

        if (!serviceRevenue[sId]) {
          serviceRevenue[sId] = {
            service_name: service.service_name,
            totalRevenue: 0,
            appointmentCount: 0,
          };
        }

        serviceRevenue[sId].totalRevenue += price;
        serviceRevenue[sId].appointmentCount += 1;

        // Ensure the appointment object itself has the correct price/duration for the frontend
        service.price = price;
        service.duration = service.AppointmentServices?.duration;
      });
    });

    const totalRevenue = Object.values(serviceRevenue).reduce(
      (sum, s) => sum + s.totalRevenue,
      0,
    );

    // Sorted by "Most Making" (Revenue)
    const topServices = Object.values(serviceRevenue)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    res.status(200).json({ totalRevenue, topServices, appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export default {
  getDashboardData,
  getAppointmentsReport,
  getIncomeOfService,
};
