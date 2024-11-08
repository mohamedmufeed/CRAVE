function updateCartQuantity(action, productId) {
    const quantityInput = document.getElementById(`quantity-${productId}`);
    let quantity = parseInt(quantityInput.value);
    console.log(`Action: ${action}, Product ID: ${productId}, Current Quantity: ${quantity}`);
   
    if (action === "increase") {
        quantity +=0;
    } else if (action === "decrease" && quantity > 1) {
        quantity -= 0 ;
    }

    quantityInput.value = quantity;

    fetch("/cart/update", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            productId: productId,
            quantity: quantity
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
               
                console.log("cart data", data)
                document.getElementById(`product-total-${productId}`).innerText = `₹${data.newTotal}`;
                document.getElementById('cart-total').innerText = `₹${data.cartTotal}`;
            }
        })
        .catch(error => {
            console.error('Error updating cart:', error);
        });


}

document.querySelector('form').addEventListener('submit', function (event) {
    event.preventDefault();
});



document.addEventListener('DOMContentLoaded', function () {
function applyCoupon() {
let couponCode = document.getElementById('coupon').value.trim();
let cartTotal = parseFloat(document.getElementById("cart-total").textContent.replace('₹', '').trim());

fetch("/applyCoupon", {
  method: "POST",
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ couponCode, cartTotal })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    const discountAmount = data.discountAmount;
    const newTotal = data.newTotal;

    const discountValueElement = document.getElementById('discount-value');
    const newTotalElement = document.getElementById('new-total');
    

    const discountRow = document.getElementById('discount-row');
    const newTotalRow = document.getElementById('new-total-row');

   
    const successMessageElement = document.getElementById('coupon-success-message');

    if (discountValueElement && newTotalElement) {
  
      discountValueElement.textContent = `₹${discountAmount.toFixed(2)}`;
      newTotalElement.textContent = `₹${newTotal.toFixed(2)}`;


      discountRow.removeAttribute('hidden');
      newTotalRow.removeAttribute('hidden');

      
      successMessageElement.removeAttribute('hidden');
    } else {
      console.error("Elements for discount or new total not found.");
    }
  } else {
    alert(data.message || "An error occurred while applying the coupon");
  }
})
.catch(error => {
  console.error("Error applying coupon:", error);
  alert("There was an error applying the coupon");
});
}

const applyCouponButton = document.getElementById('apply-coupon-button');
if (applyCouponButton) {
applyCouponButton.addEventListener('click', applyCoupon);
} else {
console.error("Apply Coupon button not found");
}
});

  function removeCoupon(){
    const originalTotal= parseFloat(document.getElementById("cart-total").textContent.replace("₹"," ").trim()) 

    fetch("/removeCoupon",{
        method:"POST",
        headers:{
            'Content-Type': 'application/json',
        },
        body:JSON.stringify({originalTotal})
    })
    .then(response => response.json())
    .then(data=>{
        if(data.success){
            document.getElementById("discount-value").textContent=" "
            document.getElementById("new-total").textContent=`₹${originalTotal.toFixed(2)}`
        }else{
            console.error("Error in removing coupom",data.message)
        }
    })
    .catch(error => {
        console.error("Error removing coupon:", error);
        alert("There was an error removing the coupon");
      });
      
    
  }
  document.getElementById("remove-coupon-button").addEventListener("click",removeCoupon)