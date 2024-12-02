const Coupon = require("../../models/couponSchema")


// const myCoupons = async (req, res, next) => {
//     try {
//         // Filter out coupons with 'Inactive' status
//         const coupons = await Coupon.find({ status: { $ne: "Inactive" } }).exec();
//         return res.render("my-coupon", { coupons });
//     } catch (error) {
//         next(error);
//     }
// };
const myCoupons = async (req, res, next) => {
    try {
        // Get the current date
        const currentDate = new Date();

        // Filter out coupons that are inactive or expired
        const coupons = await Coupon.find({
            $and: [
                { status: { $ne: "Inactive" } }, // Exclude inactive coupons
                { endDate: { $gte: currentDate } } // Only include coupons that haven't expired
            ]
        }).exec();
        return res.render("my-coupon", { coupons });
    } catch (error) {
        next(error);
    }
};



module.exports = {

    myCoupons

}