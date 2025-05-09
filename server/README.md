# File Management Server

A robust file management server built with Express.js, MongoDB, and AWS S3 for secure file storage and management.

## Features

- User authentication (signup/login)
- File upload and management
- Folder creation and organization
- File operations (copy, move, rename)
- Secure file access with signed URLs
- Folder download as ZIP
- CORS enabled for specified origins

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- AWS Account with S3 access
- npm or yarn package manager

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_s3_bucket_name
```

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   cd server
   npm install
   ```
3. Set up environment variables
4. Start the server:
   ```bash
   npm start
   ```

## API Documentation

### Authentication Routes

#### Signup

- **POST** `/api/auth/signup`
- **Body:**
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response:** User details and ID

#### Login

- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response:** JWT token and user details

### File Management Routes

All file routes require authentication. Include the JWT token in the Authorization header.

#### Upload Files

- **POST** `/api/files/upload`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Body:** FormData with files
- **Response:** Uploaded files information

#### Create Folder

- **POST** `/api/files/folder`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "path": "string",
    "name": "string"
  }
  ```

#### List Files

- **GET** `/api/files/list`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Query Parameters:**
  - `path`: Folder path to list

#### Delete File/Folder

- **DELETE** `/api/files`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "path": "string"
  }
  ```

#### Get Signed URL

- **GET** `/api/files/url`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Query Parameters:**
  - `path`: File path

#### Move File

- **POST** `/api/files/move`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "sourcePath": "string",
    "destinationPath": "string"
  }
  ```

#### Copy File

- **POST** `/api/files/copy`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "sourcePath": "string",
    "destinationPath": "string"
  }
  ```

#### Download Folder as ZIP

- **GET** `/api/files/download/:folder`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Parameters:**
  - `folder`: Folder path to download

## CORS Configuration

The server is configured to accept requests from the following origins:

- https://kzmgdwzhhmzrrp39ip84.lite.vusercontent.net
- http://localhost:5000
- http://192.168.1.7:5000
- http://172.23.128.1:5000

## Security

- All routes except signup and login require JWT authentication
- Passwords are hashed using bcrypt
- File operations are secured with AWS S3
- CORS is configured for specific origins only

## Error Handling

The server implements proper error handling for:

- Invalid credentials
- Duplicate email/username
- File operation failures
- Authentication failures
- Invalid requests

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
