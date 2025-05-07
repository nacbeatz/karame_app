const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // For password hashing

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["Employee", "TeamLeader", "Manager", "HR", "Admin"], // Define possible roles
    default: "Employee",
  },
  // Add other employee details here later as needed
  firstName: { type: String },
  lastName: { type: String },
  employeeId: { type: String, unique: true, sparse: true }, // Unique ID for employees
  // ... other fields
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;

