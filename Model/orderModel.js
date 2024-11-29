const mongoose = require('mongoose');
const productModel = require('./productModel');

const orderSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'user',
    required: true
  },
  products: [{
    productId: {
      type: mongoose.Schema.ObjectId,
      ref: 'product',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    singleStatus: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
      default: 'Pending'
    }
  }],
  address: {
    type: mongoose.Schema.ObjectId,
    ref: 'Address',
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['CashOnDelivery', "Razorpay", "Wallet"],
    default: "COD"
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'], 
    default: "Pending"                   
},
  discountAmount: {
    type: Number
  },
  shippingCharge: {
    type: Number,
    default: 100  
  },
  razorpay_order_id:{
    type:String,
    
  },
  coupon: {
    code: {
      type: String
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed']
    },
    discountValue: {
      type: Number
    },
  },
  reason:{
    cancelReason:{
      type:String
    },
    returnReason:{
      type:String
    }
  }
  


}, { timestamps: true });
  



const orderModel = mongoose.model('order', orderSchema);
module.exports = orderModel;
