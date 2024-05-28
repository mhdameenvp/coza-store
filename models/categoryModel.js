const mongoose = require('mongoose');


const categoriesSchema= new mongoose.Schema({
    catName:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    is_blocked:{
        type:Boolean,
        required:false
    }

})
module.exports=mongoose.model("categories",categoriesSchema)