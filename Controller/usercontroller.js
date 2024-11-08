const Admin = require("../Model/adminmodel");
const User = require("../Model/usermodel")
const Category = require("../Model/categoryModel")
const Products = require("../Model/productModel")
const Review = require("../Model/reviewModel")
const Address = require("../Model/addresModel")
const Cart = require("../Model/cartModel")
const Order = require("../Model/orderModel")
const Coupon = require("../Model/couponModel")
const Wallet = require("../Model/walletModel")
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { response, application } = require("express");
const mongoose = require("mongoose");
const { name } = require("ejs");
const saltround = 10
const statusCode = require("../config/httpStatusCode");
const HttpStatusCodes = require("../config/httpStatusCode");
require('dotenv').config();
const Razorpay = require('razorpay');
const walletModel = require("../Model/walletModel");

//register

const loadRegister = async (req, res) => {
  res.render("user/register", {
    message: req.session.message
  })
  req.session.message = null;
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
const generateReferralCode = () => {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
};

async function sendVerificationfEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
      }
    })
    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: 'Welcome to Crave!',
      text: `  Thank you for signing up with Crave. Your OTP is${otp}`,
      html: ` '<h1>Welcome!</h1> <p>Thank you for signing up with Crave.</p>' <b> Your OTP :${otp}</b>`


    })

    return info.accepted.length > 0

  } catch (error) {
    console.error("error sendign  email", error)
    return false
  }

}



const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {

    const exitsUser = await User.findOne({ email })
    if (exitsUser) {
      req.session.message = "Email is already registered"
      return res.redirect("/register")
    }

    if (username.length === 0 || email.length === 0 || password.length === 0) {
      req.session.message = "All fields are required";
      return res.redirect('/register');
    }
    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailPattern.test(email)) {
      req.session.message = "Please enter a valid email";
      return res.redirect("/register");
    }

    const otp = generateOtp();
    const emailSent = await sendVerificationfEmail(email, otp);
    if (!emailSent) {
      return res.json("email sending error")
    }

    req.session.userOTP = otp
    req.session.userData = { username, email, password }
    res.render("user/verfiy",)

    console.log(`OTP send ${otp}`)

  } catch (error) {
    console.error("signup error");
    // res.redirect("/pagenot found")
  }

}


const loadVerifyOtp = async (req, res) => {
  res.render("user/verfiy", {
    message: req.session.message
  })
  req.session.message = null;
}

const verifyOtp = async (req, res) => {
  try {

    const { otp } = req.body;


    if (otp == req.session.userOTP) {
      const user = req.session.userData
      const hashedPassword = await bcrypt.hash(user.password, saltround)
      const saveUserData = new User({
        username: user.username,
        email: user.email,
        password: hashedPassword,
        referralCode: generateReferralCode(),
      })

      await saveUserData.save();
      req.session.user = saveUserData._id;
      res.render("user/index")

    } else {
      req.session.message = "Invalid Otp!";
      return res.redirect('/verify-otp');
    }

  } catch (error) {
    console.error("Error invalid otp", error)
  }
}

const resendOtp = async (req, res) => {
  try {
    const { email } = req.session.userData;
    if (!email) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({ success: false, message: "Email not found in  session" })
    }
    const otp = generateOtp()
    req.session.userOTP = otp

    const emailSent = sendVerificationfEmail(email, otp)
    if (emailSent) {
      console.log("Resend otp:", otp);
      return res.status(HttpStatusCodes.OK).json({ success: true, message: "OTP resend sucsessfully" })
    } else {
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to resend OTP please try again" })
    }

  } catch (error) {
    console.error("Error resending OTP", error)
    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "server error please try again" })
  }


}

//login


const loadLogin = async (req, res) => {
  res.render("user/login", {
    message: req.session.message
  })
  req.session.message = null;
}


const login = async (req, res) => {
  const { email, password } = req.body;




  if (!email || !password) {
    req.session.message = "All fields are required";
    return res.redirect("/login");
  }

  // Validate email format
  const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailPattern.test(email)) {
    req.session.message = "Please enter a valid email";
    return res.redirect("/login");
  }

  try {

    const existUser = await User.findOne({ email: email, isBlocked: false });

    if (!existUser) {
      req.session.message = "User does not exist";
      return res.redirect("/login");
    }

    const isMatch = await bcrypt.compare(password, existUser.password);
    if (!isMatch) {
      req.session.message = "Password is incorrect";
      return res.redirect("/login");
    }



    req.session.userId = existUser._id;


    req.session.isAuthenticated = true
    return res.render('user/index');

  } catch (error) {
    // Handle any unexpected errors
    req.session.message = "An error occurred. Please try again.";
    return res.redirect("/login");
  }
};

const demologin = async (req, res) => {

  try {
    const { email, password } = req.body;
    if (email === "demo@gmail.com" && password === "demo12345") {
      res.redirect("/");
    } else {
      res.status(HttpStatusCodes.UNAUTHORIZED).send("Invalid Credentials");
    }
  } catch (error) {
    console.error("Demo login not successful", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};


//home section


const loadHome = async (req, res) => {
  const cartCount = req.session.cartCount
  res.render("user/index", { cartCount })
}

//product details

const loadProducts = async (req, res) => {
  try {
    const product = await Products.find({ isListed: true })
    const cartCount = req.session.cartCount

    res.render("user/shop", { product, cartCount })
  } catch (error) {
    console.error("Error in product handling:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).render("404");
  }

}

const productDetails = async (req, res) => {
  try {
    const productId = req.params.id;
    // find products
    const product = await Products.findOne({ _id: productId }).populate('offersApplied');;
    //find related products
    const relatedProducts = await Products.find({ material: product.material, _id: { $ne: productId } })
    // cart count
    const cartCount = req.session.cartCount
    //wishlist
    let flag = false
    const user = await User.findOne({ _id: req.session.userId })
    if (user) {
      if (user.wishList && user.wishList.includes(productId)) {
        flag = true;
      }
    } else {
      flag = false;
    }

    const firstOffer = Array.isArray(product.offersApplied) && product.offersApplied[0];


    const hasDiscount = firstOffer && product.discountPrice && product.discountPrice < product.price;


    const discountLabel = hasDiscount
      ? (firstOffer.discountType === 'percentage' && firstOffer.discountValue
        ? ` ${firstOffer.discountValue}% off`
        : firstOffer.discountValue
          ? `₹${firstOffer.discountValue} off`
          : '')
      : '';

    res.render("user/single", {
      product,
      discountPrice: product.discountPrice || product.price,
      relatedProducts,
      cartCount,
      flag,
      discountLabel
    })

  } catch (error) {
    res.status(HttpStatusCodes.NOT_FOUND).render("404")
    console.error("Product not found", error)
  }
}

//profile


const profile = async (req, res) => {
  try {
    const userid = req.session.userId
    const cartCount = req.session.cartCount
    const user = await User.findOne({ _id: userid })
    res.render("user/profile", {
      user,
      message: req.session.message,
      cartCount

    })
    req.session.message = null;
  } catch (error) {

    console.error("Error in  loading profile:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).render("404");

  }
}

const editProfile = async (req, res) => {
  try {
    const userId = req.session.userId
    const { username, email, country } = req.body

    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailPattern.test(email)) {
      req.session.message = "Please enter a valid email";
      return res.redirect("/profile");
    }

    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      req.session.message = "Email is already in use by another account";
      return res.redirect("/profile");
    }




    if (!email || !username) {
      req.session.message = "All fields are required";
      return res.redirect("/profile");
    }

    await User.findByIdAndUpdate(userId, {
      username,
      email,
      country
    })
    req.session.message = "Profile Updated sucseesfully"
    res.redirect("/profile")

  } catch (error) {
    console.error(error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("Error updating profile");
  }
}



const editPassword = async (req, res) => {
  const userId = req.session.userId
  const { oldpassword, newpassword, cpassword } = req.body


  if (!userId) {
    return res.redirect("/login")
  }
  try {
    const user = await User.findById(userId)

    if (!user || !user.password) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'User not found or password not set.' });
    }
    const isMatch = await bcrypt.compare(oldpassword, user.password);

    if (!isMatch) {
      req.session.message = "Old passwords is not correct";
      return res.redirect("/profile");
    }

    if (newpassword !== cpassword) {
      req.session.message = "New password and confirmation do not match.";
      return res.redirect("/profile");
    }

    const hashedPassword = await bcrypt.hash(newpassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.redirect("/profile")
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'An error occurred while updating the password.' });
  }
}

//address maanagement


const loadAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    const cartCount = req.session.cartCount
    const addresses = await Address.find({ user: userId });
    res.render("user/address", { addresses, message: req.session.message, cartCount });
    req.session.message = null;
  } catch (error) {
    console.log(error);

  }
}



const addAddress = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, addressLine, city, state, pinCode, country, isDefault } = req.body;
    if (!firstName || !lastName || !email || !mobile || !addressLine || !city || !state || !pinCode || !country) {
      req.session.message = "All fields are required";
      return res.redirect("/profile/address");
    }

    if (firstName.length < 2 || lastName.length < 2) {
      req.session.message = "First and last name must be at least 2 characters long";
      return res.redirect("/profile/address");
    }


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      req.session.message = "Invalid email format";
      return res.redirect("/profile/address");
    }


    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      req.session.message = "Mobile number must be 10 digits";
      return res.redirect("/profile/address");
    }

    if (addressLine.length < 5) {
      req.session.message = "Address must be at least 5 characters long";
      return res.redirect("/profile/address");
    }

    const pinCodeRegex = /^[0-9]{6}$/;
    if (!pinCodeRegex.test(pinCode)) {
      req.session.message = "Pin code must be 6 digits";
      return res.redirect("/profile/address");
    }


    const userId = req.session.userId;
    if (isDefault) {
      await Address.updateMany({ user: userId }, { isDefault: false });
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
    res.redirect("/profile/address")

  } catch (error) {
    console.log(error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "An error occurred while adding the address" });
  }
}



const editAddress = async (req, res) => {
  try {
    const addressId = req.params.id
    const updatedData = req.body;

    await Address.findByIdAndUpdate(addressId, updatedData)
    res.redirect("/profile/address")
  } catch (error) {
    console.error("error in edit address", error)
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "An error occurred while editing the address" });
  }

}

const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id
    await Address.findByIdAndDelete(addressId)
    res.redirect("/profile/address")
  } catch (error) {
    console.error("Error in deleting address:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "An error occurred while deleting the address" });
  }
}


//cart


const loadCart = async (req, res) => {
  const userId = req.session.userId
  if (!userId) {
    return res.redirect("/login")
  }
  try {
    const coupon = await Coupon.find()
    const cart = await Cart.findOne({ userId }).populate('products.productId', 'name price images')
    if (cart && cart.products.length > 0) {
      req.session.cartCount = cart.products.length;
      const totalCartPrice = cart.products.reduce((total, product) => total + (product.price * product.quantity), 0);
      res.render("user/cart", { products: cart.products, totalCartPrice, coupon })
    } else {
      req.session.cartCount = 0;
      req.session.cartCount = cart.products.length,
        res.render("user/cart", { products: [], message: req.session.message, coupon })
    }
    req.session.message = null;
  } catch (error) {
    console.error("Error loading cart: ", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
}

const addCart = async (req, res) => {
  const userId = req.session.userId
  if (!userId) {
    return res.redirect("/login")
  }
  const { quantity, productId } = req.body
  if (quantity >= 10) {
    res.status(400).send(" inavalid Qunatity")
  }

  const qty = quantity ? quantity : 1
  if (!productId) {
    return res.status(HttpStatusCodes.BAD_REQUEST).json({ error: "Product ID is required" });
  }

  if (isNaN(qty) || qty < 1) {
    return res.status(HttpStatusCodes.BAD_REQUEST).json({ error: "Quantity must be a positive integer" });
  }

  try {
    let cart = await Cart.findOne({ userId })
    if (cart) {
      const productIndex = cart.products.findIndex(p => p.productId.equals(productId))


      if (productIndex > -1) {
        cart.products[productIndex].quantity += qty

      } else {
        const product = await Products.findById(productId)
        const newPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
        cart.products.push({ productId, quantity: qty, price: newPrice, name: product.name, images: product.images, subTotal: product.price })
      }
      await cart.save()
    } else {

      const product = await Products.findById(productId);

      const newPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
      cart = new Cart({
        userId,
        products: [{ productId, quantity: qty, price: newPrice, name: product.name, images: product.images, subTotal: product.price }]
      })
      await cart.save()
      req.session.cartCount = cart.products.length;
      res.redirect("/cart")

    }


  } catch (error) {
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Error adding product to cart' });
    console.error("error in  add cart", error)
  }


}


const updateCart = async (req, res) => {
  const userId = req.session.userId
  if (!userId) {
    return res.redirect("/login")
  }
  const { productId, quantity } = req.body
  if (quantity >= 10) {
    res.status(400).send(" inavalid Qunatity")
  }

  try {
    let cart = await Cart.findOne({ userId })
    if (cart) {
      const productIndex = cart.products.findIndex(p => p.productId.equals(productId))
      const productPrice = await Products.findOne({ _id: productId }, { price: 1, _id: 0 });

      let productTotal;
      let cartTotal = 0;
      if (productIndex > -1) {
        cart.products[productIndex].quantity = quantity

        productTotal = productPrice * quantity;


        for (let i = 0; i < cart.products.length; i++) {
          const cartProduct = cart.products[i];
          const cartProductDetails = await Products.findById(cartProduct.productId);
          cartTotal += cartProductDetails.price * cartProduct.quantity;
        }

      }
      else {
        return res.status(HttpStatusCodes.NOT_FOUND).json({ error: 'Product not found in cart' });
      }
      await cart.save()
      req.session.cartCount = cart.products.length;
      return res.render('user/cart', {
        cartProducts: cart.products,
        productTotal,
        cartTotal
      });
    }
  } catch (error) {
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Error updating cart' });
    console.error("error in updating cart ", error)
  }
}

const removeCart = async (req, res) => {
  const userId = req.session.userId;
  const productId = req.params.Id;

  try {
    let cart = await Cart.findOne({ userId });

    if (cart) {
      // Find the product in the cart to get its quantity
      const productInCart = cart.products.find(p => p.productId.equals(productId));

      if (productInCart) {

        await Products.updateOne(
          { _id: productId },
          { $inc: { stock: productInCart.quantity } }
        );

        cart.products = cart.products.filter(p => !p.productId.equals(productId));
        await cart.save();

        return res.redirect('/cart');
      } else {
        return res.status(HttpStatusCodes.NOT_FOUND).json({ error: 'Product not found in cart' });
      }
    } else {
      return res.status(HttpStatusCodes.NOT_FOUND).json({ error: 'Cart not found' });
    }
  } catch (error) {
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Error removing product from cart' });
    console.error("Error in removing item from cart:", error);
  }
};


//chekout and order


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
      paymentMethod
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
  const userId = req.session.userid;

  try {
    const orders = await Order.find({ user: userId }).populate('products.productId').sort({ createdAt: -1 });

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
        description: `Refund for cancelled order ${orderId}`
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

//products

const filterProducts = async (req, res) => {
  const { category, material, 'min-price': minPrice, 'max-price': maxPrice, sort } = req.query;

  try {
    const query = {};

    if (category && Array.isArray(category)) {


      const selectedCategory = category.find(cat => cat !== '');
      if (selectedCategory) {
        try {
          console.log(selectedCategory);

          const foundCategory = await Category.findOne({ name: selectedCategory });
          if (foundCategory) {
            query.category = foundCategory._id;
          } else {

          }
        } catch (error) {
          console.error("Error finding category:", error);
        }
      }
    }






    if (minPrice && minPrice !== "") {
      query.price = { ...query.price, $gte: Number(minPrice) };
    }
    if (maxPrice && maxPrice !== "") {
      if (!query.price) {
        query.price = {};
      }
      query.price.$lte = Number(maxPrice);
    }
    query.isListed = true;




    let product = await Products.find(query);



    if (sort && sort !== "") {
      switch (sort) {
        case 'popularity':
          products = product.sort((a, b) => b.popularity - a.popularity);
          break;
        case 'priceLow':
          products = product.sort((a, b) => a.price - b.price);
          break;
        case 'priceHigh':
          products = product.sort((a, b) => b.price - a.price);
          break;
        case 'averageRating':
          products = product.sort((a, b) => b.rating - a.rating);
          break;
        case 'newArrivals':
          products = product.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'aToZ':
          products = product.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'zToA':
          products = product.sort((a, b) => b.name.localeCompare(a.name));
          break;
        default:
          break;
      }
    }



    res.render('user/shop', { product });
  } catch (error) {
    console.error(error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send('Internal Server Error');
  }
};


const serchProducts = async (req, res) => {
  const serchItem = req.query.search
  try {

    const query = {
      $and: [
        {
          $or: [
            { name: { $regex: serchItem, $options: "i" } },
            { description: { $regex: serchItem, $options: "i" } },
            { material: { $regex: serchItem, $options: "i" } }
          ]
        },
        { isListed: true }
      ]
    }


    const product = await Products.find(query)
    res.render("user/shop", { product, serchItem })


  } catch (error) {
    console.error("Error in search products:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "An error occurred while searching for products." });
  }
};


//wishlist

const loadWishlist = async (req, res) => {
  const userId = req.session.userId
  try {
    const user = await User.findById(userId).populate('wishList');
    const wishlist = user ? user.wishList : []
    res.render("user/wishlist", { wishlist })

  } catch (error) {
    console.error("error form loading the wishlist ", error)
  }

}

const addWishlist = async (req, res) => {


  const { productId } = req.body
  const userId = req.session.userId
  try {
    const user = await User.findById(userId)

    if (!user) {
      return res.json({ success: false, message: "User Doesnot exist" })
    }
    if (user.wishList.includes(productId)) {
      const productIndex = user.wishList.indexOf(productId);
      user.wishList.splice(productIndex, 1);
      await user.save();
    } else if (!user.wishList.includes(productId)) {
      user.wishList.push(productId)
      await user.save()
    }


  } catch (error) {
    console.error("Error adding product to wishlist:", error);
    res.status(500).json({ message: 'An error occurred while adding the product to wishlist.' });
  }
}

const removeWishlist = async (req, res) => {

  const userId = req.session.userId
  const productId = req.params.id
  try {
    const user = await User.findByIdAndUpdate(userId,
      { $pull: { wishList: productId } },
      { new: true }
    )
    if (user) {
      res.status(200).json({ success: true, message: "Product Removed from wishList" })
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    console.error("Error removing product from wishlist:", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
}

const addCartFromWishlist = async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.redirect("/login");
  }

  const { productId } = req.body;
  const qty = 1;

  if (!productId) {
    return res.status(400).json({ error: "Product ID is required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found with ID:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    const productInWishlist = user.wishList.find(p => p.equals(productId));
    if (!productInWishlist) {
      console.error("Product not found in wishlist with ID:", productId);
      return res.status(404).json({ error: "Product not found in wishlist" });
    }

    const product = await Products.findById(productId);
    if (!product) {
      console.error("Product not found in database with ID:", productId);
      return res.status(404).json({ error: "Product not found in database" });
    }

    const newPrice = product.discountPrice > 0 ? product.discountPrice : product.price;

    let cart = await Cart.findOne({ userId });
    if (cart) {
      const productIndex = cart.products.findIndex(p => p.productId.equals(productId));

      if (productIndex > -1) {
        cart.products[productIndex].quantity += qty;
      } else {
        cart.products.push({
          productId,
          quantity: qty,
          price: newPrice,
          name: product.name,
          images: product.images,
          subTotal: newPrice * qty,
        });
      }
    } else {
      cart = new Cart({
        userId,
        products: [{
          productId,
          quantity: qty,
          price: newPrice,
          name: product.name,
          images: product.images,
          subTotal: newPrice * qty,
        }]
      });
    }

    await cart.save();

    user.wishList = user.wishList.filter(p => !p.equals(productId));
    await user.save();

    req.session.cartCount = cart.products.length;
    res.json({ success: true, message: "Product added to cart" });
  } catch (error) {
    console.error("Error in addCartFromWishlist:", error.message);
    res.status(500).json({ error: "An error occurred while adding the product to the cart" });
  }
};




//coupon

const applyCoupon = async (req, res) => {
  try {
    const { couponCode, cartTotal } = req.body;

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


    req.session.coupon = {
      code: couponCode,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    };

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
    } else if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue;
    }
    discountAmount = Math.min(discountAmount, cartTotal);

    const newTotal = cartTotal - discountAmount;

    coupon.usageLimit -= 1;
    await coupon.save();

    return res.json({
      success: true,
      discountAmount,
      newTotal
    });

  } catch (error) {
    console.log('Error applying coupon:', error);
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


//razorpay

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const razorpayPayment = async (req, res) => {
  const amount = req.body.amount;
  const userId = req.session.userId;
  console.log(amount);

  if (!userId) {
    return res.redirect("/login");
  }

  try {

    const orderOptions = {
      amount: amount * 100,
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
    const newOrder = new Order({
      userId: userId,
      products: products,
      address: detail,
      total: totalAmount,
      status: 'Pending',
      paymentMethod: 'Razorpay',
    });

    await newOrder.save();
    await Cart.updateOne({ userId: userId }, { products: [] });
    res.json({
      amount: order.amount,
      order_id: order.id,
    });
  } catch (error) {
    console.error("Error in setting Razorpay:", error);
    res.status(500).json({ error: 'Error creating Razorpay order' });
  }
};


//wallet

// const walletTransaction= async(req,res)=>{
//   const user
// }



module.exports = {
  loadLogin,
  loadRegister,
  register,
  verifyOtp,
  loadVerifyOtp,
  login,
  resendOtp,
  loadHome,
  demologin,
  loadProducts,
  productDetails,
  profile,
  editProfile,
  loadAddress,
  addAddress,
  editAddress,
  deleteAddress,
  loadCart,
  addCart,
  updateCart,
  removeCart,
  loadCheckOut,
  defaultAddress,
  saveBillingAddress,
  placeOrder,
  orderHistory,
  orderDetails,
  filterProducts,
  cancelOrder,
  serchProducts,
  editPassword,
  loadWishlist,
  addWishlist,
  removeWishlist,
  applyCoupon,
  removeCoupon,
  razorpayPayment,
  thankyou,
  addCartFromWishlist



}