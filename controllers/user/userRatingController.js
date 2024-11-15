const User = require("../../models/userSchema");
const Product = require("../../models/productSchema")
const Rating = require("../../models/ratingSchema")
const Order = require("../../models/orderSchema")


const getRateProduct = async (req, res, next) => {

    try {
        
        const userId = res.locals.user._id;

        
        const { productId } = req.params;

        const existingRating = await Rating.findOne({ userId, productId });
        if (existingRating) {
            return res.status(400).json({ message: 'You have already rated this product' });
        }

        if (!userId) {
            let error = new Error('User not authorized');
            error.status = 403;
            return next(error);
        }

        
        const product = await Product.findById(productId)
            .select('productName description color salePrice skuNumber productImage')
            .populate({
                path: 'brand',
                select: 'name'
            })
            .exec();
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        
        const userOrder = await Order.findOne({
            user: userId,
            'items.product': productId,
            'items.itemOrderStatus': 'Delivered' 
        }).exec();

        if (!userOrder) {

            let error = new Error('You can only rate products you have purchased and received');
            error.status = 403;
            return next(error);
        }

    
        return res.render('rating-page', { product });
        
    } catch (error) {
        console.error('Error in getRateProduct:', error);
        next(error);
    }
};

const submitRating = async (req, res) => {
    try {
        const userId = res.locals.user._id;
        const { rating, reviewText, productId } = req.body;

        const numericRating = Number(rating);
        
        if (!numericRating || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ message: "Please provide a valid rating between 1 and 5." });
        }


        if (!reviewText || reviewText.trim().length < 5) {
            return res.status(400).json({ message: "Review must be at least 5 characters long." });
        }

    
        const existingReview = await Rating.findOne({
            userId: userId,
            productId: productId
        });

        
        const userOrder = await Order.findOne({
            user: userId,
            'items.product': productId,
            'items.itemOrderStatus': 'Delivered' 
        }).exec();

        if (!userOrder) {
            return res.status(403).json({ message: "You can only review products you have purchased and received." });
        }

        
        const newRating = new Rating({
            userId: userId,
            productId: productId,
            review: reviewText.trim(),
            rating: numericRating
        });

        await newRating.save();
        return res.status(200).json({ message: "Review submitted successfully!" });
    } catch (error) {
        console.error("Error submitting review:", error);
        return res.status(500).json({ message: "An error occurred while submitting your review." });
    }
};

const calculateAverageRatings = async (productIds) => {
    const averageRatings = await Rating.aggregate([
      { $match: { productId: { $in: productIds } } },
      { 
        $group: {
          _id: "$productId",
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 }
        }
      }
    ]);
  
    return averageRatings.reduce((acc, curr) => {
      acc[curr._id.toString()] = {
        averageRating: parseFloat(curr.averageRating.toFixed(1)),
        totalRatings: curr.totalRatings
      };
      return acc;
    }, {});
  };



module.exports = {
    getRateProduct,
    submitRating,
    calculateAverageRatings
}