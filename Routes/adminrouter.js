const express = require("express");
const router = express.Router();
const adminController = require("../Controller/admincontroller");
const  adminAuth=require("../middlware/adminauth")
const imagesController=require("../Controller/ imageController")
// Define the routes/
router.get("/login", adminAuth.islogin, adminController.loadlogin);
router.post("/login", adminController.login);
router.get("/dashboard", adminAuth.checkSession,adminController.loadDashboard);
router.get("/userManagement", adminAuth.checkSession,adminController.loadUserMangment)
router.get("/userManagement/search",adminController.searchUser)
router.post("/userManagement/block/:id", adminController.blockUser)
router.post('/userManagement/unblock/:id',adminController.unblockUser)
router.get("/category", adminAuth.checkSession,adminController.loadCategory)
router.get("/category/search",adminController.searchCategory)
router.post("/category/edit/:id" ,adminController.editCategory)
router.post("/category/list/:id",adminController.listCategory)
router.post("/category/unlist/:id",adminController.unlistCategory)
router.post("/category/add",adminController.addCategory)
router.get("/productManagement", adminAuth.checkSession,adminController.productManagement);
router.get("/productManagement/search", adminController.searchProduct);
router.post("/product/add",imagesController.upload,adminController.addProducts)
router.post('/product/edit/:id', imagesController.upload, adminController.editProducts);
router.post("/productManagement/list/:id",adminController.listProduct)
router.post("/productManagement/unlist/:id",adminController.unlistProduct)
router.get("/orderManagement",adminController.loadOrder),
router.get("/orderManagement/search", adminController.serchOrder)
router.post("/orderManagement/status/:id",adminController.orderStatus)
router.post("/orderManagement/cancel/:id",adminController.cancelOrder)
router.get("/inventory", adminAuth.checkSession,adminController.loadInventory)
router.post("/inventory/edit/:id",adminController.editInventory)
router.get("/offerManagement",adminController.loadOffer)
router.post("/offerManagement/create",adminController.createOffer)
router.post("/offerManagement/edit",adminController.editOffer)
router.post("/offerManagement/delete/:id",adminController.deleteOffer)
router.get("/couponManagement",adminController.loadCoupon)
router.post("/couponManagement/create",adminController.createCoupon)
router.post("/couponManagement/delete/:id",adminController.deleteCoupon)

module.exports = router;
