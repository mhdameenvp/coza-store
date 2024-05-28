const isLogin = (req, res, next) => {
    try {
        if (!req.session.admin_id) {
           return res.redirect("/admin/")
        } 
        next()
    } catch (error) {
        console.log("Error in islogin:", error);
    }
}
const isLogout = (req, res, next) => {
    try {
        if (req.session.admin_id) {
           return res.redirect('/admin/dashboard')
        } 
            next()
    } catch (error) {
        console.log("error in islogout:", error);
    }
}
module.exports = {
    isLogout,
    isLogin
}