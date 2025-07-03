const User = require("../../Model/usermodel");
const Category = require("../../Model/categoryModel");
const Products = require("../../Model/productModel");
const HttpStatusCodes = require("../../config/httpStatusCode");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const logger = require("../../config/logger");

require("dotenv").config();

cloudinary.config({
  cloud_name: "do4wdvbcy",
  api_key: "398738496838286",
  api_secret: process.env.CLOUD_SECRET,
});

const loadProducts = async (req, res) => {
  try {
    const products = await Products.find({ isListed: true }).populate({
      path: "category",
      select: "isListed",
    });

    const cartCount = req.session.cartCount;
    const product = products.filter(
      (product) => product.category && product.category.isListed
    );
    const activeOffers = Array.isArray(product.offersApplied)
      ? product.offersApplied.filter((offer) => offer.isActive)
      : [];

    const firstOffer = activeOffers[0];
    const hasDiscount =
      firstOffer &&
      product.discountPrice &&
      product.discountPrice < product.price;

    const discountLabel = hasDiscount
      ? firstOffer.discountType === "percentage" && firstOffer.discountValue
        ? ` ${firstOffer.discountValue}% off`
        : firstOffer.discountValue
        ? `₹${firstOffer.discountValue} off`
        : ""
      : "";

    res.render("user/shop", { product, cartCount, discountLabel });
  } catch (error) {
    logger.error("Error in product handling:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).render("404");
  }
};

const productDetails = async (req, res) => {
  try {
    const productId = req.params.id;
    // find products
    const product = await Products.findOne({ _id: productId }).populate(
      "offersApplied"
    );
    //filter offer
    const activeOffers = Array.isArray(product.offersApplied)
      ? product.offersApplied.filter((offer) => offer.isActive)
      : [];

    //find related products
    const relatedProducts = await Products.find({
      material: product.material,
      _id: { $ne: productId },
    });
    // cart count
    const cartCount = req.session.cartCount;
    //wishlist
    let flag = false;
    const user = await User.findOne({ _id: req.session.userId });
    if (user) {
      if (user.wishList && user.wishList.includes(productId)) {
        flag = true;
      }
    } else {
      flag = false;
    }

    const firstOffer = activeOffers[0];
    const hasDiscount =
      firstOffer &&
      product.discountPrice &&
      product.discountPrice < product.price;

    const discountLabel = hasDiscount
      ? firstOffer.discountType === "percentage" && firstOffer.discountValue
        ? ` ${firstOffer.discountValue}% off`
        : firstOffer.discountValue
        ? `₹${firstOffer.discountValue} off`
        : ""
      : "";

    res.render("user/single", {
      product,
      discountPrice: product.discountPrice || product.price,
      relatedProducts,
      cartCount,
      flag,
      discountLabel,
    });
  } catch (error) {
    res.status(HttpStatusCodes.NOT_FOUND).render("404");
    logger.error("Product not found", error);
  }
};

const filterProducts = async (req, res) => {
  const {
    category,
    material,
    "min-price": minPrice,
    "max-price": maxPrice,
    sort,
  } = req.query;

  try {
    const query = {};

    if (category && Array.isArray(category)) {
      const selectedCategory = category.find((cat) => cat !== "");
      if (selectedCategory) {
        try {
          const foundCategory = await Category.findOne({
            name: selectedCategory,
          });
          if (foundCategory) {
            query.category = foundCategory._id;
          } else {
          }
        } catch (error) {
          logger.error("Error finding category:", error);
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
        case "popularity":
          product = product.sort((a, b) => b.popularity - a.popularity);
          break;
        case "priceLow":
          product = product.sort((a, b) => a.price - b.price);
          break;
        case "priceHigh":
          product = product.sort((a, b) => b.price - a.price);
          break;
        case "averageRating":
          product = product.sort((a, b) => b.rating - a.rating);
          break;
        case "newArrivals":
          product = product.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          break;
        case "aToZ":
          product = product.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "zToA":
          product = product.sort((a, b) => b.name.localeCompare(a.name));
          break;
        default:
          break;
      }
    }

    // res.json({ products: product });
    res.render("user/shop", { product });
  } catch (error) {
    logger.error(error);
    res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .send("Internal Server Error");
  }
};

const userserchProducts = async (req, res) => {
  const serchItem = req.query.search;
  try {
    const query = {
      $and: [
        {
          $or: [
            { name: { $regex: serchItem, $options: "i" } },
            { description: { $regex: serchItem, $options: "i" } },
            { material: { $regex: serchItem, $options: "i" } },
          ],
        },
        { isListed: true },
      ],
    };

    const product = await Products.find(query);
    res.render("user/shop", { product, serchItem });
  } catch (error) {
    logger.error("Error in search products:", error);
    res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred while searching for products." });
  }
};

//user product details ends

// admin products  details



//admin product details ends
module.exports = {
  loadProducts,
  productDetails,
  filterProducts,
  userserchProducts,
};
