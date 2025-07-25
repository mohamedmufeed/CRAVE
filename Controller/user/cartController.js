
const Products = require("../../Model/productModel")
const Cart = require("../../Model/cartModel")
const Coupon = require("../../Model/couponModel")
const HttpStatusCodes = require("../../config/httpStatusCode");
const logger = require("../../config/logger");
require('dotenv').config();


//cart




const loadCart = async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    req.session.message = "Please log in to access your cart.";
    return res.redirect("/login");
  }


  try {
    const coupon = await Coupon.find();
    const cart = await Cart.findOne({ userId }).populate({
      path: 'products.productId',
      select: 'name price images discountPrice  isListed'
    });


    const couponDetails = req.session.coupon



    if (!cart || !cart.products || cart.products.length === 0) {
      req.session.cartCount = 0;
      req.session.message = "Your cart is empty.";
      return res.render("user/cart", { products: [], message: req.session.message, coupon });
    }

    const validProducts = cart.products.filter(product => product.productId && product.productId.isListed);
    const removedProducts = cart.products.filter(product => !product.productId || !product.productId.isListed);



    if (removedProducts.length > 0) {
      req.session.message = "Some products were removed from your cart as they are no longer available.";
      cart.products = validProducts;
      await cart.save();
    }

    req.session.cartCount = validProducts.length;



    if (validProducts.length > 0) {
      const totalCartPrice = validProducts.reduce((total, product) => {
        const productPrice = product.productId.discountPrice || product.productId.price;
        return total + (productPrice * product.quantity);
      }, 0);


      const applicableCoupons = coupon.filter(coupon => coupon.minimumCartValue <= totalCartPrice);
      return res.render("user/cart", {
        products: validProducts,
        totalCartPrice,
        applicableCoupons,
        message: req.session.message,
        couponDetails: couponDetails
      });
    } else {
      req.session.cartCount = 0;
      req.session.message = "Your cart is empty.";
      return res.render("user/cart", { products: [], message: req.session.message, coupon });
    }
  } catch (error) {
    logger.error("Error loading cart: ", error);
    req.session.message = "An error occurred while loading the cart. Please try again later.";
    return res.status(500).render("404", { message: req.session.message });
  } finally {
    req.session.message = null;
  }

};


const addCart = async (req, res) => {
  const userId = req.session.userId

  if (!userId) {
    return res.redirect("/login")
  }
  const { quantity, productId } = req.body
  if (quantity >= 10) {
    res.status(400).send(" inavalid Qunatity")
  }

  const qty = quantity ? quantity : 1
  if (!productId) {
    return res.status(HttpStatusCodes.BAD_REQUEST).json({ error: "Product ID is required" });
  }

  if (isNaN(qty) || qty < 1) {
    return res.status(HttpStatusCodes.BAD_REQUEST).json({ error: "Quantity must be a positive integer" });
  }

  try {
    let cart = await Cart.findOne({ userId })
    if (cart) {
      const productIndex = cart.products.findIndex(p => p.productId.equals(productId))


      if (productIndex > -1) {
        cart.products[productIndex].quantity += qty

      } else {
        const product = await Products.findById(productId)
        console.log("The value",product)
        const newPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
        console.log("the prodcut pro",newPrice)
        cart.products.push({ productId, quantity: qty, price: newPrice, name: product.name, images: product.images, subTotal: product.price ,  stock: product.stock })
      }
      await cart.save()
    } else {

      const product = await Products.findById(productId);
        console.log("The value",product)
      const newPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
        console.log("the prodcut pro",newPrice)
      cart = new Cart({
        userId,
        products: [{ productId, quantity: qty, price: newPrice, name: product.name, images: product.images, subTotal: product.price,  stock: product.stock  }]
      })
      await cart.save()
      req.session.cartCount = cart.products.length;


    }
    res.redirect("/cart")

  } catch (error) {
      logger.error("error in  add cart", error)
    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Error adding product to cart' });
  
  }


}





const updateCart = async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.redirect("/login");
  }

  const { productId, quantity } = req.body;
  const parsedQuantity = Number(quantity);

  if (parsedQuantity < 1 || parsedQuantity > 10) {
    return res.status(400).json({ error: "Invalid Quantity" });
  }

  try {
    const productDetails = await Products.findOne({ _id: productId }, { price: 1, stock: 1 , discountPrice:1 });
    if (!productDetails) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (parsedQuantity > productDetails.stock) {
      console.log(`Only ${productDetails.stock} items in stock` )
      return res.status(400).json({ error: `Only ${productDetails.stock} items in stock` });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found for user" });
    }

    const productIndex = cart.products.findIndex(p => p.productId.equals(productId));
    if (productIndex === -1) {
      return res.status(404).json({ error: "Product not found in cart" });
    }

    cart.products[productIndex].quantity = parsedQuantity;
    await cart.save();

    let cartTotal = 0;
    for (const item of cart.products) {
      const p = await Products.findById(item.productId);
      const finalPrice= p.discountPrice ? p.discountPrice :p.price
      cartTotal += finalPrice * item.quantity;
    }
const finalPrice= productDetails.discountPrice ? productDetails.discountPrice :productDetails.price
    const productTotal = finalPrice * parsedQuantity;
    req.session.cartCount = cart.products.length;

    return res.json({
      success: true,
      data: {
        cartProducts: cart.products,
        productTotal,
        cartTotal,
        quantity: parsedQuantity,
        stock: productDetails.stock
      }
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    return res.status(500).json({ error: "Error updating cart" });
  }
};




const removeCart = async (req, res) => {
  const userId = req.session.userId;
  const productId = req.params.Id;

  try {
    let cart = await Cart.findOne({ userId });

    if (cart) {
      const productInCart = cart.products.find(p => p.productId.equals(productId));

      if (productInCart) {

        await Products.updateOne(
          { _id: productId },
          { $inc: { stock: productInCart.quantity } }
        );

        cart.products = cart.products.filter(p => !p.productId.equals(productId));
        await cart.save();

        return res.redirect('/cart');
      } else {

        return res.status(HttpStatusCodes.NOT_FOUND).json({ error: 'Product not found in cart' });
      }
    } else {
      return res.status(HttpStatusCodes.NOT_FOUND).json({ error: 'Cart not found' });
    }
  } catch (error) {
        logger.error("Error in removing item from cart:", error);
    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Error removing product from cart' });

  }
};

module.exports = { loadCart, addCart, updateCart, removeCart }    