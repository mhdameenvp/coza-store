const mongoose = require('mongoose');
const adimnSchema=new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    password:{
        type:String,
        required:true

    }
})
module.exports=mongoose.model('admin',adimnSchema)