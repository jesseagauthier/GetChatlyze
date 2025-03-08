import pkg from 'node-appwrite';
const { Client, Users, Databases, ID } = pkg  // Changed Database to Databases

// Main function handler
export default async ({ req, res, log, error }) => {

    const databaseId='67cc72d1003ac5065eea'
    const collection ="users"
    
    try {
        // Initialize the Appwrite client
        const client = new Client()
            .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);
        
        // Get database instance
        const databases = new Databases(client);
        
        // Extract user information from the event payload
        const event = JSON.parse(req.body);
        const userId = event.userId || event.$id;
        const userEmail = event.email || '';
        const userName = event.name || '';
        
        log(`Creating user document for user ${userId}`);
        
        // Create a new document in the users collection
        const result = await databases.createDocument(
            databaseId,
            collection,
            userId, // Use the user's ID as the document ID
            {
                userId: userId,
                Email: userEmail,
                Name: userName
            }
        );
        
        log('User document created successfully');
        
        // Return success response
        return res.json({
            success: true,
            message: 'User document created',
            user: result
        });
    } catch (err) {
        // Log and return error
        error(`Failed to create user document: ${err.message}`);
        return res.json({
            success: false,
            message: err.message
        }, 500);
    }
};
