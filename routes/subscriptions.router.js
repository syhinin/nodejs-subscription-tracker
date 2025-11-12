import { Router } from "express";

import {
  createSubscription,
  getSubscriptionDetails,
  getAllSubscriptions,
  getUserSubscriptions,
  updateSubscriptionById,
  deleteSubscriptionById,
} from "../controllers/subscription.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

// user route to get user profile
router.get("/", getAllSubscriptions);

router.get("/:id", authMiddleware, getSubscriptionDetails);

router.post("/", authMiddleware, createSubscription);

router.put("/:id", authMiddleware, updateSubscriptionById);

router.delete("/:id", authMiddleware, deleteSubscriptionById);

router.get("/user/:id", authMiddleware, getUserSubscriptions);

router.put("/:id/cancel", (req, res) => {
  res.send({ title: "Cancel all user subscriptions" });
});

router.get("/upcoming-renewals", (req, res) => {
  res.send({ title: "get upcoming renewals" });
});

export default router;
