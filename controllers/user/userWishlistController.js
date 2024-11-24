const mongoose = require("mongoose");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Wishlist = require("../../models/wishlistSchema");

const loadWishlist = async (req, res, next) => {
    try {
        const userId = req.session.user || req.user;
        
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        let wishlist = await Wishlist.findOne({ userId: userId }).populate('items.productId').exec(); 

        if (!wishlist) {
            wishlist = new Wishlist({  
                userId: userId,
                items: []
            });
            await wishlist.save();
        }

        if (wishlist.items.length > 0 && wishlist.items.some(item => item.productId && item.productId.isBlocked)) {  
            const blockedItems = wishlist.items.filter(item => item.productId.isBlocked);  
            wishlist.items = wishlist.items.filter(item => !item.productId.isBlocked);  
        }

        let totalItems = wishlist.items.length;
        const platformFee = 0; 
        let discount = 0;

        return res.render("wishlist", { 
            wishlist, 
            totalItems, 
            discount, 
            platformFee, 
        });
    } catch (error) {
        console.error("Error in fetching wishlist:", error);
        next(error);
    }
};


const addToWishlist = async (req, res, next) => {
    try {
        const userId = req.session.user || req.user;
        if (!userId) {
            return res.status(401).json({ error: 'Please login to add items to Wishlist' });
        }

        const { productId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        const product = await Product.findById(productId).exec();
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.isBlocked) {
            return res.status(400).json({ error: 'Product is blocked' });
        }

        
        let wishlist = await Wishlist.findOne({ userId: userId }).populate('items.productId');
        if (!wishlist) {
            wishlist = new Wishlist({ userId: userId, items: [] });
        }

       
        const existingItemIndex = wishlist.items.findIndex(item => 
            item.productId && item.productId._id.toString() === productId
        );
        
        if (existingItemIndex > -1) {
            return res.status(200).json({ message: 'Item already in wishlist', wishlistItemsCount: wishlist.items.length });
        } else {
            wishlist.items.push({
                productId: product._id,
                price: product.salePrice
            });
        }

        await wishlist.save();
        await User.findByIdAndUpdate(userId, { wishlist: wishlist._id });

        res.json({ message: 'Item added to wishlist successfully', wishlistItemsCount: wishlist.items.length });
    } catch (error) {
        next(error);
    }
};

const removeFromWishlist = async (req, res) => {
    const { productId } = req.body; 
    const userId = req.session.user || req.user; 

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Please login' });
    }

    try {
        
        let wishlist = await Wishlist.findOne({ userId }).populate('items.productId');

        if (!wishlist) {
            return res.status(404).json({ success: false, message: 'Wishlist not found' });
        }

   
        const itemToRemove = wishlist.items.find(item => item.productId._id.toString() === productId); 

        if (!itemToRemove) {
            return res.status(404).json({ success: false, message: 'Item not found in wishlist' });
        }

       
        wishlist.items = wishlist.items.filter(item => item.productId._id.toString() !== productId); 
        await wishlist.save();

     
        res.json({ success: true, message: 'Item removed from wishlist successfully' });

    } catch (error) {
        
        res.status(500).json({ success: false, error: error.message });
    }
};

const removeDeletedItem = async (req, res) => {
    try {
        const { itemId } = req.body;
      

        await Wishlist.updateMany(
            { "items._id": itemId },
            { $pull: { items: { _id: itemId } } }
        );

        res.json({ success: true, message: 'Deleted item removed from wishlist' });
        
    } catch (error) {
        console.error("Error in removing deleted item from wishlist:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


module.exports = {
    loadWishlist,
    addToWishlist,
    removeFromWishlist,
    removeDeletedItem
};