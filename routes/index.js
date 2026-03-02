import { verifyToken } from "../middlewares/verifyToken.js";
import adminRoutes from "./admin/adminRoutes.js";
import authenRoutes from "./authenRoutes.js";
import doctorStaffRoutes from "./doctor/doctorRoutes.js";
import userRoutes from "./user/userRoutes.js";

export default (app) => {
  app.use("/api/auth", authenRoutes);
  app.use("/api/user", verifyToken, userRoutes);
  app.use("/api/doctor", verifyToken, doctorStaffRoutes);
  app.use("/api/admin", verifyToken, adminRoutes);
};
