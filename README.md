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
- **File Storage**: AWS S3
- **Authentication**: JWT with bcrypt password hashing
- **File Processing**: Sharp for image processing, Archiver for ZIP creation
- **Upload Handling**: Multer with chunked upload support

### Infrastructure

- **Cloud Storage**: AWS S3
- **Database**: MongoDB Atlas
- **Deployment**: Railway (backend), Vercel (frontend)

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- MongoDB database
- AWS S3 bucket
- Railway account (for deployment)

### Environment Variables

#### Backend (.env)

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_s3_bucket_name
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:5000
```

### Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd filesystem
   ```

2. **Install dependencies**

   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   pnpm install
   ```

3. **Start the development servers**

   ```bash
   # Start backend server (from server directory)
   npm run dev

   # Start frontend server (from client directory)
   pnpm dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5000
   - Backend API: http://localhost:3000

### Production Deployment

#### Backend (Railway)

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

#### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

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

https://roadmap.sh/projects/ecommerce-api

---

**Built with ❤️ using Next.js, Express.js, and MongoDB**
