import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Routes
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import subscriptionRoutes from "./routes/subscription";
import paymentRoutes from "./routes/payments";
import webhookRoutes from "./routes/webhooks";

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);

// Start scheduler service
import { schedulerService } from "./services/schedulerService";
schedulerService.start();

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

