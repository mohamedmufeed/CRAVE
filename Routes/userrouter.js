const express = require("express");
const router = express.Router();
const userController = require("../Controller/usercontroller");
const passport = require("passport");
const userAuth = require("../middlware/userAuth");
const { route } = require("./adminrouter");


router.get("/register", userController.loadRegister);
router.post("/register", userController.register);
router.get("/verify-otp", userController.loadVerifyOtp)
router.post("/verify-otp", userController.verifyOtp)
router.post("/resend-otp", userController.resendOtp)
router.get("/login", userController.loadLogin);
router.post("/login", userController.login)
router.post('/demo-login', userController.demologin);
router.get("/auth/google", passport.authenticate("google", { scope: ['profile', 'email'] }))
router.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/register" }), (req, res) => {
    res.redirect("/")
})
router.get("/", userController.loadHome)
router.get("/products", userController.loadProducts)
router.get("/productdetails/:id", userController.productDetails)
router.get("/profile", userController.profile)
router.post("/profile/edit", userController.editProfile)
router.post("/profile/editpassword", userController.editPassword)
router.get("/profile/address", userController.loadAddress)
router.post("/profile/addAddress", userController.addAddress)
router.post("/profile/address/edit/:id", userController.editAddress)
router.post("/profile/address/delete/:id", userController.deleteAddress)
router.get("/cart", userController.loadCart)
router.post("/cart/add", userController.addCart)
router.post("/cart/update", userController.updateCart)
router.post("/cart/remove/:Id", userController.removeCart);
router.get("/checkOut", userController.loadCheckOut)
router.post("/address/default/:id", userController.defaultAddress)
router.post("/address/save", userController.saveBillingAddress)
router.post("/placeorder", userController.placeOrder)
router.get("/profile/orders", userController.orderHistory)
router.get("/profile/orders/orderdetails/:id", userController.orderDetails);
router.get("/products/filter", userController.filterProducts)
router.post("/prodile/orders/cancelorder/:id", userController.cancelOrder)
router.get("/products/search", userController.serchProducts)
router.get("/profile/wishlist", userController.loadWishlist)
router.post("/profile/wishlist/add", userController.addWishlist)
router.post("/profile/wishlist/remove/:id", userController.removeWishlist)
router.post("/addtocart", userController.addCartFromWishlist);

router.post("/applyCoupon", userController.applyCoupon)
router.post("/removeCoupon",userController.removeCoupon)
router.post("/razorpay",userController.razorpayPayment)
router.get("/thankyou",userController.thankyou)



module.exports = router;
