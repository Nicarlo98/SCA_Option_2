function addBook() {
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const genre = document.getElementById('genre').value;
    const status = document.getElementById('status').value;

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
        } else {
            alert('Error adding book.');
        }
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

// Load books when the page loads
window.onload = loadBooks;