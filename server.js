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
const exphbs = require('express-handlebars'); 
require('dotenv').config();
const morgan = require('morgan');
const logger = require('./config/logger');
const hbs = require('hbs');
require('./helper/handlebarsHelpers')();

app.use(nocache());
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



app.use(morgan('tiny', {
  stream: {
    write: message => logger.info(message.trim())
  }
}));

//static seting
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'hbs');
app.set("views", path.join(__dirname, "views"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

//route settting
app.use("/admin", adminrouter);
app.use("/", userRouter)
//contect db
connectdb();
app.listen(3000, () => {
  console.log("server is working on 3000");
});
