const mongoose = require('mongoose');
require('dotenv').config()
exports.connect = () => {
    mongoose.connect(process.env.mongoUrl)
        .then(() => {
            console.log("mongo db is connected");
        }).catch(() => {
            console.log("error occcures");
        })
}
