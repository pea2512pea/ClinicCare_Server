import { Sequelize } from 'sequelize';
import Appointment from './appointments.js';
import Doctor from './doctors.js';
import Service from './services.js';
import AppointmentServices from './appointmentServices.js';
import Patient from './patients.js';
import 'dotenv/config';

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_PATH
});

const AppointmentModel = Appointment(sequelize, Sequelize.DataTypes);
const DoctorModel = Doctor(sequelize, Sequelize.DataTypes);
const ServiceModel = Service(sequelize, Sequelize.DataTypes);
const AppointmentServicesModel = AppointmentServices(sequelize, Sequelize.DataTypes);
const PatientModel = Patient(sequelize, Sequelize.DataTypes);

PatientModel.hasMany(AppointmentModel, { foreignKey: 'patient_id' });
AppointmentModel.belongsTo(PatientModel, { foreignKey: 'patient_id' });
DoctorModel.hasMany(AppointmentModel, { foreignKey: 'doctor_id' });
AppointmentModel.belongsTo(DoctorModel, { foreignKey: 'doctor_id' });
AppointmentModel.belongsToMany(ServiceModel, { through: AppointmentServicesModel, foreignKey: 'appointment_id' });
ServiceModel.belongsToMany(AppointmentModel, { through: AppointmentServicesModel, foreignKey: 'service_id' });

export {
    sequelize,
    AppointmentModel,
    DoctorModel,
    ServiceModel,
    AppointmentServicesModel,
    PatientModel
};