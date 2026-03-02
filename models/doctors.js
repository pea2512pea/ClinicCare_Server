export default (sequelize, DataTypes) => {
    const Doctor = sequelize.define('Doctor', {
        citizen_id: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        specialty: {
            type: DataTypes.STRING,
            allowNull: false
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        user_name: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('doctor', 'admin'),
            allowNull: false,
            defaultValue: 'doctor'
        }
    },
    {
        paranoid: true,
    });
    return Doctor;
}