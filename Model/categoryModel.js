const mongoose=require("mongoose")
 const categorySchema= new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    material:  { 
        type: String, 
        required: true 
    } ,
    isListed:{
        type:Boolean,
        default:true
    }

 },{timestamps:true});
 module.exports =mongoose.model("category",categorySchema)