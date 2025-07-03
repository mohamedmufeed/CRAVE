
const Products = require("../Model/productModel")

const HttpStatusCodes = require("../config/httpStatusCode");
const logger = require("../config/logger");


const loadInventory = async (req, res) => {
    try {
  
  
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 8;
      const skip = (page - 1) * limit;
  
      const totalProducts = await Products.countDocuments();
  
      const product = await Products.find().skip(skip).sort({ createdAt: -1 })
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
      logger.error("error in  load inventry :", error)
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
  
        return res.status(HttpStatusCodes.UNAUTHORIZED).json({message:"Poroduct with this name alredy exits!"})
      }
  
      if (price <= 0) {
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({message:"price must be postive number"})
      }
      if(stock <=0){
        return res.status(HttpStatusCodes.BAD_REQUEST).json({message:"Stock must be postive number"})
      }
      await Products.findByIdAndUpdate(prdoductId, { name, price, stock })
      res.redirect("/admin/inventory")
    } catch (error) {
      logger.log(error)
    }
  
  }

  module.exports={
    loadInventory,editInventory
  }