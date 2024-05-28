const mongoose = require('mongoose');



const chatSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    recieverId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin'
      
      
    },

    message: {
        type: String,
        require: true
    },
    timestamp: { type: Date, default: Date.now }
})



module.exports = mongoose.model('Chat', chatSchema)