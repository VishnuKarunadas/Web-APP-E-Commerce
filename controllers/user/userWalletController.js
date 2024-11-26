const env = require("dotenv").config();
const User = require("../../models/userSchema");
 


const wallet = async (req, res, next) => {
  const userId = res.locals.user._id;
  const page = parseInt(req.query.page) || 1; 
  const limit = 5; 

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
    walletBalanceMiddleware
}
