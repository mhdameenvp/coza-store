const orders = require('../models/orderModel');
const User = require('../models/userModel')

const dailySaleReport = async (req, res) => {
    try {

        let dailyReport = await orders.aggregate([
            { $unwind: "$orderedItem" },
            { $match: { "orderedItem.productStatus": { $nin: ["cancelled", "pending", "returned","shipped"] } } },

            {
                $project: {
                    day: { $dayOfMonth: "$createdAt" },
                    month: { $month: "$createdAt" },
                    year: { $year: "$createdAt" },
                    orderAmount: 1,
                    couponDiscount: 1,
                    "orderedItem.offer_id": 1,
                    "orderedItem.quantity": 1
                }
            },
            {
                $group: {
                    _id: {
                        orderId: "$_id",
                        day: "$day",
                        month: "$month",
                        year: "$year"
                    },
                    totalSales: { $first: "$orderAmount" },
                    productsCount: { $sum: "$orderedItem.quantity" },
                    offeredProductsSold: {
                        $sum: {
                            $cond: [
                                { $gt: [{ $type: "$orderedItem.offer_id" }, "null"] },
                                "$orderedItem.quantity",
                                0
                            ]
                        }
                    },
                    couponAmount: { $first: "$couponDiscount" },
                }
            },
            {
                $group: {
                    _id: {
                        day: "$_id.day",
                        month: "$_id.month",
                        year: "$_id.year"
                    },
                    totalOrderCount: { $sum: 1 },
                    totalSales: { $sum: "$totalSales" },
                    totalProducts: { $sum: "$productsCount" },
                    offeredProductsSold: { $sum: "$offeredProductsSold" },
                    couponsUsed: { $sum: "$couponAmount" }
                }
            },
            {
                $project: {
                    dateFormatted: {
                        $concat: [
                            { $toString: "$_id.year" }, "-",
                            { $cond: [{ $lt: ["$_id.month", 10] }, { $concat: ["0", { $toString: "$_id.month" }] }, { $toString: "$_id.month" }] }, "-",
                            { $cond: [{ $lt: ["$_id.day", 10] }, { $concat: ["0", { $toString: "$_id.day" }] }, { $toString: "$_id.day" }] }
                        ]
                    },
                    totalSales: 1,
                    totalProducts: 1,
                    offeredProductsSold: 1,
                    couponsUsed: 1,
                    totalOrderCount: 1
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);



        res.render('salesReport', {
            reportData: dailyReport,
            page: 'daily',
            TotalAmount: dailyReport.reduce((acc, curr) => acc + curr.totalSales, 0),
            TotalSaleCount: dailyReport.reduce((acc, curr) => acc + curr.totalOrderCount, 0),
            TotalCouponAmount: dailyReport.reduce((acc, curr) => acc + curr.couponsUsed, 0),
            fromDate:'', toDate:''
        });
    } catch (error) {
        console.log('error in daily sales report', error);
        res.status(500).send('Error generating daily sales report');
    }
};


const weeklySalesReport = async (req, res) => {
    try {
        const sevenWeeksAgo = new Date(new Date().setDate(new Date().getDate() - 49));

        const weeklyReport = await orders.aggregate([
            { $match: { createdAt: { $gte: sevenWeeksAgo } } },
            { $unwind: "$orderedItem" },
            { $match: { "orderedItem.productStatus": { $nin: ["cancelled", "pending", "returned","shipped"] } } },
            {
                $project: {
                    week: { $isoWeek: "$createdAt" },
                    year: { $isoWeekYear: "$createdAt" },
                    orderAmount: 1,
                    couponDiscount: 1,
                    orderedItemQuantity: "$orderedItem.quantity",
                    offeredProduct: {
                        $cond: [{ $gt: [{ $type: "$orderedItem.offer_id" }, "null"] }, "$orderedItem.quantity", 0]
                    }
                }
            },
            {
                $group: {
                    _id: { week: "$week", year: "$year", orderId: "$_id" },
                    orderAmount: { $first: "$orderAmount" },
                    couponAmount: { $first: "$couponDiscount" },
                    totalProducts: { $sum: "$orderedItemQuantity" },
                    offeredProductsSold: { $sum: "$offeredProduct" }
                }
            },
            {
                $group: {
                    _id: { week: "$_id.week", year: "$_id.year" },
                    totalOrderCount: { $sum: 1 },
                    totalSales: { $sum: "$orderAmount" },
                    totalProducts: { $sum: "$totalProducts" },
                    offeredProductsSold: { $sum: "$offeredProductsSold" },
                    couponsUsed: { $sum: "$couponAmount" }
                }
            },
            {
                $project: {
                    _id: 0,
                    week: "$_id.week",
                    year: "$_id.year",
                    totalOrderCount: 1,
                    totalSales: 1,
                    totalProducts: 1,
                    offeredProductsSold: 1,
                    couponsUsed: 1,
                    startOfWeek: { $dateToString: { format: "%Y-%m-%d", date: { $dateFromParts: { isoWeekYear: "$_id.year", isoWeek: "$_id.week", isoDayOfWeek: 1 } } } },
                    endOfWeek: { $dateToString: { format: "%Y-%m-%d", date: { $dateFromParts: { isoWeekYear: "$_id.year", isoWeek: "$_id.week", isoDayOfWeek: 7 } } } }
                }
            },
            { $sort: { "year": 1, "week": 1 } }
        ]);


        res.render('salesReport', {
            reportData: weeklyReport, page: 'weekly',
            TotalAmount: weeklyReport.reduce((acc, curr) => acc + curr.totalSales, 0),
            TotalSaleCount: weeklyReport.reduce((acc, curr) => acc + curr.totalOrderCount, 0),
            TotalCouponAmount: weeklyReport.reduce((acc, curr) => acc + curr.couponsUsed, 0),
            fromDate:'', toDate:''

        });
    } catch (error) {
        console.log('error in weekly sales report', error);
        res.status(500).send('Error generating weekly sales report');
    }
};



const monthlySalesReport = async (req, res) => {
    try {
        const twelveMonthsAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1));

        const monthlyReport = await orders.aggregate([
            { $match: { createdAt: { $gte: twelveMonthsAgo } } },
            { $unwind: "$orderedItem" },
            { $match: { "orderedItem.productStatus": { $nin: ["cancelled", "pending", "returned","shipped"] } } },
            {
                $project: {
                    month: { $month: "$createdAt" },
                    year: { $isoWeekYear: "$createdAt" },
                    orderAmount: 1,
                    couponDiscount: 1,
                    orderedItemQuantity: "$orderedItem.quantity",
                    offeredProduct: {
                        $cond: [{ $gt: [{ $type: "$orderedItem.offer_id" }, "null"] }, "$orderedItem.quantity", 0]
                    }
                }
            },
            {
                $group: {
                    _id: { month: "$month", year: "$year", orderId: "$_id" },
                    orderAmount: { $first: "$orderAmount" },
                    couponAmount: { $first: "$couponDiscount" },
                    totalProducts: { $sum: "$orderedItemQuantity" },
                    offeredProductsSold: { $sum: "$offeredProduct" }
                }
            },
            {
                $group: {
                    _id: { month: "$_id.month", year: "$_id.year" },
                    totalOrderCount: { $sum: 1 },
                    totalSales: { $sum: "$orderAmount" },
                    totalProducts: { $sum: "$totalProducts" },
                    offeredProductsSold: { $sum: "$offeredProductsSold" },
                    couponsUsed: { $sum: "$couponAmount" }
                }
            },
            {
                $project: {
                    _id: 0,
                    month: "$_id.month",
                    year: "$_id.year",
                    totalOrderCount: 1,
                    totalSales: 1,
                    totalProducts: 1,
                    offeredProductsSold: 1,
                    couponsUsed: 1,
                    monthName: {
                        $arrayElemAt: [
                            ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
                            { $subtract: ["$_id.month", 1] }
                        ]
                    }
                }
            },
            {
                $addFields: {
                    monthYear: { $concat: ["$monthName", "-", { $toString: "$year" }] }
                }
            },
            { $sort: { "year": 1, "month": 1 } }
        ]);


        res.render('salesReport', {
            reportData: monthlyReport,
            page: 'monthly',
            TotalAmount: monthlyReport.reduce((acc, curr) => acc + curr.totalSales, 0),
            TotalSaleCount: monthlyReport.reduce((acc, curr) => acc + curr.totalOrderCount, 0),
            TotalCouponAmount: monthlyReport.reduce((acc, curr) => acc + curr.couponsUsed, 0),
            fromDate:'', toDate:''
        });
    } catch (error) {
        console.log('error in monthly sales report', error);
        res.status(500).send('Error generating monthly sales report');
    }
};




const YearlySalesReport = async (req, res) => {
    try {
        const yearlyReport = await orders.aggregate([
            { $unwind: "$orderedItem" },
            { $match: { "orderedItem.productStatus": { $nin: ["cancelled", "pending", "returned"] } } },
            {
                $project: {
                    year: { $isoWeekYear: "$createdAt" },
                    orderAmount: 1,
                    couponDiscount: 1,
                    orderedItemQuantity: "$orderedItem.quantity",
                    offeredProduct: {
                        $cond: [{ $gt: [{ $type: "$orderedItem.offer_id" }, "null"] }, "$orderedItem.quantity", 0]
                    }
                }
            },
            {
                $group: {
                    _id: { year: "$year", orderId: "$_id" },
                    orderAmount: { $first: "$orderAmount" },
                    couponAmount: { $first: "$couponDiscount" },
                    totalProducts: { $sum: "$orderedItemQuantity" },
                    offeredProductsSold: { $sum: "$offeredProduct" }
                }
            },
            {
                $group: {
                    _id: { year: "$_id.year" },
                    totalOrderCount: { $sum: 1 },
                    totalSales: { $sum: "$orderAmount" },
                    totalProducts: { $sum: "$totalProducts" },
                    offeredProductsSold: { $sum: "$offeredProductsSold" },
                    couponsUsed: { $sum: "$couponAmount" }
                }
            },
            {
                $project: {
                    _id: 0,
                    year: "$_id.year",
                    totalOrderCount: 1,
                    totalSales: 1,
                    totalProducts: 1,
                    offeredProductsSold: 1,
                    couponsUsed: 1
                }
            },
            { $sort: { "year": 1 } }
        ]);

        const totalAmountResult = await orders.aggregate([
            { $group: { _id: null, totalAmount: { $sum: "$orderAmount" } } }
        ]);
        const TotalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].totalAmount : 0;

        console.log("yearlyReport", yearlyReport);
        res.render('salesReport', {
            reportData: yearlyReport,
            page: 'yearly',
            TotalAmount: yearlyReport.reduce((acc, curr) => acc + curr.totalSales, 0),
            TotalSaleCount: yearlyReport.reduce((acc, curr) => acc + curr.totalOrderCount, 0),
            TotalCouponAmount: yearlyReport.reduce((acc, curr) => acc + curr.couponsUsed, 0),
            fromDate:'', toDate:''
        });
    } catch (error) {
        console.log('error in yearly sales report', error);
        res.status(500).send('Error generating yearly sales report');
    }
};



const customDateSort = async (req, res) => {
    try {
        const { fromDate, toDate } = req.body
        console.log("fromDate", fromDate, toDate);
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
          

        const customReport = await orders.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            { $unwind: "$orderedItem" },
            { $match: { "orderedItem.productStatus": { $nin: ["cancelled", "pending", "returned","shipped"] } } },

            {
                $project: {
                    day: { $dayOfMonth: "$createdAt" },
                    month: { $month: "$createdAt" },
                    year: { $year: "$createdAt" },
                    orderAmount: 1,
                    couponDiscount: 1,

                    "orderedItem.offer_id": 1,
                    "orderedItem.quantity": 1
                }
            },
            {
                $group: {
                    _id: {
                        orderId: "$_id",
                        day: "$day",
                        month: "$month",
                        year: "$year"
                    },
                    totalSales: { $first: "$orderAmount" },
                    productsCount: { $sum: "$orderedItem.quantity" },
                    offeredProductsSold: {
                        $sum: {
                            $cond: [
                                { $gt: [{ $type: "$orderedItem.offer_id" }, "null"] },
                                "$orderedItem.quantity",
                                0
                            ]
                        }
                    },
                    couponAmount: { $first: "$couponDiscount" },
                }
            },
            {
                $group: {
                    _id: {
                        day: "$_id.day",
                        month: "$_id.month",
                        year: "$_id.year"
                    },
                    totalOrderCount: { $sum: 1 },
                    totalSales: { $sum: "$totalSales" },
                    totalProducts: { $sum: "$productsCount" },
                    offeredProductsSold: { $sum: "$offeredProductsSold" },
                    couponsUsed: { $sum: "$couponAmount" }
                }
            },
            {
                $project: {
                    dateFormatted: {
                        $concat: [
                            { $toString: "$_id.year" }, "-",
                            { $cond: [{ $lt: ["$_id.month", 10] }, { $concat: ["0", { $toString: "$_id.month" }] }, { $toString: "$_id.month" }] }, "-",
                            { $cond: [{ $lt: ["$_id.day", 10] }, { $concat: ["0", { $toString: "$_id.day" }] }, { $toString: "$_id.day" }] }
                        ]
                    },
                    totalSales: 1,
                    totalProducts: 1,
                    offeredProductsSold: 1,
                    couponsUsed: 1,
                    totalOrderCount: 1
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }

        ]);

        console.log("customReport", customReport);
        res.render("salesReport",{
            reportData: customReport,
            page: 'daily',
            TotalAmount: customReport.reduce((acc, curr) => acc + curr.totalSales, 0),
            TotalSaleCount: customReport.reduce((acc, curr) => acc + curr.totalOrderCount, 0),
            TotalCouponAmount: customReport.reduce((acc, curr) => acc + curr.couponsUsed, 0),
            fromDate, toDate
        });

    } catch (error) {
        console.log("error in custom sales report");
    }
}

const yearlyChart = async (req, res) => {
    try {
        const userCount = await User.countDocuments({});


        const tenYearsAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 10));

        const yearlyOrderData = await orders.aggregate([
            { $match: { createdAt: { $gte: tenYearsAgo } } },
            { $unwind: "$orderedItem" },
            { $match: { "orderedItem.productStatus": { $nin: ["cancelled", "returned", "pending","shipped"] } } },
            {
                $group: {
                    _id: {
                        orderId: "$_id",
                        year: { $year: "$createdAt" }
                    },

                    orderAmount: { $first: "$orderAmount" },
                    couponDiscount: { $first: "$couponDiscount" }

                }
            },
            {
                $group: {
                    _id: {
                        year: "$_id.year"
                    },
                    yearlyTotal: { $sum: "$orderAmount" },
                    yearlyCouponDiscount: { $sum: "$couponDiscount" },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1 } }
        ]);

        let orderCounts = new Array(6).fill(0);
        let totalAmounts = new Array(6).fill(0);
        let couponDiscounts = new Array(6).fill(0);
        let years = [];


        const currentYear = new Date().getFullYear();


        for (let i = 6; i >= 0; i--) {
            years.push(currentYear - i);
        }


        yearlyOrderData.forEach(data => {
            const yearIndex = years.indexOf(data._id.year);
            if (yearIndex !== -1) {
                orderCounts[yearIndex] = data.orderCount;
                totalAmounts[yearIndex] = data.yearlyTotal;
                couponDiscounts[yearIndex] = data.yearlyCouponDiscount;
            }
        });

        res.render("dashboard", {
            userCount,
            TotalAmount: yearlyOrderData.reduce((acc, curr) => acc + curr.yearlyTotal, 0),
            TotalCouponDiscount: yearlyOrderData.reduce((acc, curr) => acc + curr.yearlyCouponDiscount, 0),

            TotalOrderCount: yearlyOrderData.reduce((acc, curr) => acc + curr.orderCount, 0),
            OrderCounts: orderCounts,
            TotalAmounts: totalAmounts,
            CouponDiscounts: couponDiscounts,
            categories: years,
            text: 'Yearly',
            activePage: 'dashboard'
        });
    } catch (error) {
        console.error("Error on dashboard", error);
        res.status(500).send("Error generating dashboard data");
    }

}


const bestSellingProduct = async (req, res) => {
    try {

        const bestSellingProducts = await orders.aggregate([
            {
              $unwind: "$orderedItem"
            },
            {
              $match: {
                "orderedItem.productStatus": { $nin: ["cancelled", "pending", "returned","shipped"] }
              }
            },
            {
              $lookup: {
                from: 'products', 
                localField: 'orderedItem.productId',
                foreignField: '_id',
                as: 'productDetails'
              }
            },
            {
              $unwind: "$productDetails"
            },
            {
              $group: {
                _id: {
                  productId: "$productDetails.productName"
                },
                totalSales: { $sum: { $cond: [ { $ifNull: [ "$orderedItem.totalProductAmount", 0 ] }, "$orderedItem.totalProductAmount", 0 ] } }
              }
            },
            {
              $sort: { totalSales: -1 }
            },
            {
              $limit: 10 
            },
            {
              $project: {
                _id: 0,
                productId: "$_id.productId",
                productName: "$productDetails.productName",
                totalSales: 1
              }
            }
          ]);
          
       
 
        res.status(200).json({bestSellingProducts,item:'Product'})
      

    } catch (error) {

        console.log("error in best selling product",error)


    }
}

const bestSellingBrands=async(req,res)=>{
    try {
        const bestSellingBrands = await orders.aggregate([
            {
              $unwind: "$orderedItem"
            },
            {
              $match: {
                "orderedItem.productStatus": { $nin: ["cancelled", "pending", "returned","shipped"] }
              }
            },
            {
              $lookup: {
                from: 'products', 
                localField: 'orderedItem.productId',
                foreignField: '_id',
                as: 'productDetails'
              }
            },
            {
              $unwind: "$productDetails"
            },
            {
              $group: {
                _id: {
                  brand: "$productDetails.brand"
                },
                totalSales: { $sum: { $cond: [ { $ifNull: [ "$orderedItem.totalProductAmount", 0 ] }, "$orderedItem.totalProductAmount", 0 ] } }
              }
            },
            {
              $sort: { totalSales: -1 }
            },
            {
              $limit: 10 
            },
            {
              $project: {
                _id: 0,
                brand: "$_id.brand",
                totalSales: 1
              }
            }

          ])
           console.log("bestSellingBrands",bestSellingBrands);
           res.json({bestSellingBrands,item:'Brand'})

        
    } catch (error) {
        console.log("error in best selling brand",error);
    }
}

const bestSellingCategories=async(req,res)=>{
    try {
        
        const bestSellingCategories = await orders.aggregate([
            {
              $unwind: "$orderedItem"
            },
            {
              $match: {
                "orderedItem.productStatus": { $nin: ["cancelled", "pending", "returned","shipped"] }
              }
            },
            {
              $lookup: {
                from: 'products', 
                localField: 'orderedItem.productId',
                foreignField: '_id',
                as: 'productDetails'
              }
            },
            {
              $unwind: "$productDetails"
            },
            {
              $lookup: {
                from: 'categories',
                localField: 'productDetails.categoryId',
                foreignField: '_id',
                as: 'categorydetails'
              }
            },
            {
              $unwind: "$categorydetails"
            },
            {
              $group: {
                _id: {
                  category: "$categorydetails._id",
                  categoryName: "$categorydetails.catName"
                },
                totalSales: { $sum: { $cond: [ { $ifNull: [ "$orderedItem.totalProductAmount", 0 ] }, "$orderedItem.totalProductAmount", 0 ] } }
              }
            },
            {
              $sort: { totalSales: -1 }
            },
            {
              $limit: 10 
            },
            {
                $project: {
                  _id: 0,
             
                  categoryName: "$_id.categoryName",
                  totalSales: 1
                }
              }
          ]);
            console.log("bestSellingCategories",bestSellingCategories);
            res.status(200).json({bestSellingCategories,item:"Category"})
        
    } catch (error) {
        console.log('error in best selling category');
        
    }
}


const checkDataExist=async(req,res)=>{
    try {
        const { fromDate, toDate } = req.query
        console.log("fromDate", fromDate, toDate);
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);


        if(startDate>endDate){
            return  res.json({succes:false ,message:" Start date is greater than the end date"})
        }
        const data= await orders.find({ createdAt: {
            $gte: startDate,
            $lte: endDate
        }}) 
        console.log('data',data);
        if(data.length ==0){
          return  res.json({succes:false ,message:'Data not found in this date'})
        }else{
            return res.json({success:true ,message:""})
        }
    
        
    } catch (error) {
        
    }
}

module.exports = {
    dailySaleReport,
    weeklySalesReport,
    monthlySalesReport,
    YearlySalesReport,
    customDateSort,
    yearlyChart,
    bestSellingProduct,
    bestSellingBrands,
    bestSellingCategories,
    checkDataExist

}