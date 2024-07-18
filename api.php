<?php
header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once './config/db_connect.php';

function generateBookCode($title, $author, $conn)
{
    try {
        // Combine title and author, convert to uppercase and split into words
        $combinedString = $title . ' ' . $author;
        $wordArray = preg_split('/\s+/', strtoupper($combinedString), -1, PREG_SPLIT_NO_EMPTY);
        $preLimAlpha = '';

        if (count($wordArray) >= 3) {
            for ($i = 0; $i < 3; $i++) {
                $preLimAlpha .= substr($wordArray[$i], 0, 1);
            }
        } elseif (count($wordArray) == 2) {
            $preLimAlpha = substr($wordArray[0], 0, 1) . substr($wordArray[1], 0, 1) . 'A';
        } else {
            $charArray = str_split(strtoupper($combinedString));
            if (count($charArray) >= 3) {
                $preLimAlpha = $charArray[0] . $charArray[1] . $charArray[2];
            } elseif (count($charArray) == 2) {
                $preLimAlpha = $charArray[0] . $charArray[1] . 'A';
            } else {
                $preLimAlpha = $charArray[0] . 'AA';
            }
        }

        // Fetch all existing book codes
        $stmt = $conn->query("SELECT id FROM books WHERE id LIKE '$preLimAlpha%'");
        $existingCodes = $stmt->fetch_all(MYSQLI_ASSOC);

        // Add numeric part to alpha
        $preLimNum = 1;
        do {
            $preLimString = $preLimAlpha . str_pad($preLimNum, 3, '0', STR_PAD_LEFT);
            $preLimNum++;
        } while (in_array($preLimString, array_column($existingCodes, 'id')));

        return $preLimString;
    } catch (Exception $ex) {
        // Log the exception or handle it as needed
        return '';
    }
}

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
            // Generate unique book ID
            $bookId = generateBookCode($data["title"], $data["author"], $conn);

            $sql = "INSERT INTO books (id, title, author, genre, status) VALUES (?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("sssss", $bookId, $data["title"], $data["author"], $data["genre"], $data["status"]);
            $result = $stmt->execute();
            if ($result) {
                echo json_encode(["success" => true, "message" => "Book added successfully.", "bookId" => $bookId]);
            } else {
                echo json_encode(["success" => false, "message" => "Error adding book: " . $conn->error]);
            }
        }
    } // For updating book status
    elseif ($data["action"] == "update") {
        $sql = "UPDATE books SET status = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $data["status"], $data["id"]);
        $result = $stmt->execute();
        echo json_encode(["success" => $result]);
    }

    // For deleting a book
    elseif ($data["action"] == "delete") {
        $sql = "DELETE FROM books WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $data["id"]);
        $result = $stmt->execute();
        echo json_encode(["success" => $result]);
    }
}
$conn->close();