import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import userAuthRouter from './routes/auth.user.js';
import fileRoutes from './routes/file.routes.js';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = 3000;

interface CorsOptions {
  origin: string[];
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
}

const corsOptions: CorsOptions = {
  origin: [
    'http://localhost:5000',
    'http://192.168.1.7:5000',
    'http://172.23.128.1:5000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', userAuthRouter);
app.use('/api/files', fileRoutes);

app.get('/', (_req: express.Request, res: express.Response) => {
  res.send('Hello World!');
});

app.head('/', (_req: express.Request, res: express.Response) => {
  res.status(200).send();
});

mongoose.connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error: Error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 