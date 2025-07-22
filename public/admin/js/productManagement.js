function openProductModal() {
  document.getElementById("addProductModal").style.display = "block";
}

function closeProductModal() {
  document.getElementById("addProductModal").style.display = "none";
}

function closeCropperModal() {
  document.getElementById('imageCropperModal').style.display = 'none';
}

let cropper;
let croppedImages = [];
let currentImageIndex = 0;
let currentImageElement = null;

document.getElementById('productImage').addEventListener('change', function (event) {
  const files = event.target.files;
  const previewContainer = document.getElementById('image-preview-container');
  previewContainer.innerHTML = '';
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();

    reader.onload = function (e) {
      const imageContainer = document.createElement('div');
      imageContainer.style.display = 'flex';
      imageContainer.style.flexDirection = 'column';

      const image = new Image();
      image.src = e.target.result;
      image.style.maxWidth = '200px';
      image.style.margin = '10px';

      const changeImageBtn = document.createElement("button");
      changeImageBtn.textContent = "Change Image";
      changeImageBtn.classList.add("btn", "btn-warning", "w-50", "btn-sm", "m-2");
      changeImageBtn.addEventListener("click", function () {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.click();

        fileInput.onchange = function (e) {
          const newFile = e.target.files[0];
          if (newFile && newFile.type.startsWith('image/')) {
            const newReader = new FileReader();
            newReader.onload = function (event) {
              image.src = event.target.result;
            };
            newReader.readAsDataURL(newFile);
          } else {
            alert("Invalid image file");
          }
        };
      });

      const deleteImageBtn = document.createElement("button");
      deleteImageBtn.textContent = "Delete Image";
      deleteImageBtn.classList.add("btn", "btn-danger", "w-50", "btn-sm", "m-2");
      deleteImageBtn.addEventListener("click", function () {
        previewContainer.removeChild(imageContainer);
      });

      imageContainer.appendChild(image);
      imageContainer.appendChild(changeImageBtn);
      imageContainer.appendChild(deleteImageBtn);

      previewContainer.appendChild(imageContainer);

      image.addEventListener('click', function () {
        const cropperModal = document.getElementById('imageCropperModal');
        const cropperImage = document.getElementById('cropperImage');
        cropperImage.src = e.target.result;
        cropperModal.style.display = 'block';
        currentImageIndex = i;
        currentImageElement = image;
        if (cropper) {
          cropper.destroy();
        }

        cropper = new Cropper(cropperImage, {
          aspectRatio: 1 / 1,
          viewMode: 1
        });
      });
    };

    reader.readAsDataURL(file);
  }
});

document.getElementById('cropButton').addEventListener('click', function () {
  if (cropper) {
    const croppedCanvas = cropper.getCroppedCanvas();
    if (croppedCanvas) {
      const croppedImageURL = croppedCanvas.toDataURL('image/jpeg');
      croppedImages[currentImageIndex] = croppedImageURL;

      const croppedImage = new Image();
      croppedImage.src = croppedImageURL;
      croppedImage.style.maxWidth = '200px';
      croppedImage.style.margin = '10px';

      if (currentImageElement) {
        currentImageElement.src = croppedImageURL;
      }

      document.getElementById('imageCropperModal').style.display = 'none';
      cropper.destroy();
      cropper = null;
    }
  }
});


document.getElementById('addProductForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const submitBtn = document.getElementById('addSubmitBtn');
  const loadingIndicator = document.getElementById('addLoading');


  submitBtn.disabled = true;
  loadingIndicator.style.display = 'block';
  const formData = new FormData(this);

  
  if (croppedImages.length > 0) {
    croppedImages.forEach((image, index) => {
      fetch(image)
        .then(res => res.blob())
        .then(blob => {
          formData.append('images', blob, `cropped-image-${index}.jpg`);
        });
    });
  }

  try {
    const response = await fetch('/admin/product/add', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      closeProductModal();
      window.location.href = '/admin/productManagement';
    } else {
      const data = await response.json();
      alert(`Failed to add product: ${data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while adding the product.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Product';
    loadingIndicator.style.display = 'none';
  }
});

// Edit Product Modal Functions
function openEditProductModal(id, name, description, price, material, stock, categoryId, images) {
  document.getElementById('editProductName').value = name;
  document.getElementById('editProductDescription').value = description;
  document.getElementById('editProductPrice').value = price;
  document.getElementById('editProductMaterial').value = material;
  document.getElementById('editProductStock').value = stock;
  // document.getElementById('editProductCategory').value = category;
  document.getElementById('productId').value = id;
    const categorySelect = document.getElementById("editProductCategory");
  if (categorySelect) {
    categorySelect.value = categoryId;
  }
  const existingImagesContainer = document.getElementById('existing-images');
  existingImagesContainer.innerHTML = '';

  const updatedImagesInput = document.getElementById('updatedImages');
  updatedImagesInput.value = JSON.stringify(images);

  images.forEach((image, index) => {
    const imgWrapper = document.createElement('div');
    imgWrapper.style.margin = '5px';
    imgWrapper.style.position = 'relative';

    const imgElement = document.createElement('img');
    imgElement.src = image;
    imgElement.alt = `Product Image ${index + 1}`;
    imgElement.style.width = '100px';
    imgElement.style.height = '100px';
    imgElement.style.objectFit = 'cover';

    const changeBtn = document.createElement('button');
    changeBtn.type = 'button';
    changeBtn.textContent = 'Change Image';
    changeBtn.style.marginTop = '5px';
    changeBtn.style.display = 'block';
    changeBtn.style.cursor = 'pointer';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.name = 'images';
    fileInput.style.display = 'none';
    fileInput.accept = 'image/*';
    fileInput.dataset.index = index;

    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          imgElement.src = e.target.result;
          const updatedImages = JSON.parse(updatedImagesInput.value || '[]');
          updatedImages[index] = null;
          updatedImagesInput.value = JSON.stringify(updatedImages);
        };
        reader.readAsDataURL(file);
      }
    });

    changeBtn.addEventListener('click', () => fileInput.click());

    imgWrapper.appendChild(imgElement);
    imgWrapper.appendChild(changeBtn);
    imgWrapper.appendChild(fileInput);
    existingImagesContainer.appendChild(imgWrapper);
  });

  document.getElementById('editProductModal').style.display = 'block';
}

function closeEditProductModal() {
  const modal = document.getElementById('editProductModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function submitEditProductForm(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('editSubmitBtn');
  const loadingIndicator = document.getElementById('editLoading');


  submitBtn.disabled = true;
//  submitBtn.textContent = 'Updating...';
  loadingIndicator.style.display = 'block';

  const formData = new FormData();
  formData.append('name', document.getElementById('editProductName').value);
  formData.append('description', document.getElementById('editProductDescription').value);
  formData.append('price', document.getElementById('editProductPrice').value);
  formData.append('material', document.getElementById('editProductMaterial').value);
  formData.append('stock', document.getElementById('editProductStock').value);
  formData.append('category', document.getElementById('editProductCategory').value);

  const updatedImages = JSON.parse(document.getElementById('updatedImages').value || '[]');
  const existingImages = updatedImages.filter(img => img !== null);
  formData.append('updatedImages', JSON.stringify(existingImages));

  const existingImagesContainer = document.getElementById('existing-images');
  let newImagesCount = 0;
  if (existingImagesContainer) {
    const fileInputs = existingImagesContainer.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input) => {
      if (input.files[0]) {
        formData.append('images', input.files[0]);
        newImagesCount++;
      }
    });
  }

  if (existingImages.length === 0 && newImagesCount === 0) {
    alert('At least one image is required.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Update Product';
    loadingIndicator.style.display = 'none';
    return;
  }

 

  const id = document.getElementById('productId').value;
  fetch(`/admin/product/edit/${id}`, {
    method: 'POST',
    body: formData,
  })
    .then((response) => {
      if (response.ok) {
        closeEditProductModal();
        window.location.href = '/admin/productManagement';
      } else {
        return response.json().then((data) => {
          alert(`Failed to update product: ${data.message || 'Unknown error'}`);
        });
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('An error occurred while updating the product.');
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Update Product';
      loadingIndicator.style.display = 'none';
    });
}

const editForm = document.getElementById('editProductForm');
if (editForm) {
  editForm.addEventListener('submit', submitEditProductForm);
} else {
  console.error('Edit product form not found in the DOM.');
}


// serach 

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}


document.addEventListener('DOMContentLoaded', function () {
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const loadingIndicator = document.getElementById('searchLoading');
  const productTableBody = document.querySelector('.product-table tbody');
  const paginationContainer = document.querySelector('.pagination.custom-pagination');

  if (!searchForm || !searchInput || !loadingIndicator || !productTableBody || !paginationContainer) {
    console.error('Search form, input, loading indicator, table body, or pagination not found.');
    alert('Page elements are missing. Please refresh the page.');
    return;
  }


  const debouncedSearch = debounce(async function (query, page = 1) {
    loadingIndicator.style.display = 'block';

    try {
      const response = await fetch(`/admin/productManagement/search?search=${encodeURIComponent(query)}&page=${page}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response, possibly an error page');
      }

      const data = await response.json();

      if (response.ok) {
        updateProductTable(data.products || []);
        updatePagination(data.pagination || {});
      } else {
        alert(`Search failed: ${data.message || 'Unknown error'}`);
        updateProductTable([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert(`An error occurred while searching: ${error.message}`);
      updateProductTable([]);
    } finally {
      loadingIndicator.style.display = 'none';
    }
  }, 500);

  searchInput.addEventListener('input', function () {
    debouncedSearch(this.value);
  });

  paginationContainer.addEventListener('click', function (e) {
    e.preventDefault();
    const target = e.target.closest('a.page-link');
    if (target) {
      const page = target.getAttribute('href').split('page=')[1];
      debouncedSearch(searchInput.value, page);
    }
  });

  searchForm.addEventListener('submit', function (e) {
    e.preventDefault();
  });
});

function updateProductTable(products) {
  const tbody = document.querySelector('.product-table tbody');
  tbody.innerHTML = '';

  if (!products || products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="no-results">No products found.</td>
      </tr>
    `;
    return;
  }

  products.forEach(product => {
    const row = document.createElement('tr');
    const images = Array.isArray(product.images) ? product.images : [];
    const imageSrc = images.length > 0 ? images[0] : '/images/placeholder.jpg';
    const categoryName = product.category && product.category.name ? product.category.name : 'N/A';
    const escapedName = (product.name || '').replace(/'/g, "\\'");
    const escapedDescription = (product.description || '').replace(/'/g, "\\'");
    const escapedMaterial = (product.material || '').replace(/'/g, "\\'");
    const escapedImages = images.map(img => `'${img.replace(/'/g, "\\'")}'`).join(',');
    row.innerHTML = `
      <td><img src="${imageSrc}" alt="Product Image" width="50" height="50"></td>
      <td>${product.name || 'N/A'}</td>
      <td>${categoryName}</td>
      <td>${product.stock || 0}</td>
      <td>${product.price || 0}</td>
      <td class="action-buttons">
        <button class="btn" onclick="openEditProductModal('${product._id}', '${escapedName}', '${escapedDescription}', '${product.price || ''}', '${escapedMaterial}', '${product.stock || ''}', '${categoryName}', [${escapedImages}])">Edit</button>
        ${product.isListed
          ? `<form action="/admin/productManagement/unlist/${product._id}?_method=PATCH" method="POST">
               <button type="submit" class="btn unblock-btn">Unlist</button>
             </form>`
          : `<form action="/admin/productManagement/list/${product._id}?_method=PATCH" method="POST">
               <button type="submit" class="btn block-btn">List</button>
             </form>`}
      </td>
    `;
    tbody.appendChild(row);
  });
}



// update pagination
function updatePagination(pagination) {
  const paginationContainer = document.querySelector('.pagination.custom-pagination');
  paginationContainer.innerHTML = '';

  if (!pagination || !pagination.totalPages) {
    paginationContainer.innerHTML = `
      <li class="page-item disabled">
        <a class="page-link" href="#" aria-label="Previous">
          <span aria-hidden="true">«</span>
        </a>
      </li>
      <li class="page-item active">
        <a class="page-link" href="?page=1">1</a>
      </li>
      <li class="page-item disabled">
        <a class="page-link" href="#" aria-label="Next">
          <span aria-hidden="true">»</span>
        </a>
      </li>
    `;
    return;
  }

  const { currentPage, totalPages, previousPage, nextPage } = pagination;

  if (previousPage) {
    paginationContainer.innerHTML += `
      <li class="page-item">
        <a class="page-link" href="?page=${previousPage}" aria-label="Previous">
          <span aria-hidden="true">«</span>
        </a>
      </li>
    `;
  } else {
    paginationContainer.innerHTML += `
      <li class="page-item disabled">
        <a class="page-link" href="#" aria-label="Previous">
          <span aria-hidden="true">«</span>
        </a>
      </li>
    `;
  }

  for (let i = 1; i <= totalPages; i++) {
    paginationContainer.innerHTML += `
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="?page=${i}">${i}</a>
      </li>
    `;
  }

  if (nextPage) {
    paginationContainer.innerHTML += `
      <li class="page-item">
        <a class="page-link" href="?page=${nextPage}" aria-label="Next">
          <span aria-hidden="true">»</span>
        </a>
      </li>
    `;
  } else {
    paginationContainer.innerHTML += `
      <li class="page-item disabled">
        <a class="page-link" href="#" aria-label="Next">
          <span aria-hidden="true">»</span>
        </a>
      </li>
    `;
  }
}