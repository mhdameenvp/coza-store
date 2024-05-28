const User = require('../models/userModel')
const bcrypt = require('bcrypt');
const product = require('../models/productModel')
const Address = require('../models/addressModal');
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const Wallet = require('../models/walletModel');
const moment = require('moment')
const Category = require('../models/categoryModel')
const offers = require('../models/offerModel')
const util = require('../utilities/sendEmail')
const OTP = require('../models/otpModel')

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message);
    }
}


const loadshop = async (req, res) => {
    try {
        const productArray = await product.find({ is_categoryBlocked: false, is_blocked: false })
        res.render("user/shop", { productArray })
    } catch (error) {
        console.log("error in loadshop:", error);
        res.render('error')
    }
}

const profile = async (req, res) => {
    try {

        let userData = await User.findOne({ _id: req.session.user_id, is_blocked: false })
        let address = null
        const cartCount = await Cart.countDocuments({ userId: req.session.user_id })
        const wishlistCount = userData.wishlist.length
        if (userData) {
            res.render('user/user/profile', { userdata:userData, Address: address,cartCount,wishlistCount })
        } else {
            res.render('error')
        }
    } catch (error) {
        console.log("Error in profile:", error)
    }
}

const loadeditProfile = async (req, res) => {
    try {
        const messages = req.flash('message')
        const userId = req.session.user_id
        const userData = await User.findOne({ _id: userId })
        const cartCount = await Cart.countDocuments({ userId: req.session.user_id })
        const wishlistCount = userData.wishlist.length
        res.render('user/user/profileEdit', { userdata:userData, messages,cartCount,wishlistCount })

    } catch (error) {
        console.log('error in edit profile page');
    }
}

const updateProfile = async (req, res) => {
    try {


        const { fullname, email, age, gender, phone } = req.body
        console.log("email", email);
        const userId = req.session.user_id
        req.session.fullname = fullname
        req.session.age = age
        req.session.gender = gender
        const existNewEmail=await User.findOne({_id:{$ne:userId} , email:email})
        const findEmail = await User.findOne({ _id: userId })
        if(existNewEmail){
            return res.json({ success: false, message: 'Email already existed' })
        }

        if (!email || email.trim() == " ") {
            return res.json({ success: false, message: 'Please Enter email' })

        }

        if (findEmail.email !== email) {
            console.log("cehcking the email");
            req.session.new_email = email
            return res.json({ email: email, message: "" })

        }

        if (!fullname || fullname.trim() == " ") {
            return res.json({ success: false, message: 'user Name required' })
        }
        if (phone.length !== 10) {
            return res.json({ success: false, message: 'Eneter a valid phone number' })
        }

        const update = await User.updateOne({ _id: userId }, { $set: { name: fullname, email: email, age: age, gender: gender, mobile: phone } })
        console.log(update);
        if (update) {
            return res.status(200).json({ success: true, message: '' })

        } else {
            res.json('failed')
        }
    } catch (error) {
        console.log('error in update profile');
    }
}


const singleProduct = async (req, res,) => {
    try {

        const productId = req.query.productId;
        const productData = await product.findOne({ _id: productId });
        const categoryData = await product.find({ categoryId: productData.categoryId, _id: { $ne: productId } });
        const userData = await User.findOne({ _id: req.session.user_id })
        const cartCount = (await Cart.find({ userId: req.session.user_id })).length
        const wishlistCount = userData.wishlist.length
        let offerData = await offers.find({
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        let productDiscountedPrice = productData.price;
        let categoryDiscountedPrice = productData.price;
        let discountedPrice;
        let appliedOffer = null;

        offerData.forEach(offer => {
            if (offer.offerType === 'product' && offer.productId.includes(productData._id.toString())) {
                productDiscountedPrice = productData.price - (productData.price * offer.discount / 100);
            }
            if (offer.offerType === 'category' && offer.categoryId.includes(productData.categoryId.toString())) {
                categoryDiscountedPrice = productData.price - (productData.price * offer.discount / 100);
            }
        });

        if (productDiscountedPrice <= categoryDiscountedPrice) {
            appliedOffer = offerData.find(offer => offer.offerType === 'product' && offer.productId.includes(productData._id.toString()));
            discountedPrice = Math.round(productDiscountedPrice);
        } else {
            appliedOffer = offerData.find(offer => offer.offerType === 'category' && offer.categoryId.includes(productData.categoryId.toString()));
            discountedPrice = Math.round(categoryDiscountedPrice);
        }

        res.render('user/singleProduct', {
            product: { ...productData.toObject(), originalPrice: productData.price, discountedPrice, appliedOffer: appliedOffer ? { offerName: appliedOffer.offerName, discount: appliedOffer.discount } : null },
            userdata: userData,
            categoryData,
            cartCount,
            wishlistCount

        });
    } catch (error) {
        console.log("error in Single product:", error);
        res.render('error');
    }

}

const changePass = async (req, res) => {
    try {
        const userId = req.session.user_id
        const userdata = await User.findOne({ _id: userId, })
      
        const cartCount = await Cart.countDocuments({ userId: req.session.user_id })
        const wishlistCount = userdata.wishlist.length
  
        res.render('user/user/changePassword', { userdata,cartCount,wishlistCount })


    } catch (error) {
        console.log('error in change password',error);
    }
}

const checkpass = async (req, res) => {
    try {
        const { currentPassval } = req.body
        const userId = req.session.user_id
        const userData = await User.findOne({ _id: userId, })
        const passwordMatch = await bcrypt.compare(currentPassval, userData.password)
        if (passwordMatch) {
            res.json({ success: true, message: "" })
        } else {
            res.json({ success: false, message: "password is incorrect" })
        }

    } catch (error) {
        console.log('error in check password');
    }
}


const updatePass = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body
        console.log('newPassword', newPassword);
        console.log('confirmPassword', confirmPassword);

        if (newPassword !== confirmPassword) {

            req.flash('message', "Password is not matching")
            return res.redirect('user/user/changePassword')
        }

        if (!newPassword || newPassword.trim() == " ") {

            req.flash('message', "Password is required")
            return res.redirect('user/user/changePassword')
        }
        if (newPassword.length < 8) {

            req.flash('message', "Password length must be 8")
            return res.redirect('user/user/changePassword')
        }

        const spassword = await securePassword(newPassword)

        const userId = req.session.user_id
        const update = await User.updateOne({ _id: userId }, { $set: { password: spassword } })
        req.session.user_id = null
        if (update) {
            res.json({ success: true })
        } else {
            res.json({ success: false })
        }

    } catch (error) {
        console.log('error in update password');
    }
}

const address = async (req, res) => {
    try {
        const messages = req.flash('message')
        const userId = req.session.user_id
        const userdata = await User.findOne({ _id: userId })
        const cartCount = await Cart.countDocuments({ userId: req.session.user_id })
        const wishlistCount = userdata.wishlist.length
        const addressDetail = await Address.find({ userId: userId }).populate('userId')
        console.log("address detail", addressDetail);

        res.render('user/user/address', { addressDetail, messages ,userdata,cartCount,wishlistCount})
    } catch (error) {
        console.log("error in address");
    }
}

const addAddress = async (req, res) => {
    try {
        const userdata = await User.findOne({ _id:  req.session.user_id })
        const cartCount = await Cart.countDocuments({ userId: req.session.user_id })
        const wishlistCount = userdata.wishlist.length
        const messages = req.flash('message')
        res.render('user/user/addAddress', { messages,userdata,cartCount,wishlistCount })
    } catch (error) {
        console.log('error in add address');
    }
}

const loadeditAddress = async (req, res) => {
    try {
        const messages = req.flash('message')
        const { adddressId } = req.query
        const address = await Address.findOne({ _id: adddressId })
        const userId = req.session.user_id
        const userdata = await User.findOne({ _id: userId })
        const cartCount = await Cart.countDocuments({ userId: req.session.user_id })
        const wishlistCount = userdata.wishlist.length
        res.render('user/user/editAddress', { address, messages,userdata,cartCount,wishlistCount })
    } catch (error) {
        console.log("error in edit address");
    }
}

const editAddress = async (req, res) => {
    try {
        const { name, mobile, pincode, locality, streetAddress, city, state, landmark, addressType, id } = req.body
        // if(!name||name.trim()==" "){
        //     req.flash('message',"user Name is required")
        //     return res.redirect('/user/addAddress')
        //  }

        //  if(mobile.length!==10){
        //   req.flash('message',"Please Enter Valid Number")
        //   return res.redirect('/user/addAddress')
        //  }

        //  if(pincode!==6){
        //   req.flash('message',"Please Enter Valid Pincode")
        //   return res.redirect('/user/addAddress')
        //  }


        const details = await Address.updateOne({ _id: id }, { $set: { name: name, mobile: mobile, pincode: pincode, locality: locality, streetAddress: streetAddress, city: city, state: state, landmark: landmark, addressType: addressType } })
        if (details) {
            res.redirect('/userAddress')
        }
    } catch (error) {
        console.log('error in editAddress', error);
    }
}

const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.query
        const remove = await Address.deleteOne({ _id: addressId })
        if (remove) {
            res.redirect('/userAddress')
        }

    } catch (error) {
        console.log('error in delete address');
    }
}

const wallet = async (req, res) => {
    try {
        const userId = req.session.user_id
        const userdata = await User.findOne({ _id: userId })
        const cartCount = await Cart.countDocuments({ userId: req.session.user_id })
        const wishlistCount = userdata.wishlist.length
        const WalletDetails = await Wallet.findOne({ userId: userId })

        if (WalletDetails) {


            const formattedTransactions = WalletDetails.transaction.map(transaction => {
                const formattedDate = moment(transaction.date).format('YYYY-MM-DD');
                return {
                    ...transaction.toObject(),
                    formattedDate,
                }

            }).sort((a, b) => (a._id > b._id ? -1 : 1));

            const formattedWallet = {
                ...WalletDetails.toObject(),
                transaction: formattedTransactions
            }


            res.render('user/user/wallet', { WalletDetails: formattedWallet ,cartCount,wishlistCount,userdata})
        } else {
            res.render('user/user/wallet', { WalletDetails: 0,cartCount,wishlistCount,userdata })
        }
    } catch (error) {
        console.log('error in wallet page');
    }
}

const addWallet = async (req, res) => {
    try {
        const { Amount } = req.body
        const userId = req.session.user_id
        const WalletDetail = await Wallet.findOne({ userId: userId })
        if (!WalletDetail) {

            const newWallet = new Wallet({
                userId: userId,
                balance: Amount,
                tratransaction: [{
                    amount: Amount,
                    transactionsMethod: "Debit",
                }]

            })
            await newWallet.save()

        } else {
            await Wallet.updateOne({ userId: userId }, { $inc: { balance: Amount }, $push: { transaction: { amount: Amount, transactionsMethod: "Debit" } } })
        }
        res.status(200).json({ success: true })

    } catch (error) {
        res.status(302).json({ success: false })
        console.log('error in add wallet', error);
    }
}

const wishlist = async (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = 4; 
    const skip = (page - 1) * limit; 

    try {
        const userId = req.session.user_id;

        const userdata = await User.findOne({ _id: userId })
        const cartCount = await Cart.countDocuments({ userId: req.session.user_id })
        const wishlistCount = userdata.wishlist.length
        const user = await User.findById(userId).select('wishlist');
        if (!user) {
            return res.status(404).send('User not found');
        }

      
        const totalItems = user.wishlist.length;
        const totalPages = Math.ceil(totalItems / limit);

        
        const wishlistProductIds = user.wishlist.slice(skip, skip + limit);
        const wishlistItems = await product.find({
            '_id': { $in: wishlistProductIds }
        });

    
        const userDataWithPagination = {
            ...user.toObject(),
            wishlist: wishlistItems,
            pagination: {
                currentPage: page,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                previousPage: page > 1 ? page - 1 : null,
                lastPage: totalPages
            }
        };

        res.render('user/user/wishlist', { userData: userDataWithPagination,cartCount,wishlistCount,userdata });

    } catch (error) {
        console.log('error in wishlist', error);
        res.status(500).send('Server error');
    }
};


const addWishlist = async (req, res) => {
    try {
        const { productId } = req.body
        const userId = req.session.user_id
        const wishlist = await User.updateOne({ _id: userId }, { $push: { wishlist: productId } })
        const userdata=await User.findOne({_id:userId})
        const wishlitCount=userdata.wishlist.length
       
        res.status(200).json({ success: true,wishlitCount })

    } catch (error) {
        console.log('error in add wishlist');
    }
}

const removeWishlist = async (req, res) => {
    try {
        const { productId } = req.body
        console.log(req.body);
        const userId = req.session.user_id
        const removewishlist = await User.updateOne({ _id: userId }, { $pull: { wishlist: productId } })

        const userdata=await User.findOne({_id:userId})
        const wishlitCount=userdata.wishlist.length
 
        if (removewishlist) {
            res.status(200).json({ success: true,wishlitCount })
        } else {
            res.json({ success: false, })
        }

    } catch (error) {
        console.log("error in remove wishlist", error);
    }
}

const checkWishlist = async (req, res) => {
    try {
        const { productId } = req.body
        const userId = req.session.user_id
        const userData = await User.findOne({ _id: userId })
        const isInWishlist = userData.wishlist.some(item => item.toString() === productId);
        res.json({ success: isInWishlist })

    } catch (error) {
        console.log('error in wishlist check', error);
        res.status(500).json({ success: false })
    }
}

const about = async (req, res) => {
    try {
        res.render('user/about')

    } catch (error) {
        console.log('error inn about page', error);
    }
}

const contact = async (req, res) => {
    try {
        res.render('user/contact')
    } catch (error) {
        console.log('error in contact page');
    }
}


const emailEditOtp = async (req, res) => {
    try {
        const userId = req.session.user_id
        console.log("");
        const email = req.session.new_email
        console.log("email", email);
        console.log("email", userId);
        await util.mailsender(email, userId, `It seems you logging at CoZA store and trying to verify your Email.
        Here is the verification code.Please enter otp and verify Email`)

        res.render('user/user/emailOtp', { email })

    } catch (error) {

    }
}
const emailResendOtp = async (req, res) => {
    try {
        const userId = req.session.user_id
        const email = req.body.email
        console.log("email", email);



        await util.mailsender(email, userId, `It seems you logging at CoZA store and trying to verify your Email.
            Here is the verification code.Please enter otp and verify Email`)
        res.status(200).json({ success: true })

    } catch (error) {
        console.log('error in forgotResend', error);
    }
}
const verifyEmailOtp = async (req, res) => {
    try {
        const userId = req.session.user_id
        const otp = req.body.otp

        console.log("otp ", otp);
        console.log("userId", userId);
        const findOtp = await OTP.findOne({ userid: userId }).sort({ createdAt: -1 }).limit(1)
        console.log(findOtp);
        if (findOtp) {
            const verifyOtp = await bcrypt.compare(otp, findOtp.otp)
            console.log(verifyOtp);
            if (verifyOtp) {

                await User.updateOne({ _id: userId }, { $set: { email: req.session.new_email,name:req.session.fullname,age:req.session.age,gender:req.session.gender } })
                console.log("verify otp");
                res.json({ success: true })
            } else {
                res.json({ success: false })
            }

        }

    } catch (error) {

    }
}

module.exports = {
    singleProduct,
    loadshop,
    profile,
    loadeditProfile,
    updateProfile,
    changePass,
    checkpass,
    address,
    updatePass,
    addAddress,
    loadeditAddress,
    editAddress,
    deleteAddress,
    wallet,
    wishlist,
    addWishlist,
    removeWishlist,
    checkWishlist,
    addWallet,
    about,
    contact,
    emailEditOtp,
    emailResendOtp,
    verifyEmailOtp
}


