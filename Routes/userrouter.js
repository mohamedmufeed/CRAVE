const express = require("express");
const router = express.Router();
const userController = require("../Controller/usercontroller");
const passport = require("passport");

// Route to display register form
router.get("/register", userController.loadRegister);

// Correct POST route for registering
router.post("/register", userController.register);
router.get("/verify-otp",userController.loadVerifyOtp)
router.post("/verify-otp",userController.verifyOtp)
router.post("/resend-otp",userController.resendOtp)
router.get("/login", userController.loadLogin);
router.post("/login",userController.login)
router.post('/demo-login', userController.demologin);


router.get("/auth/google",passport.authenticate("google",{scope: ['profile', 'email']}))
router.get("/auth/google/callback",passport.authenticate("google",{failureRedirect:"/register"}),(req,res)=>{
    res.redirect("/")
})
router.get("/",userController.loadHome)

module.exports = router;
