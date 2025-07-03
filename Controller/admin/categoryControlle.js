
const Category = require("../../Model/categoryModel")
const HttpStatusCodes = require("../../config/httpStatusCode");
const logger = require("../../config/logger");

//admin category coontroller strats

const loadCategory = async (req, res) => {
    try {
  
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 7;
      const skip = (page - 1) * limit;
  
  
      const totalCategories = await Category.countDocuments();
  
  
      const categories = await Category.find({})
      .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
  
  
      const totalPages = Math.ceil(totalCategories / limit);
      const previousPage = page > 1 ? page - 1 : null;
      const nextPage = page < totalPages ? page + 1 : null;
  
      // if (!categories || categories.length === 0) {
      //   return res.status(HttpStatusCodes.NOT_FOUND).send("No categories found");
      // }
  
  
      res.render("admin/Category", {
        category: categories,
        currentPage: page,
        totalPages: totalPages,
        totalCategories: totalCategories,
        previousPage: previousPage,
        nextPage: nextPage
      });
    } catch (error) {
      logger.error("Error loading categories:", error);
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
      logger.error("error in  search category ", error)
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
      logger.log(error)
    }
  }
  
  const listCategory = async (req, res) => {
    try {
      const categoryId = req.params.id;
      await Category.findByIdAndUpdate(categoryId, { isListed: true });
      res.redirect("/admin/category")
    } catch (error) {
      logger.error("Error listing category:", error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("An error occurred while listing the category");
    }
  }
  
  const unlistCategory = async (req, res) => {
    try {
      const categoryId = req.params.id;
      await Category.findByIdAndUpdate(categoryId, { isListed: false });
      res.redirect("/admin/category")
    } catch (error) {
      logger.error("Error unlisting category:", error);
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
      logger.error("Error adding category:", error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("An error occurred while adding the category.");
  
    }
  }


   module.exports={
    loadCategory,searchCategory,editCategory,listCategory,unlistCategory,addCategory
   }

   

//   admin categories controller ends 