function removeWishlist(productId){
    fetch(`/profile/wishlist/remove/${productId}`,{
        method:"DELETE",
        headers:{
            'Content-Type': 'application/json'
        }
    })
    .then(response=>response.json())
    .then(data=>{
        if(data.success&& data.message=="Product Removed from wishList"){
            showToast( "Product Removed from wishList", "danger");
    window.location.href="/profile/wishlist"
        }
    })
      .catch(error => console.error('Error:', error));
    }
    
    
    async function addToCart(productId) {
        console.log("vanuu", productId)
      try {
        const response = await fetch("/addtocart", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ productId, quantity: 1 })
        });
    
        if (response.ok) {
          const result = await response.json();
          console.log("Product added successfully:", result);
           showToast("Product added to cart successfully!", "success");
        } else {
          const error = await response.json();
          console.error("Failed to add product:", error);
        showToast(error.error || "Failed to add product to cart.", "danger");
        }
      } catch (error) {
        console.error("Error adding product to cart:", error);
       showToast("An error occurred. Please try again.", "danger");
      }
    }
    
    
    
    function showToast(message, type = "success") {
      const toastId = `toast-${Date.now()}`;
      const toastHTML = `
        <div class="toast align-items-center text-bg-${type} border-0" role="alert" id="${toastId}" aria-live="assertive" aria-atomic="true">
          <div class="d-flex">
            <div class="toast-body">
              ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
        </div>
      `;
    
      document.getElementById('toastContainer').insertAdjacentHTML('beforeend', toastHTML);
      const toastElement = new bootstrap.Toast(document.getElementById(toastId), { delay: 3000 });
      toastElement.show();
    
      document.getElementById(toastId).addEventListener('hidden.bs.toast', () => {
        document.getElementById(toastId).remove();
      });
    }
    