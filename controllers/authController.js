import jwt from "jsonwebtoken";
import { DoctorModel, PatientModel } from "../models/index.js";

const checkAuth = (req, res) => {
  const token = req.cookies.token;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Invalid token" });
      }
      if (user.role === "patient") {
        PatientModel.findByPk(user.id, {
          attributes: ["first_name", "last_name", "email", "phone"],
        })
          .then((patient) => {
            if (patient) {
              res.status(200).json({ user: patient, role: "patient" });
            } else {
              res.status(404).json({ error: "Patient not found" });
            }
          })
          .catch(() =>
            res.status(500).json({ error: "Failed to retrieve patient" }),
          );
      } else if (user.role === "doctor") {
        DoctorModel.findByPk(user.id, {
          attributes: [
            "first_name",
            "last_name",
            "email",
            "phone",
            "specialty",
          ],
        })
          .then((doctor) => {
            if (doctor) {
              res.status(200).json({ user: doctor, role: "doctor" });
            } else {
              res.status(404).json({ error: "Doctor not found" });
            }
          })
          .catch(() =>
            res.status(500).json({ error: "Failed to retrieve doctor" }),
          );
      } else {
        res.status(400).json({ error: "Invalid user role" });
      }
    });
  } else {
    res.status(401).json({ error: "Authorization cookie missing" });
  }
};

const loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;
    const patient = await PatientModel.findOne({ where: { email } });
    if (patient && patient.password === password) {
      const token = jwt.sign(
        {
          id: patient.id,
          role: "patient",
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN },
      );
      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
      });
      res.status(200).json({ token });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to login" });
  }
};

const registerPatient = async (req, res) => {
  try {
    const { citizen_id, first_name, last_name, phone, email, password } =
      req.body;
    const existingPatient = await PatientModel.findOne({ where: { email } });
    if (existingPatient) {
      return res.status(400).json({ error: "Email already in use" });
    }
    const newPatient = await PatientModel.create({
      citizen_id,
      first_name,
      last_name,
      phone,
      email,
      password,
    });
    res.status(201).json({
      message: "Patient registered successfully",
      patient: newPatient,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Citizen ID already in use" });
    }
    res.status(500).json({ error: "Failed to register patient" });
  }
};

const loginStaff = async (req, res) => {
  try {
    const { user_name, password } = req.body;
    const doctor = await DoctorModel.findOne({ where: { user_name } });
    if (doctor && doctor.password === password) {
      const token = jwt.sign(
        {
          id: doctor.id,
          role: doctor.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN },
      );
      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
      });
      res.status(200).json({ token });
    } else {
      res.status(401).json({ error: "Invalid username or password" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to login" });
  }
};

const logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
};

export default {
  checkAuth,
  loginPatient,
  loginStaff,
  logout,
  registerPatient,
};
