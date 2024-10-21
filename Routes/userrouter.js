const express = require("express");
const router = express.Router();
const userController = require("../Controller/usercontroller");

// Route to display register form
router.get("/register", userController.loadRegister);

// Correct POST route for registering
router.post("/register", userController.register);

router.get("/login", userController.loadLogin);

module.exports = router;
