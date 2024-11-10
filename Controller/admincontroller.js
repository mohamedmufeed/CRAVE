const Admin = require("../Model/adminmodel");
const User = require("../Model/usermodel")
const PDFDocument = require('pdfkit');
const Order = require("../Model/orderModel")
const ExcelJS = require('exceljs');
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



//sales

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

    const overallSummary = await Order.aggregate([
      { $match: { status: "Delivered" } },
      {
        $group: {
          _id: null,
          overallSalesCount: { $sum: 1 },                
          overallOrderAmount: { $sum: "$total" },         
          overallDiscount: { $sum: "$discountAmount" }    
        }
      }
    ]);

    return {salesReport,overallSummary:overallSummary[0]};
  } catch (error) {
    throw new Error(`Error in aggregation: ${error.message}`);
  }
};

const salesReport = async (req, res) => {
  const { time = "monthly", startDate, endDate } = req.query;

  try {
    const {salesReport,overallSummary} = await getSalesReport(time, startDate, endDate);

    if (Array.isArray(salesReport)) {
      salesReport.forEach(report => {
        report.netSales = report.totalSalesRevenue - report.totalDiscount;
      });

      res.render('admin/salesReport', {
        salesReport,
        time,
        startDate,
        endDate,
        overallSummary
      });
    } else {
      throw new Error('Sales report data is not an array');
    }
  } catch (error) {
    console.error("Error fetching sales report:", error);
    res.status(500).send("Server Error");
  }
};

 

const generatePDFReport = async (req, res) => {
  const { time = "monthly", startDate, endDate } = req.query;

  try {
    const reportData = await getSalesReport(time, startDate, endDate);

    if (!reportData || reportData.length === 0) {
      return res.status(404).send('No sales data available for the selected period.');
    }

    const doc = new PDFDocument();

    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    doc.fontSize(18).text('Sales Report', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text('Date Range: ' + (startDate ? startDate : 'All Time') + ' - ' + (endDate ? endDate : 'Present'), { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Sales Data - ${time.charAt(0).toUpperCase() + time.slice(1)}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).text("Year | Month | Total Sales Revenue | Total Discount | Total Orders | Total Items Sold", {
      align: 'left'
    });

    reportData.forEach(report => {
      doc.text(`${report._id.year} | ${report._id.month || 'N/A'} | ₹${report.totalSalesRevenue} | ₹${report.totalDiscount} | ${report.totalOrders} | ${report.totalItemsSold}`, {
        align: 'left'
      });
    });

    doc.end();
  } catch (error) {
    console.error("Error generating PDF report:", error);
    res.status(500).send("Internal Server Error");
  }
};



const generateExcelReport = async (req, res) => {
  const { time = "monthly", startDate, endDate } = req.query;

  try {
    const reportData = await getSalesReport(time, startDate, endDate);

    if (!reportData || reportData.length === 0) {
      return res.status(404).send('No sales data available for the selected period.');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
      { header: 'Year', key: 'year' },
      { header: 'Month', key: 'month' },
      { header: 'Total Sales Revenue', key: 'totalSalesRevenue' },
      { header: 'Total Discount', key: 'totalDiscount' },
      { header: 'Total Orders', key: 'totalOrders' },
      { header: 'Total Items Sold', key: 'totalItemsSold' },
    ];

    reportData.forEach(report => {
      worksheet.addRow({
        year: report._id.year,
        month: report._id.month || 'N/A',
        totalSalesRevenue: report.totalSalesRevenue,
        totalDiscount: report.totalDiscount,
        totalOrders: report.totalOrders,
        totalItemsSold: report.totalItemsSold
      });
    });

    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).send("Internal Server Error");
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
  salesReport,
  generatePDFReport,
  generateExcelReport
};
