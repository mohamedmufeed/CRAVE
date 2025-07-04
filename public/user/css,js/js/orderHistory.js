let orderId = null;
let productId = null;
document
  .getElementById("retryPaymentBtn")
  .addEventListener("click", function (e) {
    e.preventDefault();

    const orderId = e.target.getAttribute("data-order-id");
    fetch(`/razorpay/retry/${orderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId: orderId }),
    })
      .then((response) => response.json())
      .then((data) => {
        const orderId = data.orderId;

        if (data.success) {
          var options = {
            key: "rzp_test_lHnkQ9Xt6QGUnv",
            amount: data.amount,
            currency: "INR",
            order_id: data.order_id,
            name: "CRAVE",
            description: "Retrying payment for order",
            handler: function (response) {
              if (orderId) {
                console.log("hello nana  ivande indn");
                fetch("/payment-sucsess", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                    orderId: orderId,
                  }),
                })
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.success) {
                      window.location.href = "/thankyou";
                    } else {
                      alert("Payment verification failed");
                      window.location.href = "/profile/orders";
                    }
                  })
                  .catch((error) =>
                    console.error("Error verifying payment:", error)
                  );
              }
            },
            prefill: {
              name: data.customerName,
              email: data.customerEmail,
              contact: data.customerContact,
            },
            theme: { color: "#F37254" },
            ondismiss: function () {
              window.location.href = "/profile/orders";
            },
          };

          var rzp = new Razorpay(options);
          rzp.open();
        } else {
          alert("Failed to create a new Razorpay order for retry.");
        }
      })
      .catch((error) => {
        console.error("Error creating Razorpay order:", error);
        alert("There was an error retrying the payment.");
      });
  });

function Reason(order_id, product_Id) {
  orderId = order_id;
  productId = product_Id;
}

async function submitCancelReason() {
  const reason = document.getElementById("cancelReasonText").value;
  const errortag = document.getElementById("cancel-error-tag");
  errortag.style.display = "none";
  errortag.innerText = "";
  if (!reason.trim()) {
    errortag.innerText = "Please enter a valid reason";
    errortag.style.display = "block";
    return;
  }

  try {
    const response = await fetch(
      `/profile/orders/cancelorder/${orderId}/${productId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      }
    );
    const result = await response.json();
    if (response.ok) {
      const cancelModal = bootstrap.Modal.getInstance(
        document.getElementById("cancelModal")
      );
      if (cancelModal) {
        cancelModal.hide();
      }
      window.location.reload();
    } else {
      errortag.innerText =
        result?.message || "Failed to cancel the order. Please try again.";
      errortag.style.display = "block";
    }
  } catch (error) {
    console.error("Error submitting cancel reason:", error);
    errortag.innerText = "Something went wrong. Please try again later.";
    errortag.style.display = "block";
  }
}

async function submitReturnReason() {
  const reason = document.getElementById("returnReasonText").value;
    const errortag = document.getElementById("return-error-tag");
  errortag.style.display = "none";
  errortag.innerText = "";
  if (!reason.trim()) {
  errortag.innerText = "Please enter a valid reason";
    errortag.style.display = "block";
    return;
  }
  try {
    const response = await fetch(
      `/profile/orders/returnorder/${orderId}/${productId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      }
    );
    const result = await response.json();
    console.log("Error on in the resul of returen n")
    if (result.success) {
      const cancelModal = bootstrap.Modal.getInstance(
        document.getElementById("returnModal")
      );
      if (cancelModal) {
        cancelModal.hide();
      }
      window.location.reload();
    } else {
       errortag.innerText =
        result?.message || "Failed to return the order. Please try again.";
      errortag.style.display = "block";
    }
  } catch (error) {
   console.error("Error submitting return reason:", error);
    errortag.innerText = "Something went wrong. Please try again later.";
    errortag.style.display = "block";
  }
}
