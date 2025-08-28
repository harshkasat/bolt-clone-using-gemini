import { getSystemPrompt, BASE_PROMPT } from "./prompts";
import {basePrompt as nodeBasePrompt} from "./defaults/node";
import {basePrompt as reactBasePrompt} from "./defaults/react";
import {basePrompt as nextBasePrompt} from "./defaults/next";
import express from "express";
import cors from "cors";

require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: getSystemPrompt(),
});

const app = express();
const allowedOrigins = ['https://www.cognitodev.space', 'https://launchpad.cognitodev.space'];
const localhost = process.env.LOCAL_HOST ? true : false;

// Allow all origins with CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

app.use(express.json());

app.get('/', async(req, res) => {
    res.json({
        'message': "Server is running"
    });
});

app.post('/template', async (req, res) => {
    try {
        const prompt = req.body.prompt;

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: "Return either node, react or next based on what do you think this project should be. Only return a single word either 'node', 'react' or 'next' . Do not return anything extra: " + prompt,
                        }
                    ]
                }
            ],
            generationConfig: {
                maxOutputTokens: 200,
                temperature: 0.1,
            }
        });

        const answer = result.response.text().toLowerCase().trim();

        if (answer.includes('react')) {
            res.json({
                prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [reactBasePrompt]
            });
            return;
        }
        if (answer.includes('node')) {
            res.json({
                prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [nodeBasePrompt]
            });
            return;
        }
        if (answer.includes('next')) {
            res.json({
                prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nextBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [nextBasePrompt]
            });
            return;
        }

        res.status(400).json({
            message: "Invalid template type"
        });
    } catch (error) {
        console.error('Template error:', error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

app.post('/chat', async(req, res) => {
    try {
        const messages = req.body.messages;

        const result = await model.generateContent({
            contents: messages,
            generationConfig: {
                maxOutputTokens: 10000,
                temperature: 0.1,
            }
        });

        if (result) {
            res.json({
                response: result.response.text()
            });
            return;
        }
        
        res.status(500).json({
            message: "No response generated"
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => {
        console.log('Server running on port 3000');
    });
}

module.exports = app;