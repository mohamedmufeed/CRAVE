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
router.post("/userManagement/block/:id", adminAuth.checkSession,adminController.blockUser)
router.post('/userManagement/unblock/:id', adminAuth.checkSession,adminController.unblockUser)
router.get("/category", adminAuth.checkSession,adminController.loadCategory)
router.post("/category/edit/:id" , adminAuth.checkSession,adminController.editCategory)
router.post("/category/list/:id", adminAuth.checkSession,adminController.listCategory)
router.post("/category/unlist/:id", adminAuth.checkSession,adminController.unlistCategory)
router.post("/category/add",adminAuth.checkSession,adminController.addCategory)
router.get("/productManagement", adminAuth.checkSession,adminController.productManagement)
router.post("/product/add",  adminAuth.checkSession,imagesController.upload,adminController.addProducts )
router.post('/product/edit/:id', imagesController.upload, adminController.editProducts);
router.post("/product/delete/:id",adminController.deleteProducts)


module.exports = router;
