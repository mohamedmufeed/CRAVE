const mongoose=require("mongoose")
const adminschema= new mongoose.Schema({
userName:{
    type:String,
    required:true
},
password:{
    type:String,
    required:true,
},
})
module.exports =mongoose.model("admin",adminschema)