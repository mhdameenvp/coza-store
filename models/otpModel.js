
const mongoose = require('mongoose');


const OTPschema  = new mongoose.Schema({
    userid :{
        type :mongoose.Schema.Types.ObjectId
      
    },
    otp:{
        type:String,
      
    },
    createdAt:{
        type:Date ,
        expires:'30s',
        default:Date.now,
    },
})
    OTPschema.index({ createdAt: 1 }, { expireAfterSeconds:30 });

module.exports = mongoose.model("otps",OTPschema);