const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/orderModel');
const Cart=require('../models/cartModel')
const Coupons=require('../models/couponModel')

require('../config/config').connect()


const createorder = async (req, res) => {
    try {
          let {orderId}=req.body
        const cartTotal= await Cart.find({userId:req.session.user_id})
        let totalAmount= cartTotal.reduce((acc,curr)=>{
           return acc+curr.price
        },0)

        if(req.session.coupon){
           const coupondetails= await Coupons.findOne({_id:req.session.coupon})
           totalAmount=totalAmount-coupondetails.dicountAmount

        }
        if(totalAmount<500){
            totalAmount+=40
        }

        if(orderId){
            const orderDetail= await Order.findOne({_id:orderId})
            totalAmount=orderDetail.orderAmount
        }
        const instance = new Razorpay({
            key_id: process.env.KEY_ID,
            key_secret: process.env.KEY_SECRET
        })

        const options = {
            amount: totalAmount * 100,
            currency: "INR",
        }
        instance.orders.create(options, (error, order) => {
            if (error) {
                console.log('error in create', error);
                return res.status(500).json({ message: "something went wrong" })
            } else {
                console.log('create order success');
                res.status(200).send({
                    success: true,
                    msg: "Order created",
                    orderId: order.id,
                    amount: totalAmount * 100,
                    key_id: process.env.KEY_ID,
                    product_name: req.body.name,
                    description: "Test Transaction",

                })

            }
        })

    } catch (error) {
        console.log('error in create order', error);
        return res.status(500).json({ message: "internal server error" })
    }
}


const verifypayment = async (req, res) => {
    try {

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;


        const data = `${razorpay_order_id}|${razorpay_payment_id}`;
        const generated_signature = crypto
            .createHmac('sha256', process.env.KEY_SECRET)
            .update(data)
            .digest('hex');


        if (generated_signature === razorpay_signature) {


            res.status(200).json({ success: true, message: "Payment is successful", razorpay_payment_id });
        } else {
            console.log("Signature verification failed");
            res.status(400).json({ success: false, message: "Payment verification failed" })
        }
    } catch (error) {
        console.log(error);
    }
}

const addFunds = async (req, res) => {
    try {
        const instance = new Razorpay({
            key_id: process.env.KEY_ID,
            key_secret: process.env.KEY_SECRET
        })

        const options = {
            amount: req.body.Amount * 100,
            currency: "INR",
        }
        instance.orders.create(options, (error, order) => {
            if (error) {
                console.log('error in create', error);
                return res.status(500).json({ message: "something went wrong" })
            } else {
                console.log('create order success');
                res.status(200).send({
                    success: true,
                    msg: "Order created",
                    orderId: order.id,
                    amount: req.body.Amount * 100,
                    key_id: process.env.KEY_ID,
                    product_name: "Add funds",
                    description: "Test Transaction",

                })

            }
        })


    } catch (error) {
        console.log('error in add fund', error);
    }
}


const fundVerification = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;


        const data = `${razorpay_order_id}|${razorpay_payment_id}`;
        const generated_signature = crypto
            .createHmac('sha256', process.env.KEY_SECRET)
            .update(data)
            .digest('hex');


        if (generated_signature === razorpay_signature) {


            res.status(200).json({ success: true, message: "Payment is successful", razorpay_payment_id });
        } else {
            console.log("Signature verification failed");
            res.status(400).json({ success: false, message: "Payment verification failed" })
        }


    } catch (error) {
        console.log('error in fund verification', error);
    }
}

module.exports = {
    createorder,
    verifypayment,
    addFunds,
    fundVerification
}