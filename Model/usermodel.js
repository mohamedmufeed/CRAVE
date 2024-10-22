const mongoose=require("mongoose")

const userSchema= new mongoose.Schema({
    username:{
        type:String,
        required: true,
    },
    email:{
        type:String,
        required: true,
        unique:true,
    },
    password:{
        type:String,
        required: false,
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    googleId:{
        type:String,
        unique:true
    }
})

module.exports =mongoose.model("user",userSchema)