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
        category: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Category', 
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
        }
    });
    
    module.exports =mongoose.model("product",ProductSchema)
    
