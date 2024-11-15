const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const env = require("dotenv").config();
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Offer = require("../../models/offerSchema");

const cart = async (req, res, next) => {
  try {
    const userId = res.locals.user._id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

  
    let cart = await Cart.findOne({ userId: userId })
      .populate({
        path: 'items.product',
        populate: [{ path: 'brand' }, { path: 'category' }]
      })
      .exec();

    if (!cart) {
      cart = new Cart({
        userId: userId,
        items: [],
      });
      await cart.save();
    }

    
    if (
      cart.items.length > 0 &&
      cart.items.some(
        (item) =>
          item.product &&
          (item.product.isBlocked ||
            (item.product.brand && !item.product.brand.isListed) || 
            (item.product.category && !item.product.category.isListed))
      )
    ) {
      
      const blockedOrUnlistedItems = cart.items.filter(
        (item) =>
          item.product.isBlocked ||
          (item.product.brand && !item.product.brand.isListed) || 
          (item.product.category && !item.product.category.isListed)
      );

      
      cart.items = cart.items.filter(
        (item) =>
          !item.product.isBlocked &&
          (!item.product.brand || (item.product.brand && item.product.brand.isListed)) && 
          (!item.product.category || (item.product.category && item.product.category.isListed)) 
      );

      
      for (const item of blockedOrUnlistedItems) {
        await Product.findByIdAndUpdate(item.product._id, {
          $inc: { quantity: item.quantity },
        });
      }

    
      await cart.save();
    }

  
    let totalPrice = 0;
    let totalItems = 0;
    let totalDiscount = 0;
    const platformFee = 0;
    const deliveryCharges = 0;
    let distinctProductCount = 0;
    let cartUpdated = false;

    
    if (cart.items.length > 0) {
      const distinctProducts = new Set();

      for (const item of cart.items) {
        if (item.product) {
          
          const currentPrice =
            item.product.offerPrice && item.product.offerPrice < item.product.salePrice
              ? item.product.offerPrice
              : item.product.salePrice < item.product.regularPrice
              ? item.product.salePrice
              : item.product.regularPrice;

          const currentDiscountAmount =
            item.product.offerPrice && item.product.offerPrice < item.product.regularPrice
              ? item.product.regularPrice - item.product.offerPrice
              : item.product.salePrice < item.product.regularPrice
              ? item.product.regularPrice - item.product.salePrice
              : 0;

          
          if (
            item.price !== currentPrice || 
            item.discountAmount !== currentDiscountAmount || 
            item.regularPrice !== item.product.regularPrice
          ) {
            item.price = currentPrice;
            item.discountAmount = currentDiscountAmount;
            item.regularPrice = item.product.regularPrice;
            cartUpdated = true;
          }

          totalPrice += item.regularPrice * item.quantity;
          totalDiscount += currentDiscountAmount * item.quantity;
          totalItems += item.quantity;
          distinctProducts.add(item.product._id.toString());
        }
      }

      distinctProductCount = distinctProducts.size;

    
      if (cartUpdated) {
        await cart.save();
      }
    }

    const totalAmount = totalPrice - totalDiscount + platformFee + deliveryCharges;
    
    return res.render("cart", {
      cart,
      totalItems,
      totalPrice,
      totalDiscount,
      platformFee,
      deliveryCharges,
      totalAmount,
      distinctProductCount,
    });
  } catch (error) {
    console.error("Error in fetching cart:", error);
    next(error);
  }
};


const addToCart = async (req, res, next) => {
  try {
    const userId = req.session.user || req.user;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Please login to add items to cart" });
    }

    const { productId, quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = await Product.findById(productId).exec();
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.quantity === 0) {
      return res.status(400).json({ error: "Product is out of stock" });
    }

    if (product.isBlocked) {
      return res.status(400).json({ error: "Product is blocked" });
    }

    if (quantity > product.quantity) {
      return res
        .status(400)
        .json({ error: "Requested quantity exceeds available stock" });
    }

    let cart = await Cart.findOne({ userId: userId }).populate("items.product");

    if (!cart) {
      cart = new Cart({ userId: userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product._id.toString() === productId
    );

    if (existingItemIndex > -1) {
      return res
        .status(200)
        .json({
          message: "Item already in cart",
          cartItemsCount: cart.items.length,
        });
    } else {

      const regularPrice = product.regularPrice;

      const price =
        product.offerPrice && product.offerPrice < product.salePrice
          ? product.offerPrice
          : product.salePrice < product.regularPrice
          ? product.salePrice
          : product.regularPrice;

          const discountAmount = product.offerPrice && product.offerPrice < product.regularPrice
          ? product.regularPrice - product.offerPrice
          : product.salePrice < product.regularPrice
          ? product.regularPrice - product.salePrice
          : 0;

      cart.items.push({
        product: product._id,
        quantity: quantity,
        regularPrice: regularPrice,
        price: price,
        discountAmount: discountAmount,
      });

      await Product.findByIdAndUpdate(productId, {
        $inc: { quantity: -1 },
        $set: {
          status:
            product.quantity - quantity <= 0 ? "out of stock" : product.status,
        },
      });
    }

    await cart.save();

    await User.findByIdAndUpdate(userId, { cart: cart._id });
    
    res.json({
      message: "Item added to cart successfully",
      cartItemsCount: cart.items.length,
    });
  } catch (error) {
    next(error);
  }
};

const MAX_QUANTITY_PER_PRODUCT = 5;

const updateQuantity = async (req, res, next) => {
  const { productId, change } = req.body;
  const userId = req.session.user || req.user;

  try {
    let cart = await Cart.findOne({ userId }).populate("items.product");

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const item = cart.items.find(
      (item) => item.product._id.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    if (item.isBlocked) {
      return res.status(400).json({ error: "Product is blocked" });
    }

    let newQuantity = item.quantity + change;

    if (newQuantity < 1) {
      newQuantity = 1;
      return res
        .status(400)
        .json({
          error:
            "Minimum quantity is 1. If you want to remove the item, use the remove button.",
        });
    }

    if (newQuantity > MAX_QUANTITY_PER_PRODUCT) {
      return res
        .status(400)
        .json({
          error: `You can only have up to ${MAX_QUANTITY_PER_PRODUCT} units of this product`,
        });
    }

    if (change > 0 && item.product.quantity < change) {
      return res.status(400).json({ error: "Not enough stock available" });
    }

    const quantityDifference = change;

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        $inc: { quantity: -quantityDifference },
      },
      { new: true }
    );

    if (updatedProduct.quantity === 0) {
      updatedProduct.status = "out of stock";
    } else {
      updatedProduct.status = "Available";
    }

    await updatedProduct.save();

    item.quantity = newQuantity;
    await cart.save();

    res.json({
      success: true,
      updatedQuantity: item.quantity,
      productStatus: updatedProduct.status,
      productQuantity: updatedProduct.quantity,
    });
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res) => {
  const { productId } = req.body;
  const userId = req.session.user || req.user;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Please login" });
  }

  try {
    let cart = await Cart.findOne({ userId }).populate("items.product");

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const itemToRemove = cart.items.find(
      (item) => item.product._id.toString() === productId
    );

    if (!itemToRemove) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart" });
    }

    cart.items = cart.items.filter(
      (item) => item.product._id.toString() !== productId
    );

    await Product.findByIdAndUpdate(productId, {
      $inc: { quantity: itemToRemove.quantity },
      $set: { status: "Available" },
    });

    await cart.save();

    res.json({ success: true, message: "Item removed from cart successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const removeDeletedItem = async (req, res) => {
  try {
    const { itemId } = req.body;

    await Cart.updateMany(
      { "items._id": itemId },
      { $pull: { items: { _id: itemId } } }
    );

    res.json({ success: true, message: "Deleted item removed from cart" });
  } catch (error) {
    console.error("Error in removing deleted item from cart:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  cart,
  addToCart,
  updateQuantity,
  removeFromCart,
  removeDeletedItem,
};
