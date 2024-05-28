const mongoose = require('mongoose');

const offerShema = new mongoose.Schema({
    offerName: {
        type: String,
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,

    },
    endDate: {
        type: Date,

    },

    offerType: {
        type: String,
        enum:['category','product','refferal'],
        required: true

    },
    productId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:'product'
    }],
    categoryId:[ {
        type: mongoose.Schema.Types.ObjectId,
        ref:'categories'
    }]


}, {
    timestamps: true
}
)

module.exports = mongoose.model('offer', offerShema)