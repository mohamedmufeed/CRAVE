const Admin = require("../Model/adminmodel");
const User = require("../Model/usermodel")
const Category = require("../Model/categoryModel")
const Products = require("../Model/productModel")
const Review = require("../Model/reviewModel")
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { response } = require("express");
const saltround = 10

const loadRegister = async (req, res) => {
  res.render("user/register", {
    message: req.session.message
  })
  req.session.message = null;
}

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
        user: "mohamedmufeed44@gmail.com",
        pass: "yesq alaq htch ruga"
      }
    })
    const info = await transporter.sendMail({
      from: "mohamedmufeed44@gmail.com",
      to: email,
      subject: "Verfiy your account",
      text: ` your OTP is${otp}`,
      html: `<b> Your OTP :${otp}</b>`


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
        password: hashedPassword
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
      return res.status(400).json({ success: false, message: "Email not found in  session" })
    }
    const otp = generateOtp()
    req.session.userOTP = otp

    const emailSent = sendVerificationfEmail(email, otp)
    if (emailSent) {
      console.log("Resend otp:", otp);
      return res.status(200).json({ success: true, message: "OTP resend sucsessfully" })
    } else {
      return res.status(500).json({ success: false, message: "Failed to resend OTP please try again" })
    }

  } catch (error) {
    console.error("Error resending OTP", error)
    return res.status(500).json({ success: false, message: "server error please try again" })
  }


}




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

    const existUser = await User.findOne({ email: email, isBlocked:false });

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
      res.status(401).send("Invalid Credentials");
    }
  } catch (error) {
    console.error("Demo login not successful", error);
    res.status(500).send("Internal Server Error");
  }
};



const loadHome = async (req, res) => {
  res.render("user/index")
}

const loadProducts = async (req, res) => {
  try {
    const product = await Products.find({isListed:true})
  
    res.render("user/shop", { product })
  } catch (error) {
    console.error("Error in product handling:", error);
    res.status(500).render("404"); 
  }

}

const productDetails = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Products.findOne({ _id: productId });
    res.render("user/single", { product })
  } catch (error) {
    res.status(404).render("404")
    console.error("Product not found", error)
  }
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
  loadProducts,
  productDetails,
 
}