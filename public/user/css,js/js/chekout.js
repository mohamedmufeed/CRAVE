


document.getElementById("checkoutForm").addEventListener("submit", function (e) {
    e.preventDefault()


    var selectedMethod = document.getElementById("paymentMethod").value

    if (selectedMethod === "Razorpay") {
        const amount = document.getElementById("amount").value;
        console.log('amount', amount)
        const customerName = document.getElementById("lastName").value;
        const customerEmail = document.getElementById("email").value;
        const customerContact = document.getElementById("mobile").value;

        fetch("/razorpay", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount: amount })
        })
            .then(response => response.json())
            .then(data => {
                const orderId = data.neworderId;
                console.log("order id from checkout.js", orderId);
                var options = {
                    key: 'rzp_test_lHnkQ9Xt6QGUnv',
                    amount: data.amount,
                    currency: 'INR',
                    order_id: data.order_id,
                    name: "CRAVE",
                    description: 'Payment for products',
                    handler: function (response) {
                        if (response.razorpay_payment_id && response.razorpay_order_id && response.razorpay_signature) {
                            fetch("/payment-sucsess", {
                                method: "POST",
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_signature: response.razorpay_signature,
                                    orderId: orderId
                                })
                            })
                                .then(res => res.json())
                                .then(data => {
                                    if (data.success) {
                                        window.location.href = '/thankyou';
                                    } else {
                                        showToast('Payment verification failed');
                                        window.location.href = '/profile/orders';
                                    }
                                })
                                .catch(error => console.error('Error verifying payment:', error));

                        }
                    },
                    prefill: {
                        name: customerName,
                        email: customerEmail,
                        contact: customerContact
                    },
                    theme: {
                        color: '#F37254'
                    },
                    modal:{
                        ondismiss: function () {
                            window.location.href = '/profile/orders';
                        }
    
                    }
                   
                }
                var rzp = new Razorpay(options)
                rzp.on('payment.failed', function (response) {
                    console.log("Payment failed:", response.error);
                    window.location.href = '/profile/orders';
                });
                rzp.open();

            })

            .catch(error => console.error('Error creating Razorpay order:', error));

    }
    else {
        this.submit()
    }
})


function selectAddress(element, addressId) {
    const allAddress = document.querySelectorAll(".row .col-md-4")
    document.getElementById("address").value = addressId
    allAddress.forEach(address => {
        address.classList.remove("selected")
    })

    element.classList.add("selected")

    fetch(`/address/default/${addressId}`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
    })
        .then(response => {
            if (response.ok) {
                showToast("Address selected successfully!", true);
                element.classList.add("selected");
            } else {
                showToast("Failed to set default address.", false);
            }
        })
        .catch(error => {
            console.error("Error selecting address:", error);
            showToast("An error occurred. Please try again.", false);
        });


}



async function placeOrder(orderDetails) {
    try {
        const response = await fetch('/placeorder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderDetails),
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message, 'success'); 
        } else {
            showToast(data.message, 'error'); 
        }
    } catch (error) {
        console.error('Error placing order:', error);
        showToast('Internal server error. Please try again.', 'error'); 
    }
}



function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.classList.add('toast', 'align-items-center', 'border-0', 'position-relative');
    toast.classList.add(type === 'success' ? 'text-bg-danger' : 'text-bg-success');
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




document.getElementById("addressForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const addressData = {};

    formData.forEach((value, key) => {
        addressData[key] = value;
    });

    try {
        const response = await fetch("/address/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(addressData),
        });

        const result = await response.json();

        document.querySelectorAll(".error-message").forEach((element) => {
            element.innerText = "";
        });

        if (response.ok) {
         showToast("Address saved successfully!")
         location.reload()
            this.reset(); 
        } else if (result.errors && Array.isArray(result.errors)) {
            result.errors.forEach(({ field, message }) => {
                const errorElement = document.getElementById(`${field}Error`);
                if (errorElement) {
                    errorElement.innerText = message;
                } else {
                    console.error(`No error container found for field: ${field}`);
                }
            });
        } else {
            console.error("Unexpected server response:", result);
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("An error occurred while saving the address. Please try again.");
    }
});



