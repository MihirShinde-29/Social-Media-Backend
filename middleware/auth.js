const jwt = require("jsonwebtoken");
const User = require("../models/user");

const verifyToken = (req, res, next) => {
  if(req.headers.authorization) {
    let token = req.headers.authorization.split(' ')[1]
    if (!token) {
      return res.status(403).send({ message: "No token provided!", success: false });
    }
    jwt.verify(token, process.env.AUTH_KEY, (err, decoded) => {
      if(err) {
        console.log(err)
        return res.status(401).send({ message: err, success: false });
      }
      const username = decoded.id
      User.findOne({'username': username}, (err, user) => {
        if (err) {
          return res.status(401).send({ message: "Unauthorized!", success: false });
        }
        req.userId = user.username;
        req._id = user._id;
        next();
      })
    });
  } else {
    return res.status(403).send({ message: "No token provided!", success: false });
  }
};

const authJwt = {
  verifyToken
};
module.exports = authJwt;