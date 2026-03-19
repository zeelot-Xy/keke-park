# Database Design — Keke Park Management System

## 1. Overview

The system uses a relational database (MySQL) to store and manage data for drivers, payments, queue operations, and administrative control.

---

## 2. Tables

### Users

- id (PK)
- name
- phone
- password
- role
- created_at

---

### Drivers

- id (PK)
- user_id (FK → users.id)
- plate_number
- park_id
- passport_image
- license_image
- approval_status

---

### Payments

- id (PK)
- driver_id (FK → drivers.id)
- amount
- payment_date
- status

---

### Queue

- id (PK)
- driver_id (FK → drivers.id)
- status
- joined_at

---

### Load Logs

- id (PK)
- driver_id (FK → drivers.id)
- loaded_at
- completed_at

---

## 3. Relationships

- One user → one driver
- One driver → many payments
- One driver → many queue entries
- One driver → many load logs

---

## 4. Constraints

- Primary keys uniquely identify records
- Foreign keys enforce relationships
- A driver must exist before making payment or joining queue

---

## 5. Queue Logic

The system uses FIFO (First-In-First-Out):

- Drivers join queue in order
- Admin loads the first driver in queue
- Loaded drivers are removed from queue
