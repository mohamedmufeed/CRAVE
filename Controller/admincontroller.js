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
    res.render("admin/Category",{category})
  } catch (error) {
    console.log(error)
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
  console.log(error)
}
}

const unlistCategory= async (req,res)=>{
  try {
    const  categoryId=req.params.id;
    await Category.findByIdAndUpdate(categoryId,{isListed:false});
    res.redirect("/admin/category")
  } catch (error) {
    console.log(error)
  }
  }
  
   const addCategory= async(req,res)=>{
try {
   const{name,material}=req.body
   const newCategory= new Category({name,material})
   await newCategory.save()
    res.redirect("/admin/category")
} catch (error) {
  console.log(error);
  
}
   }
  

const productManagement=async (req,res)=>{
  try {
    const categories = await Category.find({});
    const products=await  Products.find({})
    res.render("admin/productManagement",{categories,products})
  } catch (error) {
    console.log(error)
  }
}

const addProducts =async(req,res)=>{
  try {
    const {name, description,  price, category,  material, stock, }=req.body;
     const images=req.files

     
     const imagePaths = images.map(file => file.filename);


        if (!name || !price || !category || !description || !stock || !material) {
            return res.status(400).send({ message: 'Please fill all required fields' });
        }

        if (price <= 0 || stock < 0) {
            return res.status(400).send({ message: 'Invalid price or stock value' });
        }

    const newProduct= new Products({
name, description,  price, category,  material, stock, images:imagePaths
    })
    await newProduct.save();
    res.redirect("/admin/productManagement")

   
    
  } catch (error) {
    console.log(error);
    
  }
}

const editProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const {name, description,  price, category,  material, stock, }=req.body;
    const images = req.files;

console.log(id);
console.log(req.files);
  
    console.log("Uploaded files: ", images);

  
    const product = await Products.findById(id);
    
    if (!product) {
      return res.status(404).send("Product not found");
    }
    let updatedImages = product.images; 
    if (images && images.length > 0) {
      const newImagePaths = images.map(file => file.path);
      updatedImages = newImagePaths; 
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
 
    console.error("Error updating product: ", error);
    res.status(500).send("Server error");
  }
};


const listProduct= async (req,res)=>{
  try {
    const  productId=req.params.id;
   
    
    await Products.findByIdAndUpdate(productId,{isListed:true});
    res.redirect("/admin/productManagement")
  } catch (error) {
    console.log(error)
  }
  }
  
  const unlistProduct= async (req,res)=>{
    try {
      const productId=req.params.id;
 
      await Products.findByIdAndUpdate(productId,{isListed:false});
      res.redirect("/admin/productManagement")
    } catch (error) {
      console.log(error)
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
