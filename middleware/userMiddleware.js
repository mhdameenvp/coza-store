const User = require('../models/userModel')
const isLogin = async (req, res, next) => {
    try {
    
        if (!req.session.user_id) {
           return  res.redirect('/')
        } 
        next()

    } catch (error) {
        console.log(error.message);
    }
}
const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
           return  res.redirect('/home')
        } 
        next()
    } catch (error) {
        console.log(error.message);
    }
}
const isBlocked = async (req, res, next) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id })
        if (!userData) {
            next();
        } else {
            console.log(userData.is_blocked)
            if (userData.is_blocked) {
                req.session.user_id=null
                res.redirect('/home')
            } else {
                next();
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    isLogin,
    isLogout,
    isBlocked

}