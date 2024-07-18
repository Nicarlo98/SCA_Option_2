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
            alert('Book added successfully!');
            loadBooks();
            // Close the modal
            var modal = bootstrap.Modal.getInstance(document.getElementById('addBookModal'));
            modal.hide();
            // Clear the form
            document.getElementById('addBookForm').reset();
        } else {
            alert(data.message || 'Error adding book.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while adding the book. Please try again.');
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
                        <button onclick="updateBookStatus(${book.id})">Update Status</button>
                        <button onclick="deleteBook(${book.id})">Delete</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    });
}

function updateBookStatus(id) {
    const newStatus = prompt("Enter new status (available/checked_out):");
    if (newStatus) {
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
                alert('Book status updated successfully!');
                loadBooks();
            } else {
                alert('Error updating book status.');
            }
        });
    }
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
                alert('Book deleted successfully!');
                loadBooks();
            } else {
                alert('Error deleting book.');
            }
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
            }
        })
        .catch(error => {
            console.error('Error:', error);
            displayErrorMessage("An error occurred while searching. Please try again.");
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
                    <button onclick="updateBookStatus(${book.id})">Update Status</button>
                    <button onclick="deleteBook(${book.id})">Delete</button>
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
function loadBooks() {
    fetch('api.php?action=list')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                displayErrorMessage(data.error);
            } else if (data.length === 0) {
                displayErrorMessage("No books in the database.");
            } else {
                updateBookList(data);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            displayErrorMessage("An error occurred while loading books. Please try again.");
        });
}


// Load books when the page loads
window.onload = loadBooks;