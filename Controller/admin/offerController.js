
const Category = require("../../Model/categoryModel")
const Products = require("../../Model/productModel")
const Offer = require("../../Model/offerModel");
const logger = require("../../config/logger");


//admin offer controller starts here

const loadOffer = async (req, res) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 8;
      const skip = (page - 1) * limit;
  
      const totalOffers = await Offer.countDocuments();
  
      const offers = await Offer.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('applicableProducts', 'name')
        .populate('applicableCategories', 'name');
       
  
  
      const totalPages = Math.ceil(totalOffers / limit);
      const previousPage = page > 1 ? page - 1 : null;
      const nextPage = page < totalPages ? page + 1 : null;
  
      const now = new Date();
      await Offer.deleteMany({ expiryDate: { $lt: now } });
  
      const product = await Products.find();
      const category = await Category.find();
  
      res.render("admin/offerManagement", {
        offers,
        product,
        category,
        currentPage: page,
        totalPages: totalPages,
        totalOffers: totalOffers,
        previousPage: previousPage,
        nextPage: nextPage
      });
      
    } catch (error) {
      logger.log("Error in loading offers:", error);
      res.status(500).send("Error loading offers");
    }
  };
  
  
  const createOffer = async (req, res) => {
    try {
      const { discountType, discountValue, expirationDate, description } = req.body;
  
      let applicableProducts = req.body.applicableProducts;
      let applicableCategories = req.body.applicableCategories;
  
      const expiryDate = new Date(expirationDate);
      const currentDate = new Date();
      if (isNaN(expiryDate.getTime()) || expiryDate <= currentDate) {
        return res.status(400).json({ message: 'Expiration date must be a valid future date' });
      }
  
      if (applicableProducts === "all" || (Array.isArray(applicableProducts) && applicableProducts.includes("all"))) {
        const allProducts = await Products.find({});
        applicableProducts = allProducts.map(product => product._id);
      } else if (!Array.isArray(applicableProducts)) {
        applicableProducts = [applicableProducts];
      }
  
      if (applicableCategories === "all" || (Array.isArray(applicableCategories) && applicableCategories.includes("all"))) {
        const allCategories = await Category.find({});
        applicableCategories = allCategories.map(category => category._id);
      } else if (!Array.isArray(applicableCategories)) {
        applicableCategories = [applicableCategories];
      }
  
      const isActive = req.body.isActive === "on";
  
      if (!discountType || !discountValue || !expirationDate || !description) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      if (!['fixed', 'percentage'].includes(discountType)) {
        return res.status(400).json({ message: 'Invalid discount type' });
      }
      const numericDiscountValue = Number(discountValue);
      if (numericDiscountValue <= 0) {
        return res.status(400).json({ message: 'Discount value must be positive' });
      }


      if (isNaN(new Date(expirationDate).getTime())) {
        return res.status(400).json({ message: 'Invalid expiration date' });
      }
  
      const offer = new Offer({
        discountType,
        discountValue: numericDiscountValue,
        applicableProducts,
        applicableCategories,
        expirationDate,
        description,
        isActive,
      });
  
      await offer.save();
  
      let productsToUpdate = [];
      if (applicableProducts && applicableProducts.length > 0) {
        productsToUpdate = await Products.find({ _id: { $in: applicableProducts } });
      }
      if (applicableCategories && applicableCategories.length > 0) {
        const productsInCategory = await Products.find({ category: { $in: applicableCategories } });
        productsToUpdate.push(...productsInCategory);
      }
  
      for (const product of productsToUpdate) {
        let discountPrice;
        const productPrice = Number(product.price);
  
        if (discountType === 'percentage') {
          discountPrice = productPrice - (productPrice * (numericDiscountValue / 100));
        } else if (discountType === 'fixed') {
          discountPrice = productPrice - numericDiscountValue;
        }
  
        discountPrice = Math.max(discountPrice, 0);
  
        await Products.updateOne(
          { _id: product._id },
          {
            $set: { discountPrice },
            $addToSet: { offersApplied: offer._id },
          }
        );
      }
  
      res.redirect("/admin/offerManagement");
    } catch (error) {
      logger.error("Error in creating an offer:", error);
      res.status(500).json({ message: 'Error creating offer', error: error.message });
    }
  };
  
  
   const editOffer = async (req, res) => {
  try {
    const {
      offerId,
      discountType,
      discountValue,
      description,
      expirationDate,
      isActive,
      applicableProducts: rawProducts,
      applicableCategories: rawCategories
    } = req.body;

    if (!discountType || !discountValue || !expirationDate || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['fixed', 'percentage'].includes(discountType)) {
      return res.status(400).json({ message: 'Invalid discount type' });
    }

    const numericDiscountValue = Number(discountValue);
    if (numericDiscountValue <= 0) {
      return res.status(400).json({ message: 'Discount value must be positive' });
    }

    if (discountType === "percentage" && numericDiscountValue >= 30) {
      return res.status(400).json({ message: "Maximum offer value is 30%" });
    }

    let applicableProducts = rawProducts;
    let applicableCategories = rawCategories;

    if (applicableProducts === "all" || (Array.isArray(applicableProducts) && applicableProducts.includes("all"))) {
      const allProducts = await Products.find({});
      applicableProducts = allProducts.map(product => product._id);
    } else if (!Array.isArray(applicableProducts)) {
      applicableProducts = [applicableProducts];
    }

    if (applicableCategories === "all" || (Array.isArray(applicableCategories) && applicableCategories.includes("all"))) {
      const allCategories = await Category.find({});
      applicableCategories = allCategories.map(category => category._id);
    } else if (!Array.isArray(applicableCategories)) {
      applicableCategories = [applicableCategories];
    }

    await Offer.findByIdAndUpdate(offerId, {
      discountType,
      discountValue: numericDiscountValue,
      description,
      expirationDate,
      isActive: isActive === 'on',
      applicableProducts,
      applicableCategories,
    });

    res.redirect('/admin/offerManagement');
  } catch (error) {
    logger.error("Error updating offer:", error);
    res.status(500).send("Failed to update offer.");
  }
};

  
  const deleteOffer = async (req, res) => {
    try {
      const offerId = req.params.id;
      const offer = await Offer.findByIdAndDelete(offerId);
  
      if (!offer) {
        return res.status(404).json({ message: 'Offer not found' });
      }
  
      res.redirect('/admin/offerManagement'); 
    } catch (error) {
      logger.error("Error in deleting offer:", error);
      res.status(500).json({ message: 'Server error' });
    }
  };



  module.exports={loadOffer,createOffer,editOffer,deleteOffer}

//   admin offer controller ends 