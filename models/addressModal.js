const mongoose = require('mongoose');

const { required } = require('nodemon/lib/config');

const addressShema= new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    },
    name:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    pincode:{
        type:Number,
        required:true
    },
    addressType:{
        type:String,
        required:true
    },
    streetAddress:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    landmark:{
     
        type:String
     
    },
    alterPhone:{
       types:Number
    },
    locality:{
        type:String,
        required:true
    }
    

})

module.exports=mongoose.model('address',addressShema)