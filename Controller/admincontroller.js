const Admin = require("../Model/adminmodel");
const User = require("../Model/usermodel")

const Order = require("../Model/orderModel")

const bcrypt = require("bcrypt");
const HttpStatusCodes = require("../config/httpStatusCode");


const loadlogin = async (req, res) => {
  res.render("admin/login", {
    message: req.session.message
  });
  req.session.message = null;
};

const login = async (req, res) => {
  const { username, password } = req.body;
  const existAdmin = await Admin.findOne({ userName: username });

  if (!existAdmin) {
    req.session.message = "admin not exits"
    return res.redirect("/admin/login")
  }
  const isMatch = await bcrypt.compare(password, existAdmin.password);
  if (!isMatch) {
    req.session.message = "password in not match"
    return res.redirect("/admin/login")
  }
  req.session.admin = true
  res.redirect('/admin/dashboard')
};


const loadDashboard = async (req, res) => {
  res.render('admin/dashboard')
}

const loadUserMangment = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 8;
    const skip = (page - 1) * limit;


    const totalUsers = await User.countDocuments();

    const users = await User.find({})
      .skip(skip)
      .limit(limit);


    const totalPages = Math.ceil(totalUsers / limit);
    const previousPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;


    res.render("admin/userManagement", {
      users: users,
      currentPage: page,
      totalPages: totalPages,
      totalUsers: totalUsers,
      previousPage: previousPage,
      nextPage: nextPage,
    });
  } catch (error) {
    console.error("Error loading user management:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("An error occurred while loading users.");
  }
}


const searchUser = async (req, res) => {
  const searchItem = req.query.search;
  try {
    const query = {
      $or: [
        { username: { $regex: searchItem, $options: "i" } },
        { email: { $regex: searchItem, $options: "i" } }
      ]
    };

    const users = await User.find(query);
    res.render("admin/userManagement", { users, searchItem });
  } catch (error) {
    console.error("Error in search users:", error);
    res.status(500).json({ message: "An error occurred while searching for users." });
  }
};


const blockUser = async (req, res) => {
  try {
    const userId = req.params.id
    await User.findByIdAndUpdate(userId, { isBlocked: true })
    res.redirect("/admin/userManagement")
  } catch (error) {
    console.log("Error blocking user:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("Server Error");
  }
}


const unblockUser = async (req, res) => {
  try {
    const userId = req.params.id
    await User.findByIdAndUpdate(userId, { isBlocked: false })
    res.redirect("/admin/userManagement")
  } catch (error) {
    console.log(error)
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("server error")
  }
}



const getSalesReport = async (time, startDate, endDate) => {
  let pipeline = [
    { $match: { status: "Delivered" } },
  ];

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); 

    pipeline[0].$match.createdAt = { $gte: start, $lte: end };
  }

  switch (time) {
    case "yearly":
      pipeline.push({
        $group: {
          _id: { year: { $year: "$createdAt" } },
          totalSalesRevenue: { $sum: "$total" },
          totalDiscount: { $sum: "$discountAmount" },
          totalOrders: { $sum: 1 },
          totalItemsSold: { $sum: { $sum: "$products.quantity" } }
        }
      });
      break;

    case "monthly":
      pipeline.push({
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalSalesRevenue: { $sum: "$total" },
          totalDiscount: { $sum: "$discountAmount" },
          totalOrders: { $sum: 1 },
          totalItemsSold: { $sum: { $sum: "$products.quantity" } }
        }
      });
      break;

    case "weekly":
      pipeline.push({
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            week: { $isoWeek: "$createdAt" }
          },
          totalSalesRevenue: { $sum: "$total" },
          totalDiscount: { $sum: "$discountAmount" },
          totalOrders: { $sum: 1 },
          totalItemsSold: { $sum: { $sum: "$products.quantity" } }
        }
      });
      break;

    default:
      break;
  }

  pipeline.push({
    $sort: { "_id.year": -1, "_id.month": -1, "_id.week": -1 }
  });

  try {
    const salesReport = await Order.aggregate(pipeline);

    return salesReport;
  } catch (error) {
    throw new Error(`Error in aggregation: ${error.message}`);
  }
};

const salesReport = async (req, res) => {
  const { time = "monthly", startDate, endDate } = req.query;

  try {
    const reportData = await getSalesReport(time, startDate, endDate);

    if (Array.isArray(reportData)) {
      reportData.forEach(report => {
        report.netSales = report.totalSalesRevenue - report.totalDiscount;
      });

      res.render('admin/salesReport', {
        salesReport: reportData,
        time,
        startDate,
        endDate
      });
    } else {
      throw new Error('Sales report data is not an array');
    }
  } catch (error) {
    console.error("Error fetching sales report:", error);
    res.status(500).send("Server Error");
  }
};





module.exports = {
  loadlogin,
  login,
  loadDashboard,
  loadUserMangment,
  blockUser,
  unblockUser,
  searchUser,
  salesReport
};
