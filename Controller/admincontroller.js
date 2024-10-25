const Admin = require("../Model/adminmodel");
const User=require("../Model/usermodel")
const Category=require("../Model/categoryModel")
const Products=require("../Model/productModel")
const bcrypt = require("bcrypt");


const loadlogin = async (req, res) => {
    res.render("admin/login", {
       message: req.session.message
    }); 
    req.session.message = null;
};

const login = async (req, res) => {
    const{username,password}= req.body;
    const existAdmin = await Admin.findOne({userName:username});

    if(!existAdmin){
      req.session.message = "admin not exits"
      return res.redirect("/admin/login")
    }
    const isMatch = await bcrypt.compare(password,existAdmin.password);
    if(!isMatch){
      req.session.message = "password in not match"
        return res.redirect("/admin/login")
    }
    req.session.admin=true
    res.redirect('/admin/dashboard')
  };


const loadDashboard = async (req,res)=>{
    res.render('admin/dashboard')
}

const loadUserMangment= async (req,res)=>{
  try {
    const users=await User.find({})
    res.render("admin/userManagement",{users})
  } catch (error) {
    console.log(error)
    res.status(500).send("Server Error");
  }
}

const blockUser =async (req,res)=>{
 try {
const userId=req.params.id
await User.findByIdAndUpdate(userId,{isBlocked:true})
res.redirect("/admin/userManagement")
 } catch (error) {
  console.log("Error blocking user:", error);
  res.status(500).send("Server Error");
 }
}


const unblockUser= async( req,res)=>{
try {
  const userId= req.params.id
  await User.findByIdAndUpdate(userId,{isBlocked:false})
  res.redirect("/admin/userManagement")
} catch (error) {
  console.log(error)
  res.status(500).send("server error")
}
}



const loadCategory= async(req,res)=>{
  try {
    const category=await Category.find({})
    if (!category || category.length === 0) {
      return res.status(404).send("No categories found");
    }
    res.render("admin/Category",{category})
  } catch (error) {
    console.error("Error loading categories:", error);
    res.status(500).send("An error occurred while loading categories");
  }
}

const editCategory= async (req,res)=>{
 try {
 
  const {id}=req.params
  const {name, material}=req.body
  await Category.findByIdAndUpdate(id,{name,material})

  res.redirect('/admin/category'); 
 } catch (error) {
  res.status(500).send("Somthing went wrong")
  console.log(error)
 }
}

const listCategory= async (req,res)=>{
try {
  const  categoryId=req.params.id;
  await Category.findByIdAndUpdate(categoryId,{isListed:true});
  res.redirect("/admin/category")
} catch (error) {
  console.error("Error listing category:", error);
  res.status(500).send("An error occurred while listing the category");
}
}

const unlistCategory= async (req,res)=>{
  try {
    const  categoryId=req.params.id;
    await Category.findByIdAndUpdate(categoryId,{isListed:false});
    res.redirect("/admin/category")
  } catch (error) {
    console.error("Error unlisting category:", error);
  res.status(500).send("An error occurred while  unlisting the category");
  }
  }
  
   const addCategory= async(req,res)=>{
try {
   const{name,material}=req.body
  
   const newCategory= new Category({name,material})
   await newCategory.save()
    res.redirect("/admin/category")
} catch (error) {
  console.error("Error adding category:", error);
  res.status(500).send("An error occurred while adding the category.");
  
}
   }
  

const productManagement=async (req,res)=>{
  try {
    const categories = await Category.find({});
    const products=await  Products.find({})

    if (!categories || categories.length === 0) {
      console.log("No categories found");
    }

    if (!products || products.length === 0) {
      console.log("No products found");
    }

    res.render("admin/productManagement",{categories,products})
  } catch (error) {
    console.error("Error in product management:", error);
    res.status(500).send("An error occurred while fetching products and categories.");
  }
}

const addProducts = async (req, res) => {
  try {
    const { name, description, price, category, material, stock } = req.body;
    const images = req.files;

    // Validate input
    if (!name || !price || !category || !description || !stock || !material) {
      return res.status(400).send({ message: 'Please fill all required fields' });
    }

    if (price <= 0 || stock < 0) {
      return res.status(400).send({ message: 'Invalid price or stock value' });
    }

    // Ensure images are uploaded
    if (!images || images.length < 1) {
      return res.status(400).send({ message: 'Please upload at least one image' });
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
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const editProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, material, stock } = req.body;
    const images = req.files; 

   
    if (!name || !description || !price || !category || !material || !stock) {
      return res.status(400).send("All fields are required");
    }

    const product = await Products.findById(id);
    
    if (!product) {
      return res.status(404).send("Product not found");
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
    res.status(500).send("Error updating product: " + error.message);
  }
};




const listProduct= async (req,res)=>{
  try {
    const  productId=req.params.id;
   
    
    await Products.findByIdAndUpdate(productId,{isListed:true});
    
    res.redirect("/admin/productManagement")
  } catch (error) {
    console.error("Error listing product:", error);
    res.status(500).send("An error occurred while updating the product.");
  }
  }
  
  const unlistProduct= async (req,res)=>{
    try {
      const productId=req.params.id;
 
      await Products.findByIdAndUpdate(productId,{isListed:false});
      res.redirect("/admin/productManagement")
    } catch (error) {
      console.error("Error unlisting product:", error);
      res.status(500).send("An error occurred while unlist the product.");
    }
    }

module.exports = {
    loadlogin,
    login,
    loadDashboard,
    loadUserMangment ,
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
 unlistProduct
  
};
