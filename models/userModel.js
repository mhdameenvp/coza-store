
const mongoose = require('mongoose');
const { stringify } = require('nodemon/lib/utils');


const userShema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    mobile: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },

    is_blocked: {
        type: Boolean,
        default: false
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    gender:{
        type:String,
     
    },
    age:{
        type:Number
    },
    wishlist:[{
      
            type:mongoose.Schema.Types.ObjectId,
            ref:'product'
    
    }],
    chatStatus:{
        type:Boolean,
        default:0
    }

   

   
},{   timestamps:true })

module.exports = mongoose.model('user', userShema)