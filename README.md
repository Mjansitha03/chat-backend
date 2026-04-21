# Chat Backend
A scalable, real-time chat application backend built with Node.js, Express.js, Socket.io, and MongoDB. Supports user authentication, private/group chats, real-time messaging, image uploads via Cloudinary, email notifications, and comprehensive error handling.

## ✨ Features

- **User Authentication & Authorization**: JWT-based auth, bcrypt password hashing, protected routes.
- **Real-time Chat**: Socket.io for instant messaging, private and group chats.
- **Chat Management**: Create/join chats, fetch chats, send/retrieve messages.
- **Media Uploads**: Image uploads with Multer & Cloudinary integration.
- **Email Notifications**: Nodemailer/SendGrid for user alerts.
- **Rate Limiting & Security**: Helmet, CORS, rate limiting, input validation.
- **RESTful APIs**: Clean MVC architecture with services layer for business logic.
- **Error Handling**: Global error middleware, custom API responses.
- **Logging**: Morgan for request logging.

## 🛠️ Tech Stack

| Category      | Technologies                                |
|---------------|---------------------------------------------|
| **Runtime**   | Node.js                                     |
| **Framework** | Express.js (ESM)                            |
| **Database**  | MongoDB + Mongoose                          |
| **Real-time** | Socket.io                                   |
| **Auth**      | JWT, bcryptjs                               |
| **Upload**    | Multer, Cloudinary                          |
| **Email**     | Nodemailer, SendGrid                        |
| **Security**  | Helmet, express-rate-limit, CORS, validator |
| **Utils**     | AsyncHandler, custom APIError/Response      |
| **Dev Tools** | Nodemon, Morgan                             |

## 📦 Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- Cloudinary account (for uploads)
- Nodemailer ( for emails)

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd chat-backend
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and fill values:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/chatapp  # or Atlas URI

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Nodemailer 
NODEMAILER_EMAIL=your_email
NODEMAILER_PASSWORD=your_email_password

# Server
PORT=5000
NODE_ENV=development
```

### 3. Run the Application

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5000`.

### 4. Seed Database (Optional)

```bash
npm run seed
```

Populates DB with sample users, chats, and messages.

## 🔌 API Endpoints

Base URL: `http://localhost:5000/api`

### Auth Routes (`/auth`)
| Method | Endpoint    | Description   | Auth |
|--------|-------------|---------------|------|
| POST   | `/register` | Register user | No   |
| POST   | `/login`    | Login user    | No   |
| POST   | `/logout`   | Logout        | Yes  |

### User Routes (`/users`)
| Method | Endpoint   | Description      | Auth |
|--------|------------|------------------|------|
| GET    | `/profile` | Get user profile | Yes  |
| PUT    | `/profile` | Update profile   | Yes  |
| GET    | `/:id`     | Get user by ID   | Yes  |

### Chat Routes (`/chats`)
| Method | Endpoint | Description        | Auth |
|--------|----------|--------------------|------|
| POST   | `/`      | Create/access chat | Yes  |
| GET    | `/`      | Fetch user chats   | Yes  |
| GET    | `/:id`   | Fetch chat details | Yes  |

### Message Routes (`/messages`)
| Method | Endpoint   | Description    | Auth |
|--------|------------|----------------|------|
| POST   | `/:chatId` | Send message   | Yes  |
| GET    | `/:chatId` | Fetch messages | Yes  |

### Upload Routes (`/upload`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST   | `/image` | Upload image| Yes  |

**Note**: All protected routes require `Authorization: Bearer <token>` header.

## ⚡ Real-time Features (Socket.io)

Connect to `ws://localhost:5000/socket.io`:

- `joinChat(chatId)`: Join specific chat room.
- `sendMessage(chatId, message)`: Send real-time message.
- `message:received`: Listen for new messages.

## 📁 Project Structure

```
chat-backend/
├── Config/          # DB, Cloudinary config
├── Controllers/     # Request handlers
├── Middlewares/     # Auth, error, upload middleware
├── Models/          # Mongoose schemas (User, Chat, Message)
├── Routes/          # Express routes
├── Services/        # Business logic
├── Sockets/         # Socket.io handlers           # DB seeders
├── Utils/           # Helpers (mailer, token gen, etc.)
├── .env.example
├── index.js         # Entry point
├── package.json
└── README.md
```

## 🔒 Environment Variables

See `.env.example` for full list.

## 🤝 Contributing

1. Fork the project.
2. Create feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to branch (`git push origin feature/AmazingFeature`).
5. Open Pull Request.

## 📄 License

This project is [ISC](LICENSE) licensed.

## 👨‍💻 Author

**Jansitha**
---

⭐ Star this repo if you found it helpful!

