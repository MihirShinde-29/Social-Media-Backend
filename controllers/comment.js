const Comment = require("../models/comment");
const Post = require("../models/post");
const User = require("../models/user");

const addComment = async (req, res) => {
    User.findOne({ username: req.userId })
        .select("username profilePicture")
        .then(user => {
            const { postId, ...comment } = req.body;
            comment.user = user;
            const commenttosave = new Comment(comment);
            commenttosave.save()
                .then(comment => {
                    console.log(comment);
                    Post.findOne({ _id: postId }, (err, post) => {
                        if (err) {
                            res.status(500).send({
                                success: false,
                                message: err,
                            });
                        }
                        console.log(post);
                        post.comments.push(comment);
                        post.save()
                            .then(() => {
                                res.status(200).send({
                                    success: true,
                                    message: "Comment added successfully",
                                });
                            })
                            .catch((err) => {
                                res.status(500).send({
                                    success: false,
                                    message: err,
                                });
                            });
                    })
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

const getbyPostId = async (req, res) => {
  const postId = req.params.id;
  Post.findOne({ _id: postId })
    .select("-createdAt -updatedAt -__v -img")
    .populate("comments", "text createdAt user")
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
                data: post.comments,
            });
        })
    })
    .catch((err) => {
        res.status(500).send({
            success: false,
            message: err,
        });
        }
    );
};

// const deleteComment = async (req, res) => {
//     const commentId = req.params.id;
//     Comment.findOneAndDelete({ _id:
//         commentId }, (err, comment) => {
//         if (err) {
//             res.status(500).send({
//                 success: false,
//                 message: err,
//             });
//         }
//         res.status(200).send({
//             success: true,
//             message: "Comment deleted successfully",
//         });
//     });
// };

module.exports = { addComment, getbyPostId };
