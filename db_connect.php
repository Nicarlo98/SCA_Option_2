<?php

try {
    // Database connection
    $pdo = new PDO('mysql:host=localhost;dbname=library_inventory', 'Nicarlo@98', 'Klievizo@98');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // Log the error message
    error_log('Connection failed: ' . $e->getMessage());
    // Display message
    echo 'Database connection failed. Please try again later.';
    // Stop further execution
    exit;
}