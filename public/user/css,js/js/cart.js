function updateCartQuantity(action, productId) {
    const quantityInput = document.getElementById(`quantity-${productId}`);
    let quantity = parseInt(quantityInput.value);
    console.log(`Action: ${action}, Product ID: ${productId}, Current Quantity: ${quantity}`);


    if (isNaN(quantity) || quantity < 1) {
      quantity = 1;
  }

    if (action === 'decrease') {
      quantity = quantity > 1 ? quantity -- : 1; // Ensure quantity doesn't go below 1
  } else if (action === 'increase') {
      quantity =  quantity <=10 ? quantity ++ :10;
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
      showToast(`Coupon applied successfully! Discount: ₹${discountAmount.toFixed(2)}`, 'success');
    } else {
      showToast(data.message || "An error occurred while applying the coupon.", 'error');
    }
  } else {
    showToast(data.message || "An error occurred while applying the coupon.", 'error');
  }
})
.catch(error => {
  console.error("Error applying coupon:", error);
  showToast("There was an error applying the coupon.", 'error');
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
      console.error("Error applying coupon:", error);
      showToast("There was an error removing the coupon.", 'error');
      });
      
    
  }
  document.getElementById("remove-coupon-button").addEventListener("click",removeCoupon)


function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toast-container');

  const toast = document.createElement('div');
  
  toast.classList.add('toast', 'align-items-center', 'border-0', 'position-relative');
  toast.classList.add(type === 'success' ? 'text-bg-success' : 'text-bg-danger');
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  toastContainer.appendChild(toast);

  const bootstrapToast = new bootstrap.Toast(toast);

  bootstrapToast.show();

  setTimeout(() => {
    bootstrapToast.hide();
    setTimeout(() => {
      toastContainer.removeChild(toast);
    }, 500); 
  }, 5000); 
}


 document.getElementById("apply-coupon-button").addEventListener("click",function(){
  this.style.display="none"
  document.getElementById("remove-coupon-button").style.display="block"


  document.getElementById("remove-coupon-button").addEventListener("click",function(){
    this.style.display="none"
    document.getElementById("apply-coupon-button").style.display="block"
  })
 })