const express = require("express");
const app = express();
const adminrouter = require("./Routes/adminrouter");
const userRouter= require("./Routes/userrouter")
const path = require("path");
const passport=require("./config/passport")
const session = require("express-session");
const connectdb = require('./db/connectdb');
const nocache = require("nocache")
const methodOverride = require('method-override');
const multer = require('multer');
const { upload } = require("./Controller/ imageController");
const hbs = require('hbs');


app.use(methodOverride('_method'));




// Register the ifCond helper
hbs.registerHelper('ifCond', function (v1, v2, options) {
  if (v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});




app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session())
app.use(nocache());



app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'hbs');
app.set("views", path.join(__dirname, "views"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")))


app.use("/admin", adminrouter);
app.use("/",userRouter)


connectdb();

app.listen(3000, () => {
  console.log("server is working on 3000");
});
