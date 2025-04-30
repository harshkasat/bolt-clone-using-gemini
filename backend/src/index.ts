import { getSystemPrompt, BASE_PROMPT } from "./prompts";
import {basePrompt as nodeBasePrompt} from "./defaults/node";
import {basePrompt as reactBasePrompt} from "./defaults/react";
import {basePrompt as nextBasePrompt} from "./defaults/next";
import express, { response } from "express";

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
const allowedOrigins = ['https://launchpad.cognitodev.space'];
const localhost = process.env.LOCAL_HOST ? true : false;
app.use(cors({
    origin: (origin, callback) => {
        if (localhost){
            callback(null, true);
            return;
        }
        else if (origin && allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Hey diddy what is this?'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    exposedHeaders: ['Cross-Origin-Embedder-Policy', 'Cross-Origin-Opener-Policy']
}));
app.use(express.json())

app.use((req, res, next) => {
    const origin = req.headers.origin;

    // if (localhost){
    //     res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    //     res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    //     res.setHeader('Access-Control-Allow-Origin', '*');
    //     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // Allow needed methods
    //     next();
    //     return;
    // }
    // Set COOP/COEP headers
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // Allow needed methods
        next();
    } else {
        res.status(403).json({
            message: `Hey diddy what is this?`
        })
    }
  });

app.get('/', async(req, res) =>{
    res.json({
        'message':"Server is running"
    })
    return;
})

app.post('/template', async (req, res) =>{

    const prompt = req.body.prompt;

    const result =  await model.generateContent({
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
    // console.log('Template response:', answer);

    if (answer.includes('react')){
        res.json({
            prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [reactBasePrompt]
        })
        return;
    }
    if (answer.includes('node')){
        res.json({
            prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [nodeBasePrompt]
        })
        return;
    }
    if (answer.includes('next')){
        res.json({
            prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [nextBasePrompt]
        })
        return;
    }

    res.status(403).json({
        messsage: "Hey diddy what is this?"
    })
    return;
    
})


app.post('/chat', async(req, res) => {
    const messages = req.body.messages;

    const result =  await model.generateContent({
        contents: messages,
        generationConfig: {
            maxOutputTokens: 10000,
            temperature: 0.1,
        }
    });

    if (result){
        res.json({
            response: result.response.text()
        })
        return;
    }
    
    res.status(403).json({
        messsage: "Hey diddy what is this?"
    })
    return;
})


// app.post('/stripxml', async(req, res) =>{
//     const xmlbody = req.body.xmlBody;
//     const fileContent = parseResponse(xmlbody)
    
//     res.status(200).json({
//         'jsonBody':fileContent,
//     })
//     return;

// })
if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => {
      console.log('Server running on port 3000');
    });
  }

module.exports =  app;
