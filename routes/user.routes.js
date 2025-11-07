import { Router } from "express";
const router = Router();

router.get("/", (req, res) => {
  res.send({ title: "Get all users" });
});
router.get("/:id", (req, res) => {
  res.send({ title: "Get user details by id" });
});
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
