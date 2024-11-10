
const mongoose = require("mongoose");
const User = require("../Model/usermodel")

const Products = require("../Model/productModel")

const Address = require("../Model/addresModel")
const Cart = require("../Model/cartModel")
const Order = require("../Model/orderModel")

const Wallet = require("../Model/walletModel")
const HttpStatusCodes = require("../config/httpStatusCode");
require('dotenv').config();


// user order controllr and    checkout stars 


const loadCheckOut = async (req, res) => {
  const userId = req.session.userId
  const cartCount = req.session.cartCount
  if (!userId) {
    return res.redirect("/login")
  }
  try {
    const savedAddresses = await Address.find({ user: userId })
    const userCart = await Cart.findOne({ userId });
    if (!userCart || !userCart.products || userCart.products.length === 0) {
      req.session.message = "Your cart is empty. Please add products to proceed.";
      return res.redirect("/cart");
    }

    let subtotal = 0;
    userCart.products.forEach(item => {
      subtotal += item.price * item.quantity;
    });
    let discountAmount = 0;
    let newTotal = subtotal;
    let couponDetails = null;

    if (req.session.coupon) {
      const coupon = req.session.coupon;

      couponDetails = {
        code: coupon.code,
        type: coupon.discountType,
        value: coupon.discountValue
      };
      if (coupon.discountType === 'percentage') {
        discountAmount = (subtotal * coupon.discountValue) / 100;
      } else if (coupon.discountType === 'fixed') {
        discountAmount = coupon.discountValue;
      }


      discountAmount = Math.min(discountAmount, subtotal);
      newTotal = subtotal - discountAmount;

      const shippingCharge = 100
      newTotal += shippingCharge;
    }


    const order = {
      products: userCart.products,
      subtotal: subtotal,
      total: newTotal,
      discountAmount: discountAmount,
      couponDetails: couponDetails
    };




    return res.render("user/chekout", {
      savedAddresses, order,
      message: req.session.message,
      cartCount,

    });
    req.session.message = null;



  } catch (error) {
    console.error("Error loading checkout:", error);
  }

}

const defaultAddress = async (req, res) => {
  const addressId = req.params.id
  const userId = req.session.userId


  try {
    await Address.updateMany({ user: userId }, { isDefault: false })

    await Address.findByIdAndUpdate(addressId, { isDefault: true })

  } catch (error) {
    console.error('Error setting default address:', error);
    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
}


const saveBillingAddress = async (req, res) => {
  const userId = req.session.userId
  try {

    const { firstName, lastName, email, mobile, addressLine, city, state, pinCode, country, isDefault } = req.body;

    if (!firstName || !lastName || !email || !mobile || !addressLine || !city || !state || !pinCode || !country) {
      req.session.message = "All fields are required";
      return res.redirect("/checkOut");
    }

    if (firstName.length < 2 || lastName.length < 2) {
      req.session.message = "First and last name must be at least 2 characters long";
      return res.redirect("/checkOut");
    }


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      req.session.message = "Invalid email format";
      return res.redirect("/checkOut");
    }


    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      req.session.message = "Mobile number must be 10 digits";
      return res.redirect("/checkOut");
    }

    if (addressLine.length < 5) {
      req.session.message = "Address must be at least 5 characters long";
      return res.redirect("/checkOut");
    }

    const pinCodeRegex = /^[0-9]{6}$/;
    if (!pinCodeRegex.test(pinCode)) {
      req.session.message = "Pin code must be 6 digits";
      return res.redirect("/checkOut");
    }


    const newAddres = new Address({
      user: userId,
      firstName,
      lastName,
      email,
      mobile,
      addressLine,
      city,
      state,
      pinCode,
      country,
      isDefault
    })
    await newAddres.save()
  } catch (error) {
    console.error('Error saving address:', error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to save address' });
  }
}


const placeOrder = async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const objectId = new mongoose.Types.ObjectId(userId);
    let { addressId, paymentMethod } = req.body;

    if (!addressId) {
      const defaultAddress = await Address.findOne({ user: objectId, isDefault: true });
      if (!defaultAddress) {
        return res.status(404).json({ error: 'No default address found' });
      }
      addressId = defaultAddress._id;
    }

    const cart = await Cart.findOne({ userId: objectId }).populate('products.productId');
    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    let totalAmount = 0;
    let totalDiscount = 0;
    let products = [];
    let price

    for (let item of cart.products) {
      const product = await Products.findById(item.productId._id);

      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      if (product.discountPrice) {
        price = product.discountPrice
      } else {
        price = product.price
      }

      const productDiscount = product.price - price;
      totalDiscount += productDiscount * item.quantity;


      product.stock -= item.quantity;

      await product.save();

      totalAmount += price * item.quantity;
      products.push({
        productId: product._id,
        quantity: item.quantity,
        name: product.name,
        price: price
      });
    }


    const newOrder = new Order({
      userId: objectId,
      products,
      address: addressId,
      total: totalAmount,
      status: 'Pending',
      paymentMethod,
      discountAmount: totalDiscount
    });

    const savedOrder = await newOrder.save();
    await Cart.updateOne({ userId: objectId }, { products: [] });

    return res.render("user/thankyou");
  } catch (error) {
    console.error('Error placing order:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
const thankyou = async (req, res) => {
  res.render("user/thankyou")
}


const orderHistory = async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    res.redirect("/login")
  }

  try {
    const orders = await Order.find({ userId: userId }).populate('products.productId').sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      req.session.message = "No orders found";
      return res.redirect("/profile/orders");
    }
    res.render("user/orderHistory", {
      orders,
      message: req.session.message
    })
    req.session.message = null;

  } catch (error) {
    console.error("Error fetching order history:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
  }
}


const cancelOrder = async (req, res) => {
  const userId = req.session.userId
  const orderId = req.params.id;

  if (!userId) {
    return res.redirect("/login")
  }

  try {
    const user = await User.findById(userId)
    const order = await Order.findByIdAndUpdate(orderId, { status: "Cancelled" })

    if (!order) {
      return res.status(HttpStatusCodes.NOT_FOUND).json({ message: "Order not found" });
    }



    if (order.paymentMethod === "Razorpay") {

      const walletTransaction = new Wallet({
        userId,
        amount: order.total,
        transactionType: "Credit",
        description: `Refund for cancelled order `
      })
      await walletTransaction.save()
      user.walletBalance += order.total
      await user.save()
    }

    res.redirect("/profile/orders")

  } catch (error) {
    console.error("Error in cancel order", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "An error occurred while cancelling the order" });
  }
}

const returnorder = async (req, res) => {
  const orderId = req.params.id;
  try {
    const order = await Order.findById(orderId).populate('products.productId');

    if (!order) {
      return res.status(HttpStatusCodes.NOT_FOUND).json({ message: "Order not found" });
    }

    if (order.status === "Delivered") {
      order.status = "Returned";

      order.products.forEach((product) => {
        product.productId.stock += product.quantity;
      });

      const refundamount = order.total;

      const walletTransaction = new Wallet({
        userId: order.userId,
        amount: refundamount,
        transactionType: 'Credit',
        description: `Refund for returned order`,
      });

      await walletTransaction.save();

      const user = await User.findById(order.userId);
      user.walletBalance += refundamount;
      await user.save();

      await order.save();

      

    } else {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Order is not delivered yet, cannot return products" });
    }
    res.redirect("/profile/orders")
  } catch (error) {
    console.error("Error in return order:", error);

    if (!res.headersSent) {
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "An error occurred while processing the return" });
    }
  }
};



const orderDetails = async (req, res) => {
  const orderId = req.params.id;
  const userId = req.session.userId;

  try {

    const order = await Order.findOne({ _id: orderId, userId })
      .populate('products.productId')
      .populate('address');



    if (!order) {
      return res.status(HttpStatusCodes.NOT_FOUND).render("user/orderDetails", { message: "Order not found or access denied" });

    }


    res.render("user/orderDetails", { order });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("Server error");
  }
};


//user order conrrollwe and chekout ends


//admin order controller starts


const loadOrder = async (req, res) => {
  try {

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 7; // Set items per page
    const skip = (page - 1) * limit;

    // Fetch total number of categories
    const totalOrders = await Order.countDocuments(); // Get total number of categories


    const orders = await Order.find()
      .populate('userId', 'username')
      .populate('address')
      .populate('products.productId', 'name price')
      .skip(skip)
      .limit(limit);


    const totalPages = Math.ceil(totalOrders / limit);
    const previousPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;

    if (!orders || orders.length === 0) {
      return res.status(HttpStatusCodes.NOT_FOUND).send("No orders found");
    }


    res.render("admin/orderManagement", {
      orders: orders,
      currentPage: page,
      totalPages: totalPages,
      totalOrders: totalOrders,
      previousPage: previousPage,
      nextPage: nextPage
    });



  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'An error occurred while fetching orders.' });
  }

}

const serchOrder = async (req, res) => {
  const searchItem = req.query.search || "";

  try {

    const regex = new RegExp(searchItem, "i");

    const query = {
      $or: [
        { "userId.username": { $regex: regex } },
        { status: { $regex: regex } },
        { "products.name": { $regex: regex } }
      ]
    };

    const orders = await Order.find(query).populate('userId').populate('products.productId');
    res.render("admin/orderManagement", { orders, searchItem });
  } catch (error) {
    console.error("Error in search orders:", error);
    res.status(500).json({ message: "An error occurred while searching for orders." });
  }
};


const orderStatus = async (req, res) => {
  const orderId = req.params.id
  const newStatus = req.body.status


  try {
    const updateOrder = await Order.findByIdAndUpdate(orderId, { status: newStatus })
    if (!updateOrder) {
      return res.status(HttpStatusCodes.NOT_FOUND).json({ message: 'Order not found' });
    }
    res.redirect("/admin/orderManagement")
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'An error occurred while updating the order status.' });

  }

}

const admincancelOrder = async (req, res) => {
  const orderId = req.params.id
  try {
    const order = await Order.findByIdAndUpdate(orderId, { status: "Cancelled" })
    res.redirect("/admin/orderManagement")
  } catch (error) {

  }
}

//admin ordercontrollerr ends 

module.exports = { 
  loadCheckOut, 
  defaultAddress,
   saveBillingAddress, 
  placeOrder,
   thankyou,
   orderHistory,
   cancelOrder, 
  orderDetails,
   loadOrder, 
  serchOrder,
   orderStatus, 
  admincancelOrder,
  returnorder
}