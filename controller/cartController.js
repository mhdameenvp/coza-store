const user=require('../models/userModel')
const Cart=require('../models/cartModel')
const Product=require('../models/productModel')
const {ObjectId}=require('mongodb')
const Address=require('../models/addressModal')
const Coupon = require('../models/couponModel');
const offers=require('../models/offerModel')

const addToCart = async (req, res) => {
  try {
    let { productId } = req.body;
    const userId = req.session.user_id;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send('Product not found');
    }

    let offerData = await offers.find({
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    let discountedPrice = product.price; 
    let appliedOffer = null; 

    
    offerData.forEach(offer => {
      if (offer.offerType === 'product' && offer.productId.includes(product._id.toString())) {
        discountedPrice = product.price - (product.price * offer.discount / 100);
        appliedOffer = offer; 
      }
    });

   
    if (!appliedOffer || (appliedOffer && appliedOffer.offerType !== 'product')) {
      offerData.forEach(offer => {
        if (offer.offerType === 'category' && offer.categoryId.includes(product.categoryId._id.toString())) {
          const potentialDiscountPrice = product.price - (product.price * offer.discount / 100);
          if (potentialDiscountPrice < discountedPrice) {
            discountedPrice = potentialDiscountPrice;
            appliedOffer = offer; 
          }
        }
      });
    }

    discountedPrice = Math.round(discountedPrice); 

    
    let cartItem = await Cart.findOne({ userId: userId, productId: productId });

    if (cartItem) {
     
      cartItem.price += discountedPrice; 
    } else {
      
      cartItem = new Cart({
        userId: userId,
        productId: productId,
        price: discountedPrice,
        offer_id: appliedOffer ? appliedOffer._id : undefined 
      });
    }

    const savedCartItem = await cartItem.save();
    const cartCount = await Cart.countDocuments({ userId: req.session.user_id })
    console.log("add to cart success");

    res.status(200).json({savedCartItem,cartCount});
  } catch (error) {
    console.log("Error in addToCart:", error);
    res.status(500).json("An error occurred");
  }
};


const itemExist=async(req,res)=>{
    try {
      const userId=req.session.user_id
      const id=new ObjectId(req.params.id)
        console.log('productId:',id);
        
        const exist =await Cart.findOne({productId:id,userId:userId})
             console.log('exist:',exist);
        if(exist){
            res.status(200).json({exist:true})
        }
        
        
    } catch (error) {
        console.log("error in item exist:",error);
    }
}

const shoppingcart = async (req, res) => {
  try {
    const userId = req.session.user_id; 
    const userData = await user.findOne({ _id: userId });
    const cartCount =await (await Cart.find({userId:req.session.user_id })).length
    const wishlistCount=userData.wishlist.length
    let Usercart = await Cart.find({ userId: userId }).populate({
      path: 'productId',
      populate: {
        path: 'categoryId'
      }
    });

    let offerData = await offers.find({
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    let totalActualAmount = 0;
    let totalDiscountedAmount = 0;

    const cartItemsWithOffers = Usercart.map(cartItem => {
      const product = cartItem.productId;
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

      let discountedPrice;
      if (productDiscountedPrice <= categoryDiscountedPrice) {
        appliedOffer = offerData.find(offer => offer.offerType === 'product' && offer.productId.includes(product._id.toString()));
        discountedPrice = Math.round(productDiscountedPrice);
      } else {
        appliedOffer = offerData.find(offer => offer.offerType === 'category' && offer.categoryId.includes(product.categoryId._id.toString()));
        discountedPrice = Math.round(categoryDiscountedPrice);
      }

   
      totalActualAmount += product.price * cartItem.quantity;
      totalDiscountedAmount += discountedPrice * cartItem.quantity;

      return {
        ...cartItem._doc,
        productDetails: product,
        discountedPrice,
        appliedOffer: appliedOffer ? {
          offerName: appliedOffer.offerName,
          discount: appliedOffer.discount,
          offerId:appliedOffer._id
        } : null,
        offerText: appliedOffer ? `${appliedOffer.discount}% Off` : ''
      };
    });

    
    let totalSavings = totalActualAmount - totalDiscountedAmount;
    console.log("cartItemsWithOffers",cartItemsWithOffers);
   
   
    res.render('user/shoppingCart', {
      cartItems: cartItemsWithOffers,
      userdata: userData,
      totalActualAmount: totalActualAmount,
      totalDiscountedAmount: totalDiscountedAmount,
      totalSavings: totalSavings,
      cartCount,
      wishlistCount
    });
  } catch (error) {
    console.log('error in shopping cart:', error);
    res.render('error');
  }
};


const checkout=async(req,res)=>{
  try {
   
    const cartTotal= await Cart.find({userId:req.session.user_id})
       let totalAmount= cartTotal.reduce((acc,curr)=>{
          return acc+curr.price
       },0)

  

    if(totalAmount<500){
      totalAmount =totalAmount+40
    }
    const userId=req.session.user_id
    const couponData=req.session.coupon
    const addressData=await Address.find({userId:userId})
    const userData= await user.findOne({_id:userId})
   const currentdate=new Date()
    const couponDetails =await Coupon.find({minimumAmount:{$lte:totalAmount}})
    const validCoupon = couponDetails.filter(coupon =>new Date(coupon.expireDate)>=currentdate)
    const cartCount = await Cart.countDocuments({ userId: req.session.user_id });
    const wishlistCount = userData.wishlist.length

  if(!couponData){

 
    res.render('user/checkOut',{addressData,totalprice:totalAmount,validCoupon,couponData:"",userdata:userData,cartCount,wishlistCount})
  }else{
    res.render('user/checkOut',{addressData,totalprice:totalAmount,validCoupon,couponData,userdata:userData,cartCount,wishlistCount})

  }
       
  } catch (error) {
      console.log("error in checkout page",error);
  }
}

const editPrice=async(req,res)=>{
  try {
    const userId=req.session.user_id
    const {productId,totalPrice,quantity}=req.body

    await Cart.updateOne({userId: userId,productId:productId},{$set:{price:totalPrice,quantity:quantity}})

    let cartItems = await Cart.find({ userId: userId }).populate('productId');
      let newTotal=0
      cartItems.forEach(element => {
        newTotal=element.price+newTotal
      });
     
      let ActualTotal=cartItems.reduce((total,item)=>{

        let itemTotal = item.productId.price * item.quantity;
        return total + itemTotal;

      },0)
      let savings= ActualTotal-newTotal
      
 res.status(200).json({success:true,newTotal,ActualTotal,savings})
  } catch (error) {
    console.log('error in edit price');
    res.status(300).json('error')
  }
}

const removeProduct=async(req,res)=>{
  try {
    const userId=req.session.user_id
    const {productId}=req.body
       const remove=await Cart.deleteOne({userId:userId, productId:productId}) 
      
       if(remove){
        res.status(200).json({success:true})
       }
      } catch (error) {
     console.log('error in remove product',error);
  }
}

const checkStock=async(req,res)=>{
  try {
    const{productId,quantity}=req.body
    console.log("req.body",req.body);
    console.log("productId",productId);
    const product= await Product.findOne({_id:productId})
    console.log("product",product);
    if(product && product.quantity >= quantity){
       res.json({success:false})
    }else{
      res.json({success:true})
    }
    
  } catch (error) {
    console.log('error in checkstock');
  }
}

module.exports={
    addToCart,
    itemExist,
    shoppingcart,
    checkout,
    editPrice,
    removeProduct,
    checkStock
}