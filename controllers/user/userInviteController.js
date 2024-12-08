const env = require("dotenv").config();
const User = require("../../models/userSchema");
const ReferralOffer = require('../../models/referralOfferSchema');

const inviteFriends = async (req, res, next) => {
    try {
      const userId = res.locals.user._id;
      if (!userId) {
        let error = new Error('User not authorized');
        error.status = 403;
        return next(error);
      }
  
      const user = await User.findById(userId);
      if (!user) {
        let error = new Error('User not found');
        error.status = 404;
        return next(error);
      }
  
      const currentDate = new Date();
      const referralOffer = await ReferralOffer.findOne({
        status: 'active',
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate }
      });
  
      res.render('invite-friends', { user, referralOffer });
    } catch (error) {
      next(error);
    }
  };

module.exports = {

    inviteFriends
}