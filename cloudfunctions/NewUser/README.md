# NewUser Cloud Function

## Purpose
This cloud function automatically creates a user document in an Appwrite database when a new user is registered. It captures essential user information and stores it in a designated collection for user management.

## Functionality
- Triggered when a new user is created
- Extracts user information (ID, email, name) from the request
- Creates a document in the "users" collection using the user's ID
- Stores user details and creation timestamp
- Returns success or error information

## Requirements
- Appwrite instance
- Configured database (ID: '67cc72d1003ac5065eea')
- "users" collection in the database

## Environment Variables
The function requires the following environment variables:
- `APPWRITE_FUNCTION_ENDPOINT`: The URL of your Appwrite instance
- `APPWRITE_FUNCTION_PROJECT_ID`: Your Appwrite project ID
- `APPWRITE_API_KEY`: API key with permissions to access/modify databases

## Request Format
The function expects a JSON payload with:
```json
{
  "userId": "unique-user-id",  // or "$id"
  "email": "user@example.com", // optional
  "name": "User Name"          // optional
}
```

## Response
### Success
```json
{
  "success": true,
  "message": "User document created",
  "user": { /* user document data */ }
}
```

### Error
```json
{
  "success": false,
  "message": "Error message",
  "errorType": "Error type",
  "errorCode": "Error code if available"
}
```

## Error Handling
The function includes comprehensive error handling for common issues:
- Missing environment variables
- Invalid request format
- Permission issues
- Database access problems

## Deployment
Deploy this function to your Appwrite instance and configure it to be triggered by authentication events or manual API calls.
