const mongoose = require('mongoose');

const productSchema= new mongoose.Schema({
    productName:{
        type:String,
        required: true
    },
    price:{
        type:Number,
        required: true
    },
    quantity:{
        type:Number,
        required:true
    },
    image:[{
       type:String,
       required:true  

    }],
    brand:{
        type:String,
        required:true
    },
    size:[{
        type:String,
        required:true
    }],
    categoryId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"categories",
        required:true
    },
  
    is_blocked:{
        type:Boolean,
        default:false
    },
    is_categoryBlocked:{
        type:Boolean,
       default:false
    },
    description:{
        type: String,
        required:true

    },
    discountPrice:{
        type:Number,
      
    
    }

},{
    timestamps:true
})
module.exports=mongoose.model("product",productSchema)