const user = require('../models/userModel')
const util = require('../utilities/sendEmail')
const OTP = require('../models/otpModel')
const products = require('../models/productModel')
const bcrypt = require('bcrypt')
const category = require('../models/categoryModel')
const offers = require('../models/offerModel')
const cart = require('../models/cartModel')
const wallet=require('../models/walletModel')


const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message);
    }
}

const signup = async (req, res) => {
    try {
        const messages = req.flash('message')
        res.render("user/user/register", { messages,userdata:'',cartCount:0,wishlistCount:0 })
    } catch (error) {
        console.log("error in signup page:", error);
        res.render('error')
    }
}

const verifySignup = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, mobile } = req.body
        const userCheck = await user.findOne({ email, is_verified: true })

        if (userCheck) {
            req.flash('message', "User Already Exist")
            return res.redirect('user/user/register')
        }
        if (! /^[6-9]\d{9}$/.test(mobile)) {
            req.flash('message', "Password length must be 8")
            return res.render('user/user/register')
        }
        if (password !== confirmPassword) {
            req.flash('message', "Password and confirm password is not match")
            return res.render('user/user/register')
        }


        const spassword = await securePassword(password)

        const insertUser = new user({
            name: name,
            email: email,
            password: spassword,
            mobile: mobile
        })
        const userData = await insertUser.save()

        console.log(userData);
        const userId = userData._id
        req.session.user_sign = userId
      
        req.session.user_email = userData.email
        await util.mailsender(email, userId, `It seems you logging at CoZA store and trying to verify your Email.
          Here is the verification code.Please enter otp and verify Email`)

        res.render("user/signupOtp", { message: "enter Otp", user: req.session.user_email })

    } catch (error) {
        res.render('error')
        console.log("error in verify signuop:", error);
    }
}

const userLogin = async (req, res) => {
    try {
        const messages = req.flash('message')
        res.render('user/user/login', { messages,userdata:'',cartCount:0,wishlistCount:0 })
    } catch (error) {
        console.log("error in userlogin:", error);
        res.status(500).send('Internal Server Error');
    }
}

const verifyLogin = async (req, res) => {
    try {

        const { email, password } = req.body
        console.log("email",email);
        console.log("password",password);
        const userData = await user.findOne({email:email});
        console.log(userData);
        if (!userData) {
            req.flash('message', 'User not found')
            return res.redirect('/login')

        }
        if (userData.is_blocked === true) {
            req.flash('message', "You have been blocked")
            return res.redirect('/login')
        }
        if (userData.is_verified === false) {
            req.flash('message', "Please verify your Account")
            return res.redirect('/login')

        }
        const passwordMatch = await bcrypt.compare(password, userData.password)
        if (!passwordMatch) {
            req.flash('message', "Password does not Math")
            return res.redirect('/login')
        }
        console.log('session in verify');
        req.session.user_id = userData._id

        return res.redirect('/home')

    } catch (error) {
        console.log("error in verify login", error.message);
        res.render('error')
    }
}


const otp = async (req, res) => {
    try {
        res.render('user/signupOtp', { user: req.session.user_email, message: "Enter OTP" })
    } catch (error) {
        console.log("error in otp:", error);
    }
}

const verifyOtp = async (req, res) => {
    try {

        console.log("otp reached");
        const { noOne, noTwo, noThree, noFour, email } = req.body
        const userData = await user.findOne({ email: email })
        console.log("verify otp", userData);
        const userID = req.session.user_sign
        const input = `${noOne}${noTwo}${noThree}${noFour}`
        console.log(input);
        console.log(userID);


        if (!userID) {
            console.log("no userid");
            return res.json({success:false, message: 'No userId' })
        }

        const findOtp = await OTP.find({ userid: userID }).sort({ createdAt: -1 }).limit(1)
        console.log(findOtp);

        if (findOtp.length > 0) {
            const verifyOtp = await bcrypt.compare(input, findOtp[0].otp)

            console.log('verifyotp', verifyOtp);
            if (verifyOtp) {
                await user.updateOne({ _id: userID }, { $set: { is_verified: true } }).catch((err) => {
                    console.log(err);
                })

                if( req.session.refferalId){
                    console.log(" req.session.refferalId", req.session.refferalId);
                    const walletData=await wallet.findOne({userId:req.session.refferalId})
                    if(walletData){
                        await wallet.updateOne({userId:req.session.refferalId},{$inc:{balance:100},$push:{transaction:{amount:100,   transactionsMethod:'refferal'}}})

                    }else{
                        const Walletnew= new wallet({
                            userId:req.session.refferalId,
                            balance:100,
                            transaction:[
                                {
                                    amount:100,
                                    transactionsMethod:'refferal',
                                   
                                }
                            ]

                        })
                        Walletnew.save()
                    }
                    
                    const newWallet= new wallet({
                        userId:req.session.user_sign,
                        balance:50,
                        transaction:[
                            {
                                amount:50,
                                transactionsMethod:'refferal',
                               
                            }
                        ]

                    })
                    newWallet.save()

                }

                res.json({success:true})
            } else {

                // req.session.user_id = userID
               return res.json({success:false, message: 'Incorrect OTP' })

            }
        }
    } catch (error) {
        console.log("error in verifyotp:", error);
    }


}

const resendOtp = async (req, res) => {
    try {
        const userId = req.session.user_sign
        const email = req.session.user_email
        console.log("userId",userId);
        console.log("email",email);
        console.log("userId", userId);
        await util.mailsender(email, userId, `It seems you logging at CoZA store and trying to verify your Email.
        Here is the verification code.Please enter otp and verify Email`)
          res.status(200).json({ success: true })

    } catch (error) {
        console.log('Error in resend otp ', error);
        res.status(404).json({ success: false })
    }
}




//---------forgot otp--------------//

const forgotPass = async (req, res) => {
    try {
        const messages = req.flash('message')
        res.render('user/user/forgetPassword', { messages })
    } catch (error) {
        console.log('error in forgetpass', error);
    }
}

const forgotOtp = async (req, res) => {
    try {
        const email = req.body.email

        const existemail = await user.findOne({ email: email, is_verified: true })

        console.log(existemail);
        if (!existemail) {
            req.flash('message', "Email does not exist")
            res.redirect('/forgot')
        } else {
            req.session.email_id = email
            req.session.userid = existemail._id
            await util.mailsender(email, existemail._id, `It seems you logging at CoZA store and trying to verify your Email.
            Here is the verification code.Please enter otp and verify Email`)
            res.render('user/user/forgotOtp', { email })


        }

    } catch (error) {
        console.log('error in forgot');
    }
}

const forgotResend = async (req, res) => {
    try {

        const email = req.body.email

        const existemail = await user.findOne({ email: email })

        if (existemail) {
            await util.mailsender(email, existemail._id, `It seems you logging at CoZA store and trying to verify your Email.
            Here is the verification code.Please enter otp and verify Email`)
            res.status(200).json({ success: true })
        }

    } catch (error) {
        console.log('error in forgotResend', error);
    }
}

const forgotVerifyOtp = async (req, res) => {
    try {
        const userId = req.session.userid
        const otp = req.body.otp

        console.log("otp ", otp);
        console.log("userId", userId);
        const findOtp = await OTP.findOne({ userid: userId }).sort({ createdAt: -1 }).limit(1)
        console.log(findOtp);
        if (findOtp) {
            const verifyOtp = await bcrypt.compare(otp, findOtp.otp)
            console.log(verifyOtp);
            if (verifyOtp) {
                console.log("verify otp");
                res.json({ success: true })
            } else {
                res.json({ success: false })
            }

        }

    } catch (error) {
        console.log('error in  forgot password otp', error);
    }
}


const loadresetPass = async (req, res) => {
    try {
        res.render('user/user/forgotPasschange')


    } catch (error) {
        console.log("error in resetpassword");
    }
}

const resetPass = async (req, res) => {
    try {
        const { password } = req.body
        const userId = req.session.userid
        const oldpassword = await user.findOne({ _id: userId })
        console.log("oldpassword", oldpassword);
        const oldpasswordMatch = await bcrypt.compare(password, oldpassword.password)
        console.log("oldpasswordMatch", oldpasswordMatch);
        if (oldpasswordMatch) {
            return res.json({ passwordMatch: true })
        }

        const spassword = await securePassword(password)
        const update = await user.updateOne({ _id: userId }, { $set: { password: spassword } })
        console.log(update);
        if (update) {
            res.status(200).json({ success: true })
        } else {
            res.json({ success: false })
        }


    } catch (error) {
        console.log('error in resetpassword', error);
    }
}

const userLogout = async (req, res) => {
    try {
        req.session.user_id = null
        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
}

const Homepage = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;
    try {

        let userData = req.session.user_id;
        if(userData){}
        let userdata = await user.findOne({ _id: userData, is_blocked: false });
        let categoryData = await category.find({});
        let offerData = await offers.find({
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        let productData = await products.find({ is_blocked: false, is_categoryBlocked: false })
            .sort({ _id: -1 })
            .limit(limit)
            .skip(skip)
            .populate('categoryId');

        productData = productData.map(product => {
            let productDiscountedPrice = product.price;
            let categoryDiscountedPrice = product.price;
            let appliedOffer = null;


            offerData.forEach(offer => {
                if (offer.offerType === 'product' && offer.productId.includes(product._id.toString())) {
                    productDiscountedPrice = product.price - (product.price * offer.discount / 100);
                }
            });


            offerData.forEach(offer => {
                if (offer.offerType === 'category' && offer.categoryId.includes(product.categoryId._id.toString())) {
                    categoryDiscountedPrice = product.price - (product.price * offer.discount / 100);
                }
            });


            if (productDiscountedPrice <= categoryDiscountedPrice) {
                appliedOffer = offerData.find(offer => offer.offerType === 'product' && offer.productId.includes(product._id.toString()));
                discountedPrice = Math.round(productDiscountedPrice);
            } else {
                appliedOffer = offerData.find(offer => offer.offerType === 'category' && offer.categoryId.includes(product.categoryId._id.toString()));
                discountedPrice = Math.round(categoryDiscountedPrice);
            }

            return {
                ...product.toObject(),
                originalPrice: product.price,
                discountedPrice,
                appliedOffer: appliedOffer ? {
                    offerName: appliedOffer.offerName,
                    discount: appliedOffer.discount
                } : null,
                offerText: appliedOffer ? `${appliedOffer.discount}% Off` : ''
            };
        });
        const totalProducts = await products.countDocuments({ is_blocked: false, is_categoryBlocked: false });
        const totalPages = Math.ceil(totalProducts / limit);

        const cartCount = await cart.countDocuments({ userId: req.session.user_id });

        let wishlistCount;
        if (userdata) {

            wishlistCount = userdata.wishlist.length

        } else {
            wishlistCount = 0

        }
        console.log("wishlistCount", wishlistCount);

        if (userdata) {
            res.render('user/user/home', {
                product: productData,
                userdata: userdata,
                categoryData,
                offerData,
                cartCount,
                wishlistCount,
                currentPage: page,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: totalPages
            });
        } else {
            res.render('user/user/home', {
                product: productData,
                userdata: null,
                categoryData,
                offerData,
                cartCount: 0,
                wishlistCount,
                currentPage: page,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: totalPages
            });
        }
    } catch (error) {
        console.log("error in home after login:", error);
    }
};


const shop = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    try {

        let userData = req.session.user_id;
        let userdata = await user.findOne({ _id: userData, is_blocked: false });
        let categoryData = await category.find({});
        let offerData = await offers.find({
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });
        let productData = await products.find({ is_blocked: false, is_categoryBlocked: false })
            .sort({ _id: -1 })
            .limit(limit)
            .skip(skip)
            .populate('categoryId');

        productData = productData.map(product => {
            let productDiscountedPrice = product.price;
            let categoryDiscountedPrice = product.price;
            let appliedOffer = null;


            offerData.forEach(offer => {
                if (offer.offerType === 'product' && offer.productId.includes(product._id.toString())) {
                    productDiscountedPrice = product.price - (product.price * offer.discount / 100);
                }
            });


            offerData.forEach(offer => {
                if (offer.offerType === 'category' && offer.categoryId.includes(product.categoryId._id.toString())) {
                    categoryDiscountedPrice = product.price - (product.price * offer.discount / 100);
                }
            });


            if (productDiscountedPrice <= categoryDiscountedPrice) {
                appliedOffer = offerData.find(offer => offer.offerType === 'product' && offer.productId.includes(product._id.toString()));
                discountedPrice = Math.round(productDiscountedPrice);
            } else {
                appliedOffer = offerData.find(offer => offer.offerType === 'category' && offer.categoryId.includes(product.categoryId._id.toString()));
                discountedPrice = Math.round(categoryDiscountedPrice);
            }

            return {
                ...product.toObject(),
                originalPrice: product.price,
                discountedPrice,
                appliedOffer: appliedOffer ? {
                    offerName: appliedOffer.offerName,
                    discount: appliedOffer.discount
                } : null,
                offerText: appliedOffer ? `${appliedOffer.discount}% Off` : ''
            };
        });
        const totalProducts = await products.countDocuments({ is_blocked: false, is_categoryBlocked: false });
        const totalPages = Math.ceil(totalProducts / limit);

        const cartCount = await cart.countDocuments({ userId: req.session.user_id });
        const wishlistCount = userdata.wishlist.length

        res.render('user/shop', {
            product: productData, categories: categoryData, userdata, cartCount, wishlistCount,
            currentPage: page,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: totalPages
        })
    } catch (error) {
        console.log('error in shop', error);
    }
}

const checkEmail = async (req, res) => {
    try {
        const { email } = req.body
        const check = await user.findOne({ email: email, is_verified: true })
        console.log(check);
        if (check) {
            res.status(200).json({ success: true })
        } else {
            res.json({ success: false })
        }

    } catch (error) {
        console.log('error in check email', error);
    }
}

module.exports = {
    otp,
    signup,
    verifySignup,
    userLogin,
    verifyLogin,
    userLogout,
    Homepage,
    verifyOtp,
    shop,
    checkEmail,
    resendOtp,
    forgotPass,
    forgotOtp,
    loadresetPass,
    forgotVerifyOtp,
    resetPass,
    forgotResend
}