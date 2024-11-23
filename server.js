const express = require("express");
const app = express();
const adminrouter = require("./Routes/adminrouter");
const userRouter = require("./Routes/userrouter")
const path = require("path");
const passport = require("./config/passport")
const session = require("express-session");
const connectdb = require('./db/connectdb');
const nocache = require("nocache")
const methodOverride = require('method-override');
const multer = require('multer');
const { upload } = require("./Controller/ imageController");
const hbs = require('hbs');
const exphbs = require('express-handlebars'); 



app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'your-secret-key', 
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isAuthenticated || false;
  res.locals.user = req.session.user || {}
  next()
})

app.use(passport.initialize());
app.use(passport.session())
app.use(nocache());


//Helper


hbs.registerHelper('isEqual', (a, b) => {
  return a === b;
});
hbs.registerHelper('range', (start, end) => {
  let result = [];
  for (let i = start; i <= end; i++) {
    result.push(i);
  }
  return result;
});

hbs.registerHelper('ifCond', function (v1, v2, options) {
  if (v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

hbs.registerHelper('multiply', function (quantity, price) {
  return quantity * price;
});
hbs.registerHelper('formatDate', function (dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
});
hbs.registerHelper('eq', function (a, b) {
  return a === b;
});

hbs.registerHelper('isAllProductsApplicable', function (products, applicableProducts) {
  return products.length === applicableProducts.length;
});

hbs.registerHelper('isAllCategoryApplicable', function (categories, applicableCategories) {
  return categories.length === applicableCategories.length;
});

hbs.registerHelper("json", function(context) {
  return JSON.stringify(context);
});

hbs.registerHelper('netSales', function (totalSalesRevenue, totalDiscount) {
  return totalSalesRevenue - totalDiscount;
});
hbs.registerHelper('formatCurrency', function (value) {
  if (typeof value === 'number') {
    return value.toFixed(2); 
  }})


  hbs.registerHelper('ifCond', function (v1, v2, options) {
    if (v1 === v2) {
      return options.fn(this); 
    }
    return options.inverse(this); 
  });
  
hbs.registerHelper('ifRazorpayFailed', function(paymentMethod, paymentStatus, options) {
  if (paymentMethod === 'Razorpay' && paymentStatus === 'Failed') {
    return options.fn(this); 
  } else {
    return options.inverse(this);  
  }
});
hbs.registerHelper('json', function(context) {
  return JSON.stringify(context);
});

hbs.registerHelper('greaterThanOrEqual', function (value1, value2) {
  return  value1>=value2
});

hbs.registerHelper("or", function(value1,value2){
  return value1||value2
})

//Helper ends

//static seting
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'hbs');
app.set("views", path.join(__dirname, "views"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

//route settting
app.use("/admin", adminrouter);
app.use("/", userRouter)

connectdb();
app.listen(3000, () => {
  console.log("server is working on 3000");
});
