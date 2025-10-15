/*
 User Model
 Defines the structure for user documents stored in MongoDB.
 Uses Mongoose Schema to enforce data types and validation rules.
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define the schema for a User
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true, // Ensures no two users share the same email
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please fill a valid email address",
    ],
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: 6,
    select: false, // Ensures the password hash is not returned in queries by default
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Static method to compare entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  // 'this.password' is available here because we set select: false
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to hash the password before saving the document
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next(); // Only hash if the password field is being modified
  }

  // Generate a salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("User", UserSchema);

