const Order = require("../Model/orderModel")

const getTopSellingProducts = async () => {
  const topProducts = await Order.aggregate([
    { $unwind: "$products" },
    {
      $group: {
        _id: "$products.productId",
        totalSold: { $sum: "$products.quantity" }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productDetails"
      }
    },
    { $unwind: "$productDetails" },
    {
      $project: {
        productId: "$_id",
        name: "$productDetails.name",
        totalSold: 1
      }
    }
  ])
  return topProducts
}

const getTopSellingCategories = async () => {
  const topCategories = await Order.aggregate([
    { $unwind: "$products" },
    {
      $lookup: {
        from: "products",
        localField: "products.productId",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    { $unwind: "$productDetails" },
    {
      $lookup: {
        from: "categories",
        localField: "productDetails.category",
        foreignField: "_id",
        as: "categoryDetails",
      },
    },
    { $unwind: "$categoryDetails" },
    {
      $group: {
        _id: "$categoryDetails._id",
        categoryName: { $first: "$categoryDetails.name" },
        totalSold: { $sum: "$products.quantity" },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
    {
      $project: {
        categoryName: 1,
        totalSold: 1,
      },
    },
  ]);

  return topCategories;
};

const getMonthlySalesData = async (year) => {
  const monthlySales = await Order.aggregate([
    {
      $match: {
        status: "Delivered",
        createdAt: {
          $gt: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { month: { $month: "$createdAt" } },
        totalSales: { $sum: "$total" }
      }
    },
    {
      $sort: { "_id.month": 1 }
    }
  ])
  const monthlySalesData = Array(12).fill(0).map((_, i) => {
    const monthData = monthlySales.find(data => data._id.month === i + 1);
    return { month: i + 1, totalSales: monthData ? monthData.totalSales : 0 };
  });

  return monthlySalesData;
}





const getYearlySalesData = async () => {
  const yearlySales = await Order.aggregate([
    {
      $match: { status: "Delivered" }
    },
    {
      $group: {
        _id: { year: { $year: "$createdAt" } },
        totalSales: { $sum: "$total" }
      }
    },
    {
      $sort: { "_id.year": 1 }
    }
  ]);

  return yearlySales.map(data => ({
    year: data._id.year,
    totalSales: data.totalSales
  }));
};

const getDailySalesData = async () => {
  const dailySales = await Order.aggregate([
    {
      $match: { status: "Delivered" }
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
          weekday: { $dayOfWeek: "$createdAt" }
        },
        totalSales: { $sum: "$total" }
      }
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
        "_id.day": 1
      }
    }
  ]);

  return dailySales.map(data => ({
    date: `${data._id.year}-${String(data._id.month).padStart(2, "0")}-${String(data._id.day).padStart(2, "0")}`,
    weekday: data._id.weekday,
    totalSales: data.totalSales
  }));
};



const loadDashboard = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const TopSellingProducts = await getTopSellingProducts();
    const TopSellingCategories = await getTopSellingCategories();

    const monthlySalesData = await getMonthlySalesData(year);
    const yearlySalesData = await getYearlySalesData();
    const dailySalesData = await getDailySalesData();




    res.render("admin/dashboard", {
      TopSellingProducts,
      TopSellingCategories,
      yearlySalesData: JSON.stringify(yearlySalesData),
      monthlySalesData: JSON.stringify(monthlySalesData),
      dailySalesData: JSON.stringify(dailySalesData)
    });
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    res.status(500).send("Error loading dashboard data");
  }
};


module.exports = {
  getTopSellingProducts,
  getTopSellingCategories,
  loadDashboard
}