const mongoose = require("mongoose");
const { Schema } = mongoose;

const cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [{
        product: {  
            type: Schema.Types.ObjectId,
            ref: "Product",  
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        regularPrice:{
            type:Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        discountAmount:{
            type: Number,
            required:false,
            default:0
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);//check cart exit if not then only create new schema
module.exports = Cart;
