const mongoose = require("mongoose");

const Comment = new mongoose.model(
  "Comment", 
  new mongoose.Schema(
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: { type: String, max: 500 },
    },
    { timestamps: true }
  )
);

module.exports = Comment
