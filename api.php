<?php
header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once './config/db_connect.php';

// In the GET request handling section for "list" action
if ($_SERVER["REQUEST_METHOD"] == "GET" && $_GET["action"] == "list") {
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = 10; // Number of books per page
    $offset = ($page - 1) * $limit;

    // Get total number of books
    $countSql = "SELECT COUNT(*) as total FROM books";
    $countResult = $conn->query($countSql);
    if (!$countResult) {
        die(json_encode(['error' => 'Count query failed: ' . $conn->error]));
    }
    $totalBooks = $countResult->fetch_assoc()['total'];

    // Get books for the current page
    $sql = "SELECT * FROM books LIMIT ? OFFSET ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        die(json_encode(['error' => 'Prepare failed: ' . $conn->error]));
    }
    $stmt->bind_param("ii", $limit, $offset);
    if (!$stmt->execute()) {
        die(json_encode(['error' => 'Execute failed: ' . $stmt->error]));
    }
    $result = $stmt->get_result();

    $books = [];
    while ($row = $result->fetch_assoc()) {
        $books[] = $row;
    }

    echo json_encode([
        'books' => $books,
        'totalBooks' => $totalBooks,
        'currentPage' => $page,
        'totalPages' => max(1, ceil($totalBooks / $limit))
    ]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "GET") {
    if ($_GET["action"] == "list") {
        $sql = "SELECT * FROM books";
        $result = $conn->query($sql);
        $books = [];
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $books[] = $row;
            }
            echo json_encode($books);
        } else {
            echo json_encode(["error" => "No books in the database."]);
        }
    } elseif ($_GET["action"] == "search") {
        $searchTerm = isset($_GET["term"]) ? $_GET["term"] : '';
        error_log("Search term: " . $searchTerm);

        $sql = "SELECT * FROM books WHERE 
                title LIKE ? OR 
                author LIKE ? OR 
                genre LIKE ?";
        $stmt = $conn->prepare($sql);
        $searchParam = "%$searchTerm%";
        $stmt->bind_param("sss", $searchParam, $searchParam, $searchParam);
        $stmt->execute();
        $result = $stmt->get_result();
        $books = [];
        while ($row = $result->fetch_assoc()) {
            $books[] = $row;
        }
        if (count($books) > 0) {
            echo json_encode($books);
        } else {
            echo json_encode(["error" => "No books found matching your search."]);
        }
    }
} elseif ($_SERVER["REQUEST_METHOD"] == "POST") {
    $data = json_decode(file_get_contents("php://input"), true);

    if ($data["action"] == "add") {
        // Server-side validation
        if (empty(trim($data["title"])) || empty(trim($data["author"])) || empty(trim($data["genre"]))) {
            echo json_encode(["success" => false, "message" => "All fields (Title, Author, and Genre) are required."]);
        } else {
            $sql = "INSERT INTO books (title, author, genre, status) VALUES (?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ssss", $data["title"], $data["author"], $data["genre"], $data["status"]);
            $result = $stmt->execute();
            if ($result) {
                echo json_encode(["success" => true, "message" => "Book added successfully."]);
            } else {
                echo json_encode(["success" => false, "message" => "Error adding book: " . $conn->error]);
            }
        }
    } elseif ($data["action"] == "update") {
        $sql = "UPDATE books SET status = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $data["status"], $data["id"]);
        $result = $stmt->execute();
        echo json_encode(["success" => $result]);
    } elseif ($data["action"] == "delete") {
        $sql = "DELETE FROM books WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $data["id"]);
        $result = $stmt->execute();
        echo json_encode(["success" => $result]);
    }
}

$conn->close();