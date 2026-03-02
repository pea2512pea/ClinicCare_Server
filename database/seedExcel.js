import { Sequelize } from 'sequelize';
import XLSX from 'xlsx';
import path from 'path';
import { 
    AppointmentModel, 
    DoctorModel, 
    ServiceModel, 
    AppointmentServicesModel, 
    PatientModel 
} from '../models/index.js';

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_PATH
});

// Helper to convert Excel sheet to JSON
const getDataFromSheet = (workbook, sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
        console.warn(`Sheet "${sheetName}" not found. Skipping...`);
        return [];
    }
    return XLSX.utils.sheet_to_json(sheet);
};

const seedDatabase = async () => {
    try {
        // Load the Excel file
        const workbook = XLSX.readFile(path.resolve('./database/clinic_data.xlsx'));

        await sequelize.sync({ force: true });
        console.log('Database synced!');

        // 1. Seed Patients
        const patientData = getDataFromSheet(workbook, 'Patients');
        const patients = await PatientModel.bulkCreate(patientData);

        // 2. Seed Doctors
        const doctorData = getDataFromSheet(workbook, 'Doctors');
        const doctors = await DoctorModel.bulkCreate(doctorData);

        // 3. Seed Services
        const serviceData = getDataFromSheet(workbook, 'Services');
        const services = await ServiceModel.bulkCreate(serviceData);

        // 4. Seed Appointments
        // Note: If your Excel has IDs, bulkCreate will use them. 
        // If not, you'll need to map them like your original script.
        const appointmentData = getDataFromSheet(workbook, 'Appointments').map(row => {
            // If the date comes in as a number (Excel Serial), convert it
            if (typeof row.appointment_date === 'number') {
                const date = new Date(Math.round((row.appointment_date - 25569) * 86400 * 1000));
                row.appointment_date = date.toISOString().split('T')[0];
            }
            return row;
        });
        const appointments = await AppointmentModel.bulkCreate(appointmentData);

        // 5. Seed Join Table (AppointmentServices)
        const pivotData = getDataFromSheet(workbook, 'AppointmentServices');
        await AppointmentServicesModel.bulkCreate(pivotData);

        console.log('Database seeded successfully from Excel!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await sequelize.close();
    }
};

seedDatabase();