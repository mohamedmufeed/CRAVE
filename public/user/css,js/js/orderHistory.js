 let orderId = null;
    let productId = null
    document.getElementById("retryPaymentBtn").addEventListener("click", function (e) {
        e.preventDefault();

        const orderId = e.target.getAttribute('data-order-id');
        fetch(`/razorpay/retry/${orderId}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderId: orderId })
        })
            .then(response => response.json())
            .then(data => {
                const orderId = data.orderId
           
                if (data.success) {
                    var options = {
                        key: 'rzp_test_lHnkQ9Xt6QGUnv',
                        amount: data.amount,
                        currency: 'INR',
                        order_id: data.order_id,
                        name: "CRAVE",
                        description: 'Retrying payment for order',
                        handler: function (response) {
                            if (orderId) {
                                console.log("hello nana  ivande indn")
                                fetch("/payment-sucsess", {
                                    method: "POST",
                                    headers: { 'Content-Type': 'application/json' },
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
                                            alert('Payment verification failed');
                                            window.location.href = '/profile/orders';
                                        }
                                    })
                                    .catch(error => console.error('Error verifying payment:', error));
                            }
                        },
                        prefill: {
                            name: data.customerName,
                            email: data.customerEmail,
                            contact: data.customerContact
                        },
                        theme: { color: '#F37254' },
                        ondismiss: function () {
                            window.location.href = '/profile/orders';
                        }
                    };

                    var rzp = new Razorpay(options);
                    rzp.open();
                } else {
                    alert('Failed to create a new Razorpay order for retry.');
                }
            })
            .catch(error => {
                console.error('Error creating Razorpay order:', error);
                alert('There was an error retrying the payment.');
            });
    });


    function Reason(order_id, product_Id) {
        orderId = order_id
        productId = product_Id
    }

    async function submitCancelReason() {

        const reason = document.getElementById("cancelReasonText").value
        if (!reason.trim()) {
            console.log("please enter a reasin korah kaxnibjttt inkline akkanam")
            return
        }
        try {
            const response = await fetch(`/profile/orders/cancelorder/${orderId}/${productId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ reason })
            })
            const result = await response.json()
            if (response.ok) {
                const cancelModal = bootstrap.Modal.getInstance(document.getElementById("cancelModal"));
                if (cancelModal) {
                    cancelModal.hide();
                }
                window.location.reload();
            } else {
                console.log(`errror in cancel order${result.message}`)
            }
        } catch (error) {
            console.error("Error submitting cancel reason:", error);
        }
    }




    async function submitReturnReason() {
        console.log("this is the  order id",orderId)
        console.log("this is the product id",productId)
        const reason = document.getElementById("returnReasonText").value
        if (!reason.trim()) {
            console.log("please enter a reasin korah kaxnibjttt inkline akkanam")
            return
        }
        try {
            const response = await fetch(`/profile/orders/returnorder/${orderId}/${productId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",

                },
                body: JSON.stringify({ reason })
            })
            const result = await response.json()
            console.log(result)
            if (result.success) {
                const cancelModal = bootstrap.Modal.getInstance(document.getElementById("returnModal"));
                if (cancelModal) {
                    cancelModal.hide();
                }
                window.location.reload();
            } else {
                console.log(`errror in return order ${result.message} `)
            }
        }
        catch (error) {
            console.error("Error submitting return reason:", error);
        }
    }