const express = require('express');
const admin_route = express();
const adminMiddleware=require('../middleware/adminMiddleware')
const adminAuth=require('../controller/adminAuth')
const adminController=require('../controller/adminController');
const products = require('../controller/ProductController');
const multer=require('../middleware/multerMiddleware')
const couponController=require('../controller/couponController')
const offerController= require('../controller/offerController')
const salesReport=require('../controller/salesReport')
const chatController=require('../controller/chatController')

admin_route.set("view engine",'ejs')
admin_route.set("views","./views/admin")

admin_route.get('/',adminMiddleware.isLogout,adminAuth.adminLogin)
admin_route.post('/adminlogin',adminMiddleware.isLogout,adminAuth.adminVerify)
admin_route.get('/logout',adminAuth.adminLogout)
admin_route.get("/dashboard",adminMiddleware.isLogin,adminAuth.dashboard)
admin_route.get('/userlist',adminMiddleware.isLogin,adminController.userList)
admin_route.get('/blockuser',adminMiddleware.isLogin,adminController.blockUser)
admin_route.get('/unblockuser',adminMiddleware.isLogin,adminController.unblockUser)

admin_route.get('/category',adminMiddleware.isLogin,adminController.categories)
admin_route.get('/findcatId',adminMiddleware.isLogin,adminController.findCatId)
admin_route.get('/addcategory',adminMiddleware.isLogin,adminController.loadAddCategory)
admin_route.post('/addcategory',adminMiddleware.isLogin,adminController.addCategory)
admin_route.get('/editcategory',adminMiddleware.isLogin,adminController.loadEditCategory)

admin_route.post('/editcategory',adminMiddleware.isLogin,adminController.editCategory)
admin_route.get('/blockCategory',adminMiddleware.isLogin,adminController.blockCategory)
admin_route.get('/unblockCategory',adminMiddleware.isLogin,adminController.unblockCategory)
admin_route.get('/findcategory',adminController.findCategory)

admin_route.get('/productlist',adminMiddleware.isLogin,products.loadProduct)
admin_route.post("/unblockcategory",adminMiddleware.isLogin,adminController.unblockCategory)


admin_route.get('/addproduct',adminMiddleware.isLogin,products.loadAddProduct)
admin_route.post('/addproduct',adminMiddleware.isLogin,multer.uploadProduct,products.addProduct)
admin_route.post('/blockcategory/',adminMiddleware.isLogin,adminController.blockCategory)
admin_route.get('/unlistproduct',adminMiddleware.isLogin,products.unlistProduct)
admin_route.get('/listproduct',adminMiddleware.isLogin,products.listProduct)
admin_route.get('/editproduct',adminMiddleware.isLogin,products.loadeditProduct)   
admin_route.post('/deleteImage',products.deleteProductImage)

admin_route.post('/editproduct',adminMiddleware.isLogin,multer.uploadProduct,products.editProduct)
admin_route.get('/oderDetails',adminMiddleware.isLogin,adminController.oderDetails)
admin_route.get('/singleorderview',adminMiddleware.isLogin,adminController.singleProduct)
admin_route.post('/updatestatus',adminMiddleware.isLogin,adminController.updateSts)


admin_route.get('/Coupon',adminMiddleware.isLogin,couponController.coupon)
admin_route.post('/Coupon',adminMiddleware.isLogin,couponController.addCoupon)
admin_route.post('/updatecoupon',adminMiddleware.isLogin,couponController.updateCoupon)
admin_route.post('/editCoupon',adminMiddleware.isLogin,couponController.editCoupon)
admin_route.post('/deletecoupon',adminMiddleware.isLogin,couponController.deleteCoupon)

admin_route.get('/offer',adminMiddleware.isLogin,offerController.offer)
admin_route.post('/offerType',adminMiddleware.isLogin,offerController.offerType)
admin_route.post('/addOffer',adminMiddleware.isLogin,offerController.addOffer)
admin_route.get('/editOffer',adminMiddleware.isLogin,offerController.loadEdit)
admin_route.post('/offerIdSave',adminMiddleware.isLogin,offerController.offerproductIdSave)
admin_route.post('/catIdSave',adminMiddleware.isLogin,offerController.offercatIdSave)
admin_route.patch('/editOffer',adminMiddleware.isLogin,offerController.editOffer)
admin_route.post('/deleteOffer',adminMiddleware.isLogin,offerController.deleteOffer)


admin_route.get('/salesDaily',adminMiddleware.isLogin,salesReport.dailySaleReport)
admin_route.get('/salesWeekly',adminMiddleware.isLogin,salesReport.weeklySalesReport)
admin_route.get('/salesMonthly',adminMiddleware.isLogin,salesReport.monthlySalesReport)
admin_route.get('/salesYearly',adminMiddleware.isLogin,salesReport.YearlySalesReport)
admin_route.post('/customDate',adminMiddleware.isLogin,salesReport.customDateSort)
admin_route.get('/yearlyChart',adminMiddleware.isLogin,salesReport.yearlyChart)

admin_route.get('/bestSellingProduct',adminMiddleware.isLogin,salesReport.bestSellingProduct)
admin_route.get('/bestSellingBrand',adminMiddleware.isLogin,salesReport.bestSellingBrands)
admin_route.get('/bestSellingCategory',adminMiddleware.isLogin,salesReport.bestSellingCategories)
admin_route.get('/checkDataExist',adminMiddleware.isLogin,salesReport.checkDataExist)
admin_route.get('/adminChat',adminMiddleware.isLogin,chatController.adminChatPage)

module.exports = admin_route;
