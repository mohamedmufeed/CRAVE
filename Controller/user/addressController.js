
const logger = require("../../config/logger");
const Address = require("../../Model/addresModel")
const loadAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    if(!userId){
       return res.redirect("/login")
    }
    const cartCount = req.session.cartCount
    const addresses = await Address.find({ user: userId });
    res.render("user/address", { addresses, message: req.session.message, cartCount });
    req.session.message = null;
  } catch (error) {
    logger.error("Error on Loading Address",error);
return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({message:"internal server error"})
  }
}

const addAddress = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, addressLine, city, state, pinCode, country } = req.body;


    const errors = {};

    if (!firstName) errors.firstName = "First name is required.";
    if (!lastName) errors.lastName = "Last name is required.";
    if (!email) errors.email = "Email is required.";
    if (!mobile) errors.mobile = "Mobile number is required.";
    if (!addressLine) errors.addressLine = "Address is required.";
    if (!city) errors.city = "City is required.";
    if (!state) errors.state = "State is required.";
    if (!pinCode) errors.pinCode = "Pincode is required.";
    if (!country) errors.country = "Country is required.";

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (email && !emailRegex.test(email)) {
      errors.email = "Please enter a valid email address.";
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (mobile && !mobileRegex.test(mobile)) {
      errors.mobile = "Please enter a valid 10-digit mobile number.";
    }

    const pinCodeRegex = /^[0-9]{6}$/;
    if (pinCode && !pinCodeRegex.test(pinCode)) {
      errors.pinCode = "Please enter a valid 6-digit pincode.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const newAddress = new Address({
      user: req.session.userId,
      firstName,
      lastName,
      email,
      mobile,
      addressLine,
      city,
      state,
      pinCode,
      country,
    });


    await newAddress.save();
    // return res.redirect("/profile/address");
    return res.status(HttpStatusCodes.OK).json({success:true})
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: "An error occurred while adding the address." });
  }
};



const editAddress = async (req, res) => {
  try {
    const addressId = req.params.id
    const updatedData = req.body;

    await Address.findByIdAndUpdate(addressId, updatedData)
    res.redirect("/profile/address")
  } catch (error) {
    logger.error("error in edit address", error)
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "An error occurred while editing the address" });
  }

}

const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id
    await Address.findByIdAndDelete(addressId)
    res.redirect("/profile/address")
  } catch (error) {
    logger.error("Error in deleting address:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "An error occurred while deleting the address" });
  }
}



module.exports={
    loadAddress,
    addAddress,
    editAddress,
    deleteAddress
}