import express from "express";
import { paymentService } from "../services/paymentService";
import { subscriptionService, PlanType } from "../services/subscriptionService";

const router = express.Router();

// Create payment intent
router.post("/create", async (req, res) => {
  try {
    const { planType, currency } = req.body;
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    if (!planType || !["basic", "pro"].includes(planType)) {
      return res.status(400).json({ error: "Invalid plan type" });
    }

    const paymentIntent = await paymentService.createPaymentIntent(
      planType as PlanType,
      currency || "eth"
    );

    res.json({ paymentIntent });
  } catch (error: any) {
    console.error("Payment creation error:", error);
    res.status(500).json({ error: error.message || "Failed to create payment intent" });
  }
});

// Verify payment transaction
router.post("/verify", async (req, res) => {
  try {
    const { txHash, planType } = req.body;
    const { username } = req.query;

    if (!username || !txHash || !planType) {
      return res.status(400).json({ error: "Username, txHash, and planType required" });
    }

    const result = await paymentService.processPayment(
      username as string,
      txHash,
      planType as PlanType,
      req.body.network // Optional network param
    );

    if (result.success) {
      res.json({ success: true, message: "Payment verified and subscription activated" });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error: any) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: error.message || "Failed to verify payment" });
  }
});

// Get payment status
router.get("/status/:txHash", async (req, res) => {
  try {
    const { txHash } = req.params;
    const status = paymentService.getPaymentStatus(txHash);
    res.json(status);
  } catch (error: any) {
    console.error("Payment status error:", error);
    res.status(500).json({ error: "Failed to get payment status" });
  }
});

export default router;


