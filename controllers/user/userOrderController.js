const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const crypto = require('crypto');
const mongoose = require("mongoose");

const env = require("dotenv").config();

const User = require("../../models/userSchema");
const Product = require("../../models/productSchema")
const Cart = require("../../models/cartSchema");
const { cart } = require("./userCartController");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema")
const Coupon = require("../../models/couponSchema")
const razorpayInstance = require('../../config/razorpay'); 
const Wallet =require("../../models/walletSchema")
const PDFDocument = require('pdfkit');
const fs = require('fs');




const placeOrder = async (req, res, next) => {
console.log("--------------------place-Order-------------------")
  const userId = res.locals.user._id;

  try {
    const cart = await Cart.findOne({ userId: userId })
    .populate({
      path: 'items.product',
      populate: {
        path: 'brand',
        select: 'name'
      }
    })
    .exec();
    const user = await User.findById(userId).populate('address').exec();
    const currentDate = new Date();
    const coupons =  await Coupon.find({
      $and: [
          { status: { $ne: "Inactive" } }, // Exclude inactive coupons
          { endDate: { $gte: currentDate } } // Only include coupons that haven't expired
      ]
  }).exec();
    const addresses = user.address || [];
    console.log(cart)

    if (cart && cart.items.length > 0) {
      const distinctProducts = new Set(cart.items.map(item => item.product._id.toString()));
      const distinctProductCount = distinctProducts.size;

      let totalPrice = 0;
      let totalDiscount = 0; 
      const platformFee = 0;
      const deliveryCharges = 0;
      let cartUpdated = false; 

      cart.items.forEach(item => {
        const product = item.product;

        if (product.isBlocked) {
          return res.status(400).json({ error: `Product ${product.name} is blocked` });
        }

        // Check the stock availability for the selected size (if applicable)
        if (item.size) {
          if (!product.size || !product.size.includes(item.size)) {
            return res.status(400).json({ error: `Size ${item.size} is not available for product ${product.name}` });
          }
          if (product.quantity[item.size] < item.quantity) {
            return res.status(400).json({ error: `Size ${item.size} of product ${product.name} is out of stock` });
          }
        } else {
          // If no size, check general stock
          if (product.quantity < item.quantity) {
            return res.status(400).json({ error: `Product ${product.name} is out of stock` });
          }
        }
    
        const price =
          product.offerPrice && product.offerPrice < product.salePrice
            ? product.offerPrice
            : product.salePrice < product.regularPrice
            ? product.salePrice
            : product.regularPrice;

        const discountAmount =
          product.offerPrice && product.offerPrice < product.regularPrice
            ? product.regularPrice - product.offerPrice
            : product.salePrice < product.regularPrice
            ? product.regularPrice - product.salePrice
            : 0;

        
        if (item.price !== price || item.discountAmount !== discountAmount) {
          item.price = price;
          item.discountAmount = discountAmount;
          item.regularPrice = product.regularPrice;
          cartUpdated = true; 
        }

        totalPrice += product.regularPrice * item.quantity;
        totalDiscount += discountAmount * item.quantity;
      });

      const finalTotal = totalPrice - totalDiscount + platformFee + deliveryCharges;

      
      if (cartUpdated) {
        await cart.save();
      }
      console.log(cart)
      res.render("checkout-page", { 
        cart, 
        addresses,
        distinctProductCount,
        coupons,
        totalPrice: totalPrice.toFixed(2),
        discount: totalDiscount.toFixed(2),
        platformFee: platformFee.toFixed(2),
        deliveryCharges: deliveryCharges.toFixed(2),
        finalTotal: finalTotal.toFixed(2)
      });
    } else {
      res.status(400).json({ message: "Your cart is empty. Please add items to your cart before proceeding." });
    }
  } catch (error) {
    next(error);
  }
};



const addCoupon = async (req, res, next) => {
  console.log('----------------addCoupon-----------------')
  try {
    const { couponId } = req.body; 
    const userId = req.session.user || req.user;
    const cart = await Cart.findOne({ userId: userId }).populate('items.product').exec();

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

  
    const today = new Date();
    if (today > coupon.endDate) {
      return res.status(400).json({ message: "Coupon has expired" });
    }

  
    const usedCoupon = await Order.find({ user: userId, coupon: couponId });
    console.log(usedCoupon.length)
    console.log('---------------------------------')
    console.log(coupon.usageLimit)

    if (usedCoupon.length >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon has already been used. Please try another one." });
    }

    let totalPrice = 0;
    let totalDiscount = 0;

    cart.items.forEach(item => {
      totalPrice += item.product.regularPrice * item.quantity;
      totalDiscount += item.discountAmount * item.quantity; 
    });

   
const netAmount = totalPrice - totalDiscount;



if (netAmount < coupon.minPurchaseAmount) {
  return res.status(400).json({ message: `Minimum purchase amount is ${coupon.minPurchaseAmount} for this coupon.` });
}

if (netAmount > coupon.maxPurchaseAmount) {
  return res.status(400).json({ message: `Maximum purchase amount is ${coupon.maxPurchaseAmount} for this coupon.` });
}

    const platformFee = 0;
    const deliveryCharges = 0;
  
    
    
    let discountAmount = 0;
    if (coupon.discountType === "fixed") {
      discountAmount = coupon.discountValue;
    } else if (coupon.discountType === "percentage") {
      discountAmount = (netAmount * coupon.discountValue) / 100;
    }

    
    discountAmount = Math.min(discountAmount, (totalPrice - totalDiscount));

    totalDiscount += discountAmount;

    
   let finalTotal = totalPrice - totalDiscount + platformFee + deliveryCharges;

   
    req.session.appliedCoupon = couponId;

    
    res.status(200).json({
      totalPrice: totalPrice.toFixed(2),
      discount: totalDiscount.toFixed(2),
      platformFee: platformFee.toFixed(2),
      deliveryCharges: deliveryCharges.toFixed(2),
      finalTotal: finalTotal.toFixed(2),
      couponCode: coupon.code,
      couponId: coupon._id
    });

  } catch (error) {
    console.error('Error in addCoupon:', error);
    res.status(500).json({ message: "An error occurred while applying the coupon" });
    next(error);
  }
};

const removeCoupon = async (req, res, next) => {
  try {
    const userId = req.session.user || req.user;

   
    const cart = await Cart.findOne({ userId: userId }).populate('items.product').exec();

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    
    req.session.appliedCoupon = null;

    let totalPrice = 0;
    let totalDiscount = 0;

    
    cart.items.forEach(item => {
      totalPrice += item.product.regularPrice * item.quantity;
      totalDiscount += item.discountAmount * item.quantity; 
    });

    const platformFee = 0;
    const deliveryCharges = 0;
    const finalTotal = totalPrice - totalDiscount + platformFee + deliveryCharges;

    res.status(200).json({
      totalPrice: totalPrice.toFixed(2),
      discount: totalDiscount.toFixed(2), 
      platformFee: platformFee.toFixed(2),
      deliveryCharges: deliveryCharges.toFixed(2),
      finalTotal: finalTotal.toFixed(2),
    });

  } catch (error) {
    console.error('Error in removeCoupon:', error);
    res.status(500).json({ message: "An error occurred while removing the coupon" });
    next(error);
  }
};

const loadPayment = async (req, res, next) => {


  try {

    if (!res.locals.user) {
      return res.status(401).json({ message: 'User not authenticated.' });
  }

    const { userId, address, appliedCouponId } = req.body;

    const user = await User.findById(userId);
    const selectedAddress = await Address.findById(address);
    const cart = await Cart.findOne({ userId: userId }).populate('items.product');
    console.log("------------------loadplayment--------------")
    console.log(cart)
    let appliedCoupon = null;

    
    if (appliedCouponId) {
      appliedCoupon = await Coupon.findById(appliedCouponId);
    }

    if (!user || !selectedAddress || !cart) {
      return res.status(400).json({ message: 'Invalid user, address, or cart information.' });
    }

    
    let totalPrice = 0;
    let totalDiscount = 0;
    let cartUpdated = false;  

    cart.items.forEach(item => {
      const product = item.product;

      const price =
        product.offerPrice && product.offerPrice < product.salePrice
          ? product.offerPrice
          : product.salePrice < product.regularPrice
          ? product.salePrice
          : product.regularPrice;

      const discountAmount =
        product.offerPrice && product.offerPrice < product.regularPrice
          ? product.regularPrice - product.offerPrice
          : product.salePrice < product.regularPrice
          ? product.regularPrice - product.salePrice
          : 0;

      
      if (item.price !== price || item.discountAmount !== discountAmount) {
        item.price = price;
        item.discountAmount = discountAmount;
        item.regularPrice = product.regularPrice;
        cartUpdated = true;  
      }

      totalPrice += product.regularPrice * item.quantity;
      totalDiscount += discountAmount * item.quantity;
    });

    const platformFee = 0;
    const deliveryCharges = 0;
    let finalTotal = totalPrice - totalDiscount;

   
    let discountAmount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === "fixed") {
        discountAmount = appliedCoupon.discountValue;
      } else if (appliedCoupon.discountType === "percentage") {
        discountAmount = (finalTotal * appliedCoupon.discountValue) / 100;
      }

     
      discountAmount = Math.min(discountAmount, finalTotal);
      totalDiscount += discountAmount; 
      finalTotal = totalPrice - totalDiscount + platformFee + deliveryCharges; 
    }

    if (cartUpdated) {
      await cart.save();
    }
    console.log("------------loadplaycart---------------")
    console.log("cart-loadplay", cart.items)
    res.render('payment-page', {
      user,
      address: selectedAddress,
      items: cart.items,
      totalPrice: totalPrice.toFixed(2),
      discountAmount: totalDiscount.toFixed(2),  
      couponDiscountAmount: discountAmount.toFixed(2),  
      platformFee: platformFee.toFixed(2),
      deliveryCharges: deliveryCharges.toFixed(2),
      finalTotal: finalTotal.toFixed(2),
      appliedCoupon
    });

  } catch (error) {
    console.error('Error loading payment page:', error);
    return next(error);
  }
};


const confirmOrder = async (req, res) => {
  console.log("--------- conform order user side ---------")
  const userId = res.locals.user._id;
  try {
    const { userId, address, items, couponDiscountAmount, totalPrice, finalTotal, appliedCouponId, discountAmount, paymentMethod } = req.body;

    let parsedAddress;
    
    try {
      parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
    } catch (error) {
      throw new Error('Invalid address format');
    }

    if (!parsedAddress || typeof parsedAddress !== 'object') {
      throw new Error('Invalid address data');
    }

    const requiredAddressFields = ['house', 'place', 'city', 'state', 'pin', 'contactNo'];
    for (const field of requiredAddressFields) {
      if (!parsedAddress[field]) {
        throw new Error(`Address ${field} is required`);
      }
    }

    const addressData = {
      house: parsedAddress.house,
      place: parsedAddress.place,
      city: parsedAddress.city,
      state: parsedAddress.state,
      landMark: parsedAddress.landMark || "",
      pin: parsedAddress.pin,
      contactNo: parsedAddress.contactNo
    };

    const parsedFinalTotal = parseFloat(finalTotal);
    if (isNaN(parsedFinalTotal) || parsedFinalTotal < 0) {
      throw new Error('Invalid final total amount');
    }

    const parsedItems = items.map(item => {
      try {
        return JSON.parse(item);
      } catch (error) {
        console.error('Error parsing item:', item);
        throw new Error('Invalid item data');
      }
    });
    console.log(parsedItems)
    console.log("--------------------------------------------------")
    const parsedDiscountAmount = parseFloat(discountAmount) || 0;
    const parsedTotalPrice = parseFloat(totalPrice);

    if (isNaN(parsedTotalPrice)) {
      throw new Error('Invalid total price');
    }

    let totalItemCount = parsedItems.reduce((sum, item) => sum + item.quantity, 0);

    const discountPerItem = couponDiscountAmount / totalItemCount;

    parsedItems.forEach(item => {
      const itemDiscount = discountPerItem * item.quantity; 
      item.saledPrice = item.price - (itemDiscount / item.quantity);  
    });

    const orderData = {
      user: userId,
      address: addressData, 
      items: parsedItems,
      actualPrice: parsedTotalPrice,
      offerPrice: parsedFinalTotal,
      coupon: appliedCouponId || undefined,
      discount: parsedDiscountAmount,
      status: 'Pending',
      totalPrice: parsedFinalTotal,
      payment: [{
        method: paymentMethod === "OnlinePayment" ? "Online Payment" : 
                 paymentMethod === "WalletPayment" ? "Wallet Payment" : "Cash On Delivery",
        status: "pending"
      }]
    };

    const order = new Order(orderData);
    console.log(order)
    await order.save();

    await Cart.findOneAndUpdate({ userId: userId }, { $set: { items: [] } });
console.log("------------------- conform order------------------");
console.log("size id",parsedItems.itemsize);
    // Reduce product quantity after order is confirmed
    for (let item of parsedItems) {
      const productSizes = item.size
      const product = await Product.findById(item.product._id);
      console.log(item.product._id);
     console.log(productSizes)
      console.log(product.quantity[productSizes])
      if (product) {

        // if()
        // Ensure there's enough stock to reduce
        if (product.quantity[productSizes] < item.quantity) {
          throw new Error(`Not enough stock available for product: ${product.name}`);
        }
        console.log(item.quantity)
        // Reduce stock based on the quantity purchased
        product.quantity[productSizes] -= item.quantity;
        console.log(product.quantity[productSizes])
        // If quantity goes to 0 or below, mark the product as out of stock
        if (product.quantity[productSizes] <= 0) {
          product.status = 'Out of stock';
        }
        console.log(product);
        const updateProduct = await Product.findByIdAndUpdate(item.product._id, product, { new: true });
        await updateProduct.save();
      } else {
        throw new Error(`Product with ID ${item.productId} not found`);
      }
    }

    if (paymentMethod === "OnlinePayment") {
      const razorpayOptions = {
        amount: Math.round(parsedFinalTotal * 100), 
        currency: "INR",
        receipt: `order_rcptid_${order._id}`
      };

      const razorpayOrder = await razorpayInstance.orders.create(razorpayOptions);

      order.payment[0].razorpayOrderId = razorpayOrder.id;
      await order.save();

      res.render("razorpay-checkout", {
        orderId: order._id,
        razorpayOrderId: razorpayOrder.id,
        totalPrice: order.totalPrice,  
        razorpayKeyId: process.env.RAZOR_PAY_KEY_ID  
      });
    
    } else if (paymentMethod === "WalletPayment") {
      try {
        await processWalletPayment(userId, parsedFinalTotal);
        order.payment[0].status = "completed";
        await order.save();
        await finalizeOrder(order, userId, appliedCouponId);
        return res.redirect('/user/order-confirmation');
      } catch (error) {
        console.error('Wallet payment failed:', error);
    
        // Handle insufficient balance error specifically
        if (error.message === 'Insufficient balance in wallet') {
          return res.status(400).json({
            error: 'Your wallet does not have enough funds to complete the payment. Please add funds to your wallet or choose another payment method.'
          });
        }
    
        // Handle general errors
        return res.status(500).json({ error: 'An error occurred while processing the payment: ' + error.message });
      }
    } else {
      await finalizeOrder(order, userId, appliedCouponId);
      return res.redirect('/user/order-confirmation');
    }
    
  } catch (error) {
    console.error('Error in confirmOrder:', error);
    return res.status(400).json({ error: error.message });
  }
};

const finalizeOrder = async (order, userId, appliedCouponId) => {
  try {
    
    order.status = 'Processing';
    //Online Payment

    if (order.payment[0].method === "Wallet Payment") {
      order.payment[0].status = 'completed';
    } else if (order.payment[0].method === "Cash On Delivery") {
      order.payment[0].status = 'pending';
    }

    order.items.forEach(item => {
      item.itemOrderStatus = 'Processing';
    });

    await order.save();

   
    

    if (appliedCouponId) {

      const couponData = await Coupon.findById(appliedCouponId);

      if (couponData) {
       
        couponData.usedCount = (couponData.usedCount || 0) + 1;

        if (couponData.usedCount >= couponData.usageLimit && couponData.status !== "Not available") {
          couponData.status = "Not available";
        }

        await couponData.save(); 
      }
    }
    
  } catch (error) {
    console.error('Error finalizing order:', error);
    throw error;
  }
};

const processWalletPayment = async (userId, totalAmount) => {
  try {
    const user = await User.findById(userId).populate('wallet');
    if (!user || !user.wallet) {
      throw new Error('User or wallet not found');
    }

    console.log(`User wallet balance: ${user.wallet.balance}`);
    console.log(`Total amount to be paid: ${totalAmount}`);

    if (user.wallet.balance < totalAmount) {
      throw new Error('Insufficient balance in wallet');
    }

    user.wallet.balance -= totalAmount;
    user.wallet.transactions.push({
      type: 'debit',
      amount: totalAmount,
      description: `Payment for order`,
      date: new Date()
    });

    await user.wallet.save();
    return true;
  } catch (error) {
    console.error('Error processing wallet payment:', error);
    throw error;
  }
};

const razorpayCheckout = async (req, res) => {
  try {
      const userId = res.locals.user._id; // User ID from authentication
      const { orderId } = req.query; // Order ID passed in the query

      const order = await Order.findById(orderId).populate('user');
      if (!order) {
          return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const razorpayOrder = await razorpayInstance.orders.create({
          amount: Math.round(order.totalPrice * 100),
          currency: 'INR',
          receipt: `order_rcptid_${order._id}`,
          payment_capture: 1,
      });

      // Save Razorpay Order ID in the database
      order.payment[0].razorpayOrderId = razorpayOrder.id;
      await order.save();

      res.status(200).json({
          success: true,
          razorpayKeyId: process.env.RAZOR_PAY_KEY_ID,
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
      });
  } catch (error) {
      console.error('Error in razorpayCheckout:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



const verifyRazorpayPayment = async (req, res) => {
  try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          return res.status(400).json({ success: false, message: 'Missing required parameters' });
      }

      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
          .createHmac("sha256", process.env.RAZOR_PAY_KEY_SECRET)
          .update(sign.toString())
          .digest("hex");

      if (razorpay_signature !== expectedSign) {
          return res.status(400).json({ success: false, message: 'Signature mismatch' });
      }

      const order = await Order.findOne({ 'payment.razorpayOrderId': razorpay_order_id });
      if (!order) {
          return res.status(404).json({ success: false, message: 'Order not found' });
      }

      order.payment[0].status = 'completed';
      order.payment[0].razorpayPaymentId = razorpay_payment_id;
      order.status = 'Processing';
      console.log("_______________ order varify--------------------")
      console.log(order)
      // order status bug fixed 
      order.items.forEach(item => {
        item.itemOrderStatus = 'Processing';
      });
      await order.save();

      res.status(200).json({ success: true, message: 'Payment verified', orderId: order._id });
  } catch (error) {
      console.error('Error in verifyRazorpayPayment:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



const orderConfirmationPage = async (req,res,next) => {
  try {
    return res.render("order-confirmation");
  } catch (error) {
    next(error)
  }
};

const myOrder = async (req, res, next) => {
    try {
      const userId = req.session.user || req.user;
      const searchQuery = req.query.searchQuery || '';
      const page = parseInt(req.query.page) || 1;
      const limit = 3;
      const skip = (page - 1) * limit;
  
      let searchCondition = { user: userId };
  
      const totalOrders = await Order.countDocuments(searchCondition);
      const totalPages = Math.ceil(totalOrders / limit);
  
      let orders = await Order.find(searchCondition)
  .populate({
    path: 'items.product',
    select: 'productName description color salePrice skuNumber productImage',
    populate: {
      path: 'brand',
      select: 'name' 
    }
  })
  .sort({ date: -1 })
  .skip(skip)
  .limit(limit)
  .lean();

  
      if (searchQuery) {
        const regex = new RegExp(searchQuery, 'i');
        orders = orders.filter(order =>
          order.items.some(item =>
            item.product &&
            (
              regex.test(item.product.productName) 
            )
          )
        );
      }
  
      orders = orders.map(order => {
        order.items = order.items.map(item => {
          if (!item.product) {
            item.product = {
              productName: 'Product Deleted',
              productImage: ['placeholder.jpeg'],
              salePrice: item.price,
              sku: 'N/A',
              description: 'This product has been removed from our catalog.',
              color: 'N/A'
            };
          }
          return item;
        });
        return order;
      });
  
      res.render("my-order", {
        orders,
        currentPage: page,
        totalPages,
        totalOrders,
        searchQuery,
        noResults: orders.length === 0
      });
    } catch (error) {
      next(error);
    }
};
  

const cancelOrder = async (req, res, next) => {
  console.log("--------------        Cancel Order   -------------------------");
  try {
    const { itemOrderId, cancelReason } = req.params;
    console.log('Cancelling item with ID:', itemOrderId);

    const order = await Order.findOne({ "items.itemOrderId": itemOrderId }).populate('user');

    if (!order) {
      console.error('Order not found for ID:', itemOrderId);
      return res.status(404).send('Order not found');
    }

    const itemIndex = order.items.findIndex(item => item.itemOrderId === itemOrderId);

    if (itemIndex === -1) {
      console.error('Item not found in the order:', order.items);
      return res.status(404).send('Item not found in the order');
    }

    order.items[itemIndex].itemOrderStatus = "Cancelled";
    order.items[itemIndex].cancelReason = cancelReason || "No reason provided";

    const { saledPrice, quantity } = order.items[itemIndex];
    

    if (!saledPrice || !quantity) {
      console.error('Invalid item price or quantity:', { saledPrice, quantity });
      return res.status(400).send('Invalid item price or quantity');
    }

    const amountToCredit = saledPrice * quantity;
    const paymentMethod = order.payment[0].method;
    const paymentStatus = order.payment[0].status;

    if ((paymentMethod === "Online Payment" || paymentMethod === "Wallet Payment") && paymentStatus === "completed") {
      if (order.user) {
        if (!order.user.wallet) {
          console.log('Creating new wallet for user:', order.user._id);
          const newWallet = new Wallet({ balance: 0, transactions: [] });
          await newWallet.save();
          order.user.wallet = newWallet._id;
          await order.user.save();
        }

        const wallet = await Wallet.findById(order.user.wallet);

        if (wallet) {
          wallet.balance += amountToCredit;
          wallet.transactions.push({
            type: "credit",
            amount: amountToCredit,
            description: `Refund for cancelled order item: ${itemOrderId}`,
            date: new Date()
          });

          await wallet.save();
          
        } else {
          console.error('Wallet not found even after attempted creation');
          return res.status(404).send('Wallet not found');
        }
      } else {
        console.error('User not found in the order');
        return res.status(404).send('User not found');
      }
    }

    const productId = order.items[itemIndex].product._id.toString();
    await Product.findOneAndUpdate(
      { _id: productId },
      { $inc: { quantity: quantity } },
      { new: true }
    );

    const allStatuses = order.items.map(item => item.itemOrderStatus);
    const uniqueStatuses = [...new Set(allStatuses)];

    if (uniqueStatuses.length === 1) {
      order.status = uniqueStatuses[0];
    } else if (uniqueStatuses.length > 1) {
      order.status = "Processing";
    }

    await order.save();

    res.redirect('/user/my-order');

  } catch (error) {
    console.error('Error in cancelOrder:', error);
    next(error);
  }
};


const returnOrder = async (req, res, next) => {
  try {
    const { itemOrderId, returnReason } = req.body;

    const order = await Order.findOne({ "items.itemOrderId": itemOrderId });

    if (!order) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const itemIndex = order.items.findIndex(item => item.itemOrderId === itemOrderId);

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in the order' });
    }

    const item = order.items[itemIndex];

   
    if (item.itemOrderStatus !== 'Delivered') {
      return res.status(400).json({ message: 'Item is not eligible for return' });
    }

    const deliveryDate = item.deliveryDate || order.date; 
    const currentDate = new Date();
    const daysSinceDelivery = Math.floor((currentDate - deliveryDate) / (1000 * 60 * 60 * 24));

    if (daysSinceDelivery > 7) {
      return res.status(400).json({ message: 'Return period has expired' });
    }

   
    item.itemOrderStatus = "Return Requested";
    item.returnReason = returnReason;

    await order.save();

    res.status(200).json({ message: 'Return request submitted successfully' });

  } catch (error) {
    next(error);
  }
};


const orderDetails = async (req, res, next) => {
  try {
    const { orderId, productId } = req.body; 

    const order = await Order.findOne({ orderId })
    .populate('user')
    .populate('address')
    .populate({
      path: 'items.product',
      populate: {
        path: 'brand',
        select: 'name' 
      }
    })
    .exec();
  

    if (!order) {
      return res.status(404).send('Order not found');
    }

    const selectedItem = order.items.find(item => item.product._id.toString() === productId);

    if (!selectedItem) {
      return res.status(404).send('Product not found in order');
    }

    return res.render('order-details-page', { order, selectedItem });

  } catch (error) {
    console.error('Error fetching order details:', error);
    return next(error);
  }
};


const confirmRePayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { razorpayOrderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.payment[0].status === 'completed') {
      return res.status(400).json({ success: false, message: 'Payment already completed for this order' });
    }

    let razorpayOrder;
    if (razorpayOrderId) {
      
      razorpayOrder = await razorpayInstance.orders.fetch(razorpayOrderId);
    } else {
      
      razorpayOrder = await razorpayInstance.orders.create({
        amount: Math.round(order.totalPrice * 100), 
        currency: 'INR',
        receipt: `order_rcptid_${order._id}`,
        payment_capture: 1
      });

      
      order.payment[0].razorpayOrderId = razorpayOrder.id;
      await order.save();
    }

    res.status(200).json({
      success: true,
      amount: razorpayOrder.amount,
      razorpayOrderId: razorpayOrder.id
    });

  } catch (error) {
    console.error('Error in confirmRePayment:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

const downloadInvoice = async (req, res, next) => {

  try {
    const { orderId, itemId } = req.params;
    

    const order = await Order.findById(orderId)
    .populate('user')
    .populate('address')
    .populate({
      path: 'items.product',
      populate: {
        path: 'brand',
        select: 'name' 
      }
    })
    .exec();
    console.log("-------------------- Download - oder invoice function  invock ayii")
    console.log(order)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    
    const selectedItem = order.items.find(item => item.itemOrderId === itemId);

    if (!selectedItem) {
      return res.status(404).json({ message: 'Item not found in the order' });
    }

  
    const doc = new PDFDocument();
    const chunks = [];

    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfData = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order.invoice.invoiceNo}.pdf`);
      res.send(pdfData);
    });

    // Add the image (logo or any other image)
    // const imageWidth = 100; // width of the image
    // const imageHeight = 50; // height of the image


    // doc.addImage("https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg", 'PNG', 200, 50, imageWidth, imageHeight);
  
    doc.fontSize(20).text('Tax Invoice - Nike.Just Do it. Nike IN', { align: 'center' });
    doc.moveDown();
    
    
    doc.fontSize(12);
    
    
    let leftColumnX = 50;
    let startY = 110;
    
    doc.text(`Sold by`, leftColumnX, startY, { underline: true }); 
    doc.text(`Nike Clone-`, leftColumnX, startY + 20); 
    doc.text(`No 6`, leftColumnX, startY + 40); 
    doc.text(`India`, leftColumnX, startY + 60); 
    doc.text(`Pin: 688888`, leftColumnX, startY + 80);
    
    
    const rightColumnX = 300;
    doc.text(`Order Id: ${order.orderId}`, rightColumnX, startY);
    doc.text(`Invoice No: ${order.invoice.invoiceNo}`, rightColumnX, startY + 20);
    doc.text(`Order Date: ${order.date.toLocaleString()}`, rightColumnX, startY + 40);
    doc.text(`Invoice Date: ${order.invoice.invoiceDate.toLocaleString()}`, rightColumnX, startY + 80);
    doc.text(`Payment method: ${order.payment[0].method}`, rightColumnX, startY + 100);
    
    
    doc.moveDown(2);
    
    
    let shippingAddressStartY = startY + 120; 
    doc.text('Shipping Address:', leftColumnX, shippingAddressStartY, { underline: true });
    doc.text(`${order.user.name}`, leftColumnX, shippingAddressStartY + 20);
    doc.text(`${order.address.house}, ${order.address.place}`, leftColumnX, shippingAddressStartY + 40);
    doc.text(`${order.address.city}, ${order.address.state} - ${order.address.pin}`, leftColumnX, shippingAddressStartY + 60);
    doc.text(`Phone: ${order.address.contactNo}`, leftColumnX, shippingAddressStartY + 80);
    
    
    doc.moveDown();

    
    const tableTop = 350;
    doc.font('Helvetica-Bold');
    doc.text('Name', 20, tableTop);

    doc.text('Qty', 200, tableTop);
    doc.text('Amount', 250, tableTop);
    doc.text('Discount', 325, tableTop);
    doc.text('Taxable Value', 400, tableTop);
    doc.text('Total', 500, tableTop);

    
    doc.font('Helvetica');
  
    const nameColumnWidth = 180; // Set a max width for the product name column
const tableRow = tableTop + 25; // Starting row for the table

// Adjusting text to avoid overlap and allow wrapping
doc.text(selectedItem.product.productName, 20, tableRow, {
  width: nameColumnWidth, // Set a max width for name to wrap text
  align: 'left' // Align the text to the left
});
    doc.text(selectedItem.quantity.toString(), 200, tableRow);
    doc.text(selectedItem.regularPrice.toFixed(2), 250, tableRow);
    doc.text((selectedItem.regularPrice - selectedItem.saledPrice).toFixed(0), 325, tableRow);
    doc.text(selectedItem.saledPrice.toFixed(2), 400, tableRow);
    doc.text((selectedItem.saledPrice * selectedItem.quantity).toFixed(0), 500, tableRow);

    doc.moveDown();
    const totalRow = tableRow + 30;
    doc.font('Helvetica-Bold');
    doc.text('Total:', 400, totalRow);
    doc.text(` ${(selectedItem.saledPrice * selectedItem.quantity).toFixed(0)}`, 500, totalRow);
    
    doc.moveDown();
    doc.text('All values are in INR ₹', 50, 600);
    doc.moveDown(3);
    doc.text('Thank you for shopping with us!',{align : "center"});
  
    doc.fontSize(5).text("*ASSPL-Nike Seller Services Pvt. Ltd., ARIPL-Nike Retail India Pvt. Ltd. only where Nike Retail India Pvt. Ltd. fulfillment center is co-located Customers desirous of availing input GST credit are requested to create a Business account and purchase on Nike.in/business from Business eligible offers Please note that this invoice is not a demand for payment",{align : "center"})
  
    doc.end();

  } catch (error) {
    next(error);
  }
};


module.exports = {
    placeOrder,
    addCoupon,
    loadPayment,
    confirmOrder,
    orderConfirmationPage,
    myOrder,
    cancelOrder,
    returnOrder,
    orderDetails,
    verifyRazorpayPayment,
    razorpayCheckout,
    removeCoupon,
    confirmRePayment,
    downloadInvoice
 
}
