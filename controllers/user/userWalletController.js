const env = require("dotenv").config();
const User = require("../../models/userSchema");
const Wallet= require("../../models/walletSchema");


const wallet = async (req, res, next) => {
  const userId = res.locals.user._id;
  const page = parseInt(req.query.page) || 1; 
  const limit = 100; 

  try {
      const user = await User.findById(userId).populate('wallet').exec();
      
      if (!user) {
          return res.status(404).send('User not found');
      }

      if (!user.wallet) {
          return res.render('wallet', {
              balance: 0, 
              transactions: [],
              currentPage: page,
              totalPages: 0
          });
      }

      const { balance, transactions } = user.wallet;

      
      const totalTransactions = transactions.length;
      const totalPages = Math.ceil(totalTransactions / limit);
      const paginatedTransactions = transactions.slice((page - 1) * limit, page * limit);

      return res.render('wallet', {
          balance: balance,
          transactions: paginatedTransactions, 
          currentPage: page,
          totalPages: totalPages
      });

  } catch (error) {
      next(error);
  }
};

const addToWallet = async (req, res, next) => {
  const userId = res.locals.user._id;
  const { amount2Walltet } = req.body;

  try {
    // Find the user by userId
    const user = await User.findById(userId).exec();
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Check if the user has a wallet
    let wallet = user.wallet;
    if (!wallet) {
      // If wallet doesn't exist, create a new one
      wallet = new Wallet({ balance: 0, transactions: [] });
      user.wallet = wallet;
    }

    // Add the amount to the wallet balance
    const newBalance = wallet.balance + amount2Walltet;  // Correct calculation

    // Update the wallet in the database
    await Wallet.findByIdAndUpdate(wallet._id, {  // Use wallet._id here
      $inc: { balance: amount2Walltet },  // Increment the balance by the amount
      $push: {
        transactions: {
          type: 'credit',
          amount: amount2Walltet,
          description: 'Added to wallet',
          date: new Date(),
        }
      }
    });

    // Save the user after modifying the wallet
    await user.save();  // Make sure to await here
    
    return res.status(201).send('Transaction added to wallet');
  } catch (error) {
    next(error);
  }
};

// <-Todo-> 01-12-2024

// const verifyRazorpayPaymentForWallet = async (req, res) => {
//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//   try {
//     // Check if all necessary parameters are provided
//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return res.status(400).json({ success: false, message: 'Missing required parameters' });
//     }

//     // Verify the signature from Razorpay
//     const sign = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSign = crypto
//       .createHmac("sha256", process.env.RAZOR_PAY_KEY_SECRET)
//       .update(sign.toString())
//       .digest("hex");

//     if (razorpay_signature !== expectedSign) {
//       return res.status(400).json({ success: false, message: 'Signature mismatch' });
//     }

//     // Find the user and verify the payment
//     const user = await User.findById(res.locals.user._id).exec();
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     // Find the wallet associated with the user
//     const wallet = user.wallet;
//     if (!wallet) {
//       return res.status(404).json({ success: false, message: 'Wallet not found' });
//     }

//     // Add the amount to the wallet balance (we use the amount from the Razorpay order)
//     const amount2Add = Math.round(amount2Walltet); // Amount should be same as requested by the user

//     // Update the wallet and add a transaction record
//     await Wallet.findByIdAndUpdate(wallet._id, {
//       $inc: { balance: amount2Add }, // Increment the wallet balance
//       $push: {
//         transactions: {
//           type: 'credit',
//           amount: amount2Add,
//           description: 'Added to wallet via Razorpay',
//           date: new Date(),
//         },
//       },
//     });

//     // Update the payment status to completed
//     user.wallet.razorpayPaymentId = razorpay_payment_id;
//     await user.save();

//     res.status(200).json({ success: true, message: 'Payment verified, wallet updated' });
//   } catch (error) {
//     console.error('Error in verifyRazorpayPaymentForWallet:', error);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// };
// const razorpayCheckoutForWallet = async (req, res) => {
//   try {
//       const { amount2Wallet } = req.body; // Amount to be added to the wallet (from frontend)

//       // Find the user by ID
//       const userId = res.locals.user._id; // Don't forget to get userId here
//       const user = await User.findById(userId).exec();
//       if (!user) {
//           return res.status(404).json({ success: false, message: 'User not found' });
//       }

//       // Create a Razorpay order for the wallet deposit
//       const razorpayOrder = await razorpayInstance.orders.create({
//           amount: Math.round(amount2Wallet * 100), // Convert to paise
//           currency: 'INR',
//           receipt: `wallet_deposit_${userId}`,
//           payment_capture: 1, // Automatically capture payment
//       });

//       // Save Razorpay order ID to the user's order/payment history
//       const walletTransaction = {
//           type: 'deposit',
//           amount: amount2Wallet,
//           razorpayOrderId: razorpayOrder.id,
//           status: 'pending',
//           date: new Date(),
//       };

//       // You can store this transaction in the user's wallet or a transaction collection
//       user.wallet.transactions.push(walletTransaction);
//       await user.save();

//       res.status(200).json({
//           success: true,
//           razorpayKeyId: process.env.RAZOR_PAY_KEY_ID, // Your Razorpay Key ID
//           razorpayOrderId: razorpayOrder.id, // The Razorpay Order ID
//           amount: razorpayOrder.amount / 100, // Amount to be paid (in INR)
//       });

//   } catch (error) {
//       console.error('Error in razorpayCheckoutForWallet:', error);
//       res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// };



const checkWalletBalance = async (req, res) => {
    try {
      const { amount } = req.body;

      const userId = res.locals.user._id;

      const user = await User.findById(userId).populate('wallet');
      if (!user || !user.wallet) {
        return res.json({ success: false, message: 'User or wallet not found' });
      }
 
      if (user.wallet.balance < amount) {
        return res.json({ success: false, message: 'Insufficient balance in wallet' });
      }
  
      return res.json({ success: true, message: 'Sufficient balance available' });
    } catch (error) {
      console.error('Error checking wallet balance:', error);
      return res.status(500).json({ success: false, message: 'An error occurred while checking the wallet balance' });
    }
  };

 

  const walletBalanceMiddleware = async (req, res, next) => {
    const userId = res.locals.user._id; // assuming user info is stored in locals after login
  
    try {
      const user = await User.findById(userId).populate('wallet');
  
      if (user && user.wallet) {
        // Add wallet balance to res.locals to make it accessible in EJS
        res.locals.walletBalance = user.wallet.balance || 0;
      } else {
        res.locals.walletBalance = 0; // if no wallet or user found, set balance to 0
      }
  
      next(); // pass control to the next middleware or route handler
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      res.locals.walletBalance = 0; // Set default balance to 0 on error
      next();
    }
  };
  
 
  
module.exports = {
    wallet,
    checkWalletBalance,
    walletBalanceMiddleware,
    addToWallet,
    // verifyRazorpayPaymentForWallet,
    // razorpayCheckoutForWallet
}
