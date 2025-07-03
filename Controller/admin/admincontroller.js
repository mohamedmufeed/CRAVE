const Admin = require("../../Model/adminmodel");
const User = require("../../Model/usermodel")
const PDFDocument = require('pdfkit');
const Order = require("../../Model/orderModel")
const ExcelJS = require('exceljs');
const HttpStatusCodes = require("../../config/httpStatusCode");
const logger = require('../../config/logger');


const loadlogin = async (req, res) => {
  if(req.session.admin){
    return res.redirect('/admin/dashboard')
  }
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
  let isMatch=false
  if(existAdmin.password === password){
    isMatch=true
  }
  // const isMatch = await bcrypt.compare(password, existAdmin.password);
  if (!isMatch) {
    req.session.message = "password in not match"
    return res.redirect("/admin/login")
  }
  req.session.admin = true
  res.redirect('/admin/dashboard')
};




const loadUserMangment = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 8;
    const skip = (page - 1) * limit;


    const totalUsers = await User.countDocuments();

    const users = await User.find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })


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
  try {
    const { search, page = 1 } = req.query;
    const limit = 10; 
    const skip = (page - 1) * limit;
    const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = search
      ? {
          $or: [
            { username: { $regex: escapeRegex(search), $options: 'i' } },
            { email: { $regex: escapeRegex(search), $options: 'i' } },
          ],
        }
      : {};

    const users = await User.find(query).skip(skip).limit(limit).lean();
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        previousPage: parseInt(page) > 1 ? parseInt(page) - 1 : null,
        nextPage: parseInt(page) < totalPages ? parseInt(page) + 1 : null,
      },
    });
  } catch (error) {
    console.error('Search error:', error.stack);
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
};


const blockUser = async (req, res) => {
  try {
    const userId = req.params.id
    await User.findByIdAndUpdate(userId, { isBlocked: true })
    res.redirect("/admin/userManagement")
  } catch (error) {
    logger.error("Error blocking user:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("Server Error");
  }
}


const unblockUser = async (req, res) => {
  try {
    const userId = req.params.id
    await User.findByIdAndUpdate(userId, { isBlocked: false })
    res.redirect("/admin/userManagement")
  } catch (error) {
  logger.error("Error on Unblocking User",error)
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

  pipeline.push({
    $lookup: {
      from: "users", 
      localField: "userId", 
      foreignField: "_id", 
      as: "userDetails"
    }
  });

  pipeline.push({
    $unwind: "$userDetails"
  });

  pipeline.push({
    $project: {
      orderId: "$_id",
      userName: "$userDetails.username",
      totalAmount: "$total",
      orderDate: "$createdAt",
      totalSalesRevenue: "$total",
      totalDiscount: "$discountAmount",
      products: 1
    }
  });

  switch (time) {
    case "yearly":
      pipeline.push({
        $group: {
          _id: { year: { $year: "$orderDate" } },
          orders: { $push: "$$ROOT" },
          totalSalesRevenue: { $sum: "$totalSalesRevenue" },
          totalDiscount: { $sum: "$totalDiscount" },
          totalOrders: { $sum: 1 }
        }
      });
      break;

    case "monthly":
      pipeline.push({
        $group: {
          _id: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" }
          },
          orders: { $push: "$$ROOT" },
          totalSalesRevenue: { $sum: "$totalSalesRevenue" },
          totalDiscount: { $sum: "$totalDiscount" },
          totalOrders: { $sum: 1 }
        }
      });
      break;

    case "weekly":
      pipeline.push({
        $group: {
          _id: {
            year: { $year: "$orderDate" },
            week: { $isoWeek: "$orderDate" }
          },
          orders: { $push: "$$ROOT" },
          totalSalesRevenue: { $sum: "$totalSalesRevenue" },
          totalDiscount: { $sum: "$totalDiscount" },
          totalOrders: { $sum: 1 }
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

    return { salesReport, overallSummary: overallSummary[0] };
  } catch (error) {
    logger.error("Error on sales Report")
    throw new Error(`Error in aggregation: ${error.message}`);
  }
};

const salesReport = async (req, res) => {
  const { time = "monthly", startDate, endDate } = req.query;
  
  try {
    const { salesReport, overallSummary } = await getSalesReport(time, startDate, endDate);


    salesReport.forEach(report => {
      report.orders.forEach(order => {
        const totalAmount = order.totalAmount || 0;
        const totalDiscount = order.totalDiscount || 0;
    
        order.netSales = totalAmount - totalDiscount;
    
      });
    });
    
  
   
    res.render('admin/salesReport', {
      salesReport,
      time,
      startDate,
      endDate,
      overallSummary
    });
  } catch (error) {
    console.error("Error fetching sales report:", error);
    res.status(500).send("Server Error");
  }
};

 
const generatePDFReport = async (req, res) => {
  const { time = "monthly", startDate, endDate } = req.query;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start) || isNaN(end)) {
    return res.status(400).json({ message: "Invalid date format" });
  }

  if (start >= end) {
    return res.status(400).json({ message: "Invalid date range. Start date must be earlier than end date." });
  }
  try {
    const { salesReport, overallSummary } = await getSalesReport(time, startDate, endDate);

    if (!salesReport || salesReport.length === 0) {
      return res.status(404).send("No sales data available for the selected period.");
    }

    const doc = new PDFDocument();

    res.setHeader("Content-Disposition", "attachment; filename=sales-report.pdf");
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    doc.fontSize(22).font("Helvetica-Bold").text("CRAVE", 50, 20, { align: "left" });
    doc.moveDown(1);
    doc.fontSize(18).text("Sales Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Date Range: ${startDate || "All Time"} - ${endDate || "Present"}`, { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Sales Data (${time.charAt(0).toUpperCase() + time.slice(1)})`, { align: "center" });
    doc.moveDown(2);

    doc.fontSize(12).font("Helvetica-Bold").text("Overall Summary:", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").text(`Total Sales Revenue: MRP:${overallSummary.overallOrderAmount}`, { align: "left" });
    doc.text(`Total Discount Given: MRP:${overallSummary.overallDiscount}`, { align: "left" });
    doc.text(`Total Orders Delivered: ${overallSummary.overallSalesCount}`, { align: "left" });
    doc.moveDown(2);

    const tableHeaders = ["Year", "Month", "User Name", "Total Sales", "Total Discount"];
    const tableWidth = 500;
    const colWidth = tableWidth / tableHeaders.length;

    let startY = doc.y + 20;
    doc.fontSize(10).font("Helvetica-Bold");
    tableHeaders.forEach((header, i) => {
      doc.text(header, 50 + i * colWidth, startY, { width: colWidth, align: "center" });
    });

    startY += 15;
    doc.moveTo(50, startY).lineTo(550, startY).stroke();
    startY += 10;

    doc.fontSize(10).font("Helvetica");
    salesReport.forEach(report => {
      report.orders.forEach(order => {
        const row = [
          report._id.year,
          report._id.month || "N/A",
          order.userName || "N/A",
          `MRP: ${order.totalAmount}`,
          `${order.totalDiscount || 0}`,
          
        ];
        row.forEach((cell, i) => {
          const alignment = i > 2 ? "center" : "left";
          doc.text(cell, 50 + i * colWidth, startY, { width: colWidth, align: alignment });
        });

        startY += 15;
        if (startY > doc.page.height - 50) {
          doc.addPage();
          startY = 50;
          doc.fontSize(10).font("Helvetica-Bold");
          tableHeaders.forEach((header, i) => {
            doc.text(header, 50 + i * colWidth, startY, { width: colWidth, align: "center" });
          });
          startY += 15;
          doc.moveTo(50, startY).lineTo(550, startY).stroke();
          startY += 10;
        }
      });
    });

    doc.moveTo(50, startY).lineTo(550, startY).stroke();
    doc.moveDown(2);
    doc.fontSize(8).text("Generated by Crave Report System", { align: "center" });

    doc.end();
  } catch (error) {
    console.error("Error generating PDF report:", error);
    res.status(500).send("Internal Server Error");
  }
};


const generateExcelReport = async (req, res) => {
  const { time = "monthly", startDate, endDate } = req.query;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start) || isNaN(end)) {
    return res.status(400).json({ message: "Invalid date format" });
  }

  if (start >= end) {
    return res.status(400).json({ message: "Invalid date range. Start date must be earlier than end date." });
  }
  try {
    const { salesReport, overallSummary } = await getSalesReport(time, startDate, endDate);

    if (!salesReport || salesReport.length === 0) {
      return res.status(404).send('No sales data available for the selected period.');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
      { header: 'Date Range', key: 'dateRange' },
      { header: 'User Name', key: 'userName' },
      { header: 'Total Sales', key: 'totalSales' },
      { header: 'Total Discount', key: 'totalDiscount' },
      { header: 'Net Sales', key: 'netSales' },
   
    ];

    salesReport.forEach(report => {
      report.orders.forEach(order => {
        const totalAmount = order.totalAmount || 0;
        const totalDiscount = order.totalDiscount || 0;
        const netSales = totalAmount - totalDiscount;  

        const formattedStartDate = new Date(start).toISOString().split('T')[0]; 
        const formattedEndDate = new Date(end).toISOString().split('T')[0];
        const dateRange = `${formattedStartDate} to ${formattedEndDate}`;

        worksheet.addRow({
          year: report._id.year,
          dateRange: dateRange,
          userName: order.userName || 'N/A',
          totalSales: `MRP: ${totalAmount}`,  
          totalDiscount: totalDiscount || 0,  
          netSales: netSales || 0,  
          
        });
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




//logout

const logout= async (req,res)=>{
  req.session.destroy(err=>{
    if(err){
      console.error("Error destroying session during logout:", err);
            return res.status(500).json({ error: 'Failed to log out' });
    }
    res.redirect('/admin/login');
  })

}






module.exports = {
  loadlogin,
  login,
  loadUserMangment,
  blockUser,
  unblockUser,
  searchUser,
  salesReport,
  generatePDFReport,
  generateExcelReport,
  logout

};
