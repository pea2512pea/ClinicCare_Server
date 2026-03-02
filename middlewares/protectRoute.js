import jwt from "jsonwebtoken";

const protectUserView = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect("/");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "patient") {
      return res.redirect("/");
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie("token");
    return res.redirect("/");
  }
};

const protectDoctorView = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect("/");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role == "admin") {
      return res.redirect("/admin");
    }

    if (decoded.role !== "doctor") {
      return res.redirect("/");
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie("token");
    return res.redirect("/");
  }
};

const protectAdminView = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect("/");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role == "doctor") {
      return res.redirect("/doctor");
    }

    if (decoded.role !== "admin") {
      return res.redirect("/");
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie("token");
    return res.redirect("/");
  }
};

const protectUnauthenticatedView = (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === "admin") {
      return res.redirect("/admin");
    } else if (decoded.role === "doctor") {
      return res.redirect("/doctor");
    } else if (decoded.role === "patient") {
      return res.redirect("/user");
    }

    } catch (err) {
        res.clearCookie("token");
        return res.redirect("/");
    }
    }
    next();
};

export {
  protectAdminView,
  protectDoctorView,
  protectUnauthenticatedView,
  protectUserView,
};
