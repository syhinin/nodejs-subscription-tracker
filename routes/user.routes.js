import { Router } from "express";
import { getAllUsers, getUserById } from "../controllers/users.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getAllUsers);
router.get("/:id", authMiddleware, getUserById);
router.post("/", (req, res) => {
  res.send({ title: "Create a new user" });
});
router.put("/:id", (req, res) => {
  res.send({ title: "Update the user by id" });
});
router.delete("/:id", (req, res) => {
  res.send({ title: "Delete a user by id" });
});

export default router;
