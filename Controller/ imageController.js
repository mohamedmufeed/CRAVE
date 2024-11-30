const multer = require("multer");
const path = require("path")


// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'uploads');  
//     },
//     filename: (req, file, cb) => {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Unique file name
//     }
//   });
  
//    // Set up multer upload
//   const upload = multer({
//     storage: storage,
//     limits: { fileSize: 1024 * 1024 * 20 },  // 20MB file limit
//     fileFilter: (req, file, cb) => {
//       const filetypes = /jpeg|jpg|png|webp/;
//       const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//       const mimetype = filetypes.test(file.mimetype);
//       if (mimetype && extname) {
//         return cb(null, true);
//       } else {
//         cb(new Error('Images Only!'));
//       }
//     }
//   }).array('images', 3); 

//   module.exports={upload}


// const multer = require("multer");

// Configure memory storage
const storage = multer.memoryStorage(); // Stores files in memory temporarily

// Set up multer upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 20 }, // 20MB file limit
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
}).array("images", 3); // Accept up to 3 image files

module.exports = { upload };
