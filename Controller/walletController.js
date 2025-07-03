
const logger = require("../config/logger");
const User = require("../Model/usermodel")

const Wallet = require("../Model/walletModel")



const loadWallet = async (req, res) => {
  const userId = req.session.userId;

  const page = parseInt(req.query.page) || 1;   
  const limit = 3;                                 
  const skip = (page - 1) * limit;

  try {
    const user = await User.findById(userId, 'walletBalance');
    if (!user) {
      logger.error("User not found with ID:", userId);
      return res.redirect("/login");
    }

    const totalTransactions = await Wallet.countDocuments({ userId });


    const transactions = await Wallet.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(totalTransactions / limit);

    const walletAmount = user.walletBalance;

    res.render("user/wallet", {
      transactions,
      walletAmount,
      currentPage: page,
      totalPages
    });
  } catch (error) {
    logger.error("Error in loading wallet:", error);
    res.status(500).send("Internal Server Error");
  }
};

  module.exports = {loadWallet}
  