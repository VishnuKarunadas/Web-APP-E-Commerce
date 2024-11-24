const User = require("../../models/userSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const Wallet = require("../../models/walletSchema");


const orders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; 
        const skip = (page - 1) * limit;

        const searchQuery = req.query.search || '';
        let query = {};

        if (searchQuery) {
            query = {
                $or: [
                    { orderId: { $regex: searchQuery, $options: 'i' } },
                    { status: { $regex: searchQuery, $options: 'i' } },
                    { 'payment.method': { $regex: searchQuery, $options: 'i' } }
                ]
            };
        }

        const orders = await Order.find(query)
            .populate({
                path: 'user',
                select: 'username email', 
                options: { lean: true }
            })
            .populate('items.product', 'productName')
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalOrders = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / limit);

        res.render("customers-order", {
            orders,
            currentPage: page,
            totalPages,
            searchQuery
        });
    } catch (error) {
       
        res.status(500).render('error', { message: 'An error occurred while fetching orders' });
    }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, itemId, cancelReason, returnReason, returnRejectionReason } = req.body;

    if (!id || !status || !itemId) {
      return res.status(400).json({ success: false, message: 'Order ID, item ID, and status are required' });
    }

    const order = await Order.findById(id).populate('user');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const item = order.items.find(item => item.itemOrderId === itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in the order' });
    }

    if (item.itemOrderStatus === 'Cancelled' || item.itemOrderStatus === 'Returned') {
      return res.status(400).json({ success: false, message: 'This item status cannot be changed' });
    }

    if (status === 'Return Requested' && item.itemOrderStatus !== 'Return Requested') {
      if (item.itemOrderStatus !== 'Delivered') {
        return res.status(400).json({ success: false, message: 'Only delivered items can be returned' });
      }
      const deliveryDate = item.deliveryDate || order.date;
      const currentDate = new Date();
      const daysSinceDelivery = Math.floor((currentDate - deliveryDate) / (1000 * 60 * 60 * 24));
      if (daysSinceDelivery > 7) {
        return res.status(400).json({ success: false, message: 'Return period has expired' });
      }
      item.returnReason = returnReason || 'Not specified';
    }

    if (status === 'Return Rejected') {
      item.returnRejectionReason = returnRejectionReason || 'Not specified';
    }

    if (status === 'Cancelled' || status === 'Returned') {
      item.cancelReason = status === 'Cancelled' ? (cancelReason || 'Not specified') : undefined;
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: item.quantity }
      }, { new: true });

      const paymentMethod = order.payment[0].method;
      const paymentStatus = order.payment[0].status;
      const refundAmount = item.saledPrice;

      if ((paymentMethod === 'Online Payment' && paymentStatus === 'completed') || 
      (paymentMethod === 'Wallet Payment' && paymentStatus === 'completed') ||
      (paymentMethod === 'Cash On Delivery' && status === 'Returned')) {
        const user = await User.findById(order.user._id);
        
        let wallet;

        if (!user.wallet) {
          wallet = await createNewWallet(user, refundAmount, status, item);
        } else {
          try {
            wallet = await Wallet.findById(user.wallet);
            if (!wallet) {
      
              wallet = await createNewWallet(user, refundAmount, status, item);
            } else {
              wallet.balance += refundAmount;
              wallet.transactions.push({
                type: 'credit',
                amount: refundAmount,
                description: `Refund for ${status.toLowerCase()} order item ${item.itemOrderId}`,
                date: new Date()
              });
              await wallet.save();
            
            }
          } catch (error) {
            console.error('Error fetching or updating existing wallet:', error);
            return res.status(500).json({ success: false, message: 'Error with wallet operation' });
          }
        }
      }
    }

    item.itemOrderStatus = status;

    if (status === 'Delivered' && order.payment[0].method === 'Cash On Delivery') {
      order.payment[0].status = 'completed'; 
    }

    const allItemsCompleted = order.items.every(item => 
      item.itemOrderStatus === 'Delivered' || 
      item.itemOrderStatus === 'Returned' || 
      item.itemOrderStatus === 'Cancelled'
    );
    
    if (allItemsCompleted) {
      order.status = 'Completed';
    } else {
      order.status = 'Processing';
    }
    
    await order.save();


    res.json({ success: true, message: 'Item status updated successfully', order });
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating the item status' });
  }
};

async function createNewWallet(user, refundAmount, status, item) {
  const wallet = new Wallet({
    balance: refundAmount,
    transactions: [{
      type: 'credit',
      amount: refundAmount,
      description: `Refund for ${status.toLowerCase()} order item: ${item.itemOrderId}`,
      date: new Date()
    }]
  });

  try {
    await wallet.save();
    
    user.wallet = wallet._id;
    await user.save();
    return wallet;
  } catch (error) {
    console.error('Error creating new wallet:', error);
    throw error;
  }
}



const orderDetails = async (req, res, next) => {
    try {
      const { orderId } = req.params;
  
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
  
      return res.render('customer-order-details', { order });
    } catch (error) {
      console.error('Error fetching order details:', error);
      return next(error);
    }
  };


module.exports = {

orders,
updateOrderStatus,
orderDetails

}