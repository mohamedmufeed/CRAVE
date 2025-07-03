const hbs = require('hbs');

module.exports = () => {
  hbs.registerHelper('isEqual', (a, b) => a === b);

  hbs.registerHelper('range', (start, end) => {
    let result = [];
    for (let i = start; i <= end; i++) result.push(i);
    return result;
  });

  hbs.registerHelper('ifCond', function (v1, v2, options) {
    return v1 === v2 ? options.fn(this) : options.inverse(this);
  });

  hbs.registerHelper('multiply', (quantity, price) => quantity * price);

  hbs.registerHelper('formatDate', function (dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  });

  hbs.registerHelper('eq', (a, b) => a === b);
  hbs.registerHelper('gt', (a, b) => a > b);
  hbs.registerHelper('lt', (a, b) => a < b);
  hbs.registerHelper('add', (a, b) => a + b);
  hbs.registerHelper('subtract', (a, b) => a - b);

  hbs.registerHelper('greaterThanOrEqual', (v1, v2) => v1 >= v2);
  hbs.registerHelper('or', (a, b) => a || b);
  hbs.registerHelper('and', (a, b) => a && b);
  hbs.registerHelper('not', (a, b) => a !== b);

  hbs.registerHelper('shortId', id => id.toString().slice(-6));

  hbs.registerHelper('json', context => JSON.stringify(context));

  hbs.registerHelper('coupon', (context) => {
    if (context && context.code) {
      return `Applied Coupon: ${context.code} (${context.discountAmount ? `₹${context.discountAmount}` : 'No Discount'})`;
    }
    return 'No coupon applied.';
  });

  hbs.registerHelper('isAllProductsApplicable', (products, applicableProducts) => {
    return products.length === applicableProducts.length;
  });

  hbs.registerHelper('isAllCategoryApplicable', (categories, applicableCategories) => {
    return categories.length === applicableCategories.length;
  });

  hbs.registerHelper('netSales', (totalSalesRevenue, totalDiscount) => {
    return totalSalesRevenue - totalDiscount;
  });

  hbs.registerHelper('formatCurrency', value => {
    if (typeof value === 'number') return value.toFixed(2);
  });
  
  hbs.registerHelper('ifRazorpayFailed', (paymentMethod, paymentStatus, options) => {
    if (paymentMethod === 'Razorpay' && paymentStatus === 'Failed') {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  hbs.registerHelper('getOid', function(obj) {
  return obj.$oid;
});


};
