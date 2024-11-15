const mongoose = require("mongoose");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema")
const Category = require("../../models/categorySchema")
const Offer = require("../../models/offerSchema")
const {calculateAverageRatings} = require("../user/userRatingController")


//todo
const loadSingleProduct = async (req, res, next) => {
    try {
        let productId = req.params.productId.trim();

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).send('Invalid product ID');
        }
        
        const product = await Product.findById(productId)
            .populate('category')
            .populate('brand')
            .lean()  
            .exec();
        
        if (!product) {
            return res.status(404).send('Product not found');
        }

        if (!product.category || !product.category.isListed) {
            return res.status(403).send('This product is under an unlisted category.');
        }


        const relatedProducts = await Product.find({
            category: product.category._id,
            isBlocked: false,
            _id: { $ne: product._id } 
        })
        .limit(4)
        .lean()  // Use lean() for better performance
        .exec();


         // Calculate average ratings for the main product and related products
        const allProductIds = [product._id, ...relatedProducts.map(p => p._id)];
        const averageRatings = await calculateAverageRatings(allProductIds);

        // Add rating information to the main product
        product.averageRating = averageRatings[product._id.toString()]?.averageRating || 0;
        product.totalRatings = averageRatings[product._id.toString()]?.totalRatings || 0;

        // Add rating information to related products
        const relatedProductsWithRatings = relatedProducts.map(relatedProduct => ({
            ...relatedProduct,
            averageRating: averageRatings[relatedProduct._id.toString()]?.averageRating || 0,
            totalRatings: averageRatings[relatedProduct._id.toString()]?.totalRatings || 0
        }));

        const categories = await Category.find({}).exec();

        let userId = req.user || req.session.user;

        const offer = await Offer.find().populate('category').populate('product').exec();

        let userData = null;
        if (userId) {
            userData = await User.findById(userId).populate("cart").exec();
        
            if (userData && userData.cart && !userData.cart.items) {
                userData.cart.items = [];
            }
        }
        
        res.locals.user = userData;

        res.render("single", { 
            user: userData,
            product: product,
            categories: categories,
            relatedProducts: relatedProducts,

        });
    } catch (error) {
        console.log("Error loading product:", error);
        next(error);
    }
};


module.exports = {
    loadSingleProduct,
}


