const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidv4 } = require("uuid");

const productSchema = new Schema({
    productName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    skuNumber: {  
        type: String,
        default: () => uuidv4(),
        unique: true,
    },
    brand: {
        type: Schema.Types.ObjectId,
        ref: "Brand",
        required: false,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    regularPrice: {
        type: Number,
        required: true,
    },
    salePrice: {
        type: Number,
        required: true,
    },
    offerPrice: {
        type: Number,
        default: 0,
    },
    // Manage quantity per size for products with sizes
    size: {
        type: [String],  // Array of sizes (e.g. ['S', 'M', 'L'])
        required: false,
    },
    // This field stores the quantity for each size
    quantity: {
        type: Object,
        of: Number,
        default: { 'S': 0, 'M': 0, 'L': 0 },  // Default quantities
        validate: {
            validator: function(v) {
                // Ensure all quantities are non-negative integers
                return Object.values(v).every(q => q >= 0 && Number.isInteger(q));
            },
            message: 'Quantity values must be non-negative integers',
        }
    },
    color: {
        type: String,
        required: true,
    },
    productImage: {
        type: [String],
        required: true,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ["Available", "Out of stock"], 
        required: true,
        default: "Available",
    },
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
