// Live Chat Widget with WebSocket Connection (ES6) and Vue
// This version connects to the Node.js WebSocket server

// Load dependencies
document.addEventListener("DOMContentLoaded", () => {
  // Load Vue CDN script
  const vueScript = document.createElement("script");
  vueScript.src = "https://unpkg.com/vue@3/dist/vue.global.js";
  vueScript.async = true;

  vueScript.onload = () => {
    // Load Socket.IO client script after Vue loads
    const socketScript = document.createElement("script");
    socketScript.src = "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";
    socketScript.async = true;

    socketScript.onload = () => {
      // Initialize chat widget after all scripts load
      initializeChatWidget();
    };

    document.head.appendChild(socketScript);
  };

  document.head.appendChild(vueScript);

  // Add necessary Tailwind styles
  const tailwindCDN = document.createElement("script");
  tailwindCDN.src = "https://unpkg.com/@tailwindcss/browser@4";
  document.head.appendChild(tailwindCDN);
});

let chatConfig = {
  serverUrl: "http://www.getchatlyze.com:3000",
  agentName: "Support Agent",
  welcomeMessage: "Hi there! How can we help you today?",
  userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
};

// WebSocket connection and chat variables
let socket;
let chatId;
let connected = false;
let typing = false;
let typingTimeout;

const initializeChatWidget = () => {
  // Create widget container
  const chatContainer = document.createElement("div");
  chatContainer.id = "live-chat-widget-app";
  document.body.appendChild(chatContainer);

  // Vue app template
  chatContainer.innerHTML = `
    <div class="fixed bottom-4 right-4 flex flex-col">
      <!-- Chat Button (Collapsed State) -->
      <button id="chat-button" v-show="!isChatOpen" @click="toggleChat" class="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg flex items-center justify-center ml-auto transition-all duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
      
      <!-- Chat Window (Expanded State) -->
      <div id="chat-window" v-show="isChatOpen" class="bg-white rounded-lg shadow-xl overflow-hidden w-72 md:w-80 mb-4 flex flex-col transition-all duration-300 max-h-96">
        <!-- Chat Header -->
        <div class="bg-blue-500 text-white p-4 flex justify-between items-center">
          <h3 class="font-medium">Live Support</h3>
          <button id="close-chat" @click="toggleChat" class="text-white hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Connection Status -->
        <div id="connection-status" :class="connectionStatusClass" class="text-xs p-2 text-center">
          {{ connectionStatus }}
        </div>
        
        <!-- Chat Messages -->
        <div id="chat-messages" class="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
          <div v-for="(msg, index) in messages" :key="index" :class="messageContainerClass(msg)">
            <div :class="messageBubbleClass(msg)">
              <p class="text-sm">{{ msg.text }}</p>
            </div>
          </div>
        </div>
        
        <!-- Typing Indicator -->
        <div id="typing-indicator" v-show="isAgentTyping" class="px-4 py-2 text-xs text-gray-500">
          Agent is typing...
        </div>
        
        <!-- Chat Input -->
        <div class="border-t p-3 bg-white">
          <div class="flex items-center">
            <input id="chat-input" v-model="userInput" @keypress.enter="sendUserMessage" @input="handleTyping" type="text" placeholder="Type a message..." class="flex-1 border rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <button id="send-message" @click="sendUserMessage" class="bg-blue-500 text-white rounded-r-lg px-4 py-2 hover:bg-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Create Vue app
  const { createApp } = Vue;

  const chatApp = createApp({
    data() {
      return {
        isChatOpen: false,
        connectionStatus: "Connecting to support...",
        connectionStatusClass: "bg-yellow-100 text-yellow-800",
        messages: [
          {
            type: "agent",
            text: chatConfig.welcomeMessage,
          },
        ],
        userInput: "",
        isAgentTyping: false,
      };
    },
    mounted() {
      this.connectToServer();
    },
    methods: {
      toggleChat() {
        this.isChatOpen = !this.isChatOpen;

        // If opening the chat and not connected, try to connect
        if (this.isChatOpen && !connected) {
          this.connectToServer();
        }

        // Force scroll to bottom when opening
        if (this.isChatOpen) {
          this.$nextTick(() => {
            const chatMessages = document.getElementById("chat-messages");
            if (chatMessages) {
              chatMessages.scrollTop = chatMessages.scrollHeight;
            }
          });
        }
      },

      connectToServer() {
        try {
          // Connect to WebSocket server
          socket = io(chatConfig.serverUrl);

          // Update connection status
          this.updateConnectionStatus("Connecting to support...", "yellow");

          // Connection established
          socket.on("connect", () => {
            console.log("Connected to chat server");
            this.updateConnectionStatus("Connected to support", "green");

            // Identify as a user to the server
            socket.emit("user:connect", {
              userId: chatConfig.userId,
              page: window.location.href,
              referrer: document.referrer,
              timestamp: new Date(),
            });
          });

          // Handle connection error
          socket.on("connect_error", (error) => {
            console.error("Connection error:", error);
            this.updateConnectionStatus("Unable to connect to support", "red");
          });

          // User is queued
          socket.on("user:queued", (data) => {
            this.updateConnectionStatus(
              `In queue (position ${data.position})`,
              "yellow"
            );
            this.addSystemMessage(data.message);
          });

          // Chat connected with agent
          socket.on("chat:connected", (data) => {
            chatId = data.chatId;
            connected = true;
            this.updateConnectionStatus(
              `Connected with ${data.agentName}`,
              "green"
            );
            this.addSystemMessage(data.message);
          });

          // Receive message
          socket.on("message:received", (data) => {
            if (data.sender.type === "agent") {
              this.addMessage(data.message, "agent");
            }
          });

          // Agent is typing
          socket.on("agent:typing", (data) => {
            this.isAgentTyping = data.isTyping;
          });

          // Agent disconnected
          socket.on("agent:disconnected", (data) => {
            this.updateConnectionStatus("Reconnecting...", "yellow");
            this.addSystemMessage(data.message);
          });

          // Chat ended
          socket.on("chat:ended", () => {
            connected = false;
            chatId = null;
            this.updateConnectionStatus("Chat ended", "gray");
            this.addSystemMessage("This chat session has ended.");
          });

          // Handle reconnection
          socket.on("reconnect", () => {
            this.updateConnectionStatus("Reconnected", "green");
            this.addSystemMessage("Reconnected to support.");

            // Re-identify as user
            socket.emit("user:connect", {
              userId: chatConfig.userId,
              page: window.location.href,
              referrer: document.referrer,
              timestamp: new Date(),
            });
          });

          // Handle disconnection
          socket.on("disconnect", () => {
            connected = false;
            this.updateConnectionStatus("Disconnected", "red");
            this.addSystemMessage(
              "Disconnected from support. Trying to reconnect..."
            );
          });
        } catch (error) {
          console.error("Failed to initialize WebSocket:", error);
          this.updateConnectionStatus("Connection failed", "red");
        }
      },

      updateConnectionStatus(message, color) {
        this.connectionStatus = message;

        // Set status color class
        switch (color) {
          case "green":
            this.connectionStatusClass = "bg-green-100 text-green-800";
            break;
          case "yellow":
            this.connectionStatusClass = "bg-yellow-100 text-yellow-800";
            break;
          case "red":
            this.connectionStatusClass = "bg-red-100 text-red-800";
            break;
          case "gray":
            this.connectionStatusClass = "bg-gray-100 text-gray-800";
            break;
          default:
            this.connectionStatusClass = "bg-blue-100 text-blue-800";
        }
      },

      sendUserMessage() {
        const message = this.userInput.trim();

        if (message === "" || !connected || !chatId) return;

        // Add message to UI
        this.addMessage(message, "user");

        // Clear input
        this.userInput = "";

        // Send message to server
        socket.emit("message:send", {
          chatId: chatId,
          message: message,
          sender: {
            id: chatConfig.userId,
            type: "user",
          },
          timestamp: new Date(),
        });

        // Clear typing indicator
        typing = false;
        if (typingTimeout) {
          clearTimeout(typingTimeout);
        }
        socket.emit("user:typing", { chatId, isTyping: false });
      },

      addMessage(text, sender) {
        this.messages.push({
          type: sender,
          text: text,
        });

        // Scroll to bottom of messages
        this.$nextTick(() => {
          const chatMessages = document.getElementById("chat-messages");
          if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
        });

        // Hide typing indicator if this is an agent message
        if (sender === "agent") {
          this.isAgentTyping = false;
        }
      },

      addSystemMessage(text) {
        this.messages.push({
          type: "system",
          text: text,
        });

        // Scroll to bottom of messages
        this.$nextTick(() => {
          const chatMessages = document.getElementById("chat-messages");
          if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
        });
      },

      handleTyping() {
        if (!typing && connected && chatId) {
          typing = true;
          socket.emit("user:typing", { chatId, isTyping: true });
        }

        // Clear existing timeout
        if (typingTimeout) {
          clearTimeout(typingTimeout);
        }

        // Set new timeout to stop typing indicator
        typingTimeout = setTimeout(() => {
          typing = false;
          if (connected && chatId) {
            socket.emit("user:typing", { chatId, isTyping: false });
          }
        }, 1000);
      },

      messageContainerClass(msg) {
        if (msg.type === "system") {
          return "flex items-center justify-center";
        }
        return msg.type === "user"
          ? "flex items-start justify-end"
          : "flex items-start";
      },

      messageBubbleClass(msg) {
        if (msg.type === "system") {
          return "bg-gray-100 text-gray-500 rounded-lg py-1 px-3 max-w-xs text-xs";
        }
        return msg.type === "user"
          ? "bg-blue-500 text-white rounded-lg py-2 px-3 max-w-xs"
          : "bg-gray-200 rounded-lg py-2 px-3 max-w-xs";
      },
    },
  });

  chatApp.mount("#live-chat-widget-app");
};

// Function to initialize the chat with custom settings
const configureLiveChat = (settings = {}) => {
  chatConfig = { ...chatConfig, ...settings };
  console.log("Chat configured with:", chatConfig);
};

// Export the configuration function for website owners to use
window.configureLiveChat = configureLiveChat;
