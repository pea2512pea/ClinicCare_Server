import {
  protectAdminView,
  protectDoctorView,
  protectUnauthenticatedView,
  protectUserView,
} from "../middlewares/protectRoute.js";

import { verifyToken } from "../middlewares/verifyToken.js";
import adminViews from "./admin/views.js";
import adminRoutes from "./admin/adminRoutes.js";
import authenRoutes from "./authenRoutes.js";
import doctorStaffRoutes from "./doctor/doctorRoutes.js";
import doctorViews from "./doctor/views.js";
import userRoutes from "./user/userRoutes.js";
import userViews from "./user/views.js";

export default (app) => {
  app.get("/", protectUnauthenticatedView, (req, res) => {
    res.render("user_login");
  });
  app.get("/login", protectUnauthenticatedView, (req, res) => {
    res.render("user_login");
  });
  app.get("/register", protectUnauthenticatedView, (req, res) => {
    res.render("user_register");
  });

  app.get("/portal", protectUnauthenticatedView, (req, res) => {
    res.render("portal");
  });

  app.use("/api/auth", authenRoutes);
  app.use("/api/user", verifyToken, userRoutes);
  app.use("/api/doctor", verifyToken, doctorStaffRoutes);
  app.use("/api/admin", verifyToken, adminRoutes);
  app.use("/admin", protectAdminView, adminViews);
  app.use("/doctor", protectDoctorView, doctorViews);
  app.use("/user", protectUserView, userViews);
};
