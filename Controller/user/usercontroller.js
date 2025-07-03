const WalletTransaction = require('../../Model/walletModel')
const User = require("../../Model/usermodel")
const Address = require("../../Model/addresModel")
const Products=require("../../Model/productModel")
const Cart = require("../../Model/cartModel")
const Order = require("../../Model/orderModel")
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require('crypto');
const saltround = 10
const HttpStatusCodes = require("../../config/httpStatusCode");
const logger = require('../../config/logger')
require('dotenv').config();



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
    logger.error("error sendign  email", error)
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
    logger.info(`OTP send ${otp}`)
    return res.status(200).json({ message: "OTP sent successfully", redirect: "/verify-otp" });
  } catch (error) {
    logger.error("Registration error:", error);
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
    logger.error("Error invalid otp", error)
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
      logger.info("Resend otp:", otp);
      return res.status(HttpStatusCodes.OK).json({ success: true, message: "OTP resend sucsessfully" })
    } else {
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to resend OTP please try again" })
    }

  } catch (error) {
    logger.error("Error resending OTP", error)
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
    logger.error("Login error:", error);
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
    logger.error("error sendign  email", error)
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
        logger.info("Your otp is :", otp)
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

//logout

const logout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error("error in logout", err)
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
  logout,
  loadForgotPassword,
  forgotEmailValid,
  validateforgotOtp,
  loadresetPassword,
  resetPassword,
  googleCallback,
}