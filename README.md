# Doodle Mood Server API

A RESTful API server for the Doodle Mood application, built with Node.js, Express, and MongoDB.

## Features

- 🔐 Authentication (Register, Login, Forgot Password)
- 👥 Friend Management
- 💬 Real-time Messaging
- 📸 Image Upload & Management
- 🔔 Push Notifications
- 🔍 User Search

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Socket.IO
- Firebase Cloud Messaging
- Google Drive API
- JWT Authentication

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Google Cloud Platform account (for Google Drive API)
- Firebase project (for push notifications)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd doodle_mood_server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GOOGLE_DRIVE_CLIENT_ID=your_google_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_google_client_secret
GOOGLE_DRIVE_REDIRECT_URI=your_redirect_uri
GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token
FOLDER_ID=your_google_drive_folder_id
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
FIREBASE_SERVER_KEY=your_firebase_server_key
```

4. Start the server:
```bash
npm start
```

## API Endpoints

### Authentication

#### Register
- **POST** `/api/auth/register`
- Body: `{ name, email, password }`

#### Login
- **POST** `/api/auth/login`
- Body: `{ email, password, deviceToken }`

#### Forgot Password
- **POST** `/api/auth/forgot-password`
- Body: `{ email }`

#### Verify OTP
- **POST** `/api/auth/verify-otp`
- Body: `{ email, otp }`

#### Reset Password
- **POST** `/api/auth/reset-password`
- Body: `{ resetToken, newPassword }`

### Users

#### Search Users
- **GET** `/api/users/search?query=search_term`
- Query: `query` (search by name or email)

### Friends

#### Send Friend Request
- **POST** `/api/friends/request`
- Body: `{ senderId, receiverId }`

#### Accept/Reject Friend Request
- **POST** `/api/friends/request/response`
- Body: `{ requestId, receiverId, status }`

#### Get Friend Requests
- **GET** `/api/friends/requests/:userId`

### Files

#### Upload File
- **POST** `/api/files/upload`
- Form Data: `file`, `userId`

#### Get Images
- **GET** `/api/files/images/:userId`

### Messages (WebSocket)

#### Send Message
- Event: `sendMessage`
- Data: `{ senderId, receiverId, message }`

#### Receive Message
- Event: `receiveMessage`
- Data: `{ messageId, senderId, message, timestamp }`

## Response Format

All API responses follow a standardized format:

```json
{
  "success": boolean,
  "message": string,
  "data": any | null,
  "error": string | null,
  "statusCode": number
}
```

## Error Codes

- 200: Success
- 201: Created
- 400: Bad Request/Validation Error
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

## Security

- JWT-based authentication
- Password hashing with bcrypt
- OTP verification for password reset
- Secure file uploads to Google Drive
- CORS enabled
- Environment variables for sensitive data

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.
