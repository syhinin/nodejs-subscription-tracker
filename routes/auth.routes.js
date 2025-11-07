import { Router } from "express";
const router = Router();

// authentication route for sign-up
router.post("/sign-up", (req, res) => {
  res.send({ title: "sign-up" });
});
router.post("/sign-in", (req, res) => {
  res.send({ title: "sign-in" });
});
router.post("/sign-out", (req, res) => {
  res.send({ title: "sign-out" });
});

export default router;
