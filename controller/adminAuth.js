const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const orders = require('../models/orderModel')
const Admin=require('../models/adminModel')


require('dotenv').config()

const adminLogin = async (req, res) => {
    try {
        res.render("adminLogin", { message: "enter name and password" })
    } catch (error) {
        console.log(error, "error on admin login");
    }
}

const adminVerify = async (req, res) => {
    try {
        const { name, password } = req.body
      
      const adminData=await Admin.findOne({name:name}) 
      if(adminData.password !==password){
        return res.redirect('/admin/')
      }
      if(adminData){
        req.session.admin_id=adminData._id
        res.redirect("/admin/dashboard")
      }else{

        res.redirect('/admin/')
      }


    } catch (error) {
        console.log("error in the admin login verify", error);
    }
}

const dashboard = async (req, res) => {
    try {
        const userCount = await User.countDocuments({});
        const categoryCount = await Category.countDocuments({});
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);

       
        const monthlyOrderData = await orders.aggregate([
            { $match: { createdAt: { $gte: startOfYear } } },
            { $unwind: "$orderedItem" },
            { $match: { "orderedItem.productStatus": { $nin: ["cancelled", "returned", "pending","shipped"] } } },
            {
                $group: {
                    _id: {
                        orderId: "$_id",
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    orderAmount: { $first: "$orderAmount" },
                    couponDiscount: { $first: "$couponDiscount" }
                }
            },
            {
                $group: {
                    _id: {
                        month: "$_id.month",
                        year: "$_id.year"
                    },
                    monthlyTotal: { $sum: "$orderAmount" },
                    monthlyCouponDiscount: { $sum: "$couponDiscount" },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        let OrderCounts = new Array(12).fill(0);
        let TotalAmounts = new Array(12).fill(0);
        let CouponDiscounts = new Array(12).fill(0);

        monthlyOrderData.forEach(data => {
            const monthIndex = data._id.month - 1;
            OrderCounts[monthIndex] = data.orderCount;
            TotalAmounts[monthIndex] = data.monthlyTotal;
            CouponDiscounts[monthIndex] = data.monthlyCouponDiscount;
        });

        res.render("dashboard", {
            userCount,
            categoryCount,
            TotalAmount: TotalAmounts.reduce((acc, curr) => acc + curr, 0),
            TotalCouponDiscount: CouponDiscounts.reduce((acc, curr) => acc + curr, 0),
            TotalOrderCount: OrderCounts.reduce((acc, curr) => acc + curr, 0),
            OrderCounts,
            TotalAmounts,
            CouponDiscounts,
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            text: "Monthly",
            activePage: 'dashboard'
        });
    } catch (error) {
        console.error("Error on dashboard", error);
        res.status(500).send("Error generating dashboard data");
    }
};


const adminLogout = async (req, res) => {
    try {
        req.session.admin_id = null;
        res.redirect('/admin')
    } catch (error) {
        console.log("error on adminlogout", error);
    }
}

module.exports = {
    dashboard,
    adminVerify,
    adminLogin,
    adminLogout
}