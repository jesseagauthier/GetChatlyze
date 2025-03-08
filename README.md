# Multi-Tenant Live Chat System - Database Documentation

This document provides an overview of the database structure for the multi-tenant live chat system built on Appwrite. The system allows multiple companies to embed a customizable chat widget on their websites, with features for real-time communication, agent assignment, and performance tracking.

## Database Collections Overview

The database consists of seven primary collections:

1. **Companies** - Stores information about client companies using the chat service
2. **Users** - Contains profiles for agents and administrators
3. **Chat Rooms** - Represents individual chat sessions
4. **Chat Messages** - Stores all messages within chat rooms
5. **Chat Queue** - Manages waiting visitors
6. **Agent Stats** - Tracks agent performance metrics
7. **Chat Ratings** - Stores customer satisfaction ratings

## Collection Details

### 1. Companies Collection

Stores information about client companies using the chat service.

| Attribute       | Type     | Required              | Description                                   |
| --------------- | -------- | --------------------- | --------------------------------------------- |
| `$id`           | String   | Auto-generated        | Unique document identifier                    |
| `name`          | String   | Yes                   | Company name                                  |
| `domain`        | String   | No                    | Company website domain                        |
| `apiKey`        | String   | Yes                   | Unique API key for authentication             |
| `clientSecret`  | String   | No                    | Secret key for server-to-server communication |
| `plan`          | String   | No (default: "basic") | Subscription plan level                       |
| `active`        | Boolean  | No (default: true)    | Whether company account is active             |
| `contactEmail`  | String   | No                    | Primary contact email                         |
| `contactName`   | String   | No                    | Primary contact name                          |
| `settings`      | JSON     | No                    | Company-specific chat configuration settings  |
| `maxAgents`     | Integer  | No (default: 1)       | Maximum number of concurrent agents allowed   |
| `customization` | JSON     | No                    | Chat widget UI customization settings         |
| `createdAt`     | DateTime | No                    | When the company was created                  |
| `trialEndsAt`   | DateTime | No                    | When the trial period ends                    |

#### Indexes:

- `company_domain` (key) - Domain name
- `company_api_key` (unique) - API key
- `company_active` (key) - Active status
- `company_plan` (key) - Subscription plan

### 2. Users Collection

Contains profiles for support agents and administrators.

| Attribute    | Type     | Required                | Description                         |
| ------------ | -------- | ----------------------- | ----------------------------------- |
| `$id`        | String   | Auto-generated          | Unique document identifier          |
| `userId`     | String   | Yes                     | User identifier from authentication |
| `companyId`  | String   | Yes                     | Company this user belongs to        |
| `name`       | String   | Yes                     | User's full name                    |
| `email`      | String   | Yes                     | User's email address                |
| `role`       | String   | No (default: "user")    | User role (agent, admin, etc.)      |
| `avatarUrl`  | String   | No                      | Profile image URL                   |
| `status`     | String   | No (default: "offline") | Current online status               |
| `lastActive` | DateTime | No                      | When user was last active           |
| `createdAt`  | DateTime | No                      | When user was created               |

#### Indexes:

- `user_company` (key) - Company association
- `user_id_company` (unique) - Composite key of userId and companyId
- `user_role` (key) - User role
- `user_status` (key) - Online status
- `user_company_role` (key) - Composite of company and role

### 3. Chat Rooms Collection

Represents individual chat sessions between visitors and agents.

| Attribute       | Type     | Required                | Description                          |
| --------------- | -------- | ----------------------- | ------------------------------------ |
| `$id`           | String   | Auto-generated          | Unique document identifier           |
| `companyId`     | String   | Yes                     | Company ID this chat belongs to      |
| `name`          | String   | Yes                     | Chat session name/title              |
| `type`          | String   | No (default: "support") | Chat type (support, sales, etc.)     |
| `participants`  | String[] | Yes                     | Array of participant IDs             |
| `createdBy`     | String   | Yes                     | User ID who initiated the chat       |
| `status`        | String   | No (default: "active")  | Chat status (active, waiting, ended) |
| `metadata`      | JSON     | No                      | Additional chat metadata             |
| `visitorInfo`   | JSON     | No                      | Information about the visitor        |
| `referrerUrl`   | String   | No                      | Where visitor came from              |
| `lastMessageAt` | DateTime | No                      | When the last message was sent       |
| `createdAt`     | DateTime | No                      | When the chat was created            |
| `endedAt`       | DateTime | No                      | When the chat ended                  |

#### Indexes:

- `room_company` (key) - Company association
- `room_participants` (key) - Chat participants
- `room_status` (key) - Chat status
- `room_created_by` (key) - Chat creator
- `room_type` (key) - Chat type
- `room_last_message` (key) - Last message timestamp
- `room_company_status` (key) - Composite of company and status

### 4. Chat Messages Collection

Stores all messages within chat rooms.

| Attribute   | Type     | Required             | Description                            |
| ----------- | -------- | -------------------- | -------------------------------------- |
| `$id`       | String   | Auto-generated       | Unique document identifier             |
| `companyId` | String   | Yes                  | Company ID this message belongs to     |
| `roomId`    | String   | Yes                  | Chat room ID                           |
| `senderId`  | String   | Yes                  | User ID who sent the message           |
| `content`   | String   | Yes                  | Message content                        |
| `type`      | String   | No (default: "text") | Message type (text, file, system)      |
| `fileId`    | String   | No                   | File ID if message contains a file     |
| `status`    | String   | No (default: "sent") | Message status (sent, delivered, read) |
| `readBy`    | String[] | No                   | Array of user IDs who read the message |
| `metadata`  | JSON     | No                   | Additional message metadata            |
| `createdAt` | DateTime | No                   | When the message was created           |

#### Indexes:

- `message_company` (key) - Company association
- `message_room` (key) - Chat room association
- `message_sender` (key) - Message sender
- `message_created` (key) - Creation timestamp
- `message_room_time` (key) - Composite of room and timestamp
- `message_status` (key) - Message status
- `message_company_room` (key) - Composite of company and room

### 5. Chat Queue Collection

Manages visitors waiting for an agent.

| Attribute      | Type     | Required                | Description                                      |
| -------------- | -------- | ----------------------- | ------------------------------------------------ |
| `$id`          | String   | Auto-generated          | Unique document identifier                       |
| `companyId`    | String   | Yes                     | Company ID this queue entry belongs to           |
| `userId`       | String   | Yes                     | Visitor ID in queue                              |
| `status`       | String   | No (default: "waiting") | Queue status (waiting, assigned, timeout)        |
| `assignedTo`   | String   | No                      | Agent ID if assigned                             |
| `roomId`       | String   | No                      | Chat room ID once created                        |
| `priority`     | Integer  | No (default: 1)         | Queue priority (higher number = higher priority) |
| `metadata`     | JSON     | No                      | Additional queue metadata                        |
| `visitorInfo`  | JSON     | No                      | Information about the visitor                    |
| `waitingSince` | DateTime | No                      | When visitor joined the queue                    |

#### Indexes:

- `queue_company` (key) - Company association
- `queue_status` (key) - Queue status
- `queue_waiting_time` (key) - Wait time
- `queue_priority` (key) - Queue priority
- `queue_assigned_to` (key) - Assigned agent
- `queue_user` (key) - Visitor ID
- `queue_company_status` (key) - Composite of company and status

### 6. Agent Stats Collection

Tracks agent performance metrics.

| Attribute             | Type     | Required        | Description                          |
| --------------------- | -------- | --------------- | ------------------------------------ |
| `$id`                 | String   | Auto-generated  | Unique document identifier           |
| `companyId`           | String   | Yes             | Company ID these stats belong to     |
| `agentId`             | String   | Yes             | Agent ID                             |
| `date`                | DateTime | No              | Date of the stats                    |
| `totalChats`          | Integer  | No (default: 0) | Total number of chats handled        |
| `resolvedChats`       | Integer  | No (default: 0) | Number of chats resolved             |
| `averageResponseTime` | Integer  | No              | Average response time in seconds     |
| `averageChatDuration` | Integer  | No              | Average chat duration in seconds     |
| `customerRatings`     | Float    | No              | Average customer satisfaction rating |
| `onlineTime`          | Integer  | No              | Time agent was online in seconds     |

#### Indexes:

- `stats_company` (key) - Company association
- `stats_agent` (key) - Agent association
- `stats_date` (key) - Stats date
- `stats_agent_date_company` (unique) - Composite unique key
- `stats_company_date` (key) - Composite of company and date

### 7. Chat Ratings Collection

Stores customer satisfaction ratings.

| Attribute   | Type     | Required       | Description                       |
| ----------- | -------- | -------------- | --------------------------------- |
| `$id`       | String   | Auto-generated | Unique document identifier        |
| `companyId` | String   | Yes            | Company ID this rating belongs to |
| `roomId`    | String   | Yes            | Chat room ID being rated          |
| `userId`    | String   | Yes            | User ID who submitted the rating  |
| `agentId`   | String   | Yes            | Agent ID being rated              |
| `rating`    | Integer  | Yes            | Numerical rating (typically 1-5)  |
| `feedback`  | String   | No             | Optional text feedback            |
| `createdAt` | DateTime | No             | When the rating was submitted     |

#### Indexes:

- `rating_company` (key) - Company association
- `rating_room` (unique) - Chat room (one rating per chat)
- `rating_agent` (key) - Agent association
- `rating_value` (key) - Rating value
- `rating_company_agent` (key) - Composite of company and agent

## Data Relationships

- Each **Company** can have multiple **Users** (agents & admins)
- Each **Chat Room** belongs to one **Company** and contains multiple **Chat Messages**
- Each **Chat Message** belongs to one **Chat Room** and is sent by one **User**
- Each **Chat Queue** entry represents a visitor waiting to be assigned to an agent
- **Agent Stats** are aggregated performance metrics for each agent
- **Chat Ratings** provide customer feedback on specific chat sessions

## Security Considerations

- Company data is isolated through the `companyId` field in each collection
- All queries and realtime subscriptions should filter by `companyId` to maintain multi-tenancy
- Security rules are set to prevent cross-company data access
- The `apiKey` in the Companies collection is used to authenticate widget requests

## Database Diagrams

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│             │       │             │       │             │
│  Companies  │──1:N──│    Users    │──1:N──│ Agent Stats │
│             │       │             │       │             │
└─────────────┘       └─────────────┘       └─────────────┘
      │                     │
      │                     │
      │                     │
      │                     │
┌─────┴─────┐         ┌─────┴─────┐
│           │         │           │
│Chat Rooms │──1:N────│Chat Queue │
│           │         │           │
└─────┬─────┘         └───────────┘
      │
      │
      │
┌─────┴─────┐         ┌───────────┐
│           │         │           │
│  Messages │──1:1────│  Ratings  │
│           │         │           │
└───────────┘         └───────────┘
```

## Best Practices

1. Always filter data by `companyId` to maintain isolation between clients
2. Use indexes for common query patterns to improve performance
3. Store date/time values in ISO format for consistent sorting and filtering
4. Use JSON fields (`settings`, `metadata`, `visitorInfo`) for flexible, schema-less data
5. Keep all timestamps in UTC to avoid timezone issues
