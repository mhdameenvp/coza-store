const address = require('../models/addressModal');
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const user = require('../models/userModel')
const product = require('../models/productModel')
const payment = require('../models/paymentModel')
const wallet = require('../models/walletModel');
const offers = require('../models/offerModel')
const Coupons = require('../models/couponModel');




const useraddAddress = async (req, res) => {
    try {

        const userId = req.session.user_id;

        const { addressType, alternativePhone, landmark, mobile, state, city, streetAddress, locality, pincode, name } = req.body
        if (!addressType || addressType.trim() == "") {
            req.flash('message', 'Please Select Address type')
            return res.redirect('/addAddress')

        }
        if (!mobile || mobile.length !== 10) {
            req.flash('message', 'Please Enter Mobile Number')
            return res.redirect('/addAddress')
        }
        if (!state || state.trim() == '') {
            req.flash('message', 'Please select state')
            return res.redirect('/addAddress')
        }
        if (!city || city.trim() == "") {
            req.flash('message', 'Please select city')
            return res.redirect('/addAddress')
        }
        if (!streetAddress || streetAddress.trim() == "") {

            req.flash('message', 'Please select streetAddress')
            return res.redirect('/addAddress')
        }
        if (!locality || locality.trim() == "") {
            req.flash('message', 'Please select locallity')
            return res.redirect('/addAddress')
        }
        if (!pincode || pincode.length !== 6) {
            req.flash('message', 'Please select pincode')
            return res.redirect('/addAddress')
        }



        const newAddress = new address({
            userId: userId,
            name: name,
            mobile: mobile,
            pincode: pincode,
            addressType: addressType,
            streetAddress: streetAddress,
            city: city,
            landmark: landmark,
            alterPhone: alternativePhone,
            locality: locality,
            state: state

        })
        const save = await newAddress.save()
        console.log(save);
        if (save) {
            res.redirect('/userAddress')

        } else {
            res.status(400).json({ success: false })
        }

    } catch (error) {
        console.log('error in add address', error);
    }
}

const addAddress = async (req, res) => {
    try {

        const userId = req.session.user_id;
        console.log("req.body", req.body);
        const { addressType, alternativePhone, landmark, mobile, state, city, streetAddress, locality, pincode, name } = req.body

        if (!name || name.trim() == "") {
            return res.json({ success: false, message: "user Name is required" })
        }

        if (mobile.length !== 10) {

            return res.json({ success: false, message: "Please Enter Valid Number" })
        }

        if (pincode.length !== 6) {

            return res.json({ success: false, message: "Please Enter Valid Pincode" })
        }
        if (!city || city.trim() == "") {
            return res.json({ success: false, message: "Please Enter  city name" })
        }
        if (!streetAddress || streetAddress.trim() == "") {
            return res.json({ success: false, message: "Please Enter  Street Address" })
        }
        if (!locality || locality.trim() == "") {
            return res.json({ success: false, message: "Please Enter  locality" })
        }
        if (!addressType || addressType.trim() == "") {
            return res.json({ success: false, message: "Please Select Address type  " })
        }





        const newAddress = new address({
            userId: userId,
            name: name,
            mobile: mobile,
            pincode: pincode,
            addressType: addressType,
            streetAddress: streetAddress,
            city: city,
            landmark: landmark,
            alterPhone: alternativePhone,
            locality: locality,
            state: state

        })
        const save = await newAddress.save()
        console.log(save);
        if (save) {
            res.status(200).json({ success: true, message: '' })

        }
    } catch (error) {
        console.log('error in add address', error);
    }
}

const checkname = async (req, res) => {
    try {
        const { name } = req.body
        console.log(name);
        if (!name || name.trim() == '') {
            res.json({ success: false })
        } else {
            res.json({ success: true })
        }
    } catch (error) {
        console.log('error in check name');
    }
}


const placeorder = async (req, res) => {
    try {

      const {transactionId}=req.query
        
        const { selectedAddress, selectedPaymentMethod, status, coupon } = req.body

        if (!selectedAddress) {

            res.json({ success: false, message: "Please select an Address" })
        }
        

        const cartTotal= await Cart.find({userId:req.session.user_id})
        let totalAmount= cartTotal.reduce((acc,curr)=>{
           return acc+curr.price
        },0)

        if(req.session.coupon){
           const coupondetails= await Coupons.findOne({_id:req.session.coupon})
           totalAmount=totalAmount-coupondetails.dicountAmount

        }

        const userId = req.session.user_id
        const cartItems = await Cart.find({ userId: userId }).populate('productId')
        const couponData = await Coupons.findOne({ couponCode: coupon })
        const deliveryAddressData = await address.findOne({ _id: selectedAddress })
        const deliveryAddress={
            name:deliveryAddressData.name,
            mobile: deliveryAddressData.mobile,
            pincode: deliveryAddressData.pincode,
            addressType: deliveryAddressData.addressType,
            streetAddress: deliveryAddressData.streetAddress,
            city: deliveryAddressData.city,
            state: deliveryAddressData.state,
            locality: deliveryAddressData.locality,
            landmark: deliveryAddressData.landmark, 
            alterPhone: deliveryAddressData.alterPhone 
        }

        console.log("deliveryAddress", deliveryAddress);


        const orderedItem = await cartItems.map(item => ({
            productId: item.productId._id,
            quantity: item.quantity,
            totalProductAmount: item.price,
            offer_id: item.offer_id,
            productAmount: item.productId.price


        }))



        for (let item of orderedItem) {
            const { productId, quantity } = item

            const products = await product.updateOne({ _id: productId }, { $inc: { quantity: -quantity } });

        }
        req.session.coupon=null

        const order = new Order({
            userId: userId,
            cartId: cartItems.map(item => item._id),
            orderedItem: orderedItem,
            orderAmount: totalAmount,
            deliveryAddress: deliveryAddress,
            paymentMethod: selectedPaymentMethod,
            paymentStatus: status,
            couponDiscount: couponData ? couponData.dicountAmount : 0


        })
        const save = await order.save()



        await Cart.deleteMany({ userId: userId })

        if (status == "pending") {
            return res.json({ success: false, orderId: order._id })
        }

        if (selectedPaymentMethod == "COD") {
            const Payment = new payment({
                userId: userId,
                orderId: order._id,
                amount: totalAmount,
                status: 'pending',
                paymentMethod: selectedPaymentMethod

            })
            await Payment.save()
        } else {
            const Payment = new payment({
                userId: userId,
                orderId: order._id,
                amount: totalAmount,
                status: 'completed',
                paymentMethod: selectedPaymentMethod,
                transactionId:transactionId

            })
            await Payment.save()

        }
        if (save) {
            console.log("orderId", order._id);
            res.status(200).json({ success: true, orderId: order._id })

        }
        else {
            res.status(302).json({ success: false })
        }





    } catch (error) {
        console.log('error in place order page', error);
    }
}

const retryOrder = async (req, res) => {
    try {
        const userId=req.session.user_id
        const { orderId,transactionId } = req.body
        console.log(req.body);
        const orderdetail=await Order.findOne({_id:orderId})
        const update = await Order.updateOne({ _id: orderId }, { $set: { paymentStatus: 'success' } })
        const Payment = new payment({
            userId: userId,
            orderId: orderId,
            amount: orderdetail.orderAmount,
            status: 'completed',
            paymentMethod: 'Razorpay',
            transactionId:transactionId

        })
        await Payment.save()


        if (update) {
            res.status(200).json({ success: true })
        }

    } catch (error) {

    }
}

const ordersuccess = async (req, res) => {
    try {
        const userId = req.session.user_id
        const userdata = await user.findOne({ _id: userId })
        const { orderId } = req.query
        const orderDetail = await Order.findOne({ _id: orderId }).populate('userId')
        console.log("order details", orderDetail);
        const formattedCreatedAt = orderDetail.createdAt.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        console.log(orderDetail.deliveryAddress);


        console.log(formattedCreatedAt);

        const cartCount = await Cart.countDocuments({ userId: req.session.user_id });

        const wishlistCount = userdata.wishlist.length

        res.render('user/orderSuccess', { orderDetail, formattedCreatedAt, userdata, cartCount, wishlistCount })
    } catch (error) {
        console.log('error in order details page');
    }
}

const orderpage = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    try {
        const userId = req.session.user_id;
        const userdata = await user.findOne({ _id: userId })
        const cartCount = await Cart.countDocuments({ userId: req.session.user_id })
        const wishlistCount = userdata.wishlist.length
        const totalOrderAmount = req.query.totalOrderAmount
        req.session.totalOrderAmount = totalOrderAmount
        const orderDetails = await Order.find({ userId: userId })
            .populate('orderedItem.productId')
            .sort({ _id: -1 })
            .limit(limit)
            .skip(skip);


        const totalOrders = await Order.countDocuments({ userId: userId });
        const totalPages = Math.ceil(totalOrders / limit);

        res.render('user/user/orderpage', {
            orderDetails,
            userdata,
            wishlistCount,
            cartCount,
            currentPage: page,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: totalPages,
            totalOrderAmount
        });

    } catch (error) {
        console.log('error in orderpage', error);
    }
};


const singleorder = async (req, res) => {
    try {
        const orderId = req.query.orderId.trim();
        const productId = req.query.productId
        const userdata = await user.findOne({ _id: req.session.user_id })
        const cartCount = await Cart.countDocuments({ userId: req.session.user_id })
        const wishlistCount = userdata.wishlist.length
        const orderDetails = await Order.findOne({ _id: orderId }).populate('deliveryAddress').populate('orderedItem.productId')


        const products = orderDetails.orderedItem


        const matchedItem = await products.find(item => item.productId._id.toString() === productId)

        res.render('user/user/singleOrder', { orderDetails, productDetails: matchedItem, userdata, cartCount, wishlistCount })

    } catch (error) {
        console.log("error in singleorder", error);
    }
}


const cancelOrder = async (req, res) => {
    try {
        const userId = req.session.user_id

        const { orderId, productId, paymentMethod } = req.body

        console.log(orderId, productId);

        const productStatus = await Order.updateOne({ _id: orderId }, { $set: { 'orderedItem.$[item].productStatus': "cancelled" } }, { arrayFilters: [{ "item._id": productId }] })

        const order = await Order.findOne({ _id: orderId }).populate("orderedItem.productId")
        const matchedItem = await order.orderedItem.filter(item => item._id == productId)



        const totalAmount = matchedItem[0].totalProductAmount

        const isExistWallet = await wallet.findOne({ userId: userId })

        if (paymentMethod !== "COD") {

            if (!isExistWallet) {

                const newWallet = new wallet({
                    userId: userId,
                    balance: totalAmount,
                    transaction: [{
                        amount: totalAmount,
                        transactionsMethod: "Refund",
                    }]

                })

                await newWallet.save()
            } else {

                await wallet.updateOne({ userId: userId }, { $inc: { balance: totalAmount }, $push: { transaction: { amount: totalAmount, transactionsMethod: "Refund" } } })

            }
        }

        if (productStatus) {

            await product.updateOne({ _id: productId }, { $inc: { quantity: matchedItem[0].quantity } })
            res.status(200).json({ success: true, })

        } else {
            res.status(302).json({ success: false })
        }






    } catch (error) {
        console.log('error in cancel order', error);
    }
}


const placeorderWallet = async (req, res) => {
    try {
        const { Amount, selectedAddress, selectedPaymentMethod, status, coupon } = req.body

        const cartTotal= await Cart.find({userId:req.session.user_id})
        let totalAmount= cartTotal.reduce((acc,curr)=>{
           return acc+curr.price
        },0)

        if(req.session.coupon){
           const coupondetails= await Coupons.findOne({_id:req.session.coupon})
           totalAmount=totalAmount-coupondetails.dicountAmount

        }
        const userId = req.session.user_id
        const cartItems = await Cart.find({ userId: userId }).populate('productId')
        const couponData = await Coupons.findOne({ couponCode: coupon })
        const deliveryAddressData = await address.findOne({ _id: selectedAddress })
        const deliveryAddress={
            name:deliveryAddressData.name,
            mobile: deliveryAddressData.mobile,
            pincode: deliveryAddressData.pincode,
            addressType: deliveryAddressData.addressType,
            streetAddress: deliveryAddressData.streetAddress,
            city: deliveryAddressData.city,
            state: deliveryAddressData.state,
            locality: deliveryAddressData.locality,
            landmark: deliveryAddressData.landmark, 
            alterPhone: deliveryAddressData.alterPhone 
        }



        const orderedItem = await cartItems.map(item => ({
            productId: item.productId._id,
            quantity: item.quantity,
            totalProductAmount: item.price,
            offer_id: item.offer_id,
            productAmount: item.productId.price


        }))
        const walletDetails = await wallet.findOne({ userId: userId })

        if (!walletDetails) {
            return res.json({ message: "please check your wallet" })
        }

        if (walletDetails.balance < totalAmount) {
            return res.json({ message: "please check your wallet" })
        }
        const walletFund = await wallet.updateOne({ userId: userId }, { $inc: { balance: -totalAmount }, $push: { transaction: { amount: totalAmount, transactionsMethod: "Razorpay" } } })
        console.log('walletFund', walletFund);



        for (let item of orderedItem) {
            const { productId, quantity } = item

            const products = await product.updateOne({ _id: productId }, { $inc: { quantity: -quantity } });

        }
        req.session.coupon=null
        const order = new Order({
            userId: userId,
            cartId: cartItems.map(item => item._id),
            orderedItem: orderedItem,
            orderAmount: totalAmount,
            deliveryAddress: deliveryAddress,
            paymentMethod: selectedPaymentMethod,
            paymentStatus: status,
            couponDiscount: couponData ? couponData.dicountAmount : 0
        })
        const save = await order.save()

        await Cart.deleteMany({ userId: userId })
        const Payment = new payment({
            userId: userId,
            orderId: order._id,
            amount: totalAmount,
            status: 'pending',
            paymentMethod: selectedPaymentMethod

        })
        await Payment.save()

        res.status(200).json({ success: true, orderId: order._id })


    } catch (error) {

        console.log('error in place order wallet', error);
        res.status(302).json({ success: false })

    }
}

const retrunOrder = async (req, res) => {
    try {
        console.log(req.body);
        const userId = req.session.user_id
        const { selectedReason, productId, orderId } = req.body

        if (!selectedReason) {
            res.json({ success: false })

        }

        const productStatus = await Order.updateOne({ _id: orderId }, { $set: { 'orderedItem.$[item].productStatus': "returned", 'orderedItem.$[item].returReason': selectedReason } }, { arrayFilters: [{ "item._id": productId }] })


        const order = await Order.findOne({ _id: orderId }).populate("orderedItem.productId")
        const matchedItem = await order.orderedItem.filter(item => item._id == productId)



        const totalAmount = matchedItem[0].totalProductAmount

        const isExistWallet = await wallet.findOne({ userId: userId })


        if (!isExistWallet) {

            const newWallet = new wallet({
                userId: userId,
                balance: totalAmount,
                transaction: [{
                    amount: totalAmount,
                    transactionsMethod: "Refund",
                }]

            })

            await newWallet.save()
        } else {

            await wallet.updateOne({ userId: userId }, { $inc: { balance: totalAmount }, $push: { transaction: { amount: totalAmount, transactionsMethod: "Refund" } } })

        }
        if (productStatus) {

            await product.updateOne({ _id: productId }, { $inc: { quantity: matchedItem[0].quantity } })
        }


        res.status(200).json({ success: true })


    } catch (error) {
        console.log('error in return', error);
    }
}

const invoicePage = async (req, res) => {
    try {

        const { orderId, productId } = req.query
        console.log("productId", productId);
        const orderDetails = await Order.findOne({ _id: orderId.trim() }).populate('orderedItem.productId')

        const userdata = await user.findOne({ _id: req.session.user_id })
        const cartCount = await Cart.countDocuments({ userId: req.session.user_id })
        const wishlistCount = userdata.wishlist.length
        const products = orderDetails.orderedItem

        const procductData = await products.find(item => item.productId._id.toString() === productId)
        console.log('procductData', procductData);
        res.render('user/user/orderInvoice', { procductData, orderDetails, userdata, cartCount, wishlistCount })

    } catch (error) {
        console.log('error ininvoice page', error);

    }
}



module.exports = {
    addAddress,
    checkname,
    ordersuccess,
    placeorder,
    orderpage,
    singleorder,
    useraddAddress,
    cancelOrder,
    placeorderWallet,
    retrunOrder,
    invoicePage,
    retryOrder
}



