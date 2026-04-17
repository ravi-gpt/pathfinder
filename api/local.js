import express from 'express';
import dotenv from 'dotenv';
import generateHandler from './generate';
import chatHandler from './chat';

dotenv.config();

const app = express();
app.use(express.json());

// Mock Vercel res methods for local consumption
const mockVercel = (req, res, handler) => {
    const customRes = {
        status: (code) => {
            res.status(code);
            return customRes;
        },
        json: (data) => {
            res.json(data);
            return customRes;
        }
    };
    return handler(req, customRes);
};

app.post('/api/generate', (req, res) => mockVercel(req, res, generateHandler));
app.post('/api/chat', (req, res) => mockVercel(req, res, chatHandler));

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Local API proxy running at http://localhost:${PORT}`);
});
