

const User = require("../Model/usermodel")
const Category = require("../Model/categoryModel")
const Products = require("../Model/productModel")
const { serchProducts } = require("./usercontroller");
const HttpStatusCodes = require("../config/httpStatusCode");
require('dotenv').config();



//  user product details

const loadProducts = async (req, res) => {
    try {
      const product = await Products.find({ isListed: true })
      const cartCount = req.session.cartCount
  
      res.render("user/shop", { product, cartCount })
    } catch (error) {
      console.error("Error in product handling:", error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).render("404");
    }
  
  }
  
  const productDetails = async (req, res) => {
    try {
      const productId = req.params.id;
      // find products
      const product = await Products.findOne({ _id: productId }).populate('offersApplied');
  //filter offer
      const activeOffers = Array.isArray(product.offersApplied)
      ? product.offersApplied.filter(offer => offer.isActive)
      : [];
  
      //find related products
      const relatedProducts = await Products.find({ material: product.material, _id: { $ne: productId } })
      // cart count
      const cartCount = req.session.cartCount
      //wishlist
      let flag = false
      const user = await User.findOne({ _id: req.session.userId })
      if (user) {
        if (user.wishList && user.wishList.includes(productId)) {
          flag = true;
        }
      } else {
        flag = false;
      }
  
      const firstOffer = activeOffers[0];
      const hasDiscount = firstOffer && product.discountPrice && product.discountPrice < product.price;
  
  
      const discountLabel = hasDiscount
        ? (firstOffer.discountType === 'percentage' && firstOffer.discountValue
          ? ` ${firstOffer.discountValue}% off`
          : firstOffer.discountValue
            ? `₹${firstOffer.discountValue} off`
            : '')
        : '';
  
      res.render("user/single", {
        product,
        discountPrice: product.discountPrice || product.price,
        relatedProducts,
        cartCount,
        flag,
        discountLabel
      })
  
    } catch (error) {
      res.status(HttpStatusCodes.NOT_FOUND).render("404")
      console.error("Product not found", error)
    }
  }
  
  const filterProducts = async (req, res) => {
    const { category, material, 'min-price': minPrice, 'max-price': maxPrice, sort } = req.query;
  
    try {
      const query = {};
  
      if (category && Array.isArray(category)) {
  
  
        const selectedCategory = category.find(cat => cat !== '');
        if (selectedCategory) {
          try {
            console.log(selectedCategory);
  
            const foundCategory = await Category.findOne({ name: selectedCategory });
            if (foundCategory) {
              query.category = foundCategory._id;
            } else {
  
            }
          } catch (error) {
            console.error("Error finding category:", error);
          }
        }
      }
  
  
  
  
  
  
      if (minPrice && minPrice !== "") {
        query.price = { ...query.price, $gte: Number(minPrice) };
      }
      if (maxPrice && maxPrice !== "") {
        if (!query.price) {
          query.price = {};
        }
        query.price.$lte = Number(maxPrice);
      }
      query.isListed = true;
  
  
  
  
      let product = await Products.find(query);
  
  
  
      if (sort && sort !== "") {
        switch (sort) {
          case 'popularity':
            products = product.sort((a, b) => b.popularity - a.popularity);
            break;
          case 'priceLow':
            products = product.sort((a, b) => a.price - b.price);
            break;
          case 'priceHigh':
            products = product.sort((a, b) => b.price - a.price);
            break;
          case 'averageRating':
            products = product.sort((a, b) => b.rating - a.rating);
            break;
          case 'newArrivals':
            products = product.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
          case 'aToZ':
            products = product.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'zToA':
            products = product.sort((a, b) => b.name.localeCompare(a.name));
            break;
          default:
            break;
        }
      }
  
  
  
      res.render('user/shop', { product });
    } catch (error) {
      console.error(error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send('Internal Server Error');
    }
  };
  
  
  const userserchProducts = async (req, res) => {
    const serchItem = req.query.search
    try {
  
      const query = {
        $and: [
          {
            $or: [
              { name: { $regex: serchItem, $options: "i" } },
              { description: { $regex: serchItem, $options: "i" } },
              { material: { $regex: serchItem, $options: "i" } }
            ]
          },
          { isListed: true }
        ]
      }
  
  
      const product = await Products.find(query)
      res.render("user/shop", { product, serchItem })
  
  
    } catch (error) {
      console.error("Error in search products:", error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "An error occurred while searching for products." });
    }
  };


  //user product details ends 



  // admin products  details 



const productManagement = async (req, res) => {
    try {
  
      const totalCategories = await Category.countDocuments(); // Get total number of categories
      const categories = await Category.find({});
  
  
  
  
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 7;
      const skip = (page - 1) * limit;
  
  
      const totalProducts = await Products.countDocuments();
      const products = await Products.find({}).populate('category')
        .skip(skip)
        .limit(limit);
  
  
  
      if (!products || products.length === 0) {
        console.log("No products found");
      }
  
  
      const totalPages = Math.ceil(totalProducts / limit);
      const previousPage = page > 1 ? page - 1 : null;
      const nextPage = page < totalPages ? page + 1 : null;
  
  
      res.render("admin/productManagement", {
        categories,
        products,
        currentPage: page,
        totalPages: totalPages,
        totalCategories: totalCategories,
        previousPage: previousPage,
        nextPage: nextPage,
  
      });
  
  
    } catch (error) {
      console.error("Error in product management:", error.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("An error occurred while fetching products and categories.");
    }
  }
  
  const adminsearchProduct = async (req, res) => {
    const searchItem = req.query.search || "";
    try {
  
      const regex = new RegExp(searchItem, "i");
  
      const query = {
        $or: [
          { name: { $regex: regex } },
          { description: { $regex: regex } },
          { material: { $regex: regex } }
        ]
      };
  
      const products = await Products.find(query);
      res.render("admin/productManagement", { products, searchItem });
    } catch (error) {
      console.error("Error in search products:", error);
      res.status(500).json({ message: "An error occurred while searching for products." });
    }
  };
  
  
  
  
  const addProducts = async (req, res) => {
    try {
      const { name, description, price, category, material, stock } = req.body;
      const images = req.files;
  
      // Validate input
      if (!name || !price || !category || !description || !stock || !material) {
        return res.status(HttpStatusCodes.BAD_REQUEST).send({ message: 'Please fill all required fields' });
      }
  
  
  
      if (price <= 0 || stock <= 0) {
        return res.status(HttpStatusCodes.BAD_REQUEST).send({ message: 'Invalid price or stock value' });
      }
  
      // Ensure images are uploaded
      if (!images || images.length < 1) {
        return res.status(HttpStatusCodes.BAD_REQUEST).send({ message: 'Please upload at least one image' });
      }
  
      // Process image file names
      const imagePaths = images.map(file => file.filename);
  
      // Create new product
      const newProduct = new Products({
        name,
        description,
        price,
        category,
        material,
        stock,
        images: imagePaths
      });
  
      // Save product to DB
      await newProduct.save();
      res.redirect("/admin/productManagement");
    } catch (error) {
      console.error("Error while adding product:", error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send({ message: "Internal Server Error" });
    }
  };
  
  const editProducts = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, price, category, material, stock } = req.body;
      const images = req.files;
  
  
      if (!name || !description || !price || !category || !material || !stock) {
        return res.status(HttpStatusCodes.BAD_REQUEST).send("All fields are required");
      }
  
      if (price <= 0 || stock <= 0) {
        return res.status(HttpStatusCodes.BAD_REQUEST).send({ message: 'Invalid price or stock value' });
      }
  
      const product = await Products.findById(id);
  
      if (!product) {
        return res.status(HttpStatusCodes.NOT_FOUND).send("Product not found");
      }
  
      let updatedImages = product.images || [];
      if (images && images.length > 0) {
        const newImagePaths = images.map(file => file.path);
        updatedImages = [...updatedImages, ...newImagePaths];
      }
  
  
      await Products.findByIdAndUpdate(id, {
        name,
        description,
        price,
        category,
        material,
        stock,
        images: updatedImages
      });
  
      res.redirect("/admin/productManagement");
    } catch (error) {
      console.error("Error updating product: ", error.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("Error updating product: " + error.message);
    }
  };
  
  
  
  
  const listProduct = async (req, res) => {
    try {
      const productId = req.params.id;
  
  
      await Products.findByIdAndUpdate(productId, { isListed: true });
  
      res.redirect("/admin/productManagement")
    } catch (error) {
      console.error("Error listing product:", error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("An error occurred while updating the product.");
    }
  }
  
  const unlistProduct = async (req, res) => {
    try {
      const productId = req.params.id;
  
      await Products.findByIdAndUpdate(productId, { isListed: false });
      res.redirect("/admin/productManagement")
    } catch (error) {
      console.error("Error unlisting product:", error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("An error occurred while unlist the product.");
    }
  }


  //admin product details ends 
  module.exports = {loadProducts,productDetails,filterProducts,userserchProducts,productManagement,adminsearchProduct,addProducts,editProducts,listProduct,unlistProduct}