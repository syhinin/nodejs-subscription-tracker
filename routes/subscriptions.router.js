import { Router } from "express";
const router = Router();

// user route to get user profile
router.get("/", (req, res) => {
  res.send({ title: "Get all subscriptions" });
});
router.get("/:id", (req, res) => {
  res.send({ title: "Get subscription details" });
});
router.post("/", (req, res) => {
  res.send({ title: "Create subscription details" });
});
router.put("/:id", (req, res) => {
  res.send({ title: "Update subscription details" });
});
router.delete("/:id", (req, res) => {
  res.send({ title: "Delete subscription details" });
});

router.get("/user/:id", (req, res) => {
  res.send({ title: "Get all user subscriptions" });
});
router.put("/:id/cancel", (req, res) => {
  res.send({ title: "Cancel all user subscriptions" });
});
router.get("/upcoming-renewals", (req, res) => {
  res.send({ title: "get upcoming renewals" });
});

export default router;
