

document.getElementById("checkoutForm").addEventListener("submit",function(e){
    e.preventDefault()
  
    
    var selectedMethod= document.getElementById("paymentMethod").value
   
    if(selectedMethod==="Razorpay"){
        const amount = document.getElementById("amount").value;
        console.log('amount',amount)
        const customerName = document.getElementById("lastName").value;
        const customerEmail = document.getElementById("email").value;
        const customerContact = document.getElementById("mobile").value;
        console.log(amount,customerContact)
        fetch("/razorpay",{
            method:"POST",
            headers:{
                'Content-Type': 'application/json',
            },
            body:JSON.stringify({amount:amount})
        })
        .then(response => response.json())
        .then(data=>{
            console.log(data)
            var options={
                key:'rzp_test_lHnkQ9Xt6QGUnv',
                amount:data.amount,
                currency:'INR',
                order_id:data.order_id,
                name:"CRAVE",
                description: 'Payment for products',
                handler:function(response){
                    console.log("Payment Sucsessfull" ,response)
                    window.location.href='/thankyou'
                },
                prefill:{
                    name:customerName,
                    email:customerEmail,
                    contact:customerContact
                },
                theme:{
                    color:'#F37254'
                }

            }
            var rzp = new Razorpay(options)
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
            'content-TYPE': 'application/json'
        },
    })
        .then(response => {
            if (response.ok) {
                console.log(`Selected Address ID: ${addressId}`);
            } else {
                console.error('Failed to set default address');
            }
        })

}

document.getElementById("addressForm").addEventListener("submit", function (event) {
    event.preventDefault()
    const fromData = new FormData(this)
    const addressData = {}

    fromData.forEach((value, key) => {
        addressData[key] = value
    })

    fetch("/address/save", {
        method: "POST",
        headers: {
            'content-TYPE': 'application/json'
        },
        body: JSON.stringify(addressData)
    })
        .then(response => {
            if (response.ok) {
                alert("Address saved successfully!");
                this.reset(); // Clear the form
            } else {
                alert("Failed to save address. Please try again.");
            }
        })

})


