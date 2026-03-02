export default function(sequelize, DataTypes) {
    const AppointmentServices = sequelize.define('AppointmentServices', {
        appointment_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        service_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });
    return AppointmentServices;
}