# QuickStart Guide (for running on your local machine)

## Step 1: Clone the Repo

## Step 2: Install MySql

#### 2a. For this project I used a mySql database. To run this on your local machine you will need to install mySql (https://dev.mysql.com/downloads/installer/) if you do not have it installed already.
### 2b. Edit the .env file in the root directory of this project with the MySql host name, password, and port for your computer

## Step 3: Install Node Dependecies
#### 3a. In the root directory of the project run `npm install`

## Step 4: (Optional) Install Typscript Annotations
#### 4a. TODO figure out how this workds 


---


## Database Schema Documentation

### Table: users

#### Columns:
1. **user_id**:
   - Type: INT (Primary Key)
   - Description: Unique identifier for each user.
   - Constraints: AUTO_INCREMENT, PRIMARY KEY

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
   - Description:  Indicates whether the reservation is still available.


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


## API Documentation

## Endpoint: Book Reservation

### Description:
This endpoint allows clients to book a reservation for a group of users by providing a reservation ID and a list of user IDs.

### URL: POST /api/v1/create_booking
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
  http://localhost:3000/
```

##TODO: add info on the other 2 apis
