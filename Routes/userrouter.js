const express = require("express");
const router = express.Router();
const userController = require("../Controller/usercontroller");
const wishlistController=require("../Controller/wishlistController")
const walletController=require("../Controller/walletController")
const productController=require("../Controller/productController")
const orderController=require("../Controller/orderController")
const couponController=require("../Controller/couponController")
const cartController=require("../Controller/cartController")
const invoiceController=require("../Controller/invoiceController")
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
router.get("/products", productController.loadProducts)
router.get("/productdetails/:id", productController.productDetails)
router.get("/profile", userController.profile)
router.post("/profile/edit", userController.editProfile)
router.post("/profile/editpassword", userController.editPassword)
router.get("/profile/address", userController.loadAddress)
router.post("/profile/addAddress", userController.addAddress)
router.post("/profile/address/edit/:id", userController.editAddress)
router.post("/profile/address/delete/:id", userController.deleteAddress)
router.get("/cart", cartController.loadCart)
router.post("/cart/add", cartController.addCart)
router.post("/cart/update", cartController.updateCart)
router.post("/cart/remove/:Id", cartController.removeCart);
router.get("/checkOut", orderController.loadCheckOut)
router.post("/address/default/:id", orderController.defaultAddress)
router.post("/address/save", orderController.saveBillingAddress)
router.post("/placeorder", orderController.placeOrder)
router.get("/profile/orders", orderController.orderHistory)
router.get("/profile/orders/orderdetails/:id", orderController.orderDetails);
router.get("/products/filter", productController.filterProducts)
router.post("/profile/orders/cancelorder/:orderId/:productId", orderController.cancelOrder)
router.get("/products/search", productController.userserchProducts)
router.get("/profile/wishlist", wishlistController.loadWishlist)
router.post("/profile/wishlist/add", wishlistController.addWishlist)
router.post("/profile/wishlist/remove/:id", wishlistController.removeWishlist)
router.post("/addtocart", wishlistController.addCartFromWishlist);
router.post("/applyCoupon",couponController.applyCoupon)
router.post("/removeCoupon",couponController.removeCoupon)
router.post("/razorpay",userController.razorpayPayment)
router.get("/thankyou",orderController.thankyou)
router.get("/profile/wallet",walletController.loadWallet)
router.get("/logout",userController.logout)
router.post('/profile/orders/returnorder/:orderId/:productId',orderController.returnorder)
router.get("/forgotPassword",userController.loadForgotPassword)
router.post("/forgot-password-email-validaion",userController.forgotEmailValid)
router.post("/forgotpassword-verify-otp",userController.validateforgotOtp)
router.get("/resetPassword",userController.loadresetPassword)
router.post("/reset-password",userController.resetPassword)
router.post("/payment-sucsess",userController.paymentSuccess)
router.post("/razorpay/retry/:id",userController.retryPayment)
router.get("/invoice/download/:id",invoiceController.invoiceDownload)
router.get("/aboutus",userController.loadAboutus)





module.exports = router;
