const mongoose = require("mongoose");

const Post = new mongoose.model(
  "Post", 
  new mongoose.Schema(
    {
      user: { type: String, required: true },
      userPic: { type: String, required: true },
      description: { type: String, max: 500, default: "" },
      img: { data: Buffer, contentType: String },
      link: { type: String },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    },
    { timestamps: true }
  )
);

module.exports = Post
