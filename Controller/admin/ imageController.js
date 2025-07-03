const multer = require("multer");
const path = require("path")





const storage = multer.memoryStorage(); 


const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 20 }, 
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Images Only!"));
    }
  },
}).array("images", 3); 



module.exports = { upload };
