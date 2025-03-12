import { Client, Databases, Query  } from 'node-appwrite';


// Currently This function only fetches user Data - It needs to be updated to both modify and delete user data


// Main function handler
export default async ({ req, res, log, error }) => {
    const databaseId = '67cc72d1003ac5065eea';
    const collectionId = "users";
    
    log('Function triggered - starting execution');
    
    try {
        // Initialize the Appwrite client
        log('Initializing Appwrite client');
        const client = new Client()
            .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
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
            // Check if req.body is already an object
            if (typeof req.body === 'object' && req.body !== null) {
                event = req.body;
                log('Request body is already an object, no parsing needed');
            } else {
                event = JSON.parse(req.body);
                log('Request body parsed successfully');
            }
        } catch (parseErr) {
            error(`Failed to parse request body: ${parseErr.message}`);
            error(`Request body type: ${typeof req.body}`);
            error(`Request body content: ${String(req.body).substring(0, 200)}...`);
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
        log(`Processing user: ID=${userId}`);
        
    
        const result = await databases.listDocuments(
            databaseId,
            collectionId,
            [
                Query.equal('userId', userId)
            ]
        );

        return res.json({
            success: true,
            message: 'document found',
            userInformation: result
        });
    } catch (err) {
        // Enhanced error logging - avoid JSON stringify issues
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
        
        // Return appropriate error response with safe error handling
        return res.json({
            success: false,
            message: `Failed to fetch user document: ${err.message}`,
            errorType: err.constructor.name,
            errorCode: err.code || null,
            details: process.env.NODE_ENV === 'development' ? String(err.stack) : undefined
        }, 500);
    }
};