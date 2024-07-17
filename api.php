<?php
header("Content-Type: application/json");

$servername = "localhost";
$username = "Nicarlo@98";
$password = "Klievizo@98";
$dbname = "library_inventory";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]));
}

if ($_SERVER["REQUEST_METHOD"] == "GET" && $_GET["action"] == "list") {
    $sql = "SELECT * FROM books";
    $result = $conn->query($sql);
    $books = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $books[] = $row;
        }
    }
    echo json_encode($books);
} elseif ($_SERVER["REQUEST_METHOD"] == "POST") {
    $data = json_decode(file_get_contents("php://input"), true);

    if ($data["action"] == "add") {
        $sql = "INSERT INTO books (title, author, genre, status) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssss", $data["title"], $data["author"], $data["genre"], $data["status"]);
        $result = $stmt->execute();
        echo json_encode(["success" => $result]);
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