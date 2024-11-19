

const Order=require("../Model/orderModel")
const PDFDocument = require('pdfkit');



const fs = require("fs");


function createInvoice(invoice, res) {
  let doc = new PDFDocument({ size: "A4", margin: 50 });

  generateHeader(doc);
  generateCustomerInformation(doc, invoice);
  generateInvoiceTable(doc, invoice);
  generateFooter(doc);

  doc.pipe(res);
  doc.end();

}

function generateHeader(doc) {
  doc
    // .image("logo.png", 50, 45, { width: 50 })
    .fillColor("#444444")
    .fontSize(20)
    .text("CRAVE.", 110, 57)
    .fontSize(10)
    .text("ACME Inc.", 200, 50, { align: "right" })
    .text("Bangalore, India", 200, 65, { align: "right" })
    .text("Phone: +91 123 456 7890", 200, 80, { align: "right" })
    .moveDown();
}

function generateCustomerInformation(doc, orderData) {
    doc
      .fillColor("#444444")
      .fontSize(20)
      .text("Invoice", 50, 160);
  
    generateHr(doc, 185);
  
    const customerInformationTop = 200;
  
    doc
      .fontSize(10)
      .text("Invoice Number:", 50, customerInformationTop)
      .font("Helvetica-Bold")
      .text(orderData._id.toString(), 150, customerInformationTop) // Using order ID as the invoice number
      .font("Helvetica")
      .text("Invoice Date:", 50, customerInformationTop + 15)
      .text(formatDate(orderData.createdAt), 150, customerInformationTop + 15) // Order creation date
      .text("Balance Due:", 50, customerInformationTop + 30)
      .text(
        formatCurrency(orderData.total - (orderData.discountAmount || 0)),
        150,
        customerInformationTop + 30
      );
  
    if (orderData.address) {
      doc
        .font("Helvetica-Bold")
        .text(orderData.address.firstName || "Customer Name", 300, customerInformationTop)
        .font("Helvetica")
        .text(orderData.address.street || "Customer Address", 300, customerInformationTop + 15)
        .text(
          `${orderData.address.city || "City"}, ${orderData.address.state || "State"}, ${orderData.address.country || "Country"}`,
          300,
          customerInformationTop + 30
        )
        .moveDown();
    } else {
      doc
        .text("Customer address not available", 300, customerInformationTop)
        .moveDown();
    }
  
    generateHr(doc, 252);
  }
  

  function generateInvoiceTable(doc, invoice) {
    const invoiceTableTop = 330;
  
    doc.font("Helvetica-Bold");
    generateTableRow(
      doc,
      invoiceTableTop,
      "Item",
      "Unit Cost",
      "Quantity",
      "Line Total"
    );
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");
  
if (invoice.products && invoice.products.length > 0) {
    for (let i = 0; i < invoice.products.length; i++) {
      const product = invoice.products[i];
      const position = invoiceTableTop + (i + 1) * 30;
  
      const unitPrice = `₹${product.price.toFixed(2)}`;
      const lineTotal = `₹${(product.price * product.quantity).toFixed(2)}`;
  
      generateTableRow(
        doc,
        position,
        product.name,
        unitPrice,     
        product.quantity,
        lineTotal     
      );
  
      generateHr(doc, position + 20);
    }
  } else {
    doc.text("No products available", 50, invoiceTableTop + 30);
  }
  
  
    const subtotalPosition = invoiceTableTop + (invoice.products?.length + 1) * 30;
    generateTableRow(
      doc,
      subtotalPosition,
      "",
      "",
      "Subtotal",
      "",
      (invoice.total) 
    );
  
    const paidToDatePosition = subtotalPosition + 20;
    generateTableRow(
      doc,
      paidToDatePosition,
      "",
      "",
      "Paid To Date",
      "",
      (invoice.paid || 0) 
    );
  
    const duePosition = paidToDatePosition + 25;
    doc.font("Helvetica-Bold");
    generateTableRow(
      doc,
      duePosition,
      "",
      "",
      "Balance Due",
      "",
  (invoice.total - (invoice.paid || 0))
    );
    doc.font("Helvetica");
  }
  

function generateFooter(doc) {
  doc
    .fontSize(10)
    .text(
      "Payment is due within 15 days. Thank you for your business.",
      50,
      780,
      { align: "center", width: 500 }
    );
}

function generateTableRow(
  doc,
  y,
  item,
  description,
  unitCost,
  quantity,
  lineTotal
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(description, 150, y)
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

function generateHr(doc, y) {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

function formatCurrency(cents) {
  return "$" + (cents / 100).toFixed(2);
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return year + "/" + month + "/" + day;
}



 const  invoiceDownload= async(req,res)=>{
    const orderId=req.params.id
    try {
        const orderData = await Order.findById(orderId).populate("")
      
        if(!orderData){
            return res.status(400).send("Order not found")
        }
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=invoice_${orderId}.pdf`);
        createInvoice(orderData,res)
    } catch (error) {
       console.log("error in downloading  invoice",error) 
       res.status(500).send("internal server error")
    }
   
 }
 
module.exports = { invoiceDownload};
