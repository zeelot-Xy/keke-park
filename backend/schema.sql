-- Create Database
CREATE DATABASE keke_park;
USE keke_park;

-- USERS TABLE
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('driver', 'admin') DEFAULT 'driver',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DRIVERS TABLE
CREATE TABLE drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    plate_number VARCHAR(50),
    park_id VARCHAR(50),
    passport_image VARCHAR(255),
    license_image VARCHAR(255),
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- PAYMENTS TABLE
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT,
    amount DECIMAL(10,2),
    payment_date DATE,
    status ENUM('paid', 'unpaid') DEFAULT 'paid',
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

-- QUEUE TABLE
CREATE TABLE queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT,
    status ENUM('waiting', 'loading', 'completed') DEFAULT 'waiting',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

-- LOAD LOGS TABLE
CREATE TABLE load_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT,
    loaded_at TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);