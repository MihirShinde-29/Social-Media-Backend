const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");
const upload = require("../middleware/upload");
const fs = require("fs");
const path = require("path");

exports.createPost = async (req, res) => {
  upload(req, res, err => {
    console.log(req.file);
    if (err) {
      res.status(500).send({
        success: false,
        message: 'multer error',
      });
    } else {
      User.findOne({ username: req.userId }, (err, user) => {
        if(err) {
          return res.status(500).send({
            success: false,
            message: err
          });
        }
        if(!user) {
          return res.status(404).send({
            success: false,
            message: "User not found"
          });
        }
        if(req.file) {
          req.body.userPic = user.profilePicture;
          req.body.user = user.username;
          const dir = path.resolve(__dirname, '..', "uploads") + '/' + req.file.filename
          var final_img = {
            contentType: req.file.mimetype,
            data: fs.readFileSync(dir)
          };
          req.body.img = final_img
          req.body.link = req.file.destination + '/' + req.file.filename
          const newPost = new Post(req.body);
          newPost.save((err, post) => {
            if(err) {
              return res.status(500).send({
                success: false,
                message: err
              });
            }
            const { img, createdAt, updatedAt, __v, ...other } = post._doc
            return res.status(200).send({
              success: true,
              message: "Post created successfully",
              data: other
            });
          });
        } else {
          res.status(500).send({
            success: false,
            message: "No image provided"
          });
        }
      })
    }
  })
};

exports.updatePost = async (req, res) => {
  upload(req, res, async (err) => {
    Post.findById(req.params.id)
      .then((post) => {
        if (req.file) {
          const dir = __dirname.split('\\').slice(0, -1).join('/') + '/uploads/' + req.file.filename
          var final_img = {
            contentType: req.file.mimetype,
            data: fs.readFileSync(dir
          )};
          req.body.img = final_img
          req.body.link = req.file.destination + '/' + req.file.filename
        }
        if (req.userId === post.user.toString()) {
          Post.updateOne({ $set: req.body })
            .then(() => {
              res.status(200).send({
                success: true,
                message: "Post has been updated",
              });
            })
        } else {
          res.status(401).send({
            success: false,
            message: "You are not authorized",
          });
        }
      })
  })
};

exports.deletePost = async (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        if (req.userId === post.user.toString()) {
          if(post.comments.length > 0) {
            Comment.deleteMany({ user: req.userId })
              .then(() => {
                Post.findByIdAndDelete(req.params.id)
                  .then(() => {
                    res.status(200).send({
                      success: true,
                      message: "Post has been deleted",
                    });
                  })
              })
          } else {
            Post.findByIdAndDelete(req.params.id)
              .then(() => {
                res.status(200).send({
                  success: true,
                  message: "Post has been deleted",
                });
              })
          }
        } else {
          res.status(401).send({
            success: false,
            message: "You are not authorized",
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          success: false,
          message: "Post not found",
        });
      });
};

exports.getTimeline = async (req, res) => {
  try {
    const user = await User.findById(req._id).select("following");
    const myPosts = await Post.find({ user: req.userId })
      .select("-img -createdAt -updatedAt -__v")
      .sort({ createdAt: "desc" })
      .populate("user", "username profilePicture")
      .populate({
        path: "comments", 
        model: "Comment",
        select: "text createdAt user",
        populate: {
          path: "user",
          model: "User",
          select: "username profilePicture"
        }
      })
      .populate("likes", "username profilePicture")
    const followingPosts = await Promise.all(
      user.following.map((followingId) => {
        return Post.find({ user: followingId })
          .select("-img -createdAt -updatedAt -__v")
          .sort({ createdAt: "desc" })
          .populate("user", "username profilePicture")
          .populate({
            path: "comments", 
            model: "Comment",
            select: "text createdAt user",
            populate: {
              path: "user",
              model: "User",
              select: "username profilePicture"
            }
          })
          .populate("likes", "username profilePicture")
      })
    );
    arr = myPosts.concat(...followingPosts);
    res.status(200).send({
      success: true,
      posts: arr,
      limit: arr.length,
    });
  } catch (e) {
    res.status(500).send({
      success: false,
      message: e.message,
    });
  }
};

exports.getPost = async (req, res) => {
  Post.findOne({ _id: req.params.id })
    .populate("comments", "text createdAt user")
    .populate("likes", "username profilePicture")
    .select("-createdAt -updatedAt -__v -img")
    .then(post => {
      post.populate("comments.user", "username profilePicture", (err, post) => {
        if(err) {
          return res.status(500).send({
            success: false,
            message: err
          });
        }
        res.status(200).send({
          success: true,
          post,
        });
      })
    })
    .catch((err) => {
      res.status(500).send({
        success: false,
        message: err,
      });
    });
};

exports.likeUnlike = async (req, res) => {
  Post.findById(req.params.id)
    .select("-createdAt -updatedAt -__v -img")
    .populate("likes", "username profilePicture")
    .then(async post => {
      User.findOne({ username: req.userId })
        .select("username profilePicture")
        .then(user => {
          console.log(user);
          if (!(post.likes.filter((like) => like.username === user.username).length > 0)) {
            post.updateOne({ $push: { likes: user } })
              .then(() => {
                res.status(200).send({
                  success: true,
                  message: "The post has been liked",
                });
              })
              .catch((err) => {
                res.status(500).send({
                  success: false,
                  message: err,
                });
              });
          } else {
            console.log('unlike')
            post.updateOne({ $pull: { likes: user._id } })
              .then(() => {
                res.status(200).send({
                  success: true,
                  message: "The post has been unliked",
                });
              })
              .catch((err) => {
                res.status(500).send({
                  success: false,
                  message: err,
                });
              });
          }
        })
        .catch((err) => {
          res.status(500).send({
            success: false,
            message: err,
          });
        });
    })
    .catch((err) => {
      res.status(500).send({
        success: false,
        message: err,
      });
    });
};