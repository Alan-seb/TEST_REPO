-- Drop existing tables if re-initializing
DROP TABLE IF EXISTS approvals;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'faculty', 'hod', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Requests table
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending_faculty' 
        CHECK (status IN ('pending_faculty', 'pending_hod', 'pending_admin', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Approvals table to track the workflow history
CREATE TABLE approvals (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES leave_requests(id) ON DELETE CASCADE,
    approver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    decision VARCHAR(50) NOT NULL CHECK (decision IN ('approved', 'rejected')),
    comment TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert completely dummy initial data for easy testing
-- password for all: password123 (we typically use bcrypt, so I'll generate the hash for 'password123' here: $2b$10$wTf/0K1RAsXW.4w6/A24rOFZgBwK6W6n1WIf3w/jI9Bv/u8U8JvRe)
INSERT INTO users (name, email, password, role) VALUES 
('Alice Student', 'student@test.com', '$2b$10$NiybK7x/pfHxN3Zmi0.zGOxcnh6LZp6xDp5z5V8rqaBFvBXN2FIqK', 'student'),
('Bob Faculty', 'faculty@test.com', '$2b$10$NiybK7x/pfHxN3Zmi0.zGOxcnh6LZp6xDp5z5V8rqaBFvBXN2FIqK', 'faculty'),
('Charlie HOD', 'hod@test.com', '$2b$10$NiybK7x/pfHxN3Zmi0.zGOxcnh6LZp6xDp5z5V8rqaBFvBXN2FIqK', 'hod'),
('Dave Admin', 'admin@test.com', '$2b$10$NiybK7x/pfHxN3Zmi0.zGOxcnh6LZp6xDp5z5V8rqaBFvBXN2FIqK', 'admin');
