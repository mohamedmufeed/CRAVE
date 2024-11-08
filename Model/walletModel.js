const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    transactionType: {
        type: String,
        enum: ['Credit', 'Debit'],
        required: true
    },
    description: {
        type: String,
        default: 'Refund for canceled order'
    },
},
{ timestamps: true });

module.exports = mongoose.model('walletTransaction', walletTransactionSchema);