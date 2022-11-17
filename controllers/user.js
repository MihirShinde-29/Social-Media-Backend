const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const upload = require("../middleware/upload");

exports.signup = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.status(500).send({ message: err, success: false });
      return;
    }
    const data = req.body
    if(req.file) {
      data.profilePicture = req.file.destination + '/' + req.file.filename
    } else {
      data.profilePicture = 'uploads/default.png'
    }
    bcrypt.genSalt(8, (err, salt) => {
        if (err) {
          res.status(500).send({ message: err, success: false });
          return;
        }
        bcrypt.hash(data.password, salt, (err, hash) => {
          if (err) {
            res.status(500).send({ message: err, success: false });
            return;
          }
          data.password = hash;
          const user = new User(data);
          user.save((err, user) => {
            if (err) {
              res.status(500).send({ message: err, success: false });
              return;
            }
            res.status(201).send({ 
              message: "User was registered successfully!",
              success: true,
            });
          });
        })
    });
  });
};

exports.signin = (req, res) => {
  User.findOne({
    username: req.body.username,
  })
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err, success: false });
        return;
      }
      if (!user) {
        return res.status(404).send({ message: "User Not found.", success: false });
      }
      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );
      if (!passwordIsValid) {
        return res.status(401).send({ message: "Invalid Password!", success: false });
      }
      const accessToken = jwt.sign(
        { id: req.body.username, email: req.body.email }, 
        process.env.AUTH_KEY, 
        { expiresIn: "1h" }
      );
      const refreshToken = jwt.sign(
        { id: req.body.username, email: req.body.email }, 
        process.env.AUTH_KEY + 'refresh', 
        { expiresIn: "1d" }
      );
      res.status(200).send({
        username: user.username,
        email: user.email,
        description: user.description,
        profilePicture: user.profilePicture,
        followers: user.followers,
        following: user.following,
        gender: user.gender,
        accessToken: accessToken,
        refreshToken: refreshToken,
        success: true,
      });
    });
};

exports.refreshToken = (req, res) => {
  const refreshToken = req.body.refreshToken;
  if (refreshToken === null) return res.status(401).send({ message: "No Token", success: false });;
  jwt.verify(refreshToken, process.env.AUTH_KEY + 'refresh', (err, user) => {
    if (err) return res.status(403).send({ message: "Invalid Token", success: false });
    const accessToken = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.AUTH_KEY, 
      { expiresIn: "1h" }
    );
    res.json({ 
      accessToken: accessToken,
      success: true,
    });
  });
};

exports.userInfo = (req, res) => {
    User.findOne({
        username: req.userId,
    })
        .exec((err, user) => {
        if (err) {
            res.status(500).send({ message: err, success: false });
            return;
        }
        if (!user) {
            return res.status(404).send({ message: "User Not found.", success: false });
        }
        res.status(200).send({
            username: user.username,
            email: user.email,
            description: user.description,
            profilePicture: user.profilePicture,
            followers: user.followers,
            following: user.following,
            gender: user.gender,
            success: true,
        });
    });
};

exports.searchUsers = (req, res) => {
    const search = req.query.search || "";
    User.find({
      username: { $regex: search, $options: "i" },
    })
      .select("username profilePicture")
      .exec((err, users) => {
          if (err) {
              res.status(500).send({ message: err, success: false });
              return;
          }
          if (!users) {
              return res.status(404).send({ message: "Users Not found.", success: false });
          }
          res.status(200).send({
              users: users,
              totalUsers: users.length,
              success: true,
          });
      });
  };

exports.users = (req, res) => {
    User.find()
      .select("-_id username profilePicture")
      .exec((err, users) => {
          if (err) {
              res.status(500).send({ message: err, success: false });
              return;
          }
          if (!users) {
              return res.status(404).send({ message: "Users Not found.", success: false });
          }
          res.status(200).send({
              users: users,
              totalUsers: users.length,
              success: true,
          });
      });
  };

exports.getUser = (req, res) => {
  const username = req.params.username;
  User.findOne({ username: username })
    .select("username description profilePicture followers following")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err, success: false });
        return;
      }
      if (!user) {
        return res.status(404).send({ message: "User Not found.", success: false });
      }
      if(user.followers.includes(req.userId)) {
        const { _id, ...data } = user._doc;
        res.status(200).send({
          user: data,
          following: true,
          success: true,
        });
      } else {
        const userInfo = {
          username: user.username,
          description: user.description,
          profilePicture: user.profilePicture,
          followers: user.followers.length,
          following: user.following.length,
        }
        res.status(200).send({
          user: userInfo,
          following: false,
          success: true,
        });
      }
    })
};

exports.updateUser = async (req, res) => {
  if (req.userId === req.params.username) {
    if (req.body.password) {
      try {
        const salt = await bcrypt.genSalt(8);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      } catch (e) {
        res.status(500).send({
          message: e,
          success: false,
        });
      }
    }
    try {
      const user = await User.findOneAndUpdate(
        { username: req.userId },
        { $set: req.body },
        { new: true }
      );
      const { password, createdAt, updatedAt, __v, _id, ...other } = user._doc;
      if (!user) {
        return res.status(400).send({
          message: "User not found",
          success: false,
        });
      }
      res.status(200).send({
        user: other,
        success: true,
      });
    } catch (e) {
      res.status(500).send({
        message: e,
        success: false,
      });
    }
  } else {
    return res.status(400).send({
      message: "You can update only your account",
      success: false,
    });
  }
};

exports.getFollowings = (req, res) => {
  const username = req.params.username;
  User.findOne({ username: username })
    .exec(async (err, user) => {
      if (err) {
        res.status(500).send({ message: err, success: false });
        return;
      }
      if (!user) {
        return res.status(404).send({ message: "User Not found.", success: false });
      }
      const following = await Promise.all(
        user.following.map((following) => {
          return User.findOne({ username: following }, {
            username: true,
            profilePicture: true,
          });
        })
      );
      res.status(200).send({
        following: following,
        success: true,
      });
    });
};

exports.getFollowers = (req, res) => {
  const username = req.params.username;
  User.findOne({ username: username })
    .exec(async (err, user) => {
      if (err) {
        res.status(500).send({ message: err, success: false });
        return;
      }
      if (!user) {
        return res.status(404).send({ message: "User Not found.", success: false });
      }
      const followers = await Promise.all(
        user.followers.map((follower) => {
          return User.findOne({ username: follower }, {
            username: true,
            profilePicture: true,
          });
        })
      );
      res.status(200).send({
        followers: followers,
        success: true,
      });
    });
};

exports.followUser = (req, res) => {
    User.findOne({ username: req.userId })
      .exec((err, user) => {
        if(err) {
          res.status(500).send({ message: err, success: false });
          return;
        }
        if (user.username !== req.params.username) {
          User.findOne({ username: req.params.username })
            .exec((err, userx) => {
              if(err) {
                res.status(500).send({ message: err, success: false });
                return;
              }
              if (!userx) {
                return res.status(404).send({ message: "User Not found.", success: false });
              }
              if (!userx.followers.includes(req.userId)) {
                User.updateOne({ username: user.username },{
                  $push: { following: userx.username },
                })
                  .then(() => {
                    User.updateOne({ username: userx.username }, {
                      $push: { followers: user.username },
                    })
                      .then(() => {
                        res.status(200).send({
                          message: "User followed successfully",
                          success: true,
                        });
                      })
                  })
                } else {
                  User.updateOne({ username: user.username },{
                    $pull: { following: userx.username },
                  })
                    .then(() => {
                      User.updateOne({ username: userx.username }, {
                        $pull: { followers: user.username },
                      })
                        .then(() => {
                          res.status(200).send({
                            message: "User unfollowed successfully",
                            success: true,
                          });
                        })
                    })
                }
            });
        } else {
          res.status(400).send({
            message: "You cannot follow/unfollow yourself",
            success: false,
          });
        }
      });
};