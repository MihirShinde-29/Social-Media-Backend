const mongoose = require("mongoose");

const User = new mongoose.model(
  "User",
  new mongoose.Schema({
    username: {
      type: String,
      required: true,
      min: 3,
      max: 15,
      unique: true,
    },
    email: {  
      type: String,
      required: true,
      min: 4,
      max: 50,
      unique: true,
    },
    password: {
      type: String,
      require: true,
      min: 6,
    },
    description: {
      type: String,
      max: 100,
      default: "",
    },
    profilePicture: {
      type: String,
      required: true,
    },
    followers: {
      type: Array,
      default: [],
    },
    following: {
      type: Array,
      default: [],
    },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
  }, {
    timestamps: true
  })
);

module.exports = User;