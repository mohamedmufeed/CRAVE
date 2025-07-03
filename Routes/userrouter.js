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
const paymenetController=require("../Controller/paymentController")
const passport = require("passport");



//  signup
router.get("/register", userController.loadRegister);
router.post("/register", userController.register);
router.get("/verify-otp", userController.loadVerifyOtp)
router.post("/verify-otp", userController.verifyOtp)
router.post("/resend-otp", userController.resendOtp)


// login 


router.get("/login", userController.loadLogin);
router.post("/login", userController.login)

router.get("/auth/google", passport.authenticate("google", { scope: ['profile', 'email'] }))
// router.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/register" }), (req, res) => {
   
//     res.redirect("/")
// })

router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/register' }), userController.googleCallback);

//home page
router.get("/", userController.loadHome)


//product page 

router.get("/products", productController.loadProducts)
router.get("/productdetails/:id", productController.productDetails)
router.get("/products/filter", productController.filterProducts)
router.get("/products/search",productController.userserchProducts)


//profile page


router.get("/profile", userController.profile)
router.post("/profile/edit", userController.editProfile)
router.post("/profile/editpassword", userController.editPassword)

 //profile address page 

router.get("/profile/address", userController.loadAddress)
router.post("/profile/addAddress", userController.addAddress)
router.post("/profile/address/edit/:id", userController.editAddress)
router.delete("/profile/address/delete/:id", userController.deleteAddress)

// cart  
router.get("/cart", cartController.loadCart)
router.post("/cart/add", cartController.addCart)
router.patch("/cart/update", cartController.updateCart)
router.delete("/cart/remove/:Id", cartController.removeCart);

// checkout
router.get("/checkOut", orderController.loadCheckOut)
router.post("/address/default/:id", orderController.defaultAddress)
router.post("/address/save", orderController.saveBillingAddress)
router.post("/placeorder", orderController.placeOrder)

//order history
router.get("/profile/orders", orderController.orderHistory)
router.get("/profile/orders/orderdetails/:id", orderController.orderDetails);
router.patch("/profile/orders/cancelorder/:orderId/:productId", orderController.cancelOrder)
router.patch('/profile/orders/returnorder/:orderId/:productId',orderController.returnorder)


//wishlist 

router.get("/profile/wishlist", wishlistController.loadWishlist)
router.post("/profile/wishlist/add", wishlistController.addWishlist)
router.delete("/profile/wishlist/remove/:id", wishlistController.removeWishlist)
router.post("/addtocart", wishlistController.addCartFromWishlist);

//coupon controller
router.post("/applyCoupon",couponController.applyCoupon)
router.post("/removeCoupon",couponController.removeCoupon)
router.post("/copondiscount",couponController.total)

// razorpay cntroller 
router.post("/razorpay",paymenetController.razorpayPayment)
router.get("/thankyou",orderController.thankyou)
router.post("/payment-sucsess",paymenetController.paymentSuccess)
router.post("/razorpay/retry/:id",paymenetController.retryPayment)


//walet
router.get("/profile/wallet",walletController.loadWallet)


// forgot password
router.get("/forgotPassword",userController.loadForgotPassword)
router.post("/forgot-password-email-validaion",userController.forgotEmailValid)
router.post("/forgotpassword-verify-otp",userController.validateforgotOtp)
router.get("/resetPassword",userController.loadresetPassword)
router.post("/reset-password",userController.resetPassword)


// invoice
router.get("/invoice/download/:id",invoiceController.invoiceDownload)

// other 
router.get("/aboutus",userController.loadAboutus)
router.get("/services",userController.loadServices)
router.get("/blog",userController.loadBlog)
router.get("/contact",userController.loadContact)

router.get("/logout",userController.logout)


module.exports = router;
