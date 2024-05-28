const Offer = require('../models/offerModel')
const product = require('../models/productModel')
const category = require('../models/categoryModel')


const offer = async (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = 5; 
    const skip = (page - 1) * limit;

    try {
        
        const offers = await Offer.find()
            .sort({_id: -1})
            .limit(limit)
            .skip(skip);

       
        const totalOffers = await Offer.countDocuments({});
        const totalPages = Math.ceil(totalOffers / limit);

        res.render('offerPage', {
            offers,
            currentPage: page,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: totalPages,
            activePage: 'offer'
        });
    } catch (error) {
        console.log("error offer", error);
        res.status(500).send("Error fetching offers");
    }
};


const addOffer = async (req, res) => {
    try {

        const { offerName, discountRate, startDate, endDate, offerType, selectedValues } = req.body
        console.log('req.body', req.body);
        if (!offerName || offerName.trim() == "") {
            return res.json({ success: false, message: "Please enter offer name" })
        }
        if (!discountRate || discountRate.trim() == "" || discountRate < 0 || discountRate > 80) {
            return res.json({ success: false, message: "Plase Enter a valid discount Amount" })
        }
        if (offerType == "Choose") {
            return res.json({ success: false, message: "Plase select offer type" })
        }
        if (!startDate) {
            return res.json({ success: false, message: "Plase select start date" })
        }
        if (!endDate) {
            return res.json({ success: false, message: "Plase select End date" })
        }


        if (offerType == "category") {
            const offerData = new Offer({
                offerName: offerName,
                discount: discountRate,
                startDate: startDate,
                endDate: endDate,
                offerType: offerType,
                categoryId: selectedValues
            })
            await offerData.save()

        } else if (offerType == "product") {
            const offerData = new Offer({
                offerName: offerName,
                discount: discountRate,
                startDate: startDate,
                endDate: endDate,
                offerType: offerType,
                productId: selectedValues
            })
            await offerData.save()
        }

        res.status(200).json({ success: true })

    } catch (error) {
        res.json({ success: false })
        console.log('error in add offer', error);
    }

}

const offerType = async (req, res) => {
    try {
        const { offerType } = req.body
        console.log('req.body', req.body);
        if (offerType == "category") {
            const categoryDetails = await category.find({})
            res.status(200).json({ categoryDetails })
        } else if (offerType == "product") {
            const productData = await product.find({})
            console.log("productData",productData);
            res.status(200).json({ productData })
        }


    } catch (error) {
        console.log('error in offerType', error);
    }

}

const deleteOffer = async (req, res) => {
    try {
        const { id } = req.body
        await Offer.deleteOne({ _id: id })
        res.json({ success: true })
    } catch (error) {
        res.json({ success: false })
        console.log('error in delete offer', error);
    }
}

const loadEdit = async (req, res) => {
    try {
        const { id } = req.query

        let offerData = await Offer.findOne({ _id: id })
        if (offerData.productId.length > 0) {
            const procuctData = await product.find({})

            res.render('editOffer', { offerData, Details: procuctData ,activePage: 'offer'})
        }
        else if (offerData.categoryId.length > 0) {
            const categoryData = await category.find()
            res.render('editOffer', { offerData, Details: categoryData ,activePage: 'offer'})
        }


    } catch (error) {
        console.log('error in edit page rendering');
    }
}

const offerproductIdSave = async (req, res) => {
    try {
        const { offerId, selectedProductIds } = req.body
        await Offer.updateOne({ _id: offerId }, { $set: { productId: selectedProductIds } })
        res.json({ success: true })

    } catch (error) {
        console.log('error in offerId', error);
    }
}

const offercatIdSave = async (req, res) => {
    try {
        const { offerId, selectedCategoryIds } = req.body
        await Offer.updateOne({ _id: offerId }, { $set: { categoryId: selectedCategoryIds } })
        res.json({ success: true })

    } catch (error) {
        console.log('error in offercat', error);
    }
}

const editOffer = async (req, res) => {
    try {
       
        const { offerName, discount, startDate, endDate, offerId } = req.body
        console.log('req.body',req.body);
        const nameExist = await Offer.find({
            offerName: offerName.trim(),
            _id: { $ne: offerId }
            
        });
   console.log('nameExist',nameExist);
        if (nameExist.length !==0) {
          return res.json({ success: false, message: 'name already exist' })
        }
        if (!offerName||offerName.trim()=="") {
            return res.json({ success: false, message: 'Plese select name' })
          }
          if (!discount||discount.trim()==''||discount<1||discount>80) {
            return res.json({ success: false, message: 'Please enter valid discount' })
          }
          if (!startDate||!endDate) {
            return res.json({ success: false, message: 'Date needed' })
          }
           await Offer.updateOne({_id:offerId},{$set:{offerName:offerName,discount:discount,startDate:startDate,endDate:endDate}})
           res.json({success:true})

    } catch (error) {
        console.log('error in edit offer', error);
    }
}



module.exports = {
    offer,
    addOffer,
    offerType,
    deleteOffer,
    loadEdit,
    offerproductIdSave,
    offercatIdSave,
    editOffer
}