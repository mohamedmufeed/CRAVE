
const Cart = require("../../Model/cartModel")
const Coupon = require("../../Model/couponModel")
const Category = require("../../Model/categoryModel")
const Products = require("../../Model/productModel")
const HttpStatusCodes = require("../../config/httpStatusCode");
const logger = require("../../config/logger");


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

module.exports = { applyCoupon, removeCoupon,total }