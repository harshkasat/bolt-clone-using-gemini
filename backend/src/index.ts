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
const express = require('express');
const cors = require('cors');

const express = require('express');
const cors = require('cors');
require("dotenv").config();

const app = express();

app.use(cors({
    origin: true, // allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    exposedHeaders: ['Cross-Origin-Embedder-Policy', 'Cross-Origin-Opener-Policy']
}));

app.use(express.json());


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
