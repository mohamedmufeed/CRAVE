
const User = require("../Model/usermodel")
const Products = require("../Model/productModel")
const Cart = require("../Model/cartModel");
const logger = require("../config/logger");
require('dotenv').config();



// user wishlist

const loadWishlist = async (req, res) => {
    const userId = req.session.userId
    try {
      const user = await User.findById(userId)
      .populate({
        path: 'wishList',
        match: { isListed: true },  
        select: 'name price images isListed'  
      });

      const wishlist = user ? user.wishList.filter(product => product) : [];
    
       
      res.render("user/wishlist", { wishlist })
  
    } catch (error) {
      logger.error("error form loading the wishlist ", error)
    }
  
  }
  
  const addWishlist = async (req, res) => {
  
  
    const { productId } = req.body
    const userId = req.session.userId
    try {
      const user = await User.findById(userId)
  
      if (!user) {
        return res.json({ success: false, message: "User Doesnot exist" })
      }
      if (user.wishList.includes(productId)) {
        const productIndex = user.wishList.indexOf(productId);
        user.wishList.splice(productIndex, 1);
        await user.save();
      } else if (!user.wishList.includes(productId)) {
        user.wishList.push(productId)
        await user.save()
      }
  
  
    } catch (error) {
      logger.error("Error adding product to wishlist:", error);
      res.status(500).json({ message: 'An error occurred while adding the product to wishlist.' });
    }
  }
  
  const removeWishlist = async (req, res) => {
  
    const userId = req.session.userId
    const productId = req.params.id
    try {
      const user = await User.findByIdAndUpdate(userId,
        { $pull: { wishList: productId } },
        { new: true }
      )
      if (user) {
        res.status(200).json({ success: true, message: "Product Removed from wishList" })
      } else {
        res.status(404).json({ success: false, message: "User not found" });
      }
    } catch (error) {
      logger.error("Error removing product from wishlist:", error);
      res.status(500).json({ success: false, message: "An error occurred" });
    }
  }
  
  const addCartFromWishlist = async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.redirect("/login");
    }
  
    const { productId } = req.body;
    const qty = 1;
  
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        logger.error("User not found with ID:", userId);
        return res.status(404).json({ error: "User not found" });
      }
  
      const productInWishlist = user.wishList.find(p => p.equals(productId));
      if (!productInWishlist) {
        logger.error("Product not found in wishlist with ID:", productId);
        return res.status(404).json({ error: "Product not found in wishlist" });
      }
  
      const product = await Products.findById(productId);
      if (!product) {
        logger.error("Product not found in database with ID:", productId);
        return res.status(404).json({ error: "Product not found in database" });
      }
  
      const newPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  
      let cart = await Cart.findOne({ userId });
      if (cart) {
        const productIndex = cart.products.findIndex(p => p.productId.equals(productId));
  
        if (productIndex > -1) {
          cart.products[productIndex].quantity += qty;
        } else {
          cart.products.push({
            productId,
            quantity: qty,
            price: newPrice,
            name: product.name,
            images: product.images,
            subTotal: newPrice * qty,
          });
        }
      } else {
        cart = new Cart({
          userId,
          products: [{
            productId,
            quantity: qty,
            price: newPrice,
            name: product.name,
            images: product.images,
            subTotal: newPrice * qty,
          }]
        });
      }
  
      await cart.save();
  
      user.wishList = user.wishList.filter(p => !p.equals(productId));
      await user.save();
  
      req.session.cartCount = cart.products.length;
      res.json({ success: true, message: "Product added to cart" });
    } catch (error) {
      logger.error("Error in addCartFromWishlist:", error.message);
      res.status(500).json({ error: "An error occurred while adding the product to the cart" });
    }
  };

  module.exports = {loadWishlist,addWishlist,removeWishlist,addCartFromWishlist}