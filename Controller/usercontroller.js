const Admin = require("../Model/adminmodel");
const User = require("../Model/usermodel")
const Category = require("../Model/categoryModel")
const Products = require("../Model/productModel")
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer")
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
      from:"mohamedmufeed44@gmail.com",
      to:email,
      subject:"Verfiy your account",
      text:` your OTP is${otp}`,
      html:`<b> Your OTP :${otp}</b>`


    })

    return info.accepted.length >0

  } catch (error) {
console.error("error sendign  email",error)
return false
  }

}

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const exitsUser = await User.findOne({ email })
    if (exitsUser) {
      req.session.message = "Email is already registered"
      return res.redirect("/register")
    }

    const otp = generateOtp();
    const emailSent = await sendVerificationfEmail(email, otp);
if(!emailSent){
  return res.json("email sending error")
}

req.session.userOTP=otp
req.session.userData={username,email,password}
res.render("user/verfiy")
console.log(`OTP send ${otp}`)

  } catch (error) {
console.error("signup error");
// res.redirect("/pagenot found")
  }







}







const loadLogin = async (req, res) => {
  res.render("user/login")
}



module.exports = {
  loadLogin,
  loadRegister, 
  register
}