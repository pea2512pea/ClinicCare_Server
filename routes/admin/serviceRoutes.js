import express from "express";
import serviceController from "../../controllers/serviceController.js";

const router = express.Router();
router.post("/", serviceController.createService);
router.get("/", serviceController.getServices);
router.get("/all", serviceController.getAllServices);
router.get("/:id", serviceController.getServiceById);
router.put("/:id", serviceController.updateService);
router.delete("/:id", serviceController.deleteService);
router.delete("/:id/force-delete", serviceController.hardDeleteService);
export default router;
