const router = require("express").Router();
const comment = require("../controllers/comment");
const authJwt = require("../middleware/auth");

router.post("/", authJwt.verifyToken, comment.addComment);
router.get("/:id", authJwt.verifyToken, comment.getbyPostId);

module.exports = router;
