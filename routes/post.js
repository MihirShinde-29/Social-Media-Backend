const router = require("express").Router();
const post = require("../controllers/post");
const authJwt = require("../middleware/auth");

router.post("/", authJwt.verifyToken, post.createPost);
router.patch("/:id", authJwt.verifyToken, post.updatePost);
router.delete("/:id", authJwt.verifyToken, post.deletePost);
router.get("/", authJwt.verifyToken, post.getTimeline);
router.get("/:id", authJwt.verifyToken, post.getPost);
router.get("/:id/like", authJwt.verifyToken, post.likeUnlike);

module.exports = router;
