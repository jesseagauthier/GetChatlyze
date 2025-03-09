import pkg from 'node-appwrite';
const { Client, Users, Databases, ID } = pkg  // Changed Database to Databases

// Constants for database and collection IDs
const DATABASE_ID = '67cc72d1003ac5065eea';
const USERS_COLLECTION = 'users';
const COMPANIES_COLLECTION = 'companies';

// CORS headers to use in all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-appwrite-key, x-appwrite-user-id',
  'Access-Control-Allow-Credentials': 'true'
};

// This Appwrite function will be executed every time your function is triggered
export default async ({ req, res, log, error }) => {
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.json({}, 204, corsHeaders);
  }
  
  // You can use the Appwrite SDK to interact with other services
  // For this example, we're using the Users service
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');

  try {
    // Initialize database and users services
    const databases = new Databases(client);  // Changed to Databases
    const users = new Users(client);
    
    // Get user ID from request headers
    const userId = req.headers['x-appwrite-user-id'];
    
    if (!userId) {
      log('Request missing user ID');
      return res.json({ success: false, message: 'User ID is required' }, 400, corsHeaders);
    }
    
    log(`Processing request for user: ${userId}`);
    
    // Get user information from the users collection
    let user;
    try {
      // Fetch user from the users collection
      user = await databases.getDocument(DATABASE_ID, USERS_COLLECTION, userId);
      log(`Found user: ${user.$id}`);
    } catch (e) {
      log(`User not found: ${userId} - ${e.message}`);
      return res.json({ success: false, message: 'User not found', error: e.message }, 404, corsHeaders);
    }
    
    // Parse request body
    let requestData;
    try {
      requestData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
      log(`Invalid request body: ${e.message}`);
      return res.json({ success: false, message: 'Invalid request body format' }, 400, corsHeaders);
    }
    
    const { name, domain } = requestData;
    
    if (!name || !domain) {
      log('Missing required fields: name or domain');
      return res.json({ success: false, message: 'Company name and domain are required' }, 400, corsHeaders);
    }
    
    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      log(`Invalid domain format: ${domain}`);
      return res.json({ success: false, message: 'Invalid domain format' }, 400, corsHeaders);
    }
    
    // Generate unique companyId
    const companyId = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Generate scriptCode from company name
    const scriptCode = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
    
    log(`Creating company: ${name} with ID: ${companyId}`);
    
    // Create a new company document
    const company = await databases.createDocument(
      DATABASE_ID,
      COMPANIES_COLLECTION,
      ID.unique(),
      {
        name,
        domain,
        companyId,
        scriptCode,
        createdBy: userId,
        createdAt: new Date().toISOString()
      },
      [`user:${userId}`]
    );
    
    log(`Company created successfully: ${company.$id}`);
    log(`Updating user ${userId} with company ID: ${companyId}`);
    
    // Update user document to include the company ID
    const updatedUser = await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION,
      userId,
      {
        companyId: companyId,
        role: 'admin'
      }
    );
    
    log('Company creation workflow completed successfully');
    
    // Return the company and updated user data
    return res.json({
      success: true,
      company,
      user: updatedUser
    }, 200, corsHeaders);
  } catch (err) {
    log(`Error in company creation: ${err.message}`);
    error(err.message);
    
    // Determine specific error types for better client feedback
    if (err.code === 404) {
      return res.json({
        success: false,
        message: 'Resource not found',
        error: err.message
      }, 404, corsHeaders);
    } else if (err.code === 401 || err.code === 403) {
      return res.json({
        success: false,
        message: 'Permission denied',
        error: err.message
      }, err.code, corsHeaders);
    }
    
    return res.json({
      success: false,
      message: 'Failed to create company',
      error: err.message
    }, 500, corsHeaders);
  }
};
