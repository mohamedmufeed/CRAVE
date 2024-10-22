const express = require("express");
const router = express.Router();
const userController = require("../Controller/usercontroller");

// Route to display register form
router.get("/register", userController.loadRegister);

// Correct POST route for registering
router.post("/register", userController.register);
router.get("/verify-otp",userController.loadVerifyOtp)
router.post("/verify-otp",userController.verifyOtp)
router.post("/resend-otp",userController.resendOtp)

router.get("/login", userController.loadLogin);
router.post("/login",userController.login)


module.exports = router;
