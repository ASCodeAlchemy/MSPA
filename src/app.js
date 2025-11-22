import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.js';
import questionRoutes from './routes/questions.js';

import testRoutes from './routes/tests.js';
import resultRoutes from './routes/results.js';


import 'dotenv/config';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});


app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());


app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/results', resultRoutes);


io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-test', (testId) => {
        socket.join(testId);
        console.log(`User ${socket.id} joined test ${testId}`);
    });

    socket.on('time-update', (data) => {
        socket.to(data.testId).emit('time-update', data);
    });

    socket.on('test-submitted', (data) => {
        socket.to(data.testId).emit('test-submitted', data);
    });

});


export { app, io, server };