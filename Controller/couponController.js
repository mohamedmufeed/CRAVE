
const Cart = require("../Model/cartModel")
const Coupon = require("../Model/couponModel")
const Category = require("../Model/categoryModel")
const Products = require("../Model/productModel")
const HttpStatusCodes = require("../config/httpStatusCode");
const logger = require("../config/logger");


//  user coupon controller starst here 

const applyCoupon = async (req, res) => {
  try {
    const { couponCode, cartTotal } = req.body;
    


    if(!couponCode){
      return res.status(400).json({ message: 'Enter coupon code' });
    }

    const coupon = await Coupon.findOne({ code: couponCode });


    if (!coupon) {
      return res.status(400).json({ message: 'Invalid coupon code' });
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }

    if (cartTotal < coupon.minimumCartValue) {
      return res.status(400).json({ message: `Minimum cart value of ₹${coupon.minimumCartValue} required` });
    }
    if (cartTotal > coupon.maximumPurchaseLimit) {
      return res.status(400).json({ message: `Maximum purchase Limit  ₹${coupon.maximumPurchaseLimit} ` })
    }

    if (coupon.usageLimit <= 0) {
      return res.status(400).json({ message: 'Coupon usage limit exceeded' });
    }

    const cart = await Cart.findOne({ userId: req.session.userId })
      .populate('products.productId', 'name price category')
      .populate('products.productId.category', 'name');

    if (!cart) {
      return res.status(400).json({ message: 'Cart is empty or does not exist' });
    }

    const cartItems = cart.products;
    const applicableProducts = coupon.applicableProducts;
    const applicableCategories = coupon.applicableCategories;

    if (Array.isArray(applicableProducts) && applicableProducts.length > 0) {
      const invalidProduct = cartItems.find(item => !applicableProducts.includes(item.productId._id));
      if (invalidProduct) {
        return res.status(400).json({ message: 'Coupon not applicable to some products in the cart' });
      }
    }

    if (Array.isArray(applicableCategories) && applicableCategories.length > 0) {
      const invalidCategory = cartItems.find(item => !applicableCategories.includes(item.productId.category._id.toString()));
      if (invalidCategory) {
        return res.status(400).json({ message: 'Coupon not applicable to some categories in the cart' });
      }
    }


  

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
    } else if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue;
    }
    discountAmount = Math.min(discountAmount, cartTotal);

    const newTotal = cartTotal - discountAmount;


    req.session.coupon = {
      code: couponCode,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountedTotal:newTotal
    };

    coupon.usageLimit -= 1;
    await coupon.save();
    return res.json({
      success: true,
      discountAmount,
      newTotal,
      couponCode:couponCode
    });

  
    
  } catch (error) {
    logger.log('Error applying coupon:', error);
    return res.status(500).json({ message: 'An error occurred while applying the coupon' });
  }
};


const removeCoupon = async (req, res) => {
  const { originalTotal } = req.body
  if (!originalTotal) {
    return res.status(400).json({ success: false, message: "Original token is  misssing" })
  }
  res.json({
    success: true,
    discountAmount: 0,
    newTotal: originalTotal
  })
}

const total= async(req,res)=>{
try {
  const {newTotal}=req.body
  if (!newTotal || isNaN(newTotal)) {
    return res.status(400).json({ success: false, message: "Invalid newTotal received" });
  }
  
req.session.newTotal=newTotal
req.session.save(err => {
  if (err) {
    logger.error("Session save error:", err);
  }
  logger.info("Session saved with newTotal:", req.session.newTotal);
});

  
} catch (error) {
  logger.error("Error in total:", error);
  res.status(500).json({ success: false, message: "An error occurred" });
  
}
}

//user coupon controler edns here 



//admin coupon controller starts here


const loadCoupon = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 8;
    const skip = (page - 1) * limit;

    const totalCoupons = await Coupon.countDocuments();

    const coupons = await Coupon.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('applicableProducts', 'name')
      .populate('applicableCategories', 'name');

    const totalPages = Math.ceil(totalCoupons / limit);
    const previousPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;

    const product = await Products.find();
    const category = await Category.find();

    res.render("admin/couponManagement", {
      coupons,
      product,
      category,
      currentPage: page,
      totalPages: totalPages,
      totalCoupons: totalCoupons,
      previousPage: previousPage,
      nextPage: nextPage
    });

  } catch (error) {
    logger.error("Error in loading coupon management:", error);
    res.status(500).send("Error loading coupons");
  }
};

const editCoupon = async (req, res) => {
  try {
    const { couponId, code, discountType, discountValue, minimumCartValue, maximumPurchaseLimit, usageLimit, applicableProducts, applicableCategories, expiryDate, description } = req.body

    if (!code || !discountType || !discountValue || !expiryDate || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['fixed', 'percentage'].includes(discountType)) {
      return res.status(400).json({ message: 'Invalid discount type' });
    }
    if (discountValue <= 0) {
      return res.status(400).json({ message: 'Discount value must be positive' });
    }

    if(discountType==="percentage"&& discountValue>=60){
      return res.status(400).json({message:"Maximum discount is 60%"})
    }
    if (isNaN(new Date(expiryDate).getTime())) {
      return res.status(400).json({ message: 'Invalid expiration date' });
    }
    await Coupon.findByIdAndUpdate(couponId, {
      code,
      discountType,
      discountValue,
      minimumCartValue,
      maximumPurchaseLimit,
      usageLimit,
      applicableProducts,
      applicableCategories,
      expiryDate,
      description
    })
    
    res.redirect("/admin/couponManagement")
  } catch (error) {
    logger.error("error in edit coupon", error)
     return  res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" })
  }
}

const createCoupon = async (req, res) => {
  try {

    const { code, discountType, discountValue, minimumCartValue, maximumPurchaseLimit, usageLimit, expiryDate, description } = req.body


    let applicableProducts = req.body.applicableProducts;
    let applicableCategories = req.body.applicableCategories;

    if (applicableProducts === "all" || (Array.isArray(applicableProducts) && applicableProducts.includes("all"))) {
      const allProducts = await Products.find({});
      applicableProducts = allProducts.map(product => product._id);
    } else if (!Array.isArray(applicableProducts)) {
      applicableProducts = [applicableProducts];
    }

    if (applicableCategories === "all" || (Array.isArray(applicableCategories) && applicableCategories.includes("all"))) {
      const allCategories = await Category.find({}).populate("");
      applicableCategories = allCategories.map(category => category._id);
    } else if (!Array.isArray(applicableCategories)) {
      applicableCategories = [applicableCategories];
    }

    if (!code || !discountType || !discountValue || !expiryDate || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['fixed', 'percentage'].includes(discountType)) {
      return res.status(400).json({ message: 'Invalid discount type' });
    }
    if (discountValue <= 0) {
      return res.status(400).json({ message: 'Discount value must be positive' });
    }
    if(discountType === "fixed" && discountValue >10000){
      return res.status(400).json({message:"Maximum discount amount is 10000"})
    }

    if(discountType==="percentage"&& discountValue>=60){
      return res.status(400).json({message:"Maximum discount is 60%"})
    }
    if (isNaN(new Date(expiryDate).getTime())) {
      return res.status(400).json({ message: 'Invalid expiration date' });
    }

    const coupon = new Coupon({
      code,
      discountType,
      discountValue,
      minimumCartValue,
      usageLimit,
      expiryDate,
      description,
      applicableProducts,
      applicableCategories,
      maximumPurchaseLimit
    })

    await coupon.save()
 
    res.redirect("/admin/couponManagement")
  } catch (error) {
    logger.error("error in creating coupon ", error)
  }
}

const deleteCoupon = async (req, res) => {

  try {
    const couponId = req.params.id
    const coupon = await Coupon.findByIdAndDelete(couponId)
    if (!coupon) {
      res.status(400).send("coupon not found ")
    }
    res.redirect("/admin/couponManagement")
  } catch (error) {
    logger.error("Error in deleting coupon")
    res.status(500).json({ message: 'Server error' });
  }
}


//   admin coupon controller ends herhe

module.exports = { applyCoupon, removeCoupon, loadCoupon, createCoupon, deleteCoupon, editCoupon,total }