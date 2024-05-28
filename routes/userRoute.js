const express = require('express');

const auth=require('../middleware/userMiddleware')
const userAuth=require('../controller/userAuth')
const userController=require("../controller/userController")
const cartController=require('../controller/cartController')
const orderController=require('../controller/orderController')
const paymentController=require('../controller/paymentController')
const productControlller = require('../controller/ProductController');
const couponController=require('../controller/couponController')
const refferalController=require('../controller/referralController')

const chatController=require('../controller/chatController')
const  userRoute=express()
    


userRoute.get('/',userAuth.Homepage)
userRoute.get('/home',auth.isLogin,userAuth.Homepage)
userRoute.get('/login',auth.isLogout,userAuth.userLogin)
userRoute.post('/login',auth.isLogout,userAuth.verifyLogin)


userRoute.get('/logout',userAuth.userLogout)

userRoute.get('/register',userAuth.signup)
userRoute.post('/checkEmail',userAuth.checkEmail)


userRoute.get('/signup',auth.isLogout,userAuth.signup)
userRoute.post('/signup',userAuth.verifySignup)

userRoute.get('/signupOtp',auth.isLogout,userAuth.otp)
userRoute.post('/signupOtp',userAuth.verifyOtp)
userRoute.post('/resendOtp',auth.isLogout,userAuth.resendOtp)


userRoute.get('/forgot',auth.isLogout,userAuth.forgotPass)
userRoute.post('/send-otp',auth.isLogout,userAuth.forgotOtp)
userRoute.post('/forgotResendOtp',auth.isLogout,userAuth.forgotResend)
userRoute.post('/verifyOtp',auth.isLogout,userAuth.forgotVerifyOtp)
userRoute.get('/resetPassword',auth.isLogout,userAuth.loadresetPass)
userRoute.post('/resetPassword',auth.isLogout,userAuth.resetPass)

userRoute.get('/shops',auth.isLogin,auth.isBlocked,userAuth.shop)
userRoute.get('/home',auth.isLogin,auth.isBlocked,userAuth.Homepage)
userRoute.get('/shoppingcart',auth.isLogin,auth.isBlocked,cartController.shoppingcart)
userRoute.get('/product',auth.isLogin,auth.isBlocked,userController.singleProduct)
userRoute.post('/addcart',auth.isLogin,auth.isBlocked,cartController.addToCart)
userRoute.get('/addcart/:id',auth.isLogin,auth.isBlocked,cartController.itemExist)
userRoute.post('/checkStock',auth.isLogin,auth.isBlocked,cartController.checkStock)
userRoute.patch('/editprice',auth.isLogin,auth.isBlocked,cartController.editPrice)
userRoute.post('/removeProduct',auth.isBlocked,cartController.removeProduct)

userRoute.get('/profile',auth.isLogin,auth.isBlocked,userController.profile)
userRoute.get('/editProfile',auth.isLogin,auth.isBlocked,userController.loadeditProfile)
userRoute.get('/emailOtp',auth.isLogin,auth.isBlocked,userController.emailEditOtp)
userRoute.post('/emailResentOtp',auth.isLogin,auth.isBlocked,userController.emailResendOtp)
               
userRoute.post('/verifyEmailOtp',auth.isLogin,auth.isBlocked,userController.verifyEmailOtp)
userRoute.patch('/updateprofile',auth.isLogin,auth.isBlocked,userController.updateProfile)
userRoute.get('/changePassword',auth.isLogin,auth.isBlocked,userController.changePass)
userRoute.post('/check-password',auth.isLogin,auth.isBlocked,userController.checkpass)
userRoute.post('/passwordChange',auth.isLogin,auth.isBlocked,userController.updatePass)

userRoute.get('/wallet',auth.isLogin,auth.isBlocked,userController.wallet)

userRoute.post('/coupon',auth.isLogin,auth.isBlocked,couponController.usercoupon)
userRoute.post('/couponCheck',auth.isLogin,auth.isBlocked,couponController.checkCoupon)
userRoute.post('/removeCoupon',auth.isLogin,auth.isBlocked,couponController.removeCoupon)
userRoute.post('/amount',auth.isLogin,auth.isBlocked,couponController.amount)

userRoute.get('/wishlist',auth.isLogin,auth.isBlocked,userController.wishlist)
userRoute.post('/wishlist',auth.isLogin,auth.isBlocked,userController.addWishlist)
userRoute.post('/checkwishlist',auth.isLogin,auth.isBlocked,userController.checkWishlist)
userRoute.post('/removeWhishlist',auth.isLogin,auth.isBlocked,userController.removeWishlist)





userRoute.post('/checkout',auth.isLogin,auth.isBlocked,cartController.checkout)
userRoute.post('/checkname',auth.isLogin,auth.isBlocked,orderController.checkname)
userRoute.post('/placeorder',auth.isLogin,auth.isBlocked,orderController.placeorder)
userRoute.post('/createOrder',auth.isLogin,paymentController.createorder)
userRoute.post('/verifiaction',auth.isLogin,paymentController.verifypayment)
userRoute.post('/retryPayment',auth.isLogin,auth.isBlocked,orderController.retryOrder)


userRoute.get('/checkout',auth.isLogin,auth.isBlocked,cartController.checkout)
userRoute.get('/ordersuccess',auth.isLogin,auth.isBlocked,orderController.ordersuccess)
userRoute.post('/AddressSave',auth.isLogin,auth.isBlocked,orderController.addAddress)

userRoute.get('/orderpage',auth.isLogin,auth.isBlocked,orderController.orderpage)
userRoute.get('/singleorder',auth.isLogin,auth.isBlocked,orderController.singleorder)
userRoute.get('/invoice',auth.isLogin,auth.isBlocked,orderController.invoicePage)

userRoute.get('/userAddress',auth.isLogin,auth.isBlocked,userController.address)
userRoute.post('/userAddressSave',auth.isLogin,auth.isBlocked,orderController.useraddAddress)
userRoute.get('/addAddress',auth.isLogin,auth.isBlocked,userController.addAddress)
userRoute.get('/editAddress',auth.isLogin,auth.isBlocked,userController.loadeditAddress)
userRoute.post('/editAddress',auth.isLogin,auth.isBlocked,userController.editAddress)
userRoute.get('/deleteAddress',auth.isLogin,auth.isBlocked,userController.deleteAddress)


userRoute.get('/productsCat',auth.isLogin,auth.isBlocked,productControlller.findbyCategory)
userRoute.patch('/cancelorder',auth.isLogin,auth.isBlocked,orderController.cancelOrder)
userRoute.post("/return",auth.isLogin,auth.isBlocked,orderController.retrunOrder)

userRoute.post('/addfunds',auth.isLogin,paymentController.addFunds)
userRoute.post('/fundVerification',auth.isLogin,paymentController.fundVerification)
userRoute.post('/addWallet',auth.isLogin,auth.isBlocked,userController.addWallet)

userRoute.post('/placeorderWallet',auth.isLogin,auth.isBlocked,orderController.placeorderWallet)

userRoute.get('/about',auth.isLogin,auth.isBlocked,userController.about)
userRoute.get('/contact',auth.isLogin,auth.isBlocked,userController.contact)

userRoute.get('/highLow',auth.isLogin,auth.isBlocked,productControlller.highLow)
userRoute.get('/lowHigh',auth.isLogin,auth.isBlocked,productControlller.lowHigh)
userRoute.get('/A-Z',auth.isLogin,auth.isBlocked,productControlller.aToZ)
userRoute.get('/Z-A',auth.isLogin,auth.isBlocked,productControlller.zToa)
userRoute.get("/catSort",auth.isLogin,auth.isBlocked,productControlller.catSort)
userRoute.post("/Search",auth.isLogin,auth.isBlocked,productControlller.Search)


userRoute.get('/referral',refferalController.refferl)

userRoute.get('/chat',auth.isLogin,auth.isBlocked,chatController.LoadchatPage)

userRoute.post('/saveChat',chatController.saveChat)

module.exports=userRoute