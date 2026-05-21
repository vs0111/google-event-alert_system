import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    image: String,

    accessToken: String,
    refreshToken: String,

    phone: String,

    remindedEvents: [String],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User ||
  mongoose.model("User", userSchema);