/*
 Product Model
 Defines the structure for product documents in MongoDB.
 This replaces the static products.json file.
*/
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    // MongoDB auto-generates a unique _id which will be used as the productId
    name: {
        type: String,
        required: [true, "Product name is required"],
        unique: true,
        trim: true,
    },
    price: {
        type: Number,
        required: [true, "Product price is required"],
        min: [0, 'Price must be a non-negative number'],
    },
    description: {
        type: String,
        required: [true, "Product description is required"],
    },
    image: {
        type: String, // Storing the image filename/URL
        default: 'placeholder.jpg',
    },

    options: {
        type: Object, // Stores key-value pairs like { size: ['Small', 'Large'], color: ['Red'] }
        default: {} // Ensure it defaults to an empty object
    },

    category: {
        type: String,
        required: [true, "Product category is required"],
    },
    stockCount: {
        type: Number,
        default: 10,
        min: [0, 'Stock count cannot be negative']
    }
}, {
    timestamps: true
});

const Product = mongoose.model('Product', ProductSchema);
module.exports = Product;