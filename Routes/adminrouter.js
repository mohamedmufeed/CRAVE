const express = require("express");
const router = express.Router();
const adminController = require("../Controller/admincontroller");
const productController=require("../Controller/productController")
const orderController=require("../Controller/orderController")
const offerController=require("../Controller/offerController")
const inventoryController=require("../Controller/inventroryController")
const couponController=require("../Controller/couponController")
const categoryController=require("../Controller/categoryControlle")
const dashboardController=require("../Controller/dashboardController")
const  adminAuth=require("../middlware/adminauth")
const imagesController=require("../Controller/ imageController")
// Define the routes/

//login
router.get("/login", adminAuth.islogin, adminController.loadlogin);
router.post("/login", adminController.login);

//dashboard
router.get("/dashboard", adminAuth.checkSession,dashboardController.loadDashboard);

//user management
router.get("/userManagement", adminAuth.checkSession,adminController.loadUserMangment)
router.get("/userManagement/search",adminController.searchUser)
router.patch("/userManagement/block/:id", adminController.blockUser)
router.patch('/userManagement/unblock/:id',adminController.unblockUser)

//catrgory  management
router.get("/category", adminAuth.checkSession,categoryController.loadCategory)
router.get("/category/search",categoryController.searchCategory)
router.put("/category/edit/:id" ,categoryController.editCategory)
router.patch("/category/list/:id",categoryController.listCategory)
router.patch("/category/unlist/:id",categoryController.unlistCategory)
router.post("/category/add",categoryController.addCategory)

//prodcuts  management 
router.get("/productManagement", adminAuth.checkSession,productController.productManagement);
router.get("/productManagement/search", productController.adminsearchProduct);
router.post("/product/add",imagesController.upload,productController.addProducts)
router.post('/product/edit/:id', imagesController.upload, productController.editProducts);
router.patch("/productManagement/list/:id",productController.listProduct)
router.patch("/productManagement/unlist/:id",productController.unlistProduct)

//order management 
router.get("/orderManagement",adminAuth.checkSession,orderController.loadOrder),
router.get("/orderManagement/search", orderController.serchOrder)
router.patch("/orderManagement/status/:id",orderController.orderStatus)
router.post("/orderManagement/cancel/:id",orderController.admincancelOrder)

//inventory  managemnt 
router.get("/inventory", adminAuth.checkSession,inventoryController.loadInventory)
router.put("/inventory/edit/:id",inventoryController.editInventory)

//offer management 
router.get("/offerManagement", adminAuth.checkSession,offerController.loadOffer)
router.post("/offerManagement/create",offerController.createOffer)
router.put("/offerManagement/edit",offerController.editOffer)
router.post("/offerManagement/delete/:id",offerController.deleteOffer)

//coupon management
router.get("/couponManagement",adminAuth.checkSession,couponController.loadCoupon)
router.post("/couponManagement/create",couponController.createCoupon)
router.put("/couponManagement/edit",couponController.editCoupon)
router.delete("/couponManagement/delete/:id",couponController.deleteCoupon)

//sales report 
router.get("/salesReport",adminAuth.checkSession,adminController.salesReport)
router.get("/downloadSalesReport/pdf", adminController.generatePDFReport);
router.get("/downloadSalesReport/excel", adminController.generateExcelReport);

//logout
router.get("/logout",adminAuth.checkSession,adminController.logout)


module.exports = router;
