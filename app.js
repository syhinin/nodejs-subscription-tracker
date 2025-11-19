import express from "express";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import subscriptionRoutes from "./routes/subscriptions.router.js";
import workflowRoutes from "./routes/workflow.routes.js";
import connectDatabase from "./database/mongodb.js";
import errorMiddleware from "./middlewares/error.middleware.js";
// import arcjetMiddleware from "./middlewares/arcjet.middleware.js";
import {
  applySecurityMiddleware,
  authRateLimiter,
} from "./middlewares/security.middleware.js";
const PORT = process.env.PORT || 3000;

const app = express();
console.log("MONGO_URI:", process.env.MONGO_DB_URI);

// Middleware setup
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(cookieParser());
applySecurityMiddleware(app);
// app.use(arcjetMiddleware);
app.use(errorMiddleware);

// Mounting route handlers
app.get("/api/v1/health", (req, res) => {
  res.json({ success: true, timestamp: new Date() });
});
app.use("/api/v1/auth", authRateLimiter, authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/workflows", workflowRoutes);

app.listen(PORT, async () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);

  await connectDatabase();
});
