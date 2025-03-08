// chat-server.js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import winston from "winston";

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Configure logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.printf(
      (info) =>
        `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`
    )
  ),
  transports: [
    // Log to the console
    new winston.transports.Console(),
    // Log to a file
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
    }),
  ],
});

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO with CORS settings
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict to your domain
    methods: ["GET", "POST"],
  },
});

// In-memory storage for active chats and users
// In a production environment, use a database
const activeChats = {};
const onlineAgents = [];
const userQueue = [];

// Route to check server status
app.get("/status", (req, res) => {
  const status = {
    status: "online",
    activeChats: Object.keys(activeChats).length,
    onlineAgents: onlineAgents.length,
    usersInQueue: userQueue.length,
  };

  logger.info(`Status check: ${JSON.stringify(status)}`);
  res.json(status);
});

// Route to view logs
app.get("/logs", (req, res) => {
  const logType = req.query.type || "combined";
  const logFile = path.join(logsDir, `${logType}.log`);

  if (!fs.existsSync(logFile)) {
    logger.warn(`Log file not found: ${logFile}`);
    return res.status(404).json({ error: "Log file not found" });
  }

  // Read the most recent logs (last 100 lines)
  const logs = fs
    .readFileSync(logFile, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .slice(-100);

  logger.info(`Logs viewed: ${logType}`);
  res.json({ logs });
});

// WebSocket connection handling
io.on("connection", (socket) => {
  logger.info(`New connection: ${socket.id} from ${socket.handshake.address}`);

  // User connects to chat
  socket.on("user:connect", (userData) => {
    logger.info(`User connected: ${userData.userId} (Socket: ${socket.id})`);
    logger.debug(`User data: ${JSON.stringify(userData)}`);

    // Create a room for this user
    socket.join(`user:${userData.userId}`);
    logger.debug(`User joined room: user:${userData.userId}`);

    // Add user to queue if no agents available
    if (onlineAgents.length === 0) {
      userQueue.push({
        userId: userData.userId,
        socketId: socket.id,
        timestamp: new Date(),
        userData,
      });

      logger.info(
        `User queued: ${userData.userId}, Queue position: ${userQueue.length}`
      );

      // Send queue position to user
      socket.emit("user:queued", {
        position: userQueue.length,
        message: "All our agents are currently busy. You are in queue.",
      });
    } else {
      // Assign to least busy agent
      logger.info(`Assigning user ${userData.userId} to an agent`);
      assignUserToAgent(userData.userId, socket.id, userData);
    }
  });

  // Agent connects to system
  socket.on("agent:connect", (agentData) => {
    logger.info(`Agent connected: ${agentData.agentId} (Socket: ${socket.id})`);
    logger.debug(`Agent data: ${JSON.stringify(agentData)}`);

    // Register agent as available
    onlineAgents.push({
      agentId: agentData.agentId,
      socketId: socket.id,
      activeChats: 0,
      name: agentData.name || "Support Agent",
    });

    logger.info(
      `Agent registered: ${agentData.agentId}, Total agents: ${onlineAgents.length}`
    );

    // Create a room for this agent
    socket.join(`agent:${agentData.agentId}`);
    logger.debug(`Agent joined room: agent:${agentData.agentId}`);

    // Send current queue info to agent
    socket.emit("agent:queue_update", {
      queueLength: userQueue.length,
    });

    // Assign queued users if available
    if (userQueue.length > 0) {
      logger.info(
        `Processing queue for new agent. Queue length: ${userQueue.length}`
      );
      processQueue();
    }
  });

  // Handle chat messages
  socket.on("message:send", (messageData) => {
    const { chatId, message, sender, timestamp } = messageData;

    // Check if this chat exists
    if (!activeChats[chatId]) {
      logger.warn(`Message sent to non-existent chat: ${chatId}`);
      socket.emit("error", { message: "Chat not found" });
      return;
    }

    logger.info(
      `Message sent in chat ${chatId} from ${sender.type} ${sender.id}`
    );
    logger.debug(`Message content: ${message}`);

    // Store the message
    const newMessage = {
      id: generateMessageId(),
      chatId,
      message,
      sender,
      timestamp: timestamp || new Date(),
    };

    activeChats[chatId].messages.push(newMessage);

    // Route message to the right recipient
    if (sender.type === "user") {
      // Send to agent
      const agentId = activeChats[chatId].agentId;
      logger.debug(`Routing message from user to agent: ${agentId}`);
      io.to(`agent:${agentId}`).emit("message:received", newMessage);
    } else {
      // Send to user
      const userId = activeChats[chatId].userId;
      logger.debug(`Routing message from agent to user: ${userId}`);
      io.to(`user:${userId}`).emit("message:received", newMessage);
    }
  });

  // User or agent requests chat history
  socket.on("chat:history", ({ chatId }) => {
    logger.info(`Chat history requested for: ${chatId}`);

    if (activeChats[chatId]) {
      socket.emit("chat:history", {
        chatId,
        messages: activeChats[chatId].messages,
      });
      logger.debug(
        `Chat history sent with ${activeChats[chatId].messages.length} messages`
      );
    } else {
      logger.warn(`Chat history requested for non-existent chat: ${chatId}`);
      socket.emit("error", { message: "Chat history not found" });
    }
  });

  // Agent picks a user from queue
  socket.on("agent:pick_user", ({ agentId, queuePosition }) => {
    logger.info(
      `Agent ${agentId} picking user from queue position ${queuePosition}`
    );

    if (queuePosition >= 0 && queuePosition < userQueue.length) {
      const userData = userQueue[queuePosition];
      userQueue.splice(queuePosition, 1);

      logger.info(
        `User ${userData.userId} removed from queue by agent ${agentId}`
      );

      assignUserToAgent(
        userData.userId,
        userData.socketId,
        userData.userData,
        agentId
      );

      // Update all agents with new queue length
      io.to("agents").emit("agent:queue_update", {
        queueLength: userQueue.length,
      });
      logger.debug(
        `Agent queue update broadcast. New queue length: ${userQueue.length}`
      );
    } else {
      logger.warn(
        `Invalid queue position selected: ${queuePosition}. Queue length: ${userQueue.length}`
      );
    }
  });

  // User or agent ends chat
  socket.on("chat:end", ({ chatId }) => {
    logger.info(`Chat end requested for: ${chatId}`);

    if (activeChats[chatId]) {
      const { userId, agentId } = activeChats[chatId];

      logger.info(
        `Ending chat ${chatId} between user ${userId} and agent ${agentId}`
      );

      // Notify both parties
      io.to(`user:${userId}`).emit("chat:ended", { chatId });
      io.to(`agent:${agentId}`).emit("chat:ended", { chatId });

      // Update agent's active chat count
      const agentIndex = onlineAgents.findIndex(
        (agent) => agent.agentId === agentId
      );
      if (agentIndex !== -1) {
        onlineAgents[agentIndex].activeChats--;
        logger.debug(
          `Decreased agent ${agentId} active chat count to: ${onlineAgents[agentIndex].activeChats}`
        );
      }

      // Store chat history for future reference
      // In production, this would go to a database
      const chatHistory = JSON.stringify(activeChats[chatId]);
      const chatDir = path.join(logsDir, "chat-history");

      if (!fs.existsSync(chatDir)) {
        fs.mkdirSync(chatDir);
      }

      fs.writeFileSync(path.join(chatDir, `${chatId}.json`), chatHistory);
      logger.info(`Chat ${chatId} history saved to file`);

      // Remove from active chats
      delete activeChats[chatId];
    } else {
      logger.warn(`End requested for non-existent chat: ${chatId}`);
    }
  });

  // Handle typing indicators
  socket.on("user:typing", ({ chatId, isTyping }) => {
    if (activeChats[chatId]) {
      const agentId = activeChats[chatId].agentId;
      logger.debug(
        `User typing indicator (${isTyping}) in chat ${chatId} sent to agent ${agentId}`
      );
      io.to(`agent:${agentId}`).emit("user:typing", {
        chatId,
        isTyping,
      });
    }
  });

  socket.on("agent:typing", ({ chatId, isTyping }) => {
    if (activeChats[chatId]) {
      const userId = activeChats[chatId].userId;
      logger.debug(
        `Agent typing indicator (${isTyping}) in chat ${chatId} sent to user ${userId}`
      );
      io.to(`user:${userId}`).emit("agent:typing", {
        chatId,
        isTyping,
      });
    }
  });

  // Disconnect handling
  socket.on("disconnect", () => {
    logger.info(`Disconnected: ${socket.id}`);

    // Check if this was an agent
    const agentIndex = onlineAgents.findIndex(
      (agent) => agent.socketId === socket.id
    );
    if (agentIndex !== -1) {
      const agentId = onlineAgents[agentIndex].agentId;

      logger.info(`Agent ${agentId} disconnected`);

      // Remove agent
      onlineAgents.splice(agentIndex, 1);
      logger.debug(
        `Agent removed from online list. Remaining agents: ${onlineAgents.length}`
      );

      // Find all chats with this agent and mark them for reassignment
      Object.keys(activeChats).forEach((chatId) => {
        if (activeChats[chatId].agentId === agentId) {
          logger.info(
            `Reassigning chat ${chatId} after agent ${agentId} disconnected`
          );

          // Put user back in queue
          userQueue.push({
            userId: activeChats[chatId].userId,
            socketId: activeChats[chatId].userSocketId,
            timestamp: new Date(),
            userData: activeChats[chatId].userData,
          });

          logger.debug(
            `User ${activeChats[chatId].userId} added back to queue`
          );

          // Notify user that agent disconnected
          io.to(`user:${activeChats[chatId].userId}`).emit(
            "agent:disconnected",
            {
              message:
                "Agent disconnected. You are being transferred to another agent.",
            }
          );

          // Store the chat history before deleting
          const chatHistory = JSON.stringify(activeChats[chatId]);
          const chatDir = path.join(logsDir, "chat-history");

          if (!fs.existsSync(chatDir)) {
            fs.mkdirSync(chatDir);
          }

          fs.writeFileSync(
            path.join(chatDir, `${chatId}_interrupted.json`),
            chatHistory
          );
          logger.info(`Interrupted chat ${chatId} history saved to file`);

          // Delete this chat
          delete activeChats[chatId];
        }
      });

      // Process queue for remaining agents
      if (onlineAgents.length > 0 && userQueue.length > 0) {
        logger.info(
          `Processing queue after agent disconnect. Queue length: ${userQueue.length}`
        );
        processQueue();
      }
    }

    // Check if this was a user in queue
    const queueIndex = userQueue.findIndex(
      (user) => user.socketId === socket.id
    );
    if (queueIndex !== -1) {
      logger.info(`Queued user ${userQueue[queueIndex].userId} disconnected`);
      userQueue.splice(queueIndex, 1);

      // Update agents with new queue length
      io.to("agents").emit("agent:queue_update", {
        queueLength: userQueue.length,
      });
      logger.debug(
        `Agent queue update broadcast. New queue length: ${userQueue.length}`
      );
    }

    // Check if this was a user in active chat
    Object.keys(activeChats).forEach((chatId) => {
      if (activeChats[chatId].userSocketId === socket.id) {
        const agentId = activeChats[chatId].agentId;
        const userId = activeChats[chatId].userId;

        logger.info(`User ${userId} in active chat ${chatId} disconnected`);

        // Notify agent that user disconnected
        io.to(`agent:${agentId}`).emit("user:disconnected", {
          chatId,
          message: "User disconnected",
        });

        // Update agent's active chat count
        const agentIndex = onlineAgents.findIndex(
          (agent) => agent.agentId === agentId
        );
        if (agentIndex !== -1) {
          onlineAgents[agentIndex].activeChats--;
          logger.debug(
            `Decreased agent ${agentId} active chat count to: ${onlineAgents[agentIndex].activeChats}`
          );
        }

        // Store the chat history before deleting
        const chatHistory = JSON.stringify(activeChats[chatId]);
        const chatDir = path.join(logsDir, "chat-history");

        if (!fs.existsSync(chatDir)) {
          fs.mkdirSync(chatDir);
        }

        fs.writeFileSync(
          path.join(chatDir, `${chatId}_user_disconnected.json`),
          chatHistory
        );
        logger.info(`User-disconnected chat ${chatId} history saved to file`);

        // Archive chat
        delete activeChats[chatId];
      }
    });
  });
});

// Helper functions
const assignUserToAgent = (
  userId,
  userSocketId,
  userData,
  specificAgentId = null
) => {
  // Find the agent with the least number of active chats
  // or use the specified agent
  let selectedAgent;

  if (specificAgentId) {
    selectedAgent = onlineAgents.find(
      (agent) => agent.agentId === specificAgentId
    );
    logger.debug(`Specific agent requested: ${specificAgentId}`);
  } else {
    selectedAgent = onlineAgents.reduce((prev, curr) =>
      prev.activeChats < curr.activeChats ? prev : curr
    );
    logger.debug(`Least busy agent selected: ${selectedAgent?.agentId}`);
  }

  if (!selectedAgent) {
    // Put user in queue if no agent available
    userQueue.push({
      userId,
      socketId: userSocketId,
      timestamp: new Date(),
      userData,
    });

    logger.info(
      `No agents available. User ${userId} added to queue. Position: ${userQueue.length}`
    );

    io.to(`user:${userId}`).emit("user:queued", {
      position: userQueue.length,
      message: "All our agents are currently busy. You are in queue.",
    });
    return;
  }

  // Create a new chat
  const chatId = generateChatId();

  logger.info(
    `Creating new chat ${chatId} between user ${userId} and agent ${selectedAgent.agentId}`
  );

  activeChats[chatId] = {
    chatId,
    userId,
    userSocketId,
    agentId: selectedAgent.agentId,
    agentName: selectedAgent.name,
    startTime: new Date(),
    messages: [],
    userData,
  };

  // Increase agent's active chat count
  selectedAgent.activeChats++;
  logger.debug(
    `Increased agent ${selectedAgent.agentId} active chat count to: ${selectedAgent.activeChats}`
  );

  // Notify user of connection
  io.to(`user:${userId}`).emit("chat:connected", {
    chatId,
    agentName: selectedAgent.name,
    message: `You are now connected with ${selectedAgent.name}`,
  });

  // Notify agent of new chat
  io.to(`agent:${selectedAgent.agentId}`).emit("chat:assigned", {
    chatId,
    userData,
    message: "New user assigned to you",
  });
};

const processQueue = () => {
  // Process users in queue if there are available agents
  if (userQueue.length > 0 && onlineAgents.length > 0) {
    // Get the user who has been waiting the longest
    const nextUser = userQueue.shift();

    logger.info(`Processing queue: User ${nextUser.userId} removed from queue`);

    // Assign to an agent
    assignUserToAgent(nextUser.userId, nextUser.socketId, nextUser.userData);

    // Update all agents with new queue length
    io.to("agents").emit("agent:queue_update", {
      queueLength: userQueue.length,
    });

    logger.debug(
      `Agent queue update broadcast. New queue length: ${userQueue.length}`
    );
  }
};

// Generate unique IDs
const generateChatId = () => {
  const id = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  logger.debug(`Generated new chat ID: ${id}`);
  return id;
};

const generateMessageId = () => {
  const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  logger.debug(`Generated new message ID: ${id}`);
  return id;
};

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Live chat server started on port ${PORT}`);
  logger.info(`Server environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`Log files located at: ${logsDir}`);
});

// Handle server errors
server.on("error", (error) => {
  logger.error(`Server error: ${error.message}`);
  logger.error(error.stack);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error(`Uncaught exception: ${error.message}`);
  logger.error(error.stack);
  // Keep the server running even after uncaught exception
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled promise rejection");
  logger.error(`Reason: ${reason}`);
});

export { app, server, io };
