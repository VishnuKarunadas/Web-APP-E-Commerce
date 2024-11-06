const User = require("../../models/userSchema");



const customerInfo = async (req, res) => {
    try {
        let search = req.query.search || "";
        let page = parseInt(req.query.page) || 1;
        const limit = 10;

        const userData = await User.find({
            role: "user",
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: 'i' } },
                { email: { $regex: ".*" + search + ".*", $options: 'i' } }
            ]
        })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

        const count = await User.find({
            role: "user",
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: 'i' } },
                { email: { $regex: ".*" + search + ".*", $options: 'i' } }
            ]
        }).countDocuments();

        res.render('customers', { users: userData, currentPage: page, totalPages: Math.ceil(count / limit) });
    } catch (error) {
        console.error("Error fetching customer info:", error);
        res.status(500).send("An error occurred");
    }
}

const customerBlocked = async (req,res) => {
    try {
        
        let id = req.query.id;
        await User.updateOne({_id: id}, { $set: { isBlocked: true}});
        res.redirect("/admin/users")

    } catch (error) {
        
        res.redirect('/admin/pageerror')

    }
};

const customerUnBlocked = async (req,res) => {

    try {
        
        let id = req.query.id;
        await User.updateOne({_id: id}, { $set: {isBlocked: false } });
        res.redirect("/admin/users");

    } catch (error) {
        res.redirect("/admin/pageerror");
    }
}


module.exports ={
    customerInfo,
    customerBlocked,
    customerUnBlocked
}