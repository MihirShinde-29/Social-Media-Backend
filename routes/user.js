const router = require("express").Router();
const user = require("../controllers/user");
const verifySignUp = require("../middleware/verifySignup");
const authJwt = require("../middleware/auth");

router.post("/signup", verifySignUp.checkDuplicateUsernameOrEmail, user.signup);
router.post("/login", user.signin);
router.post("/refresh", user.refreshToken);
router.get("/info", authJwt.verifyToken, user.userInfo);
router.get("/", authJwt.verifyToken, user.users);
router.get("/searchUser", authJwt.verifyToken, user.searchUsers);
router.get("/:username", authJwt.verifyToken, user.getUser);
router.get("/followings/:username", authJwt.verifyToken, user.getFollowings);
router.get("/followers/:username", authJwt.verifyToken, user.getFollowers);
router.patch("/:username", authJwt.verifyToken, user.updateUser);
router.put(
  "/:username/follow-toggle",
  authJwt.verifyToken,
  user.followUser
);

module.exports = router;
