const mongoose = require("mongoose");

const URI = process.env.MONGO_URI;

const connectDB = () => {
  mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log("DB Connected Successfully ✅");
    })
    .catch(err => {
      console.log(`Authentication to database failed ❗`);
      console.log(err);
    })
};

module.exports = connectDB;
