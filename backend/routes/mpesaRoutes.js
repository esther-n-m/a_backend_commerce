/**
  Mpesa Routes (Mock Payment Gateway)
  This route simulates a payment processing endpoint that the frontend will call.
  It randomly determines success or failure and returns a mock transaction ID.
 */
const express = require("express");
const router = express.Router();

router.post("/pay", (req, res) => {
  // Destructure the required information from the client request body
  const { name, phone, cart } = req.body;

  // 1. Basic Validation
  if (!name || !phone || !cart || cart.length === 0) {
    return res.status(400).json({ message: "Missing required customer info or empty cart." });
  }

  // 2. Mock Payment Simulation
  
  // Generate a mock Mpesa receipt/order ID
  const mockTransactionId = "MPESA" + Date.now().toString().slice(-8);

  // Simulate delay and random success/failure (80% chance of success)
  const isSuccess = Math.random() > 0.2; 
  
  if (isSuccess) {
    // 3. Success Response
    res.json({ 
      success: true, 
      message: "Payment successful! Your order has been placed.",
      transactionId: mockTransactionId,
      orderSummary: { name, phone, cartItems: cart.length }
    });
  } else {
    // 4. Failure Response
    res.status(500).json({ 
      success: false, 
      message: "Payment failed. Please check your details or try again."
    });
  }
});

module.exports = router;
