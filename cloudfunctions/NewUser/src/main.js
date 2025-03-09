import { Client, Users, Databases, ID } from 'node-appwrite';

// Main function handler
export default async ({ req, res, log, error }) => {
    const databaseId = '67cc72d1003ac5065eea';
    const collectionId = "users";
    
    log('Function triggered - starting execution');
    
    try {
        // Log environment check
        log('Checking environment variables');
        if (!process.env.APPWRITE_FUNCTION_ENDPOINT) {
            throw new Error('Missing APPWRITE_FUNCTION_ENDPOINT environment variable');
        }
        if (!process.env.APPWRITE_FUNCTION_PROJECT_ID) {
            throw new Error('Missing APPWRITE_FUNCTION_PROJECT_ID environment variable');
        }
        if (!process.env.APPWRITE_API_KEY) {
            throw new Error('Missing APPWRITE_API_KEY environment variable');
        }
        
        log('Environment variables verified');
        
        // Initialize the Appwrite client
        log('Initializing Appwrite client');
        const client = new Client()
            .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);
        
        log('Client initialized successfully');
        
        // Get database instance
        log('Creating Databases instance');
        const databases = new Databases(client);
        
        // Extract and validate user information from the event payload
        log('Parsing request body');
        let event;
        try {
            event = JSON.parse(req.body);
            log('Request body parsed successfully');
        } catch (parseErr) {
            error(`Failed to parse request body: ${parseErr.message}`);
            throw new Error(`Invalid JSON in request body: ${parseErr.message}`);
        }
        
        // Validate required fields
        if (!event) {
            throw new Error('Empty request body');
        }
        
        const userId = event.userId || event.$id;
        if (!userId) {
            throw new Error('Missing required field: userId or $id');
        }
        
        const userEmail = event.email || '';
        const userName = event.name || '';
        
        log(`Processing user: ID=${userId}, Email=${userEmail}, Name=${userName}`);
        
        // Verify database and collection existence
        log(`Checking if collection "${collectionId}" exists in database "${databaseId}"`);
        try {
            // Optional: You could add a check here to verify the collection exists
            // This would require an additional API call
            log('Proceeding with document creation');
        } catch (checkErr) {
            error(`Failed to verify collection: ${checkErr.message}`);
            throw new Error(`Collection verification failed: ${checkErr.message}`);
        }
        
        // Create a new document in the users collection
        log(`Creating document in database ${databaseId}, collection ${collectionId} with ID ${userId}`);
        const userDoc = {
            userId: userId,
            Email: userEmail,
            Name: userName,
            createdAt: new Date().toISOString()
        };
        
        log(`Document payload: ${JSON.stringify(userDoc)}`);
        
        const result = await databases.createDocument(
            databaseId,
            collectionId,
            userId, // Use the user's ID as the document ID
            userDoc
        );
        
        log(`Document created successfully with ID: ${result.$id}`);
        
        // Return success response
        log('Returning success response');
        return res.json({
            success: true,
            message: 'User document created',
            user: result
        });
    } catch (err) {
        // Enhanced error logging
        error(`Error type: ${err.constructor.name}`);
        error(`Error message: ${err.message}`);
        error(`Error stack: ${err.stack}`);
        
        // Check for specific Appwrite error types
        if (err.code) {
            error(`Appwrite error code: ${err.code}`);
        }
        
        // Log potential common issues
        if (err.message.includes('Permission denied')) {
            error('This may be an API key permission issue - ensure your API key has the proper scopes');
        } else if (err.message.includes('not found')) {
            error('Database or collection might not exist - check IDs');
        } else if (err.message.includes('already exists')) {
            error('Document with this ID already exists - consider updating instead');
        }
        
        // Return appropriate error response
        return res.json({
            success: false,
            message: 'Failed to create user document',
            error: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }, 500);
    }
};