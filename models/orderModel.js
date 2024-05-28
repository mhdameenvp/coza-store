const mongoose = require('mongoose');
const { required } = require('nodemon/lib/config');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true

    },
    cartId: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'cart',
        required: true
    },
    orderedItem: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        productStatus: {
            type: String,
            default: "pending",
            required: true
        },
        returReason: {
            type: String,
        },
        productAmount: {
            type: Number,
            required: true
        },
        totalProductAmount: {
            type: Number,
            required: true
        },
        offer_id: {
            type: mongoose.Schema.Types.ObjectId,
        }



    }],
    orderAmount: {
        type: Number,
        required: true,

    },
    deliveryAddress: {
        name: {
            type: String,
            required: true
        },
        mobile: {
            type: Number,
            required: true
        },
        pincode: {
            type: Number,
            required: true
        },
        addressType: {
            type: String,
            required: true
        },
        streetAddress: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        locality: {
            type: String,
            required: true
        },
        landmark: {

            type: String

        },
        alterPhone: {
            types: Number
        },
    
    },
    deliveryDate: {
        type: Date
    },
    shippingDate: {
        type: Date
    },
    paymentMethod: {
        type: String,
        required: true,

    },
    paymentStatus: {
        type: String,
        required: true
    },
    couponDiscount: {
        type: Number
    },

},
    {
        timestamps: true
    })

module.exports = mongoose.model('order', orderSchema)