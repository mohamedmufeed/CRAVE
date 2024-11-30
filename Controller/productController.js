
const mongoose = require("mongoose");

const User = require("../Model/usermodel")
const Category = require("../Model/categoryModel")
const Products = require("../Model/productModel")
const { serchProducts } = require("./usercontroller");
const HttpStatusCodes = require("../config/httpStatusCode");
const cloudinary = require('cloudinary').v2;
const streamifier = require("streamifier");


require('dotenv').config();



   cloudinary.config({ 
  cloud_name: 'do4wdvbcy', 
  api_key: '398738496838286', 
  api_secret:process.env.CLOUD_SECRET 
  });

//  user product details

const loadProducts = async (req, res) => {
    try {
      const products = await Products.find({ isListed: true }).populate({
        path:'category',
        select:'isListed'
      })

      
      
      const cartCount = req.session.cartCount

      const product=products.filter(product => product.category && product.category.isListed);
      const activeOffers = Array.isArray(product.offersApplied)
      ? product.offersApplied.filter(offer => offer.isActive)
      : [];

  

      const firstOffer = activeOffers[0];
      const hasDiscount = firstOffer && product.discountPrice && product.discountPrice < product.price;
  
  
      const discountLabel = hasDiscount
        ? (firstOffer.discountType === 'percentage' && firstOffer.discountValue
          ? ` ${firstOffer.discountValue}% off`
          : firstOffer.discountValue
            ? `₹${firstOffer.discountValue} off`
            : '')
        : '';

  
  
      res.render("user/shop", { product, cartCount,discountLabel })
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
            product = product.sort((a, b) => b.popularity - a.popularity);
            break;
          case 'priceLow':
            product = product.sort((a, b) => a.price - b.price);
            break;
          case 'priceHigh':
            product = product.sort((a, b) => b.price - a.price);
            break;
          case 'averageRating':
            product = product.sort((a, b) => b.rating - a.rating);
            break;
          case 'newArrivals':
            product = product.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
          case 'aToZ':
            product = product.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'zToA':
            product = product.sort((a, b) => b.name.localeCompare(a.name));
            break;
          default:
            break;
        }
      }
  
  
      // res.json({ products: product });
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
  
 const uploadImageToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadResult = cloudinary.uploader.upload_stream(
      { folder: "crave/products" },
      (error, result) => {
        if (error) {
          reject(error); 
        } else {
          resolve(result.secure_url);
        }
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadResult);
  });
};

const imagePaths = [];
for (const file of images) {
  const imageUrl = await uploadImageToCloudinary(file);
  imagePaths.push(imageUrl); 
}



  
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
  
  const uploadImageToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
      const uploadResult = cloudinary.uploader.upload_stream(
        { folder: "crave/products" }, 
        (error, result) => {
          if (error) {
            reject(error); 
          } else {
            resolve(result.secure_url); 
          }
        }
      );
  
      streamifier.createReadStream(file.buffer).pipe(uploadResult);
    });
  };
  
  
  const editProducts = async (req, res) => {
    try {
      const productId = req.params.id;
  
      const { name, description, price, material, stock, category, updatedImages } = req.body;
  
      if (!name || !description || !price || !material || !stock || !category) {
        return res.status(400).send('All fields are required.');
      }
  
      const existingImages = updatedImages ? JSON.parse(updatedImages) : [];
  
    const newImages = req.files && req.files.length > 0 
      ? await Promise.all(req.files.map(file => uploadImageToCloudinary(file))) 
      : [];
  
    const finalImages = [...new Set([...existingImages, ...newImages])];
  
  
      const updatedProduct = await Products.findByIdAndUpdate(productId, {
        name,
        description,
        price,
        material,
        stock,
        category,
        images: finalImages,
      });
  
      if (!updatedProduct) {
        return res.status(404).send('Product not found.');
      }
  
      res.redirect('/admin/productManagement');
    } catch (error) {
      console.error('Error updating product: ', error.message);
      res.status(500).send('Error updating product: ' + error.message);
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
  module.exports = {
    loadProducts,
    productDetails,
    filterProducts,
    userserchProducts,
    productManagement,
    adminsearchProduct,
    addProducts,
    editProducts,
    listProduct,
    unlistProduct
  }