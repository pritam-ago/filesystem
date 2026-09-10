# Folder Gumbo 🗂️

A modern, full-stack file management system built with Next.js and Node.js. Store, organize, and share your files with an intuitive web interface and robust backend infrastructure.

## ✨ Features

### 🔐 Authentication & Security

- User registration and login system
- JWT-based authentication
- Secure file access with user isolation
- Password hashing with bcrypt

### 📁 File Management

- **Upload Files**: Drag & drop or click to upload multiple files
- **Create Folders**: Organize your files in custom folder structures
- **File Operations**:
  - Rename files and folders
  - Delete files and folders
  - Download individual files
  - Download folders as ZIP archives
- **File Preview**: View file information and metadata
- **Breadcrumb Navigation**: Easy folder navigation

### 🎨 User Interface

- **Modern UI**: Built with Tailwind CSS and Radix UI components
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Mode**: Toggle between themes
- **Grid & List Views**: Choose your preferred file display mode
- **Context Menus**: Right-click for quick actions
- **Upload Progress**: Real-time upload progress indicators

### 🚀 Performance & Scalability

- **Chunked Uploads**: Handle large files efficiently
- **AWS S3 Integration**: Scalable cloud storage
- **Image Thumbnails**: Automatic thumbnail generation for images
- **Optimized Loading**: Lazy loading and efficient file listing

## 🛠️ Tech Stack

### Frontend (Client)

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives
- **State Management**: React Context API
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Authentication**: Custom JWT implementation

### Backend (Server)

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: any S3-compatible object store (MinIO locally, AWS S3 / R2 / Spaces in production)
- **Authentication**: JWT with bcrypt password hashing
- **File Processing**: Sharp for image processing, Archiver for ZIP creation
- **Upload Handling**: Multer with chunked upload support

### Infrastructure

- **Object Storage**: S3-compatible — MinIO via Docker for local development, any S3 provider in production
- **Database**: MongoDB — via Docker locally, MongoDB Atlas or self-hosted in production
- **Deployment**: Railway (backend), Vercel (frontend)

## 📦 Running locally

From a clean clone to a working app: one `docker compose up`, then one
`pnpm install && pnpm dev` per package. No AWS account and no MongoDB Atlas
account required — object storage and the database both run in Docker.

### Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 22 | Pinned in `.nvmrc`. Run `nvm use` if you have nvm. |
| pnpm | 10.7+ | `corepack enable` then `corepack install` picks it up from `packageManager`. |
| Docker | any recent | For MinIO (S3-compatible storage) and MongoDB. |

There is no npm/yarn fallback: both packages have `pnpm-lock.yaml` committed and
npm lockfiles are gitignored.

### 1. Start the infrastructure

```bash
docker compose up -d
```

This starts three things:

| Service | Address | Purpose |
| --- | --- | --- |
| MinIO (S3 API) | http://127.0.0.1:9000 | Object storage the server reads and writes |
| MinIO console | http://127.0.0.1:9001 | Web UI to browse the bucket — login `minioadmin` / `minioadmin` |
| MongoDB | mongodb://127.0.0.1:27017 | Users and sessions |

A one-shot `createbucket` container creates the `folder-gumbo` bucket and then
exits — seeing it as `Exited (0)` in `docker compose ps` is success, not a failure.

> **Already running mongod on 27017?** Start the stack on a different host port
> and point `MONGODB_URI` at it:
> ```bash
> MONGO_PORT=27018 docker compose up -d
> ```

### 2. Configure the server

```bash
cd server
cp .env.example .env
```

The defaults in `.env.example` already point at the Docker services above. The
only value you must supply is `JWT_SECRET`, which has no default — the server
refuses to start without one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

For reference, these are the values that point the server at local MinIO:

```env
S3_ENDPOINT=http://127.0.0.1:9000
S3_REGION=us-east-1
S3_BUCKET=folder-gumbo
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
```

The storage layer is provider-neutral — it speaks plain S3 protocol with
path-style addressing. To use AWS S3, Cloudflare R2 or DigitalOcean Spaces
instead, leave `S3_ENDPOINT` **empty** for AWS (the SDK resolves the regional
endpoint itself) or set it to the provider's endpoint, then supply that
provider's region, bucket and key pair. Nothing else changes.

### 3. Configure the client

```bash
cd client
cp .env.example .env.local
```

The default is correct for local development:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

### 4. Run both apps

Two terminals, one command each:

```bash
# Terminal 1 — API on http://localhost:3000
cd server && pnpm install && pnpm dev
```

```bash
# Terminal 2 — web app on http://localhost:5000
cd client && pnpm install && pnpm dev
```

Then open **http://localhost:5000** and sign up.

### Expected ports

| What | Port | Why it matters |
| --- | --- | --- |
| API server | 3000 | `PORT` in `server/.env` |
| Web client | 5000 | Fixed by `next dev -p 5000`; must differ from the API port |
| MinIO S3 API | 9000 | `S3_ENDPOINT` |
| MinIO console | 9001 | Browsing the bucket |
| MongoDB | 27017 | `MONGODB_URI` |

The client and server **must not share a port**, and the client's origin must
appear in the server's `CORS_ORIGINS` (it defaults to `http://localhost:5000`).
If you move the client, update `CORS_ORIGINS` to match or every request will
fail CORS.

### Verifying it works

A healthy server logs:

```
S3 configuration: { endpoint: 'http://127.0.0.1:9000', ... }
Connected to MongoDB
Server is running on http://localhost:3000
Allowed CORS origins: http://localhost:5000
S3 connection successful
```

Sign up in the web app, then check the MinIO console at
http://127.0.0.1:9001 — a new `users/<your-id>/` prefix with `documents/`,
`images/` and `videos/` folders confirms the whole chain is wired up.

### Troubleshooting

| Symptom | Cause |
| --- | --- |
| `Missing required environment variable(s): JWT_SECRET` | You skipped step 2. The server exits 1 rather than starting broken. |
| `Failed to connect to MongoDB` then exit 1 | `docker compose up -d` not run, or `MONGODB_URI` points at the wrong port. |
| `Missing required S3 environment variables` | `server/.env` missing or incomplete. |
| Requests fail in the browser with a CORS error | The client is not being served from an origin in `CORS_ORIGINS`. |
| `EADDRINUSE :::3000` | Something else holds the API port — often a previous `pnpm dev`. |

### Production build

```bash
cd server && pnpm build && pnpm start   # tsc -> dist/, then node dist/server.js
cd client && pnpm build && pnpm start
```

The server honours the injected `PORT`, so it deploys to Railway or any
similar host unchanged. Set every variable from `server/.env.example` in the
host's dashboard, and set `CORS_ORIGINS` to the deployed client's URL.
## 🚀 Usage

### Getting Started

1. **Sign Up**: Create a new account with email and password
2. **Login**: Access your personal file storage
3. **Upload Files**: Drag and drop files or use the upload button
4. **Organize**: Create folders to organize your files
5. **Manage**: Use right-click context menus for file operations

### File Operations

- **Upload**: Select files or drag them to the upload area
- **Create Folder**: Click the "New Folder" button and enter a name
- **Rename**: Right-click on a file/folder and select "Rename"
- **Delete**: Right-click and select "Delete" (use with caution)
- **Download**: Click the download icon or right-click and select "Download"
- **Navigate**: Click on folders to navigate, use breadcrumbs to go back

### Keyboard Shortcuts

- `Ctrl/Cmd + A`: Select all files
- `Delete`: Delete selected files
- `F2`: Rename selected file/folder
- `Enter`: Open folder or download file

## 📁 Project Structure

```
filesystem/
├── client/                 # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── lib/              # Utilities and services
│   └── public/           # Static assets
├── server/               # Express.js backend
│   ├── controllers/      # Route controllers
│   ├── middlewares/      # Express middlewares
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── workers/         # Background workers
└── README.md
```

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### File Management

- `GET /api/files/list` - List files and folders
- `POST /api/files/upload` - Upload files
- `POST /api/files/folder` - Create folder
- `POST /api/files/delete` - Delete file/folder
- `POST /api/files/rename` - Rename file/folder
- `GET /api/files/download/*` - Download folder as ZIP
- `GET /api/files/download-file` - Download individual file
- `GET /api/files/signed-url` - Get signed URL for file access

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🔮 Roadmap

- [ ] File sharing with public links
- [ ] Collaborative editing
- [ ] File versioning
- [ ] Advanced search and filtering
- [ ] Mobile app
- [ ] Integration with cloud storage providers
- [ ] Real-time collaboration features

---

**Built with ❤️ using Next.js, Express.js, and MongoDB**
