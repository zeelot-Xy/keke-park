# Keke Park Management System — Requirements

## 1. Overview

This system manages keke park operations including driver registration, levy payment, and queue-based passenger loading.

---

## 2. Actors

- Driver
- Administrator

---

## 3. Functional Requirements

### Driver

- Register account
- Upload passport and driver’s license
- Login to system
- Pay daily levy (task)
- Declare availability
- Join queue
- View queue position
- Receive loading status

### Administrator

- Approve driver accounts
- View driver documents
- Monitor queue
- Load next driver (FIFO)
- Mark driver as loaded
- Track payments
- View activity logs

---

## 4. Non-Functional Requirements

### Security

- Authentication required
- Secure storage of user data

### Performance

- Fast response time
- Real-time or near real-time queue updates

### Usability

- Simple and intuitive interface

### Reliability

- Minimal downtime
- Accurate data storage
