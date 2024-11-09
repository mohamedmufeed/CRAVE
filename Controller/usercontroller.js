const Admin = require("../Model/adminmodel");
const User = require("../Model/usermodel")
const Address = require("../Model/addresModel")
const Cart = require("../Model/cartModel")
const Order = require("../Model/orderModel")
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


//register

const loadRegister = async (req, res) => {
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

  profile,
  editProfile,
  loadAddress,
  addAddress,
  editAddress,
  deleteAddress,

  editPassword,

  razorpayPayment,

  logout



}