
const Category = require("../../Model/categoryModel");
const Products = require("../../Model/productModel");
const HttpStatusCodes = require("../../config/httpStatusCode");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const logger = require("../../config/logger");

const productManagement = async (req, res) => {
  try {
    const totalCategories = await Category.countDocuments();
    const categories = await Category.find({});

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 7;
    const skip = (page - 1) * limit;

    const totalProducts = await Products.countDocuments();
    const products = await Products.find({})
      .populate("category")
      .skip(skip)
      .limit(limit);

    if (!products || products.length === 0) {
      logger.log("No products found");
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
    logger.error("Error in product management:", error.message);
    res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .send("An error occurred while fetching products and categories.");
  }
};

const adminsearchProduct = async (req, res) => {
  try {
    const { search, page = 1 } = req.query;
    const limit = 10; 
    const skip = (page - 1) * limit;
    const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = search
      ? {
          $or: [
            { name: { $regex: escapeRegex(search), $options: 'i' } },
            { description: { $regex: escapeRegex(search), $options: 'i' } },
            { 'category.name': { $regex: escapeRegex(search), $options: 'i' } },
          ],
        }
      : {};

    const products = await Products.find(query)
      .populate('category') 
      .skip(skip)
      .limit(limit)
      .lean();
    const totalProducts = await Products.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        previousPage: parseInt(page) > 1 ? parseInt(page) - 1 : null,
        nextPage: parseInt(page) < totalPages ? parseInt(page) + 1 : null,
      },
    });
  } catch (error) {
    logger.error('Error in search products:', error.stack);
    res.status(500).json({ message: 'Error searching products', error: error.message });
  }
};

const addProducts = async (req, res) => {
  try {
    const { name, description, price, category, material, stock } = req.body;
    const images = req.files;

    // Validate input
    if (!name || !price || !category || !description || !stock || !material) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .send({ message: "Please fill all required fields" });
    }

    if (price <= 0 || stock <= 0) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .send({ message: "Invalid price or stock value" });
    }

    // Ensure images are uploaded
    if (!images || images.length < 1) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .send({ message: "Please upload at least one image" });
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
      images: imagePaths,
    });

    // Save product to DB
    await newProduct.save();
    res.redirect("/admin/productManagement");
  } catch (error) {
    logger.error("Error while adding product:", error);
    res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: "Internal Server Error" });
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

    const {
      name,
      description,
      price,
      material,
      stock,
      category,
      updatedImages,
    } = req.body;

    if (!name || !description || !price || !material || !stock || !category) {
      return res.status(400).send("All fields are required.");
    }
    const existingImages = updatedImages ? JSON.parse(updatedImages) : [];

    const newImages =
      req.files && req.files.length > 0
        ? await Promise.all(
            req.files.map((file) => uploadImageToCloudinary(file))
          )
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
      return res.status(404).send("Product not found.");
    }

    res.redirect("/admin/productManagement");
  } catch (error) {
    logger.error("Error updating product: ", error.message);
    res.status(500).send("Error updating product: " + error.message);
  }
};

const listProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    await Products.findByIdAndUpdate(productId, { isListed: true });

    res.redirect("/admin/productManagement");
  } catch (error) {
    logger.error("Error listing product:", error);
    res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .send("An error occurred while updating the product.");
  }
};

const unlistProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    await Products.findByIdAndUpdate(productId, { isListed: false });
    res.redirect("/admin/productManagement");
  } catch (error) {
    logger.error("Error unlisting product:", error);
    res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .send("An error occurred while unlist the product.");
  }
};


module.exports={
    unlistProduct,
    listProduct,
    editProducts,
    addProducts,
    adminsearchProduct,
    productManagement
}