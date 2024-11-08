const Admin = require("../Model/adminmodel");
const User = require("../Model/usermodel")
const Category = require("../Model/categoryModel")
const Products = require("../Model/productModel")
const Order = require("../Model/orderModel")
const Offer = require("../Model/offerModel")
const Coupon = require("../Model/couponModel")
const bcrypt = require("bcrypt");
const HttpStatusCodes = require("../config/httpStatusCode");
const { serchProducts } = require("./usercontroller");

const loadlogin = async (req, res) => {
  res.render("admin/login", {
    message: req.session.message
  });
  req.session.message = null;
};

const login = async (req, res) => {
  const { username, password } = req.body;
  const existAdmin = await Admin.findOne({ userName: username });

  if (!existAdmin) {
    req.session.message = "admin not exits"
    return res.redirect("/admin/login")
  }
  const isMatch = await bcrypt.compare(password, existAdmin.password);
  if (!isMatch) {
    req.session.message = "password in not match"
    return res.redirect("/admin/login")
  }
  req.session.admin = true
  res.redirect('/admin/dashboard')
};


const loadDashboard = async (req, res) => {
  res.render('admin/dashboard')
}

const loadUserMangment = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 8;
    const skip = (page - 1) * limit;


    const totalUsers = await User.countDocuments();

    const users = await User.find({})
      .skip(skip)
      .limit(limit);


    const totalPages = Math.ceil(totalUsers / limit);
    const previousPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;


    res.render("admin/userManagement", {
      users: users,
      currentPage: page,
      totalPages: totalPages,
      totalUsers: totalUsers,
      previousPage: previousPage,
      nextPage: nextPage,
    });
  } catch (error) {
    console.error("Error loading user management:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("An error occurred while loading users.");
  }
}


const searchUser = async (req, res) => {
  const searchItem = req.query.search;
  try {
    const query = {
      $or: [
        { username: { $regex: searchItem, $options: "i" } },
        { email: { $regex: searchItem, $options: "i" } }
      ]
    };

    const users = await User.find(query);
    res.render("admin/userManagement", { users, searchItem });
  } catch (error) {
    console.error("Error in search users:", error);
    res.status(500).json({ message: "An error occurred while searching for users." });
  }
};


const blockUser = async (req, res) => {
  try {
    const userId = req.params.id
    await User.findByIdAndUpdate(userId, { isBlocked: true })
    res.redirect("/admin/userManagement")
  } catch (error) {
    console.log("Error blocking user:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("Server Error");
  }
}


const unblockUser = async (req, res) => {
  try {
    const userId = req.params.id
    await User.findByIdAndUpdate(userId, { isBlocked: false })
    res.redirect("/admin/userManagement")
  } catch (error) {
    console.log(error)
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("server error")
  }
}


const loadCategory = async (req, res) => {
  try {

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 7; // Set items per page
    const skip = (page - 1) * limit;

    // Fetch total number of categories
    const totalCategories = await Category.countDocuments(); // Get total number of categories


    const categories = await Category.find({})
      .skip(skip)
      .limit(limit);


    const totalPages = Math.ceil(totalCategories / limit);
    const previousPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;

    if (!categories || categories.length === 0) {
      return res.status(HttpStatusCodes.NOT_FOUND).send("No categories found");
    }


    res.render("admin/Category", {
      category: categories,
      currentPage: page,
      totalPages: totalPages,
      totalCategories: totalCategories,
      previousPage: previousPage,
      nextPage: nextPage
    });
  } catch (error) {
    console.error("Error loading categories:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("An error occurred while loading categories");
  }
}

const searchCategory = async (req, res) => {
  const searchItem = req.query.search
  try {
    const regex = new RegExp(searchItem, "i");
    const query = {
      $or: [
        { name: { $regex: regex } },
        { material: { $regex: regex } }
      ]
    };
    const category = await Category.find(query)
    res.render("admin/Category", { category })

  } catch (error) {
    console.error("error in  search category ", error)
    res.status(500).json({ message: "An error occurred while searching for category." });
  }
}

const editCategory = async (req, res) => {
  try {

    const { id } = req.params
    const { name, material } = req.body
    const existingCategory = await Category.findOne({
      _id: { $ne: id },
      name,
      material
    });

    if (existingCategory) {

      return res.status(HttpStatusCodes.NOT_FOUND).send("Category with this name and material already exists.");
    }
    await Category.findByIdAndUpdate(id, { name, material })

    res.redirect('/admin/category');
  } catch (error) {
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("Somthing went wrong")
    console.log(error)
  }
}

const listCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    await Category.findByIdAndUpdate(categoryId, { isListed: true });
    res.redirect("/admin/category")
  } catch (error) {
    console.error("Error listing category:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("An error occurred while listing the category");
  }
}

const unlistCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    await Category.findByIdAndUpdate(categoryId, { isListed: false });
    res.redirect("/admin/category")
  } catch (error) {
    console.error("Error unlisting category:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("An error occurred while  unlisting the category");
  }
}

const addCategory = async (req, res) => {
  try {
    const { name, material } = req.body


    const existingCategory = await Category.findOne({ name, material });

    if (existingCategory) {

      return res.status(HttpStatusCodes.BAD_REQUEST).send("Category with this name and material already exists.");
    }
    const newCategory = new Category({ name, material })
    await newCategory.save()
    res.redirect("/admin/category")
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("An error occurred while adding the category.");

  }
}


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

const searchProduct = async (req, res) => {
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

// start from here


const loadOrder = async (req, res) => {
  try {

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 7; // Set items per page
    const skip = (page - 1) * limit;

    // Fetch total number of categories
    const totalOrders = await Order.countDocuments(); // Get total number of categories


    const orders = await Order.find()
      .populate('userId', 'username')
      .populate('address')
      .populate('products.productId', 'name price')
      .skip(skip)
      .limit(limit);


    const totalPages = Math.ceil(totalOrders / limit);
    const previousPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;

    if (!orders || orders.length === 0) {
      return res.status(HttpStatusCodes.NOT_FOUND).send("No orders found");
    }


    res.render("admin/orderManagement", {
      orders: orders,
      currentPage: page,
      totalPages: totalPages,
      totalOrders: totalOrders,
      previousPage: previousPage,
      nextPage: nextPage
    });



  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'An error occurred while fetching orders.' });
  }

}

const serchOrder = async (req, res) => {
  const searchItem = req.query.search || "";

  try {

    const regex = new RegExp(searchItem, "i");

    const query = {
      $or: [
        { "userId.username": { $regex: regex } },
        { status: { $regex: regex } },
        { "products.name": { $regex: regex } }
      ]
    };

    const orders = await Order.find(query).populate('userId').populate('products.productId');
    res.render("admin/orderManagement", { orders, searchItem });
  } catch (error) {
    console.error("Error in search orders:", error);
    res.status(500).json({ message: "An error occurred while searching for orders." });
  }
};


const orderStatus = async (req, res) => {
  const orderId = req.params.id
  const newStatus = req.body.status


  try {
    const updateOrder = await Order.findByIdAndUpdate(orderId, { status: newStatus })
    if (!updateOrder) {
      return res.status(HttpStatusCodes.NOT_FOUND).json({ message: 'Order not found' });
    }
    res.redirect("/admin/orderManagement")
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'An error occurred while updating the order status.' });

  }

}

const cancelOrder = async (req, res) => {
  const orderId = req.params.id
  try {
    const order = await Order.findByIdAndUpdate(orderId, { status: "Cancelled" })
    res.redirect("/admin/orderManagement")
  } catch (error) {

  }
}


const loadInventory = async (req, res) => {
  try {


    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 8;
    const skip = (page - 1) * limit;

    const totalProducts = await Products.countDocuments();

    const product = await Products.find().skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalProducts / limit);
    const previousPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;

    res.render("admin/inventory", {
      product: product,
      currentPage: page,
      totalPages: totalPages,
      totalProducts: totalProducts,
      previousPage: previousPage,
      nextPage: nextPage,
    });


  } catch (error) {
    console.error("error in  load inventry :", error)
  }

}

const editInventory = async (req, res) => {
  const prdoductId = req.params.id
  const { name, price, stock } = req.body

  try {


    const existingProduct = await Products.findOne({
      _id: { $ne: prdoductId },
      name
    });

    if (existingProduct) {

      return res.status(HttpStatusCodes.UNAUTHORIZED).send("Product with this name already exists.");
    }

    if (price <= 0) {
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("Invalid price")
    }
    await Products.findByIdAndUpdate(prdoductId, { name, price, stock })
    res.redirect("/admin/inventory")
  } catch (error) {
    console.log(error)
  }

}

const loadOffer = async (req, res) => {
  try {
    const now = new Date();
    const product = await Products.find();
    const category = await Category.find();

    await Offer.deleteMany({ expiryDate: { $lt: now } });
    const offers = await Offer.find()
      .populate('applicableProducts', 'name')
      .populate('applicableCategories', 'name');


    res.render("admin/offerManagement", { product, category, offer: offers });
  } catch (error) {
    console.log("Error in loading offer:", error);
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
    console.error("Error in creating an offer:", error);
    res.status(500).json({ message: 'Error creating offer', error: error.message });
  }
};


 const editOffer= async (req, res) => {
  const { offerId, discountType, discountValue, description, expirationDate, isActive, applicableProducts, applicableCategories } = req.body;

  try {
    await Offer.findByIdAndUpdate(offerId, {
      discountType,
      discountValue,
      description,
      expirationDate,
      isActive: isActive === 'on', 
      applicableProducts,
      applicableCategories,
    });

    res.redirect('/admin/offerManagement'); 
  } catch (error) {
    console.error("Error updating offer:", error);
    res.status(500).send("Failed to update offer.");
  }
}


const deleteOffer = async (req, res) => {
  try {
    const offerId = req.params.id;
    const offer = await Offer.findByIdAndDelete(offerId);

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    res.json({ message: 'Offer deleted successfully' });
  } catch (error) {
    console.error("Error in deleting offer:", error);
    res.status(500).json({ message: 'Server error' });
  }
};


const loadCoupon = async (req, res) => {
  try {
    const product = await Products.find();
    const category = await Category.find();
    const coupon = await Coupon.find()
    .populate('applicableProducts', 'name')
    .populate('applicableCategories', 'name');
    res.render("admin/couponManagement", { coupon, product, category })

  } catch (error) {
    console.error("errror in loading copun management ", error)
  }

}


const createCoupon = async (req, res) => {
  try {

    const { code, discountType, discountValue, minimumCartValue, usageLimit, expiryDate, description } = req.body

    let applicableProducts = req.body.applicableProducts;
    let applicableCategories = req.body.applicableCategories;

    if (applicableProducts === "all" || (Array.isArray(applicableProducts) && applicableProducts.includes("all"))) {
      const allProducts = await Products.find({});
      applicableProducts = allProducts.map(product => product._id);
    } else if (!Array.isArray(applicableProducts)) {
      applicableProducts = [applicableProducts];
    }

    if (applicableCategories === "all" || (Array.isArray(applicableCategories) && applicableCategories.includes("all"))) {
      const allCategories = await Category.find({}).populate("");
      applicableCategories = allCategories.map(category => category._id);
    } else if (!Array.isArray(applicableCategories)) {
      applicableCategories = [applicableCategories];
    }

    if (!code || !discountType || !discountValue || !expiryDate || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['fixed', 'percentage'].includes(discountType)) {
      return res.status(400).json({ message: 'Invalid discount type' });
    }
    if (discountValue <= 0) {
      return res.status(400).json({ message: 'Discount value must be positive' });
    }
    if (isNaN(new Date(expiryDate).getTime())) {
      return res.status(400).json({ message: 'Invalid expiration date' });
    }

    const coupon = new Coupon({
      code,
      discountType,
      discountValue,
      minimumCartValue,
      usageLimit,
      expiryDate,
      description,
      applicableProducts,
      applicableCategories
    })

    await coupon.save()
    res.redirect("/admin/couponManagement")
  } catch (error) {
    console.error("error in creating coupon ", error)
  }
}

const deleteCoupon= async(req,res)=>{

try {
  const couponId=req.params.id
  const coupon= await Coupon.findByIdAndDelete(couponId)
  if(!coupon){
    res.status(400).send("coupon not found ")
  }
  res.redirect("/admin/couponManagement")
} catch (error) {
  console.error("Error in deleting coupon")
  res.status(500).json({ message: 'Server error' });
}
}


module.exports = {
  loadlogin,
  login,
  loadDashboard,
  loadUserMangment,
  blockUser,
  unblockUser,
  productManagement,
  loadCategory,
  editCategory,
  listCategory,
  unlistCategory,
  addCategory,
  addProducts,
  editProducts,
  listProduct,
  unlistProduct,
  loadOrder,
  orderStatus,
  cancelOrder,
  loadInventory,
  editInventory,
  searchUser,
  searchProduct,
  serchOrder,
  searchCategory,
  loadOffer,
  createOffer,
  deleteOffer,
  loadCoupon,
  createCoupon,
  deleteCoupon,
  editOffer



};
