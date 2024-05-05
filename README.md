# QuickStart Guide (for running on your local machine)

## Step 1: Clone the Repo

## Step 2: Install MySql

#### 2a. For this project I used a mySql database. To run this on your local machine you will need to install mySql (https://dev.mysql.com/downloads/installer/) if you do not have it installed already.

### 2b. Edit the .env file in the root directory of this project with the MySql user_name, password, and host for your computer

## Step 3: Install Node Dependecies & Typescript Annotations

#### 3a. In the root directory of the project run `npm install`. Note 

## Step 4: Run the project

#### 4a: run the following command `npm run start`

#### 4b: (Optional) for hot-reloading dev changes run `npm run dev`

---

# Database Schema Documentation

### Table: users

#### Columns:

1. **user_id**:

   - Type: INT (Primary Key)
   - Description: Unique identifier for each user.

2. **name**:

   - Type: VARCHAR(255)
   - Description: Name of the user.

3. **diet_restrictions**:

   - Type: SET('Vegan', 'Gluten Free', 'Vegetarian', 'Paleo')
   - Description: Set of dietary restrictions for the user. Users can have multiple dietary restrictions selected from the given set.

4. **created_at**:
   - Type: TIMESTAMP
   - Description: Timestamp indicating the date and time when the user was created.
   - Default Value: CURRENT_TIMESTAMP

### Table: restaurants

#### Columns:

1. **restaurant_id**:

   - Type: INT (primary key)
   - Description: Unique identifier for each restaurant.

2. **name**:

   - Type: VARCHAR(255)
   - Description: Name of the restaurant.

3. **diet_support**:
   - Type: SET('Vegan', 'Gluten Free', 'Vegetarian', 'Paleo')
   - Description: Set of dietary options supported by the restaurant.

### Table: reservations

#### Columns:

1. **reservation_id**:

   - Type: INT (primary Key)
   - Description: Unique identifier for each reservation.

2. **restaurant_id**:

   - Type: INT (foreign key)
   - Description: Identifier of the restaurant associated with the reservation. Maps to the Restaurants table.

3. **num_seats**:

   - Type: INT
   - Description: Number of seats reserved.

4. **start_time**:

   - Type: TIMESTAMP
   - Description: Start time of the reservation.

5. **available**:
   - Type: BOOLEAN
   - Description: Indicates whether the reservation is still available.

### Table: user_reservations_association

#### Description:

The `user_reservations_association` table stores an associations between each user and a booked reservations for that user. Note that a reservation with multiple users will have a row associating it with each user.

#### Columns:

1. **reservation_id**:

   - Type: INT (foreign key)
   - Description: Identifier of the reservation associated with the user.

2. **user_id**:
   - Type: INT
   - Description: Identifier of the user associated with the reservation.
   - Foreign Key: References the `user_id` column in the `users` table.

---

# API Documentation

## Endpoint: Find Reservation

### Description

This API endpoint is used to find all reservations for a one or more users at a desired time. It responds with a list of all reservations that meet dietary requirements of all users and have a start time within 15 minutes of the provided time.

### URL GET /api/v1/find_reservation

### RequestQuery Parameters

- **user_ids** (string, required): A comma-separated list of user IDs for whom reservations should be found.
- **time** (string, required): The desired time for the reservations, sent in ISO 8601 format (e.g., "2024-05-19T02:00:00").

### Request Example

```plaintext
GET /api/v1/find_reservation/?user_ids=1,2,3,4,5,9,10&time=2024-05-19T02:00:00
```

### Response Example

```
[
{
  "restaurant_name": "Example Restaurant 1",
  "restaurant_id": "123456789",
  "start_time": "2024-05-19T02:00:00",
  "num_seats": 4,
  "supported_diets": ["Vegan", "Gluten Free", "Vegetarian"]
},
{
  "restaurant_name": "Example Restaurant 2",
  "restaurant_id": "5456789",
  "start_time": "2024-05-19T02:00:00",
  "num_seats": 6,
  "supported_diets": ["Vegan", "Gluten Free", "Vegetarian", "Paleo"]
}
]

```

### Notes

- The endpoint assumes that the URL parameters include a time string (in ISO 8601 format). It will respond with localized times for easier client handling.

## Endpoint: Book Reservation

### Description:

This endpoint allows clients to book a reservation for a group of users by providing a reservation ID and a list of user IDs.

### URL: POST /api/v1/book_reservation

### Request Body:

```json
{
  "reservation_id": 123,
  "user_ids": [456, 789, 1011]
}
```

#### Request Body Parameters:

    reservation_id (number, required): The ID of the reservation to be booked.
    user_ids (array of numbers, required): An array of user IDs associated with the reservation.

### Response:

```json
{
  "status": "success"
}
```

#### Response Body Parameters:

    status (string): Indicates the status of the booking operation. Possible values: "success" or "failed".

### Example Usage:

```curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"reservation_id": 123, "user_ids": [456, 789, 1011]}' \
  http://localhost:3000/api/v1/book_reservation
```

## Endpoint: Delete Reservation

### Description:

This endpoint allows clients to delete one of their already reservations to mark it available by providing a reservation ID. This will delete the reservation for all associated users.

### URL: POST /api/v1/delete_reservation

### Request Body:

```json
{
  "reservation_id": 123
}
```

#### Request Body Parameters:

    reservation_id (number, required): The ID of the booked reservation to be deleted.

### Response:

```json
{
  "status": "success"
}
```

#### Response Body Parameters:

    status (string): Indicates the status of the delete operation. Possible values: "success" or "failed".

### Example Usage:

```curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"reservation_id": 123}' \
  http://localhost:3000/api/v1/delete_reservation
```
