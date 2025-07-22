function updateCartQuantity(action, productId) {
  const quantityInput = document.getElementById(`quantity-${productId}`);
  let quantity = parseInt(quantityInput.value);

  if (isNaN(quantity) || quantity < 1) {
    quantity = 1;
  }

  if (action === "decrease") {
    quantity = quantity > 1 ? quantity - 1 : 1;
  } else if (action === "increase") {
    quantity = quantity < 10 ? quantity + 1 : 10;
  }

  fetch("/cart/update", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productId, quantity }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        quantityInput.value = data.data.quantity;
        const productTotalElement = document.getElementById(
          `product-total-${productId}`
        );
        if (productTotalElement) {
          productTotalElement.innerText = `₹${data.data.productTotal}`;
        }
        const cartTotalElement = document.getElementById("cart-total");
        if (cartTotalElement) {
          cartTotalElement.innerText = `₹${data.data.cartTotal}`;
        }

        const increaseBtn = quantityInput
          .closest(".quantity-container")
          .querySelector(".increase");
        if (increaseBtn) {
          if (data.data.quantity >= data.data.stock) {
            increaseBtn.disabled = true;
          } else {
            increaseBtn.disabled = false;
          }
        }
      } else {
        showToast(data.error || "Failed to update cart", "error");
      }
    })
    .catch((error) => {
      console.error("Error updating cart:", error);
      showToast("Something went wrong","error");
    });
}

document.querySelector("form").addEventListener("submit", function (event) {
  event.preventDefault();
});

document.addEventListener("DOMContentLoaded", function () {
  function applyCoupon() {
    let couponCode = document.getElementById("coupon").value.trim();
    let cartTotal = parseFloat(
      document.getElementById("cart-total").textContent.replace("₹", "").trim()
    );

    fetch("/applyCoupon", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ couponCode, cartTotal }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const discountAmount = data.discountAmount;
          const newTotal = data.newTotal;
          console.log("the new total from cart js ", newTotal);

          // fetch("/copondiscount", {
          //   method: "POST",
          //   headers: {
          //     'Content-Type': 'application/json',
          //   },
          //   body: JSON.stringify({ newTotal })
          // })
          //   .then(response => response.json())
          //   .then(result => {
          //     console.log("Response from /copondiscount:", result);
          //   })
          //   .catch(error => {
          //     console.error("Error in /copondiscount fetch:", error);
          //   });

          const discountValueElement =
            document.getElementById("discount-value");
          const newTotalElement = document.getElementById("new-total");

          const discountRow = document.getElementById("discount-row");
          const newTotalRow = document.getElementById("new-total-row");

          const successMessageElement = document.getElementById(
            "coupon-success-message"
          );

          if (discountValueElement && newTotalElement) {
            discountValueElement.textContent = `₹${discountAmount.toFixed(2)}`;
            newTotalElement.textContent = `₹${newTotal.toFixed(2)}`;

            discountRow.removeAttribute("hidden");
            newTotalRow.removeAttribute("hidden");

            successMessageElement.removeAttribute("hidden");
            showToast(
              `Coupon applied successfully! Discount: ₹${discountAmount.toFixed(
                2
              )}`,
              "success"
            );
          } else {
            showToast(
              data.message || "An error occurred while applying the coupon.",
              "error"
            );
          }
        } else {
          showToast(
            data.message || "An error occurred while applying the coupon.",
            "error"
          );
        }
      })
      .catch((error) => {
        console.error("Error applying coupon:", error);
        showToast("There was an error applying the coupon.", "error");
      });
  }

  const applyCouponButton = document.getElementById("apply-coupon-button");
  if (applyCouponButton) {
    applyCouponButton.addEventListener("click", applyCoupon);
  } else {
    console.error("Apply Coupon button not found");
  }
});

function removeCoupon() {
  const originalTotal = parseFloat(
    document.getElementById("cart-total").textContent.replace("₹", " ").trim()
  );

  fetch("/removeCoupon", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ originalTotal }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        document.getElementById("discount-value").textContent = " ";
        document.getElementById(
          "new-total"
        ).textContent = `₹${originalTotal.toFixed(2)}`;
      } else {
        console.error("Error in removing coupom", data.message);
      }
    })
    .catch((error) => {
      console.error("Error applying coupon:", error);
      showToast("There was an error removing the coupon.", "error");
    });
}

document
  .getElementById("remove-coupon-button")
  .addEventListener("click", removeCoupon);

document
  .getElementById("apply-coupon-button")
  .addEventListener("click", function () {
    this.style.display = "none";
    document.getElementById("remove-coupon-button").style.display = "block";

    document
      .getElementById("remove-coupon-button")
      .addEventListener("click", function () {
        this.style.display = "none";
        document.getElementById("apply-coupon-button").style.display = "block";
      });
  });

function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toast-container");

  const toast = document.createElement("div");

  toast.classList.add(
    "toast",
    "align-items-center",
    "border-0",
    "position-relative"
  );
  toast.classList.add(
    type === "success" ? "text-bg-success" : "text-bg-danger"
  );
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");

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

console.log("{{message}}");

document.addEventListener("DOMContentLoaded", function () {
  const toastEl = document.querySelector(".toast");
  const toast = new bootstrap.Toast(toastEl);
  if ("{{message}}") {
    toast.show();
  }
});

let productIdToRemove = null;
function confirmremove(productId) {
  productIdToRemove = productId;
  const toastElement = new bootstrap.Toast(
    document.getElementById("confirmation-toast")
  );
  toastElement.show();
  document.getElementById("confirmation-toast").style.display = "block";

  document
    .getElementById("confirm-remove")
    .addEventListener("click", function () {
      if (productIdToRemove) {
        document.getElementById(`remove-form-${productIdToRemove}`).submit();

        const toastElement = bootstrap.Toast.getInstance(
          document.getElementById("confirmation-toast")
        );
        toastElement.hide();
      }
    });
}
