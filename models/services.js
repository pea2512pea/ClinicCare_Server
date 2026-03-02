export default (sequelize, DataTypes) => {
  const Service = sequelize.define(
    "Service",
    {
      service_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.REAL,
        allowNull: false,
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      paranoid: true,
    },
  );
  return Service;
};
