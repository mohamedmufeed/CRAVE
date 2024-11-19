const mongoose=require("mongoose")
const ProductSchema= new mongoose.Schema({
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        discountPrice: {
            type: Number,
            default: 0,
        },
    
        category: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'category', 
            required: true
        },
        
        material: {
            type: String,
            required: true
        },
        stock: {
            type: Number,
            required: true
        },
       
        images: {
            type: [String], 
            required: false
        },isListed:{
            type:Boolean,
            default:true
        },
        offersApplied: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'offer'
        }],
  
  
    });
    
    module.exports =mongoose.model("product",ProductSchema)
    
