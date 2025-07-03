const Razorpay = require('razorpay');
const Address = require("../Model/addresModel")
const Cart = require("../Model/cartModel")
const Order =require("../Model/orderModel")
const logger = require('../config/logger');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const razorpayPayment = async (req, res) => {
  const amount = req.body.amount;
  const userId = req.session.userId;


  if (!userId) {
    return res.redirect("/login");
  }
  try {

    const orderOptions = {
      amount:  Math.round(amount * 100),
      currency: 'INR',
      payment_capture: 1,
    };

    const detail = await Address.findOne({ user: userId, isDefault: true });

    const order = await razorpay.orders.create(orderOptions);

    const cart = await Cart.findOne({ userId: userId }).populate('products.productId');

    if (!cart) {
      return res.status(400).json({ error: 'No cart found for the user' });
    }

    if (!cart.products || cart.products.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
   

    let totalAmount = 0;
    let products = [];
    let couponDetails=null

    for (let item of cart.products) {
      const product = item.productId;

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const price = product.discountPrice ? product.discountPrice : product.price;

      product.stock -= item.quantity;
      await product.save();
      totalAmount += price * item.quantity;
      products.push({
        productId: product._id,
        quantity: item.quantity,
        name: product.name,
        price: price,
      });
    }

    if (req.session.coupon) {
      const coupon = req.session.coupon;
      logger.info("This is the coupon being applied:", coupon);
    
      couponDetails = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      };
    
    }

    const newOrder = new Order({
      userId: userId,
      products: products,
      address: detail,
      total: totalAmount,
      status: 'Pending',
      paymentMethod: 'Razorpay',
      paymentStatus:"Failed",
      razorpay_order_id: order.id,
      coupon:couponDetails

    });


    await newOrder.save();

    await Cart.updateOne({ userId: userId }, { products: [] });
    const orderId= newOrder._id
    res.json({
      amount: order.amount,
      order_id: order.id,
      neworderId: orderId
    
    });


  } catch (error) {
    logger.error("Error in setting Razorpay:", error);
    res.status(500).json({ error: 'Error creating Razorpay order' });
  }
};



const paymentSuccess = async (req, res) => {
    const {orderId } = req.body;
    try {
      const order = await Order.findById(orderId)
     
      
        if (!order) {
            return res.status(400).json({ success: false, message: "Order not found" });
        }


        order.paymentStatus = "Paid";
     
        await order.save();

        res.json({ success: true });

    } catch (error) {
        logger.error("Error in payment success:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};



const retryPayment = async (req, res) => {
  const orderId = req.params.id; 

  try {
    const order = await Order.findById(orderId).populate("address");
    const amount=order.total
    const orderOptions = {
      amount: amount * 100,
      currency: 'INR',
      payment_capture: 1,
    };
    


    if (!order) {
      return res.status(400).json({ error: "Order not found" });
    }

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    const customerDetails = {
      customerName: order.address.firstName,
      customerEmail: order.address.email,
      customerContact: order.address.mobile,
    };

    res.json({
      success: true,
      amount: razorpayOrder.amount,
      razorpay_order_id: razorpayOrder.id, 
      orderId:orderId,
      customerDetails,
    });

  } catch (error) {
    logger.error("Error in retry payment:", error);
    res.status(500).send("Internal server error");
  }
};

module.exports={
    razorpayPayment,
    paymentSuccess,
    retryPayment
}