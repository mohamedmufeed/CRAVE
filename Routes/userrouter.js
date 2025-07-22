const express = require("express");
const router = express.Router();
const userController = require("../Controller/user/usercontroller");
const wishlistController=require("../Controller/user/wishlistController")
const walletController=require("../Controller/user/walletController")
const productController=require("../Controller/user/productController")
const orderController=require("../Controller/user/orderController")
const couponController=require("../Controller/user/couponController")
const cartController=require("../Controller/user/cartController")
const invoiceController=require("../Controller/user/invoiceController")
const paymenetController=require("../Controller/user/paymentController")
const passport = require("passport");
const profileController=require("../Controller/user/profileController")
const addressController=require("../Controller/user/addressController")
const homeController=require("../Controller/user/homeController")



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
router.get("/", homeController.loadHome)


//product page 

router.get("/products", productController.loadProducts)
router.get("/productdetails/:id", productController.productDetails)
router.get("/products/filter", productController.filterProducts)
router.get("/products/search",productController.userserchProducts)


//profile page


router.get("/profile", profileController.profile)
router.post("/profile/edit", profileController.editProfile)
router.post("/profile/editpassword", profileController.editPassword)

 //profile address page 

router.get("/profile/address", addressController.loadAddress)
router.post("/profile/addAddress", addressController.addAddress)
router.post("/profile/address/edit/:id", addressController.editAddress)
router.delete("/profile/address/delete/:id", addressController.deleteAddress)

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
router.get("/aboutus",homeController.loadAboutus)
router.get("/services",homeController.loadServices)
router.get("/blog",homeController.loadBlog)
router.get("/contact",homeController.loadContact)

router.get("/logout",userController.logout)


module.exports = router;
