const mongoose = require('mongoose');

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
      requried: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }
  ],
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
    enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['CashOnDelivery', "Razorpay", "Wallet"],
    default: "COD"
  },
  discountAmount: {
    type: Number
  }

}, { timestamps: true });

const orderModel = mongoose.model('order', orderSchema);
module.exports = orderModel;