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
