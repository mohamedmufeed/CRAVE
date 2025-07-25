const Order = require("../../Model/orderModel");
const User = require("../../Model/usermodel");
const HttpStatusCodes = require("../../config/httpStatusCode");
const logger = require("../../config/logger");
const Wallet = require("../../Model/walletModel")
require("dotenv").config();
const loadOrder = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments();

    const orders = await Order.find()
      .populate("userId", "username")
      .populate("address")
      .populate("products.productId", "name price")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(totalOrders / limit);
    const previousPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;

    if (!orders || orders.length === 0) {
      return res.status(HttpStatusCodes.NOT_FOUND).send("No orders found");
    }

    res.render("admin/orderManagement", {
      orders: orders,
      currentPage: page,
      totalPages: totalPages,
      totalOrders: totalOrders,
      previousPage: previousPage,
      nextPage: nextPage,
    });
  } catch (error) {
    logger.error("Error fetching orders:", error);
    res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred while fetching orders." });
  }
};

const serchOrder = async (req, res) => {
  const searchItem = req.query.search?.trim() || "";
  try {
    const regex = new RegExp(searchItem, "i");
    const orders = await Order.aggregate([
      {
        $addFields: {
          _idString: { $toString: "$_id" },
        },
      },
      {
        $match: {
          $or: [
            { _idString: { $regex: regex } },
            { "userId.username": { $regex: regex } },
            { status: { $regex: regex } },
            { "products.name": { $regex: regex } },
          ],
        },
      },
    ]);
    await Order.populate(orders, [
      { path: "userId" },
      { path: "products.productId" },
      { path: "address" },
    ]);

    const modifiedOrders = orders.map((order) => ({
      _id: order._id,
      shortId: order._id.toString().slice(-6),
      userId: order.userId,
      address: order.address,
      total: order.total,
      createdAt: order.createdAt,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      products: order.products.map((p) => ({
        name: p.productId?.name || "N/A",
        quantity: p.quantity,
      })),
    }));

    return res.json({ orders: modifiedOrders });
  } catch (error) {
    logger.error("Error in search orders:", error);
    return res.status(500).json({
      message: "An error occurred while searching for orders.",
    });
  }
};

const orderStatus = async (req, res) => {
  const orderId = req.params.id;
  const newStatus = req.body.status;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json({ message: "Order not found" });
    }
    const userId = order.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json({ message: "User not found" });
    }

    order.status = newStatus;

    if (order.paymentMethod === "CashOnDelivery" && newStatus === "Delivered") {
      order.paymentStatus = "Paid";
    }

    if (order.paymentMethod === "Razorpay" && newStatus === "Cancelled") {
      let refundAmount = 0;
      order.products.forEach((product) => {
        if (
          product.singleStatus !== "Cancelled" &&
          product.singleStatus !== "Returned"
        ) {
          refundAmount += product.price;
        }
      });

      if (refundAmount > 0) {
        user.walletBalance += refundAmount;

        const walletTransaction = new Wallet({
          userId,
          amount: refundAmount,
          transactionType: "Credit",
          description: `Refund for cancelled Order: #${order._id.toString().slice(-6)}`,
        });

        await walletTransaction.save();
        await user.save();
      }
    }

    order.products.forEach((product) => {
      if (
        product.singleStatus !== "Cancelled" &&
        product.singleStatus !== "Returned"
      ) {
        product.singleStatus = newStatus;
      }
    });
    await order.save();

    res.redirect("/admin/orderManagement");
  } catch (error) {
    logger.error("Error updating order status:", error);
    res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred while updating the order status." });
  }
};

const admincancelOrder = async (req, res) => {
  const orderId = req.params.id;
  try {
    // const order = await Order.findByIdAndUpdate(orderId, { status: "Cancelled" })
    const order = await Order.findById(orderId);
    if (!order) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ message: "Order nor found" });
    }
    order.products.forEach((product) => {
      product.singleStatus = "Cancelled";
    });
    order.status = "Cancelled";
    await order.save();
    res.redirect("/admin/orderManagement");
  } catch (error) {
    logger.error("error in cancel order form admin side");
    res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "error in canceling order in admin side " });
  }
};

const orderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId)
      .populate("userId")
      .populate("products.productId")
      .populate("address");

    if (!order) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ message: "Order not found" });
      return;
    }
    res.render("admin/orderDetails", { order });
  } catch (err) {
    logger.error(err);
    res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal Server Error" });
  }
};

module.exports = {
  admincancelOrder,
  orderStatus,
  serchOrder,
  loadOrder,
  orderDetails,
};
