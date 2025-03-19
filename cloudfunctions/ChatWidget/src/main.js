/**
 * Secure Chat Widget Server - An Appwrite Cloud Function that validates company credentials, 
 * retrieves company-specific configurations, and dynamically generates a customized client-side 
 * chat widget with real-time messaging capabilities using Appwrite Realtime.
 */
// Appwrite Cloud Function to serve the chat widget script
// This function validates the client company ID and serves the appropriate script

import { Client, Databases, Query, Storage } from 'node-appwrite';

// Main function handler
export default async ({ req, res, log, error }) => {
  try {
    // Get company code from query parameter
    const companyCode = req.query.companyId;
    
    if (!companyCode) {
      return res.json({ 
        error: 'Missing company ID',
        success: false
      }, 400);
    }
    
    log(`Serving chat script for company ID: ${companyCode}`);
    
    // Initialize Appwrite
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    
    const databases = new Databases(client);
    
    // Look up the company by ID to verify it exists and get configuration
    try {
      const companies = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        'companies',
        [Query.equal('scriptCode', companyCode)]
      );

// Then get the first match
const company = companies.documents[0];
      
      log(`Company found: ${company.name}`);
      
      // Make sure company is active
      if (!company.active) {
        return res.json({ 
          error: 'Company account is inactive',
          success: false
        }, 403);
      }
      
      // Get company settings and customization
      const settings = typeof company.settings === 'string' 
        ? JSON.parse(company.settings) 
        : company.settings;
        
      const customization = typeof company.customization === 'string' 
        ? JSON.parse(company.customization) 
        : company.customization;
      
      // Generate the widget script with embedded configuration
      const chatScript = generateChatScript(
        companyCode, 
        settings, 
        customization,
        req.hostname
      );
      
      // Send script with proper content-type header (fixed to use Appwrite response format)
      return res.send(chatScript, 200, {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'max-age=3600' // Cache for 1 hour
      });
      
    } catch (err) {
      error(`Error looking up company: ${err.message}`);
      
      return res.json({
        error: 'Invalid company ID',
        success: false
      }, 404);
    }
    
  } catch (err) {
    error(`Error serving chat script: ${err.message}`);
    
    return res.json({
      error: 'Server error',
      success: false
    }, 500);
  }
};

// Function to generate the chat widget script with embedded configuration
function generateChatScript(companyId, settings, customization, hostname) {
  // Determine the Appwrite endpoint based on the function host
  const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const databaseId = process.env.APPWRITE_DATABASE_ID;

let script = `
// Live Chat Widget with Appwrite Realtime
// Configuration
window.chatConfig = {
  companyId: "${companyId || ''}",
  appwriteEndpoint: "${endpoint || 'https://cloud.appwrite.io/v1'}",
  appwriteProjectId: "${projectId || ''}",
  appwriteDatabaseId: "${databaseId || ''}",
  appwriteChatsCollectionId: "chatRooms",
  appwriteMessagesCollectionId: "chatMessages",
  appwriteQueueCollectionId: "chatQueue",
  agentName: "${(settings && settings.agentTitle) || 'Support Agent'}",
  welcomeMessage: "${(settings && settings.welcomeMessage) || 'Hi there! How can we help you today?'}",
  offlineMessage: "${(settings && settings.offlineMessage) || 'We are currently offline. Please leave a message and we will get back to you.'}",
  userId: "visitor_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
  theme: {
    primary: "${(customization && customization.primary) || '#4F46E5'}",
    secondary: "${(customization && customization.secondary) || '#E5E7EB'}",
    text: "${(customization && customization.text) || '#111827'}",
    textLight: "${(customization && customization.textLight) || '#F9FAFB'}"
  }
};
  `;

  // Main widget code
  script += `
// Load Dependencies
(function() {
  // Load Appwrite SDK
  const appwriteScript = document.createElement("script");
  appwriteScript.src = "https://cdn.jsdelivr.net/npm/appwrite@11.0.0";
  appwriteScript.async = true;

  appwriteScript.onload = function() {
    // Initialize chat widget after Appwrite loads
    initializeChatWidget();
  };

  document.head.appendChild(appwriteScript);

  // Add necessary CSS styles
  const styles = document.createElement("style");
  styles.textContent = \`
    #live-chat-widget {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: \${window.chatConfig.theme.text};
      z-index: 9999;
    }
    #live-chat-widget * {
      box-sizing: border-box;
    }
    .chat-hidden {
      display: none !important;
    }
    .chat-flex {
      display: flex;
    }
    .chat-flex-col {
      display: flex;
      flex-direction: column;
    }
    .chat-items-center {
      align-items: center;
    }
    .chat-justify-between {
      justify-content: space-between;
    }
    .chat-justify-end {
      justify-content: flex-end;
    }
    .chat-justify-center {
      justify-content: center;
    }
    .chat-fixed {
      position: fixed;
    }
    .chat-bottom-4 {
      bottom: 1rem;
    }
    .chat-right-4 {
      right: 1rem;
    }
    .chat-rounded-full {
      border-radius: 9999px;
    }
    .chat-rounded-lg {
      border-radius: 0.5rem;
    }
    .chat-rounded-l-lg {
      border-top-left-radius: 0.5rem;
      border-bottom-left-radius: 0.5rem;
    }
    .chat-rounded-r-lg {
      border-top-right-radius: 0.5rem;
      border-bottom-right-radius: 0.5rem;
    }
    .chat-bg-white {
      background-color: white;
    }
    .chat-shadow-lg {
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .chat-p-4 {
      padding: 1rem;
    }
    .chat-p-3 {
      padding: 0.75rem;
    }
    .chat-p-2 {
      padding: 0.5rem;
    }
    .chat-py-2 {
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
    }
    .chat-px-3 {
      padding-left: 0.75rem;
      padding-right: 0.75rem;
    }
    .chat-py-1 {
      padding-top: 0.25rem;
      padding-bottom: 0.25rem;
    }
    .chat-px-4 {
      padding-left: 1rem;
      padding-right: 1rem;
    }
    .chat-mb-4 {
      margin-bottom: 1rem;
    }
    .chat-ml-auto {
      margin-left: auto;
    }
    .chat-mr-auto {
      margin-right: auto;
    }
    .chat-space-y-3 > * + * {
      margin-top: 0.75rem;
    }
    .chat-w-72 {
      width: 18rem;
    }
    .chat-h-6 {
      height: 1.5rem;
    }
    .chat-w-6 {
      width: 1.5rem;
    }
    .chat-h-5 {
      height: 1.25rem;
    }
    .chat-w-5 {
      width: 1.25rem;
    }
    .chat-overflow-hidden {
      overflow: hidden;
    }
    .chat-overflow-y-auto {
      overflow-y: auto;
    }
    .chat-max-h-96 {
      max-height: 24rem;
    }
    .chat-max-w-xs {
      max-width: 20rem;
    }
    .chat-flex-1 {
      flex: 1 1 0%;
    }
    .chat-text-xs {
      font-size: 0.75rem;
    }
    .chat-text-sm {
      font-size: 0.875rem;
    }
    .chat-font-medium {
      font-weight: 500;
    }
    .chat-border {
      border-width: 1px;
      border-style: solid;
      border-color: #e5e7eb;
    }
    .chat-border-t {
      border-top-width: 1px;
      border-top-style: solid;
      border-top-color: #e5e7eb;
    }
    .chat-outline-none:focus {
      outline: none;
    }
    .chat-ring-2:focus {
      box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
    }
    .chat-transition-all {
      transition-property: all;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 300ms;
    }
    .chat-flex-row {
      display: flex;
      flex-direction: row;
    }
    .chat-bg-gray-50 {
      background-color: #f9fafb;
    }
    @media (min-width: 768px) {
      .chat-md\\:w-80 {
        width: 20rem;
      }
    }
  \`;
  document.head.appendChild(styles);
  
  // Initialize chat variables
  let appwrite;
  let database;
  let realtime;
  let chatId;
  let connected = false;
  let typing = false;
  let typingTimeout;
  let realtimeUnsubscribe = null;
  let queuePosition = 0;
  let isChatOpen = false;
  
  function initializeChatWidget() {
    // Create widget container
    const chatWidget = document.createElement("div");
    chatWidget.id = "live-chat-widget";
    chatWidget.innerHTML = \`
      <div class="chat-fixed chat-bottom-4 chat-right-4 chat-flex chat-flex-col">
        <!-- Chat Button (Collapsed State) -->
        <button id="chat-button" class="chat-p-4 chat-rounded-full chat-shadow-lg chat-flex chat-items-center chat-justify-center chat-ml-auto chat-transition-all" style="background-color: \${window.chatConfig.theme.primary}; color: white;">
          <svg xmlns="http://www.w3.org/2000/svg" class="chat-h-6 chat-w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
        
        <!-- Chat Window (Expanded State) -->
        <div id="chat-window" class="chat-hidden chat-bg-white chat-rounded-lg chat-shadow-lg chat-overflow-hidden chat-w-72 chat-md:w-80 chat-mb-4 chat-flex chat-flex-col chat-transition-all chat-max-h-96">
          <!-- Chat Header -->
          <div class="chat-p-4 chat-flex chat-justify-between chat-items-center" style="background-color: \${window.chatConfig.theme.primary}; color: white;">
            <h3 class="chat-font-medium">Live Support</h3>
            <button id="close-chat" class="chat-text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="chat-h-5 chat-w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Connection Status -->
          <div id="connection-status" class="chat-bg-yellow-100 chat-text-yellow-800 chat-text-xs chat-p-2 chat-text-center">
            Connecting to support...
          </div>
          
          <!-- Chat Messages -->
          <div id="chat-messages" class="chat-flex-1 chat-p-4 chat-overflow-y-auto chat-space-y-3 chat-bg-gray-50">
            <div class="chat-flex chat-items-start">
              <div class="chat-rounded-lg chat-py-2 chat-px-3 chat-max-w-xs" style="background-color: \${window.chatConfig.theme.secondary}; color: \${window.chatConfig.theme.text};">
                <p class="chat-text-sm">\${window.chatConfig.welcomeMessage}</p>
              </div>
            </div>
          </div>
          
          <!-- Typing Indicator -->
          <div id="typing-indicator" class="chat-px-4 chat-py-2 chat-text-xs chat-hidden" style="color: \${window.chatConfig.theme.text};">
            Agent is typing...
          </div>
          
          <!-- Chat Input -->
          <div class="chat-border-t chat-p-3 chat-bg-white">
            <div class="chat-flex chat-items-center">
              <input id="chat-input" type="text" placeholder="Type a message..." class="chat-flex-1 chat-border chat-rounded-l-lg chat-px-3 chat-py-2 chat-outline-none chat-ring-2">
              <button id="send-message" class="chat-rounded-r-lg chat-px-4 chat-py-2" style="background-color: \${window.chatConfig.theme.primary}; color: white;">
                <svg xmlns="http://www.w3.org/2000/svg" class="chat-h-5 chat-w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    \`;
  
    document.body.appendChild(chatWidget);
  
    // Add event listeners
    setupEventListeners();
  
    // Initialize Appwrite connection
    initializeAppwrite();
  }
  
  function setupEventListeners() {
    const chatButton = document.getElementById("chat-button");
    const chatWindow = document.getElementById("chat-window");
    const closeChat = document.getElementById("close-chat");
    const sendMessage = document.getElementById("send-message");
    const chatInput = document.getElementById("chat-input");
  
    // Toggle chat window visibility
    chatButton.addEventListener("click", () => {
      toggleChat();
    });
  
    // Close chat window
    closeChat.addEventListener("click", () => {
      toggleChat(false);
    });
  
    // Send message when button is clicked
    sendMessage.addEventListener("click", () => {
      sendUserMessage();
    });
  
    // Send message when Enter key is pressed
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendUserMessage();
      }
    });
  
    // Handle typing indicator
    chatInput.addEventListener("input", () => {
      if (!typing && connected && chatId) {
        typing = true;
        sendTypingStatus(true);
      }
  
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
  
      // Set new timeout to stop typing indicator
      typingTimeout = setTimeout(() => {
        typing = false;
        if (connected && chatId) {
          sendTypingStatus(false);
        }
      }, 1000);
    });
  }
  
  function toggleChat(forcedState) {
    const chatWindow = document.getElementById("chat-window");
    const chatButton = document.getElementById("chat-button");
    
    // If forcedState is provided, use it, otherwise toggle
    isChatOpen = forcedState !== undefined ? forcedState : !isChatOpen;
    
    if (isChatOpen) {
      chatWindow.classList.remove("chat-hidden");
      chatButton.innerHTML = \`
        <svg xmlns="http://www.w3.org/2000/svg" class="chat-h-6 chat-w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      \`;
      
      // If opening the chat and not connected, try to connect
      if (!connected) {
        initializeAppwrite();
      }
      
      // Focus the input
      setTimeout(() => {
        const chatInput = document.getElementById("chat-input");
        if (chatInput) chatInput.focus();
      }, 300);
    } else {
      chatWindow.classList.add("chat-hidden");
      chatButton.innerHTML = \`
        <svg xmlns="http://www.w3.org/2000/svg" class="chat-h-6 chat-w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      \`;
    }
  }
  
  function initializeAppwrite() {
    try {
      // Check if Appwrite SDK is properly loaded
      if (typeof window.Appwrite === 'undefined') {
        throw new Error("Appwrite SDK not loaded properly");
      }
      
      // Initialize Appwrite client using the correct browser SDK structure
      appwrite = new window.Appwrite.Client();
      
      // Set endpoint and project
      appwrite.setEndpoint(window.chatConfig.appwriteEndpoint);
      appwrite.setProject(window.chatConfig.appwriteProjectId);
      
      // Initialize Appwrite database service
      database = new window.Appwrite.Databases(appwrite);
      
      // Initialize Appwrite realtime
      realtime = appwrite.subscribe;
      
      updateConnectionStatus("Connecting to support...", "yellow");
      
      // Create a chat session or connect to existing one
      createOrConnectChat();
    } catch (error) {
      console.error("Failed to initialize Appwrite:", error);
      updateConnectionStatus("Connection failed: " + error.message, "red");
    }
  }
  
  async function createOrConnectChat() {
    try {
      // Gather visitor information for context
      const visitorInfo = {
        url: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenSize: \`\${window.innerWidth}x\${window.innerHeight}\`,
        timestamp: new Date().toISOString()
      };
      
      // Create a new chat session
      const chatData = {
        companyId: window.chatConfig.companyId,
        name: \`Chat with \${window.chatConfig.userId}\`,
        type: 'support',
        participants: [window.chatConfig.userId],
        createdBy: window.chatConfig.userId,
        status: 'waiting',
        visitorInfo: JSON.stringify(visitorInfo),
        referrerUrl: document.referrer,
        createdAt: new Date().toISOString()
      };
      
      // Create the chat document
      const newChat = await database.createDocument(
        window.chatConfig.appwriteDatabaseId,
        window.chatConfig.appwriteChatsCollectionId,
        'unique()',
        chatData
      );
      
      chatId = newChat.$id;
      
      // Add to queue
      await database.createDocument(
        window.chatConfig.appwriteDatabaseId,
        window.chatConfig.appwriteQueueCollectionId,
        'unique()',
        {
          companyId: window.chatConfig.companyId,
          userId: window.chatConfig.userId,
          status: 'waiting',
          roomId: chatId,
          priority: 1,
          visitorInfo: JSON.stringify(visitorInfo),
          waitingSince: new Date().toISOString()
        }
      );
      
      updateConnectionStatus("Waiting for an agent...", "yellow");
      addSystemMessage("You've been placed in the queue. An agent will assist you shortly.");
      
      // Subscribe to realtime updates
      subscribeToRealtimeUpdates();
      
    } catch (error) {
      console.error("Error creating chat:", error);
      updateConnectionStatus("Connection failed: " + error.message, "red");
    }
  }
  
  function subscribeToRealtimeUpdates() {
    // Unsubscribe from previous subscription if exists
    if (realtimeUnsubscribe) {
      realtimeUnsubscribe();
    }
    
    // Chat channel - for room status updates, agent assignment, etc.
    const chatChannel = \`databases.\${window.chatConfig.appwriteDatabaseId}.collections.\${window.chatConfig.appwriteChatsCollectionId}.documents.\${chatId}\`;
    
    // Messages channel - for new messages in this chat
    const messagesChannel = \`databases.\${window.chatConfig.appwriteDatabaseId}.collections.\${window.chatConfig.appwriteMessagesCollectionId}.documents\`;
    
    // Subscribe to both channels using the correct Appwrite realtime API
    try {
      realtimeUnsubscribe = appwrite.subscribe([chatChannel, messagesChannel], response => {
        // Handle chat updates
        if (response.events.includes(\`databases.\${window.chatConfig.appwriteDatabaseId}.collections.\${window.chatConfig.appwriteChatsCollectionId}.documents.\${chatId}.update\`)) {
          handleChatUpdate(response.payload);
        }
        
        // Handle new messages
        if (response.events.includes(\`databases.\${window.chatConfig.appwriteDatabaseId}.collections.\${window.chatConfig.appwriteMessagesCollectionId}.documents.create\`)) {
          handleNewMessage(response.payload);
        }
      });
    } catch (error) {
      console.error("Failed to subscribe to realtime updates:", error);
      updateConnectionStatus("Failed to subscribe to updates", "red");
    }
  }
  
  function handleChatUpdate(chatData) {
    // Handle chat status changes
    if (chatData.status === 'active' && !connected) {
      connected = true;
      updateConnectionStatus(\`Connected with \${chatData.agentName || window.chatConfig.agentName}\`, "green");
      addSystemMessage(\`You are now connected with \${chatData.agentName || window.chatConfig.agentName}\`);
    } else if (chatData.status === 'ended') {
      connected = false;
      updateConnectionStatus("Chat ended", "gray");
      addSystemMessage("This chat session has ended.");
      
      // Unsubscribe from realtime updates
      if (realtimeUnsubscribe) {
        realtimeUnsubscribe();
        realtimeUnsubscribe = null;
      }
    }
    
    // Handle agent typing status
    if (chatData.agentTyping) {
      document.getElementById("typing-indicator").classList.remove("chat-hidden");
    } else {
      document.getElementById("typing-indicator").classList.add("chat-hidden");
    }
  }
  
  function handleNewMessage(messageData) {
    // Only process messages for this chat
    if (messageData.chatId === chatId) {
      // Check if the message is from an agent
      if (messageData.senderId !== window.chatConfig.userId) {
        addMessage(messageData.content, "agent");
        document.getElementById("typing-indicator").classList.add("chat-hidden");
      }
    }
  }
  
  function updateConnectionStatus(message, color) {
    const statusElement = document.getElementById("connection-status");
    if (!statusElement) return;
  
    statusElement.textContent = message;
  
    // Reset classes
    statusElement.className = "chat-text-xs chat-p-2 chat-text-center";
  
    // Add color-specific classes
    switch (color) {
      case "green":
        statusElement.style.backgroundColor = "#d1fae5";
        statusElement.style.color = "#047857";
        break;
      case "yellow":
        statusElement.style.backgroundColor = "#fef3c7";
        statusElement.style.color = "#92400e";
        break;
      case "red":
        statusElement.style.backgroundColor = "#fee2e2";
        statusElement.style.color = "#b91c1c";
        break;
      case "gray":
        statusElement.style.backgroundColor = "#f3f4f6";
        statusElement.style.color = "#4b5563";
        break;
      default:
        statusElement.style.backgroundColor = "#e0f2fe";
        statusElement.style.color = "#0369a1";
    }
  }
  
  async function sendUserMessage() {
    const chatInput = document.getElementById("chat-input");
    const message = chatInput.value.trim();
  
    if (message === "" || !chatId) return;
  
    // Add message to UI
    addMessage(message, "user");
  
    // Clear input
    chatInput.value = "";
  
    try {
      // Create message in Appwrite
      await database.createDocument(
        window.chatConfig.appwriteDatabaseId,
        window.chatConfig.appwriteMessagesCollectionId,
        'unique()',
        {
          companyId: window.chatConfig.companyId,
          chatId: chatId,
          content: message,
          senderId: window.chatConfig.userId,
          type: "text",
          status: "sent",
          createdAt: new Date().toISOString()
        }
      );
      
      // Update last message time in chat
      await database.updateDocument(
        window.chatConfig.appwriteDatabaseId,
        window.chatConfig.appwriteChatsCollectionId,
        chatId,
        {
          lastMessageAt: new Date().toISOString()
        }
      );
      
      // Clear typing indicator
      typing = false;
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      sendTypingStatus(false);
      
    } catch (error) {
      console.error("Error sending message:", error);
      addSystemMessage("Failed to send message. Please try again.");
    }
  }
  
  async function sendTypingStatus(isTyping) {
    if (!chatId) return;
    
    try {
      // Update chat document with typing status
      await database.updateDocument(
        window.chatConfig.appwriteDatabaseId,
        window.chatConfig.appwriteChatsCollectionId,
        chatId,
        {
          userTyping: isTyping
        }
      );
    } catch (error) {
      console.error("Error updating typing status:", error);
    }
  }
  
  function addMessage(text, sender) {
    const chatMessages = document.getElementById("chat-messages");
    const messageDiv = document.createElement("div");
  
    messageDiv.className = sender === "user" 
      ? "chat-flex chat-items-start chat-justify-end" 
      : "chat-flex chat-items-start";
  
    const messageBubble = document.createElement("div");
    messageBubble.className = "chat-rounded-lg chat-py-2 chat-px-3 chat-max-w-xs";
    
    if (sender === "user") {
      messageBubble.style.backgroundColor = window.chatConfig.theme.primary;
      messageBubble.style.color = window.chatConfig.theme.textLight;
    } else {
      messageBubble.style.backgroundColor = window.chatConfig.theme.secondary;
      messageBubble.style.color = window.chatConfig.theme.text;
    }
  
    const messageText = document.createElement("p");
    messageText.className = "chat-text-sm";
    messageText.textContent = text;
  
    messageBubble.appendChild(messageText);
    messageDiv.appendChild(messageBubble);
    chatMessages.appendChild(messageDiv);
  
    // Scroll to bottom of messages
    chatMessages.scrollTop = chatMessages.scrollHeight;
  
    // Hide typing indicator if this is an agent message
    if (sender === "agent") {
      document.getElementById("typing-indicator").classList.add("chat-hidden");
    }
  }
  
  function addSystemMessage(text) {
    const chatMessages = document.getElementById("chat-messages");
    const messageDiv = document.createElement("div");
  
    messageDiv.className = "chat-flex chat-items-center chat-justify-center";
  
    const messageBubble = document.createElement("div");
    messageBubble.className = "chat-bg-gray-100 chat-text-gray-500 chat-rounded-lg chat-py-1 chat-px-3 chat-max-w-xs chat-text-xs";
    messageBubble.textContent = text;
  
    messageDiv.appendChild(messageBubble);
    chatMessages.appendChild(messageDiv);
  
    // Scroll to bottom of messages
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
})();
  `;

  return script;
}