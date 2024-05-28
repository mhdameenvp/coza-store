const mongoose = require('mongoose');

const walletShema = new mongoose.Schema({
   userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
   },
   balance: {
      type: Number,
      required: true
   },
   transaction: [{
      
      amount: {
         type: Number,
         required: true
      },
      transactionsMethod: {
         type: String,
         required: true,
         enum: ["Debit", "Razorpay", "refferal", "Refund", "Payment"]
      },
      date:{
         type:Date,
         default: Date.now 
      }
      
   }]


}, {
   timestamps: true

})
module.exports = mongoose.model('Wallet', walletShema)