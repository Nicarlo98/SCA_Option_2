<?php

$servername = "localhost";
$username = "Nicarlo@98";
$password = "Klievizo@98";
$dbname = "library_inventory";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]));
}