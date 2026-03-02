export default (sequelize, DataTypes) => {
    const Appointment = sequelize.define('Appointment', {
        appointment_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        start_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
            allowNull: false,
            defaultValue: 'pending'
        },
        remark: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    });
    return Appointment;
}