require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const email = "pandiyarajan@gmail.com";
    const newPassword = "Pandi6147";

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findOneAndUpdate(
      { email: email },
      {
        $set: {
          password: hashedPassword,
          role: "admin",
        },
      },
      { new: true }
    );

    if (!user) {
      console.log("User not found!");
    } else {
      console.log("Password reset successful!");
      console.log("Email:", user.email);
      console.log("Role:", user.role);
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

resetPassword();
const newPassword = "Pandi6147";