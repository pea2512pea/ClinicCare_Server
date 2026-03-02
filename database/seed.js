import { Sequelize } from 'sequelize';
import { AppointmentModel, DoctorModel, ServiceModel, AppointmentServicesModel, PatientModel } from '../models/index.js';

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_PATH
});

const seedDatabase = async () => {
    try {
        await sequelize.sync({ force: true });
        console.log('Database synced!');

        const patients = await PatientModel.bulkCreate([
            { citizen_id: '1234567890123', first_name: 'John', last_name: 'Doe', phone: '555-1234', email: "john.doe@example.com" },
            { citizen_id: '9876543210987', first_name: 'Jane', last_name: 'Smith', phone: '555-5678', email: "jane.smith@example.com" },
            { citizen_id: '4567891234567', first_name: 'Alice', last_name: 'Johnson', phone: '555-8765', email: "alice.johnson@example.com" },
            { citizen_id: '7891234567890', first_name: 'Bob', last_name: 'Brown', phone: '555-4321', email: "bob.brown@example.com" }
        ]);

        const doctors = await DoctorModel.bulkCreate([
            { citizen_id: '1112223334445', first_name: 'Dr. Emily', last_name: 'White', specialty: 'Cardiology', phone: '555-1111', email: "emily.white@example.com" },
            { citizen_id: '2223334445556', first_name: 'Dr. Michael', last_name: 'Brown', specialty: 'Dermatology', phone: '555-2222', email: "michael.brown@example.com" },
            { citizen_id: '3334445556667', first_name: 'Dr. Sarah', last_name: 'Davis', specialty: 'Neurology', phone: '555-3333', email: "sarah.davis@example.com" },
            { citizen_id: '4445556667778', first_name: 'Dr. David', last_name: 'Wilson', specialty: 'Pediatrics', phone: '555-4444', email: "david.wilson@example.com" }
        ]);

        const services = await ServiceModel.bulkCreate([
            { service_name: 'General Consultation', price: 50.0 },
            { service_name: 'Blood Test', price: 30.0 },
            { service_name: 'X-Ray', price: 100.0 },
            { service_name: 'Vaccination', price: 20.0 }
        ]);

        const appointments = await AppointmentModel.bulkCreate([
            { patient_id: patients[0].id, doctor_id: doctors[0].id, appointment_date: new Date(), start_time: new Date().toTimeString().split(' ')[0], status: 'Scheduled'},
            { patient_id: patients[1].id, doctor_id: doctors[1].id, appointment_date: new Date(), start_time: new Date().toTimeString().split(' ')[0], status: 'Scheduled'},
            { patient_id: patients[2].id, doctor_id: doctors[2].id, appointment_date: new Date(), start_time: new Date().toTimeString().split(' ')[0], status: 'Scheduled'},
            { patient_id: patients[3].id, doctor_id: doctors[3].id, appointment_date: new Date(), start_time: new Date().toTimeString().split(' ')[0], status: 'Scheduled'}
        ]);
        await AppointmentServicesModel.bulkCreate([
            { appointment_id: appointments[0].id, service_id: services[0].id },
            { appointment_id: appointments[0].id, service_id: services[1].id },
            { appointment_id: appointments[1].id, service_id: services[0].id },
            { appointment_id: appointments[2].id, service_id: services[2].id },
            { appointment_id: appointments[3].id, service_id: services[3].id }
        ]);
        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await sequelize.close();
    }
};

seedDatabase();