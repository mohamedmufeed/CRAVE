const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: false,
    },
    country: {
        type: String,
        default: '',
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    googleId: {
        type: String,
        unique: true
    },
    wishList: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    }],
    referralCode: {
        type: String,
        unique: true
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null
    },
    walletBalance: {
        type: Number,
        default: 0
    },

    
});

module.exports = mongoose.model("user", userSchema);
