<?php

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: index.html");
    exit;
}

$email = trim($_POST["email"] ?? "");
$password = $_POST["password"] ?? "";
$gmailPattern = '/^[A-Za-z0-9]+(?:[._][A-Za-z0-9]+)*@gmail\.com$/i';

if (!preg_match($gmailPattern, $email) || strlen($password) < 8 || strlen($password) > 64) {
    http_response_code(400);
    exit("Please enter a valid Gmail address and password.");
}

require_once __DIR__ . "/connect.php";

$stmt = $conn->prepare("SELECT id, password FROM users WHERE email = ? LIMIT 1");
$stmt->bind_param("s", $email);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$user || !password_verify($password, $user["password"])) {
    http_response_code(401);
    exit("Invalid email or password.");
}

session_start();
session_regenerate_id(true);
$_SESSION["user_id"] = $user["id"];
$_SESSION["user_email"] = $email;

header("Location: dashboard.html");
exit;
