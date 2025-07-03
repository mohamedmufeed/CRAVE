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
  const userTableBody = document.getElementById('userTableBody');

  if (!searchForm || !searchInput || !loadingIndicator || !userTableBody) {
    console.error('Search form, input, loading indicator, or table body not found.');
    return;
  }

  const debouncedSearch = debounce(async function (query) {
    loadingIndicator.style.display = 'block';

    try {
      const response = await fetch(`/admin/userManagement/search?search=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        updateUserTable(data.users);
      } else {
        const data = await response.json();
        alert(`Search failed: ${data.message || 'Unknown error'}`);
        updateUserTable([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('An error occurred while searching.');
      updateUserTable([]);
    } finally {
      loadingIndicator.style.display = 'none';
    }
  }, 500); 


  searchInput.addEventListener('input', function () {
    debouncedSearch(this.value);
  });


  searchForm.addEventListener('submit', function (e) {
    e.preventDefault();
  });
});


function updateUserTable(users) {
  const tbody = document.getElementById('userTableBody');
  tbody.innerHTML = ''; 

  if (!users || users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="no-results">No users found.</td>
      </tr>
    `;
    return;
  }

  users.forEach(user => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.username || 'N/A'}</td>
      <td>${user.email || 'N/A'}</td>
      <td>${user.isBlocked ? 'Blocked' : 'Active'}</td>
      <td class="action-buttons">
        ${user.isBlocked
          ? `<form action="/admin/userManagement/unblock/${user._id}?_method=PATCH" method="POST">
               <button type="submit" class="btn unblock-btn">Unblock</button>
             </form>`
          : `<form action="/admin/userManagement/block/${user._id}?_method=PATCH" method="POST">
               <button type="submit" class="btn block-btn">Block</button>
             </form>`}
      </td>
    `;
    tbody.appendChild(row);
  });
}