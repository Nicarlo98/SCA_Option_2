let currentPage = 1;
let totalPages = 1;

function loadBooks(page = 1) {
    // Ensure page is at least 1
    page = Math.max(1, page);
    
    fetch(`api.php?action=list&page=${page}`)
        .then(response => response.json())
        .then(data => {
            console.log('API response:', data);

            if (data.error) {
                throw new Error(data.error);
            }

            if (!Array.isArray(data.books)) {
                throw new Error('Invalid data format: books is not an array');
            }

            if (data.books.length === 0 && data.totalBooks > 0) {
                // There are books, but not on this page
                currentPage = 1; // Reset to first page
                loadBooks(1); // Load first page
                return;
            }

            updateBookList(data.books);
            currentPage = data.currentPage || 1;
            totalPages = data.totalPages || 1;
            updatePagination();
        })
        .catch(error => {
            console.error('Error in loadBooks:', error);
            displayErrorMessage("An error occurred while loading books. Please try again. Error: " + error.message);
        });
}

function updatePagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="return ${currentPage !== 1 ? 'loadBooks(' + (currentPage - 1) + ')' : 'false'}">Previous</a>`;
    pagination.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="return ${i !== currentPage ? 'loadBooks(' + i + ')' : 'false'}">${i}</a>`;
        pagination.appendChild(li);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="return ${currentPage !== totalPages ? 'loadBooks(' + (currentPage + 1) + ')' : 'false'}">Next</a>`;
    pagination.appendChild(nextLi);
}

// Initial load
loadBooks();

function addBook() {
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const genre = document.getElementById('genre').value.trim();
    const status = document.getElementById('status').value;

    // Client-side validation
    if (!title || !author || !genre) {
        alert('Please fill in all fields (Title, Author, and Genre) before adding a book.');
        return;
    }

    fetch('api.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'add',
            title: title,
            author: author,
            genre: genre,
            status: status
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage(`Book added successfully! Book ID: ${data.bookId}`);
            loadBooks(currentPage);
            // Close the modal
            var modal = bootstrap.Modal.getInstance(document.getElementById('addBookModal'));
            modal.hide();
            // Clear the form
            document.getElementById('addBookForm').reset();
        } else {
            showErrorMessage(data.message || 'Error adding book.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showErrorMessage('An error occurred while adding the book. Please try again.');
    });
}


function loadBooks() {
    fetch('api.php?action=list')
    .then(response => response.json())
    .then(data => {
        const tableBody = document.getElementById('booksTableBody');
        tableBody.innerHTML = '';
        data.forEach(book => {
            const row = `
                <tr>
                    <td>${book.id}</td>
                    <td>${book.title}</td>
                    <td>${book.author}</td>
                    <td>${book.genre}</td>
                    <td>${book.status}</td>
                    <td>
                        <button onclick="updateBookStatus(${book.id})" class="btn btn-warning btn-sm">Update Status</button>
                        <button onclick="deleteBook(${book.id})" class="btn btn-danger btn-sm">Delete</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    });
}

function updateBookStatus(id) {
    // Create a modal for updating book status
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'updateStatusModal';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-labelledby', 'updateStatusModalLabel');
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="updateStatusModalLabel">Update Book Status</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="updateStatusForm">
                        <div class="form-group">
                            <label for="newStatus">New Status</label>
                            <select id="newStatus" class="form-control">
                                <option value="available">Available</option>
                                <option value="checked_out">Checked Out</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="confirmUpdateStatus">Update</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    document.getElementById('confirmUpdateStatus').addEventListener('click', function() {
        const newStatus = document.getElementById('newStatus').value;
        
        fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'update',
                id: id,
                status: newStatus
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('Book status updated successfully!');
                loadBooks(currentPage);
            } else {
                showErrorMessage('Error updating book status.');
            }
            modalInstance.hide();
        })
        .catch(error => {
            console.error('Error:', error);
            showErrorMessage('An error occurred while updating the book status.');
            modalInstance.hide();
        })
        .finally(() => {
            // Remove the modal from the DOM after it's hidden
            modal.addEventListener('hidden.bs.modal', function () {
                document.body.removeChild(modal);
            });
        });
    });
}

function deleteBook(id) {
    if (confirm("Are you sure you want to delete this book?")) {
        fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'delete',
                id: id
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('Book deleted successfully!');
                loadBooks(currentPage);
            } else {
                showErrorMessage('Error deleting book.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showErrorMessage('An error occurred while deleting the book.');
        });
    }
}

function searchBooks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    console.log('Searching for:', searchTerm);
    fetch(`api.php?action=search&term=${encodeURIComponent(searchTerm)}`)
        .then(response => response.json())
        .then(data => {
            console.log('Search results:', data);
            if (data.error) {
                displayErrorMessage(data.error);
            } else if (data.length === 0) {
                displayErrorMessage("No books found matching your search.");
            } else {
                updateBookList(data);
                // Reset pagination for search results
            currentPage = 1;
            totalPages = 1;
            updatePagination();
            }
        })
        .catch(error => {
    console.error('Error:', error);
    showErrorMessage("An error occurred while searching. Please try again.");
});
}

function updateBookList(books) {
    console.log('Updating book list with:', books);
    const tableBody = document.getElementById('booksTableBody');
    tableBody.innerHTML = '';
    books.forEach(book => {
        const row = `
            <tr>
                <td>${book.id}</td>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.genre}</td>
                <td>${book.status}</td>
                <td>
                   <button class="btn btn-warning btn-sm update-status" data-book-id="${book.id}">Update Status</button>
                   <button class="btn btn-danger btn-sm delete-book" data-book-id="${book.id}">Delete</button>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

function displayErrorMessage(message) {
    const tableBody = document.getElementById('booksTableBody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="error-message">${message}</td>
        </tr>
    `;
}

// Modify the existing loadBooks function
function loadBooks(page = 1) {
    fetch(`api.php?action=list&page=${page}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('API response:', data); // For debugging

            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data format received from server');
            }

            if (data.error) {
                displayErrorMessage(data.error);
            } else if (Array.isArray(data.books) && data.books.length === 0) {
                displayErrorMessage("No books in the database.");
            } else if (Array.isArray(data.books)) {
                updateBookList(data.books);
                currentPage = data.currentPage || 1;
                totalPages = data.totalPages || 1;
                updatePagination();
            } else {
                throw new Error('Unexpected data structure');
            }
        })
        .catch(error => {
            console.error('Error in loadBooks:', error);
            displayErrorMessage("An error occurred while loading books. Please try again. Error: " + error.message);
        });
}
function showMessage(message, type = 'success') {
    const messageContainer = document.getElementById('messageContainer');
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    messageContainer.innerHTML = alertHtml;

    // Automatically remove the alert after 5 seconds
    setTimeout(() => {
        const alert = messageContainer.querySelector('.alert');
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 3000);
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}
document.addEventListener('DOMContentLoaded', function() {
    // Initial load of books
    loadBooks();

    // Add event listener for the book list table
    const booksTableBody = document.getElementById('booksTableBody');
    if (booksTableBody) {
        booksTableBody.addEventListener('click', function(e) {
            if (e.target.classList.contains('update-status')) {
                const bookId = e.target.getAttribute('data-book-id');
                updateBookStatus(bookId);
            } else if (e.target.classList.contains('delete-book')) {
                const bookId = e.target.getAttribute('data-book-id');
                deleteBook(bookId);
            }
        });
    }

    // Add event listener for the search button
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', searchBooks);
    }

    // Add event listener for the add book form submission
    const addBookForm = document.getElementById('addBookForm');
    if (addBookForm) {
        addBookForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addBook();
        });
    }

    // Add event listener for the search input (for real-time search)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            if (this.value.length >= 3) {
                searchBooks();
            } else if (this.value.length === 0) {
                loadBooks();
            }
        });
    }
});

// Load books when the page loads
window.onload = loadBooks;