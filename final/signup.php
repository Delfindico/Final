<?php

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $fullName = trim($_POST["fullname"] ?? "");
    $phone = trim($_POST["phone"] ?? "");
    $email = trim($_POST["email"] ?? "");
    $password = $_POST["password"] ?? "";
    $confirmPassword = $_POST["confirm-password"] ?? "";

    $errors = [];
    $gmailPattern = '/^[A-Za-z0-9]+(?:[._][A-Za-z0-9]+)*@gmail\.com$/i';

    if (empty($fullName)) {
        $errors[] = "Full name is required.";
    } elseif (!preg_match("/^(?=.{2,50}$)[A-Za-zÑñ\s]+$/u", $fullName)) {
        $errors[] = "Full name must be 2-50 letters only.";
    }

    if (empty($phone)) {
        $errors[] = "Phone number is required.";
    } elseif (!preg_match("/^\d{11}$/", $phone)) {
        $errors[] = "Phone number must be exactly 11 numbers.";
    }

    if (empty($email)) {
        $errors[] = "Email is required.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Invalid email address.";
    } elseif (strtolower(substr($email, -10)) === "@gmail.com" && !preg_match($gmailPattern, $email)) {
        $errors[] = "Gmail usernames may use letters, numbers, periods, and underscores.";
    }

    if (empty($password)) {
        $errors[] = "Password is required.";
    } elseif (strlen($password) < 8 || strlen($password) > 64) {
        $errors[] = "Password must be between 8 and 64 characters.";
    }

    if (empty($confirmPassword)) {
        $errors[] = "Please confirm your password.";
    } elseif ($password !== $confirmPassword) {
        $errors[] = "Passwords do not match.";
    }

    if ($errors) {
        foreach ($errors as $error) {
            echo $error . "<br>";
        }
    } else {
        echo "Sign Up Successful!";
    }
}
?>
