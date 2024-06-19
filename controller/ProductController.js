const product = require('../models/productModel')
const category = require('../models/categoryModel')
const fs = require('fs').promises
const path = require('path')
const user = require('../models/userModel')
const offers = require('../models/offerModel')
const cart = require('../models/cartModel')
const { log } = require('console')


const loadProduct = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    try {

        const products = await product.find({})
            .populate('categoryId')
            .sort({ _id: -1 })
            .limit(limit)
            .skip(skip);


        const count = await product.countDocuments({});
        const totalPages = Math.ceil(count / limit);
        const pagesToShow = 5;
      
        let startPage = page+pagesToShow-1
        let endPage = Math.min(totalPages, startPage + pagesToShow - 1);
        if (endPage - startPage < pagesToShow - 1) {
            startPage = Math.max(1, endPage - pagesToShow + 1);
        }


        res.render("Products", {
            products: products,
            currentPage: page,
            startPage: startPage,
            endPage: endPage,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: totalPages,
            activePage: 'products',
            limit
        });
    } catch (error) {
        console.log('error in load product:', error);
        res.status(500).send("Error loading products");
    }
};

const loadAddProduct = async (req, res) => {
    try {
        const messages = req.flash('message')
        const categories = await category.find({is_blocked:false})
    console.log(categories)

        res.render("addProduct", { categories, messages , activePage: 'products'})
    } catch (error) {
        console.log('error in load addproduct');
    }
}

const addProduct = async (req, res) => {
    try {
        console.log("req.body", req.body);
        console.log("req.files", req.files);
        const details = req.body
        const files = req.files

        if (files.length <=1) {
            return res.json({ success: false, message: 'Please select 2 images' })
        }
        if(!details.productName||details.productName.trim()==""){
            return res.json({ success: false, message: 'Please  Enter Product name' })
        }
        if(!details.category||details.category.trim()==""){
            return res.json({ success: false, message: 'Please  Select category' })
        }

        if(!details.price||details.price <1){
            return res.json({ success: false, message: 'Please  Enter valid price' })
        }
        if(!details.quantity||details.quantity <1){
            return res.json({ success: false, message: 'Please  Enter valid Quantity' })
        }
        if(!details.brand||details.brand.trim()==""){
            return res.json({ success: false, message: 'Please  Enter Brand' })
        }
        if(!details.description||details.description.trim()==""){
            return res.json({ success: false, message: 'Please  Enter Description' })
        }

        const alreadyExist = await product.findOne({ productName: req.body.productName })

        if (alreadyExist) {

            return res.json({ success: false, message: 'Item already existed' })
        }
        else {
            const images = files.map(file => file.filename);


            const products = new product({
                productName: details.productName,
                price: details.price,
                quantity: details.quantity,
                image: images,
                brand: details.brand,
                size: details.size,
                categoryId: details.category,

                description: details.description,

            })
            const save = await products.save()
              console.log("save",save);
            if (save) {
               return res.status(200).json({ success: true })

            }
        }


    } catch (error) {
      return res.status(302).json({ success: false })
        console.log("error in addproduct:", error);
    }
}

const listProduct = async (req, res) => {
    try {
        const { productId } = req.query;
        console.log("Blocking product with name:", productId);
     const productDetails=await product.findOne({_id:productId})
     console.log("productDetails",productDetails);
        const update = await product.updateOne({_id: productId}, {$set: {is_blocked: true}});
        console.log("Update result:", update);

        if (update.modifiedCount == 1) {
            res.redirect('productlist');
        } else {
          
            res.status(404).json({ message: "Product not found or already blocked" });
        }
    } catch (error) {
        console.error("Error in blocking product:", error);
        res.status(500).json({ message: "An error occurred, please try again" });
    }
}

const unlistProduct = async (req, res) => {
    try {
        const { productId } = req.query;
        const update = await product.updateOne({ _id: productId }, { $set: { is_blocked: false } })

        if (update) {
            res.redirect('productlist')
        } else {
            res.json({ message: 'Something went wrong' })
        }
    } catch (error) {
        console.log("error in unlisted product");
    }
}

const loadeditProduct = async (req, res) => {
    try {

        const { id } = req.query
        const products = await product.findOne({ _id: id }).populate('categoryId').sort({ _id: -1 })
        const categories = await category.find({_id:{$ne:products.categoryId._id},is_blocked:false})


        res.render('editProducts', { product: products, category: categories, activePage: 'products' })

    } catch (error) {
        console.log("error in loadeditProdut:", error);
    }
}

const editProduct = async (req, res) => {
    try {


        const { productName, category, price, description, quantity, id, size, brand, oldimageUrl } = req.body
        console.log("oldimageUrl",oldimageUrl);
        console.log("req.body", req.body);
        console.log(" req.files", req.files);
       

        if(!productName||productName.trim()==""){
            return res.json({success:false,message:"Product name is required"})
        }
        if(!price||price.trim()==""||price<1){
            return res.json({success:false,message:"Please Enter valid amount"})

        }
        if(!quantity||quantity<1){
            return res.json({success:false,message:"Please Enter quantity "})
        }
        if(!description||description.trim()==""){
            return res.json({success:false,message:"Please Enter Description "})
        }
        if(!brand||brand.trim()==""){
            return res.json({success:false,message:"Please Enter Brand "})
        }
        if(!category||category.trim()==""){
            return res.json({success:false,message:"Please Select category "})
        }
         
        const alreadyExist = await product.findOne({_id:{$ne:id}, productName: req.body.productName })

        if (alreadyExist) {

            return res.json({ success: false, message: 'Item already existed' })
        }


        const filename = req.files.map(item => {
            return item.filename
        })

        const upload = await product.findOne({ _id: id })
        let array = upload.image
        console.log("upload", upload);

        if (oldimageUrl && oldimageUrl.length) {
            const oldImagesToRemove = JSON.parse(oldimageUrl);
            array = array.filter(item => !oldImagesToRemove.includes(item));

        }
        array.push(...filename)
        console.log("array", array);

        const edit = await product.updateOne({ _id: id }, { $set: { productName: productName, categoryId: category, price: price, description: description, quantity: quantity, size: size, brand: brand, image: array } })
        console.log('edit', edit);
        if (edit) {

            res.status(200).json({ success: true })

        }
    } catch (error) {
        console.log("error in editproduct:", error);
    }
}

const deleteProductImage = async (req, res) => {

    try {
        const { preview, filename, id } = req.body
        const fullpath = path.join(__dirname, "..", "public", preview)

        await fs.unlink(fullpath);


        const result = await product.updateOne({ _id: id }, { $pull: { image: filename } })
        console.log(result);

        res.status(200).json({ success: true })

    } catch (error) {
        console.log("error in delete product");
    }
}

const findbyCategory = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    try {
        const { categoryId } = req.query;
        const userdata = await user.findOne({ _id: req.session.user_id })
        const cartCount = await cart.countDocuments({ userId: req.session.user_id });

        const offerData = await offers.find({
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        let productData = await product.find({ categoryId: categoryId, is_blocked: false, is_categoryBlocked: false })
        .sort({ _id: -1 })
        .limit(limit)
        .skip(skip)
        .populate('categoryId');
        const totalProducts = await product.countDocuments({ categoryId: categoryId, is_blocked: false, is_categoryBlocked: false });
        const totalPages = Math.ceil(totalProducts / limit);


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
    

 
        const wishlistCount = userdata.wishlist.length
        res.render('user/products', { productData, cartCount, wishlistCount, userdata, 
            currentPage: page,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: totalPages
        });
        
    } catch (error) {
        console.log('Error finding products by category:', error);
        res.status(500).send('Error finding products by category');
    }
};



const highLow = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    try {
        const userId = req.session.user_id;
        const userdata = await user.findOne({ _id: userId });

        let products = await product.find().populate('categoryId');

        const categories = await category.find();

        const totalProducts = await product.countDocuments({ is_blocked: false, is_categoryBlocked: false });
        const totalPages = Math.ceil(totalProducts / limit);

        let offerData = await offers.find({
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        const applyOffer = (product) => {
            let discountedPrice = product.price;
            let appliedOffer = null;

            offerData.forEach(offer => {
                const productMatchesOffer = offer.offerType === 'product' && offer.productId.some(id => id.toString() === product._id.toString());
                const categoryMatchesOffer = offer.offerType === 'category' && product.categoryId && offer.categoryId.some(id => id.toString() === product.categoryId._id.toString());

                if (productMatchesOffer || categoryMatchesOffer) {
                    let newDiscountedPrice = product.price - (product.price * offer.discount / 100);
                    if (newDiscountedPrice < discountedPrice) {
                        discountedPrice = Math.round(newDiscountedPrice);
                        appliedOffer = offer;
                    }
                }
            });

            return { discountedPrice, appliedOffer };
        };

        products = products.map(product => {
            const { discountedPrice, appliedOffer } = applyOffer(product);
            return {
                ...product._doc,
                originalPrice: product.price,
                discountedPrice,
                appliedOffer: appliedOffer ? {
                    offerName: appliedOffer.offerName,
                    discount: appliedOffer.discount
                } : null,
                offerText: appliedOffer ? `${appliedOffer.discount}% Off` : ''
            };
        });

        products = products.sort((a, b) => b.discountedPrice - a.discountedPrice);
        products = products.slice(skip, skip + limit);

        const cartCount = await cart.countDocuments({ userId: req.session.user_id });
        const wishlistCount = userdata.wishlist.length


        res.render('user/shop', {
            product: products, categories, userdata, wishlistCount,
            cartCount,
            currentPage: page,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: totalPages

        });
    } catch (error) {
        console.log('error', error);
    }
};


const lowHigh = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    try {
        const userId = req.session.user_id;
        const userdata = await user.findOne({ _id: userId });

        let products = await product.find().populate('categoryId');

        const categories = await category.find();

        const totalProducts = await product.countDocuments({ is_blocked: false, is_categoryBlocked: false });
        const totalPages = Math.ceil(totalProducts / limit);

        let offerData = await offers.find({
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        const applyOffer = (product) => {
            let discountedPrice = product.price;
            let appliedOffer = null;

            offerData.forEach(offer => {
                const productMatchesOffer = offer.offerType === 'product' && offer.productId.some(id => id.toString() === product._id.toString());
                const categoryMatchesOffer = offer.offerType === 'category' && product.categoryId && offer.categoryId.some(id => id.toString() === product.categoryId._id.toString());

                if (productMatchesOffer || categoryMatchesOffer) {
                    let newDiscountedPrice = product.price - (product.price * offer.discount / 100);
                    if (newDiscountedPrice < discountedPrice) {
                        discountedPrice = Math.round(newDiscountedPrice);
                        appliedOffer = offer;
                    }
                }
            });

            return { discountedPrice, appliedOffer };
        };

        products = products.map(product => {
            const { discountedPrice, appliedOffer } = applyOffer(product);
            return {
                ...product._doc,
                originalPrice: product.price,
                discountedPrice,
                appliedOffer: appliedOffer ? {
                    offerName: appliedOffer.offerName,
                    discount: appliedOffer.discount
                } : null,
                offerText: appliedOffer ? `${appliedOffer.discount}% Off` : ''
            };
        });

        products = products.sort((a, b) => a.discountedPrice - b.discountedPrice);
        products = products.slice(skip, skip + limit);

        const cartCount = await cart.countDocuments({ userId: req.session.user_id });
        const wishlistCount = userdata.wishlist.length


        res.render('user/shop', {
            product: products, categories, userdata, wishlistCount,
            cartCount,
            currentPage: page,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: totalPages

        });
    } catch (error) {
        console.log('error', error);
    }
};



const aToZ = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;
    
    try {
        const userId = req.session.user_id;
        const userdata = await user.findOne({ _id: userId });

        
        const totalProducts = await product.countDocuments({ is_blocked: false, is_categoryBlocked: false });
        const totalPages = Math.ceil(totalProducts / limit);

 
        let products = await product.aggregate([
            {
                $addFields: {
                    lowerCaseName: { $toLower: "$productName" }
                }
            },
            {
                $sort: {
                    lowerCaseName: 1
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            },
            {
                $project: {
                    lowerCaseName: 0
                }
            }
        ]);

      
        products.forEach((item=>{

            console.log(item.productName);
        }))
    
        const categories = await category.find();
        const cartCount = await cart.countDocuments({ userId: req.session.user_id });
        const wishlistCount = userdata ? userdata.wishlist.length : 0;

        res.render('user/shop', { 
            product: products, 
            categories, 
            userdata, 
            wishlistCount, 
            cartCount,
            currentPage: page,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: totalPages
        });

    } catch (error) {
        console.log('error in a to z', error);
    }
};




const zToa = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;
    
    try {
        const userId = req.session.user_id;
        const userdata = await user.findOne({ _id: userId });

        
        const totalProducts = await product.countDocuments({ is_blocked: false, is_categoryBlocked: false });
        const totalPages = Math.ceil(totalProducts / limit);

 
        let products = await product.aggregate([
            {
                $addFields: {
                    lowerCaseName: { $toLower: "$productName" }
                }
            },
            {
                $sort: {
                    lowerCaseName: -1
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            },
            {
                $project: {
                    lowerCaseName: 0
                }
            }
        ]);

      
        products = await product.populate(products, { path: 'categoryId' });
    

        const categories = await category.find();
        const cartCount = await cart.countDocuments({ userId: req.session.user_id });
        const wishlistCount = userdata ? userdata.wishlist.length : 0;

        res.render('user/shop', { 
            product: products, 
            categories, 
            userdata, 
            wishlistCount, 
            cartCount,
            currentPage: page,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: totalPages
        });

    } catch (error) {
        console.log('error in z to a', error);
    }
};



const catSort = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;
    try {
        const userId = req.session.user_id;
        const { id } = req.query;
        const userdata = await user.findOne({ _id: userId });


        let products = await product.find({ categoryId: id, is_blocked: false, is_categoryBlocked: false })
            .sort({ _id: -1 })
            .limit(limit)
            .skip(skip)

            console.log('products',products.length);
        const categories = await category.find();


        let offerData = await offers.find({
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });


        products = products.map(product => {
            let discountedPrice = product.price;
            let appliedOffer = null;


            offerData.forEach(offer => {
                if (offer.offerType === 'product' && offer.productId.includes(product._id.toString())) {
                    let newDiscountedPrice = product.price - (product.price * offer.discount / 100);
                    if (newDiscountedPrice < discountedPrice) {
                        discountedPrice = Math.round(newDiscountedPrice);
                        appliedOffer = offer;
                    }
                }
            });


            offerData.forEach(offer => {
                if (offer.offerType === 'category' && offer.categoryId.includes(id)) {
                    let newDiscountedPrice = product.price - (product.price * offer.discount / 100);
                    if (newDiscountedPrice < discountedPrice) {
                        discountedPrice = Math.round(newDiscountedPrice);
                        appliedOffer = offer;

                    }
                }
            });

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
        const totalProducts = await product.countDocuments({categoryId: id, is_blocked: false, is_categoryBlocked: false });
        const totalPages = Math.ceil(totalProducts / limit);
console.log("totalPages",totalPages);
        const cartCount = await cart.countDocuments({ userId: req.session.user_id })
        const wishlistCount = userdata.wishlist.length
        res.render('user/shop', {
            product: products, categories, userdata, wishlistCount, cartCount,
            currentPage: page,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: totalPages
        });

    } catch (error) {
        console.log('error in catSort', error);
    }
};


const Search = async (req, res) => {
    try {
        const { words } = req.body
        console.log('words', words);
        const products = await product.find({ productName: { $regex: words, $options: 'i' } })
        let productData = [];
        if (products.length === 0) {
            const categories = await category.findOne({ catName: { $regex: words, $options: 'i' } })
            if (categories) {
                productData = await product.find({ categoryId: categories._id })
            }

        } else {
            productData = products
        }
        const cartCount = await cart.countDocuments({ userId: req.session.user_id });

        res.json({ productData,cartCount })


    } catch (error) {
        console.log('error in search', error);
    }
}





module.exports = {
    loadProduct,
    loadAddProduct,
    addProduct,
    unlistProduct,
    listProduct,
    loadeditProduct,
    editProduct,
    deleteProductImage,
    findbyCategory,
    highLow,
    lowHigh,
    aToZ,
    zToa,
    catSort,
    Search

}