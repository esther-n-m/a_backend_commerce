/**
  Mpesa Routes (Mock Payment Gateway)
  This route simulates a payment processing endpoint that the frontend will call.
  It randomly determines success or failure and returns a mock transaction ID.
 */
// routes/mpesaRoutes.js (OVERWRITE THIS FILE)

/**
  Mpesa Routes (Mock Payment Gateway)
  UPDATED: Now protected, creates an Order, and clears the Cart on success.
 */
const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler"); // Needed for async operations
const { protect } = require("../middleware/authMiddleware"); // Import protection
const Cart = require("../models/Cart"); // Import Cart model
const Order = require("../models/Order"); // Import NEW Order model

router.post("/pay", protect, asyncHandler(async (req, res) => {
  // Destructure required info from the client request body
  const { name, phone, cartItems, totalAmount } = req.body;
  // Get the authenticated user ID from the 'protect' middleware
  const userId = req.user.id; 

  // 1. Validation (Verify against stored cart data in a real scenario)
  if (!name || !phone || !cartItems || cartItems.length === 0 || totalAmount === undefined) {
    res.status(400);
    throw new Error("Missing required customer info or empty cart data.");
  }

  // 2. Mock Payment Simulation
  const mockTransactionId = "MPESA" + Date.now().toString().slice(-8);
  const isSuccess = Math.random() > 0.2; // 80% chance of success

  if (isSuccess) {
    // 3. CRITICAL: Order Creation & Cart Clearance
    
    // Create the permanent Order record
    const order = await Order.create({
      user: userId,
      items: cartItems, 
      totalAmount: totalAmount,
      shippingAddress: { name, phone },
      transactionId: mockTransactionId,
      paymentStatus: 'Paid',
      orderStatus: 'Processing',
    });

    // Clear the User's Cart
    await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { items: [], total: 0 } },
      { new: true }
    );

    // 4. Success Response
    res.json({
      success: true,
      message: `Payment successful! Order ${order._id} placed.`,
      transactionId: mockTransactionId,
      order: order,
    });
  } else {
    // 5. Failure Response
    res.status(500).json({
      success: false,
      message: "Payment failed due to a mock error.",
      transactionId: null,
    });
  }
}));

module.exports = router;