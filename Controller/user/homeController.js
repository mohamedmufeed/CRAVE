const logger = require("../../config/logger")
const Order = require("../../Model/orderModel")
const Products=require("../../Model/productModel")

const getTopSellingProducts= async()=>{
  const topProducts= await Order.aggregate([
      {$unwind:"$products"},
      {$group:{
          _id:"$products.productId",
          totalSold:{$sum:"$products.quantity"}
      }
  },
  {$sort:{totalSold:-1}},
  {$limit:10},
  {
      $lookup:{
          from:"products",
          localField:"_id",
          foreignField:"_id",
          as:"productDetails"
      }
  },
  { $unwind: "$productDetails" },
  {
    $match: { "productDetails.isListed": true }  
  },
  { $project: {
      productId: "$_id",
      name: "$productDetails.name",
      totalSold: 1
    }
  }
  ])
  return topProducts
}

const loadHome = async (req, res) => {
  try {

    const topSellingData= await getTopSellingProducts()
  
    const  productId= topSellingData.map(data=>data.productId)
    const topSellingProducts= await Products.find({_id:{$in:productId}}).limit(3)

    const cartCount = req.session.cartCount

    res.render("user/index", { cartCount,topSellingProducts , message: req.session.message})
    req.session.message=null
    
  } catch (error) {
    logger.error("error in loading  home page",error)
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({message:"internal server error"})
  }

}

//other

const loadAboutus= async(req,res)=>{
   const user=req.session.userId
   if(!user){
   return  res.redirect("/login")
   }
 return  res.render("user/aboutUs")
  }

  const loadServices= async(req,res)=>{
    const user=req.session.userId
    if(!user){
    return  res.redirect("/login")
    }
    return res.render("user/services")
  }

  const loadBlog= async(req,res)=>{
    const user=req.session.userId
    if(!user){
    return  res.redirect("/login")
    }
    return res.render("user/blog")
  }

  const loadContact= async(req,res)=>{
    const user=req.session.userId
    if(!user){
    return  res.redirect("/login")
    }
   return  res.render("user/contact")
  }

  module.exports={
    loadHome,
    loadAboutus,
    loadServices,
    loadBlog,
    loadContact
  }