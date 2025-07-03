const HttpStatusCodes = require("../../config/httpStatusCode")
const logger = require("../../config/logger")
const User = require("../../Model/usermodel")
const bcrypt = require("bcrypt");
const profile = async (req, res) => {
  try {
    const userid = req.session.userId
    const cartCount = req.session.cartCount
    const user = await User.findOne({ _id: userid ,isBlocked:false})
    if(!user){
      res.status(HttpStatusCodes.BAD_REQUEST).redirect("/login")
    }
    res.render("user/profile", {
      user,
      message: req.session.message,
      cartCount

    })
    req.session.message = null;
  } catch (error) {

    logger.error("Error in  loading profile:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).render("404");

  }
}

const editProfile = async (req, res) => {
  try {
    const userId = req.session.userId
    const { username, email, country } = req.body

    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailPattern.test(email)) {
      req.session.message = "Please enter a valid email";
      return res.redirect("/profile");
    }

    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      req.session.message = "Email is already in use by another account";
      return res.redirect("/profile");
    }


    const usernamePattern = /^[A-Za-z]+$/;
    if (!usernamePattern.test(username)) {
      req.session.message = "Invalid username";
      return res.redirect("/profile");
    }

    if (!email || !username) {
      req.session.message = "All fields are required";
      return res.redirect("/profile");
    }

    await User.findByIdAndUpdate(userId, {
      username,
      email,
      country
    })
    req.session.message = "Profile Updated sucseesfully"
    res.redirect("/profile")

  } catch (error) {
    logger.error(error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("Error updating profile");
  }
}



const editPassword = async (req, res) => {
  const userId = req.session.userId
  const { oldpassword, newpassword, cpassword } = req.body


  if (!userId) {
    return res.redirect("/login")
  }
  try {
    const user = await User.findById(userId)

    if (!user || !user.password) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'User not found or password not set.' });
    }
    const isMatch = await bcrypt.compare(oldpassword, user.password);

    if (!isMatch) {
      req.session.message = "Old passwords is not correct";
      return res.redirect("/profile");
    }

    if(newpassword === oldpassword){
      req.session.message = "Please enter a new password";
      return res.redirect("/profile");
    }
    const passwordPattern= /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

    if (!passwordPattern.test(newpassword)) {
      req.session.message = "Password must include an uppercase letter, a lowercase letter, a number, and a special character";
      return res.redirect("/profile");
    }

    if (newpassword !== cpassword) {
      req.session.message = "New password and confirmation do not match.";
      return res.redirect("/profile");
    }

    const hashedPassword = await bcrypt.hash(newpassword, 10);
    user.password = hashedPassword;
    await user.save();
    req.session.message = "Password changed successfully!";

    res.redirect("/profile")
  } catch (error) {
    logger.error("Error updating password:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'An error occurred while updating the password.' });
  }
}


module.exports={
    profile,
    editProfile,
    editPassword
}