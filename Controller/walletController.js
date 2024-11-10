
const User = require("../Model/usermodel")

const Wallet = require("../Model/walletModel")




const loadWallet = async (req, res) => {
    const userId = req.session.userId;
   
    
    try {
      const user = await User.findById(userId, 'walletBalance');
      if (!user) {
        console.error("User not found with ID:", userId);
        return res.redirect("/login"); 
      }
      
      const transactions = await Wallet.find({ userId })
        .sort({ createdAt: -1 })
        .lean();
  
      const walletAmount = user.walletBalance;
      res.render("user/wallet", { transactions, walletAmount });
    } catch (error) {
      console.error("Error in loading wallet:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  module.exports = {loadWallet}
  