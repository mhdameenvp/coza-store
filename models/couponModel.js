const mongoose = require('mongoose');

const couponShema = new mongoose.Schema({

    couponCode: {
        type: String,
        required: true,
        unique: true
    },
    dicountAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    minimumAmount:{
        type: Number,
        required: true,
        min: 0,
    },
    description: {
        type: String,
        required: true
    },
    
    expireDate: {
        type: Date,
        default: Date.now

    }

},

    {
        timestamps: true
    })

module.exports = mongoose.model('Coupon', couponShema)