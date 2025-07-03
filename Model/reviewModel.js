const mongoose=require("mongoose");
const Schema = mongoose.Schema;

const  reviewSchema=  new Schema({
    customerName:{
        type:String,
        required:true
    },productId:{
        type: Schema.Types.ObjectId,
        required:true,
        ref:"product"
    },userId:{
        type: Schema.Types.ObjectId,
        required:true,
        ref:"user"
    },rating:{
        type:Number,
        required:true,
        min:1,
        max:5
    },comment:{
        type:String,
        required:true
    },createdAt:{
        type:Date,
        default:Date.now
    }
})

module.exports = mongoose.model('Review', reviewSchema);