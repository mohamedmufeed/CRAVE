const WalletTransaction = require('../Model/walletModel')
const User = require("../Model/usermodel")
const Address = require("../Model/addresModel")
const Products=require("../Model/productModel")
const Cart = require("../Model/cartModel")
const Order = require("../Model/orderModel")
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require('crypto');
const saltround = 10
const HttpStatusCodes = require("../config/httpStatusCode");
require('dotenv').config();
const Razorpay = require('razorpay');



//register

const googleCallback=async(req,res)=>{
  req.session.userId = req.user._id; 
  req.session.isAuthenticated = true;
  res.redirect('/');
}



const loadRegister = async (req, res) => {
  if(req.session.userId){
    return  res.redirect("/")
   }
  res.render("user/register", {
    message: req.session.message
  })
  req.session.message = null;
}
const generateReferralCode = () => {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationfEmail(email, otp,username) {
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
      text: `Hello ${username},\n\nWelcome to Crave! We're thrilled to have you join our community.\n\nWith Crave, you now have access to the best selection of furniture to match your style and comfort needs. Explore our catalog, discover new designs, and enjoy exclusive member benefits.\n\nTo complete your registration, please use the OTP below to verify your email:\n\nYour OTP: ${otp}\n\nThank you for choosing Crave. We're excited to help you make your space truly yours.\n\nBest regards,\nThe Crave Team`,
      html: `
        <h1>Welcome to Crave, ${username}!</h1>
        <p>We're thrilled to have you join our community. At Crave, we bring you the best in comfort, quality, and style. Dive in to explore our wide range of furniture, crafted to suit every taste and need.</p>
        <h2>Your OTP: <strong>${otp}</strong></h2>
        <p>Please use this OTP to complete your registration and unlock all the benefits Crave has to offer.</p>
        <p>Thank you for choosing Crave, ${username}. We can't wait to help you make your space uniquely yours!</p>
        <br>
        <p>Best regards,<br>The Crave Team</p>
      `
    });
    

    return info.accepted.length > 0

  } catch (error) {
    console.error("error sendign  email", error)
    return false
  }

}




const register = async (req, res) => {
  const { username, email, password, referalCode, Conformpassword } = req.body;

  try {
    const errors = {};

    const exitsUser = await User.findOne({ email });
    if (exitsUser) {
      errors.email = "Email is already registered";
    }

    if (!username) errors.username = "Username is required";
    if (!email) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";

    const usernamePattern = /^[A-Za-z]+$/;
    if (username && !usernamePattern.test(username)) {
      errors.username = "Please enter a valid Username";
    }

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (password && !passwordPattern.test(password)) {
      errors.password = "Password must include uppercase, lowercase, number, special character, and 8+ characters.";
    }

    if (password !== Conformpassword) {
      errors.Conformpassword = "Passwords do not match";
    }

    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (email && !emailPattern.test(email)) {
      errors.email = "Please enter a valid email";
    }

    if (referalCode) {
      const referalCodeUser = await User.findOne({ referralCode: referalCode });
      if (!referalCodeUser) {
        errors.referalCode = "Invalid referral code";
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const otp = generateOtp();
    const emailSent = await sendVerificationfEmail(email, otp, username);
    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send email" });
    }

    req.session.userOTP = otp;
    req.session.userData = { username, email, password };
    console.log(`OTP send ${otp}`)
    return res.status(200).json({ message: "OTP sent successfully", redirect: "/verify-otp" });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



const loadVerifyOtp = async (req, res) => {
  res.render("user/verfiy", {
    message: req.session.message
  })
  req.session.message = null;
}

const verifyOtp = async (req, res) => {
  try {

    const { otp } = req.body;
    const referalCode = req.session.referalCode

    if (otp == req.session.userOTP) {
      const user = req.session.userData
      const hashedPassword = await bcrypt.hash(user.password, saltround)

      let saveUserData

      if (!referalCode) {
        saveUserData = new User({
          username: user.username,
          email: user.email,
          password: hashedPassword,
          referralCode: generateReferralCode(),
        })
      } else {
        saveUserData = new User({
          username: user.username,
          email: user.email,
          password: hashedPassword,
          referralCode: generateReferralCode(),
          walletBalance: 50
        })
        const referingUser = await User.findOne({ referralCode: referalCode })
        if (referingUser) {
          referingUser.walletBalance += 50
          await referingUser.save()

          const referingTransaction = new WalletTransaction({
            userId: referingUser._id,
            amount: 50,
            transactionType: 'Credit',
            description: 'Referral bonus credited'
          })
          await referingTransaction.save()

        }
      }


      await saveUserData.save();
      req.session.userId= saveUserData._id;
     
      if (referalCode) {
        const newTransaction = new WalletTransaction({
          userId: saveUserData._id,
          amount: 50,
          transactionType: 'Credit',
          description: 'Referral signup bonus credited'
        })
        await newTransaction.save()
      }
      req.session.isAuthenticated = true;
     req.session.message="Account created successfully! Welcome to Crave."
     return res.redirect("/")

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
  if(req.session.userId){
   return  res.redirect("/")
  }
  res.render("user/login", {
    message: req.session.message
  })
  req.session.message = null;
}


const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const errors = {};

    if (!email) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";

    const existUser = await User.findOne({ email, isBlocked: false });

    if (!existUser) {
      errors.email = "User does not exist";
    } else {
      const isMatch = await bcrypt.compare(password, existUser.password);
      if (!isMatch) {
        errors.password = "Password is incorrect";
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    req.session.userId = existUser._id;
    req.session.isAuthenticated = true;
    req.session.message="Welcome back! You have successfully logged in."
    return res.status(200).json({ redirectUrl: "/" });
  } catch (error) {
    console.error("Login error:", error);
    req.session.message = "An error occurred. Please try again.";
    return res.redirect("/login");
  }
};


//forgotpassword

async function sendVerificationfEmailvald(email, otp) {
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
      subject: 'Your otp for password reset',
      text: `   Your OTP is${otp}`,
      html: ` '<h1>Welcome!</h1> <p>Thank you for signing up with Crave.</p>' <b> Your OTP :${otp}</b>`


    })

    return true
  } catch (error) {
    console.error("error sendign  email", error)
    return false
  }
}


const loadForgotPassword = async (req, res) => {

  res.render("user/forgotpassword", {
    message: req.session.message
  })
  req.session.message = null
}

const forgotEmailValid = async (req, res) => {
  const { email } = req.body
  try {
    const user = await User.findOne({ email: email })
    if (user) {
      const otp = generateOtp()
      const emailSent = await sendVerificationfEmailvald(email, otp)
      if (emailSent) {
        req.session.userOtp = otp,
          req.session.email = email
        res.render("user/forgotpassword-otp")
        console.log("Your otp is :", otp)
      } else {
        res.json({ success: false, message: "Failed to send otp" })
      }
    } else {
      res.render("user/forgotpassword")
      req.session.message = "User not exixts with this email"
    }
  } catch (error) {
    res.render("404")
  }

}

const validateforgotOtp = async (req, res) => {
  try {
    const enteredotp = req.body.otp
    if (enteredotp === req.session.userOtp) {
      res.render("user/resetPassword")
    } else {
      res.render("user/forgotpassword-otp")
    }

  } catch (error) {
    res.status(500).json({ success: false, message: "Please try again" })
  }
}

const loadresetPassword = async (req, res) => {
  try {
    res.render("user/resetPassword")
  } catch (error) {
    res.render("404")
  }
}


const resetPassword = async (req, res) => {
  try {
    const { password, Conformpassword } = req.body
    console.log(password, Conformpassword)
    const email = req.session.email
    if (password === Conformpassword) {
      const hashedPassword = await bcrypt.hash(password, saltround)
      const user = await User.findOne({ email: email })
      if (user) {
        user.password = hashedPassword
        await user.save()
      }
      res.redirect("/login")
    } else {
      res.render("user/resetPassword", { message: "Paasord do not match please try again" })
    }

  } catch (error) {
    res.render("404")
  }
}


//profile


const profile = async (req, res) => {
  try {
    const userid = req.session.userId
    const cartCount = req.session.cartCount
    const user = await User.findOne({ _id: userid ,isBlocked:false})
    if(!user){
      res.status(HttpStatusCodes.BAD_REQUEST).redirect("/login")
    }
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


    const usernamePattern = /^[A-Za-z]+$/;
    if (!usernamePattern.test(username)) {
      req.session.message = "Invalid username";
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

    if(newpassword === oldpassword){
      req.session.message = "Please enter a new password";
      return res.redirect("/profile");
    }
    const passwordPattern= /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

    if (!passwordPattern.test(newpassword)) {
      req.session.message = "Password must include an uppercase letter, a lowercase letter, a number, and a special character";
      return res.redirect("/profile");
    }

    if (newpassword !== cpassword) {
      req.session.message = "New password and confirmation do not match.";
      return res.redirect("/profile");
    }

    const hashedPassword = await bcrypt.hash(newpassword, 10);
    user.password = hashedPassword;
    await user.save();
    req.session.message = "Password changed successfully!";

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
    if(!userId){
       return res.redirect("/login")
    }
    const cartCount = req.session.cartCount
    const addresses = await Address.find({ user: userId });
    res.render("user/address", { addresses, message: req.session.message, cartCount });
    req.session.message = null;
  } catch (error) {
    console.log(error);
return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({message:"internal server error"})
  }
}

const addAddress = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, addressLine, city, state, pinCode, country } = req.body;


    const errors = {};

    if (!firstName) errors.firstName = "First name is required.";
    if (!lastName) errors.lastName = "Last name is required.";
    if (!email) errors.email = "Email is required.";
    if (!mobile) errors.mobile = "Mobile number is required.";
    if (!addressLine) errors.addressLine = "Address is required.";
    if (!city) errors.city = "City is required.";
    if (!state) errors.state = "State is required.";
    if (!pinCode) errors.pinCode = "Pincode is required.";
    if (!country) errors.country = "Country is required.";

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (email && !emailRegex.test(email)) {
      errors.email = "Please enter a valid email address.";
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (mobile && !mobileRegex.test(mobile)) {
      errors.mobile = "Please enter a valid 10-digit mobile number.";
    }

    const pinCodeRegex = /^[0-9]{6}$/;
    if (pinCode && !pinCodeRegex.test(pinCode)) {
      errors.pinCode = "Please enter a valid 6-digit pincode.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const newAddress = new Address({
      user: req.session.userId,
      firstName,
      lastName,
      email,
      mobile,
      addressLine,
      city,
      state,
      pinCode,
      country,
    });


    await newAddress.save();
    // return res.redirect("/profile/address");
    return res.status(HttpStatusCodes.OK).json({success:true})
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred while adding the address." });
  }
};



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




//razorpay



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
      console.log("This is the coupon being applied:", coupon);
    
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
    console.error("Error in setting Razorpay:", error);
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
        console.error("Error in payment success:", error);
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
    console.error("Error in retry payment:", error);
    res.status(500).send("Internal server error");
  }
};



//logout

const logout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("error in logout", err)
      return res.status(500).send("Error logging out");
    }
    res.redirect("/login")
  })
}




//home section


const getTopSellingProducts= async()=>{
  const topProducts= await Order.aggregate([
      {$unwind:"$products"},
      {$group:{
          _id:"$products.productId",
          totalSold:{$sum:"$products.quantity"}
      }
  },
  {$sort:{totalSold:-1}},
  {$limit:10},
  {
      $lookup:{
          from:"products",
          localField:"_id",
          foreignField:"_id",
          as:"productDetails"
      }
  },
  { $unwind: "$productDetails" },
  {
    $match: { "productDetails.isListed": true }  
  },
  { $project: {
      productId: "$_id",
      name: "$productDetails.name",
      totalSold: 1
    }
  }
  ])
  return topProducts
}

const loadHome = async (req, res) => {
  try {


    const topSellingData= await getTopSellingProducts()
  
    const  productId= topSellingData.map(data=>data.productId)
    const topSellingProducts= await Products.find({_id:{$in:productId}}).limit(3)

    const cartCount = req.session.cartCount

    res.render("user/index", { cartCount,topSellingProducts , message: req.session.message})
    req.session.message=null
    
  } catch (error) {
    console.error("error in loading  home page",error)
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({message:"internal server error"})
  }

}

//other

const loadAboutus= async(req,res)=>{
   const user=req.session.userId
   if(!user){
   return  res.redirect("/login")
   }
 return  res.render("user/aboutUs")
  }

  const loadServices= async(req,res)=>{
    const user=req.session.userId
    if(!user){
    return  res.redirect("/login")
    }
    return res.render("user/services")
  }

  const loadBlog= async(req,res)=>{
    const user=req.session.userId
    if(!user){
    return  res.redirect("/login")
    }
    return res.render("user/blog")
  }

  const loadContact= async(req,res)=>{
    const user=req.session.userId
    if(!user){
    return  res.redirect("/login")
    }
   return  res.render("user/contact")
  }

// const load
  

module.exports = {
  loadLogin,
  loadRegister,
  register,
  verifyOtp,
  loadVerifyOtp,
  login,
  resendOtp,
  loadHome,
  profile,
  editProfile,
  loadAddress,
  addAddress,
  editAddress,
  deleteAddress,
  editPassword,
  razorpayPayment,
  logout,
  loadForgotPassword,
  forgotEmailValid,
  validateforgotOtp,
  loadresetPassword,
  resetPassword,
  paymentSuccess,
  retryPayment,
  loadAboutus,
  googleCallback,
  loadServices,
  loadBlog,
  loadContact
 
}