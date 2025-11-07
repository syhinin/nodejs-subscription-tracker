import express from "express";

import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import subscriptionRoutes from "./routes/subscriptions.router.js";

const app = express();
app.use(express.json());

// Mounting route handlers
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
