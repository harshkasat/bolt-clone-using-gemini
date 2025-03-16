"use client"

import React, { useState, useRef, useEffect } from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import {
  Code,
  Eye,
  MessageSquare,
  Play,
  Settings,
  Terminal as TerminalIcon,
  RefreshCw,
  Send,
  Image,
} from "lucide-react"
import { WebContainer } from '@webcontainer/api'
import { FileExplorer } from "../components/FileExplorer"
import { CodeEditor } from "../components/CodeEditor"
import { PreviewFrame } from "../components/PreviewFrame"
import { Terminal } from "../components/Terminal"

import axios from "axios";
import { BACKEND_URL } from "../config"; // Make sure this is accessible
import { useLocation } from 'react-router-dom';
import { parseResponse } from "../lib/xmlParse"


// Add this utility function at the top level before the BuilderTest component
async function processStream(stream: ReadableStream, onData: (data: string) => void) {
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onData(value);
    }
  } finally {
    reader.releaseLock();
  }
}

function BuilderTest() {
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code")
  const [selectedFile, setSelectedFile] = useState<string>("index.html")
  const [fileContent, setFileContent] = useState<string>("")
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([
    { text: "Welcome to Bolt! How can I help you today?", isUser: false },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [serverStatus, setServerStatus] = useState<string>("Starting...")
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [webcontainerInstance, setWebcontainerInstance] = useState<WebContainer | null>(null)
  const [fileContents, setFileContents] = useState<Record<string, string>>({})
  const [terminalVisible, setTerminalVisible] = useState(true)
  const [terminalOutput, setTerminalOutput] = useState<string[]>([])
  const location = useLocation();
  const {prompt}  = location.state as { prompt: string };



  const [loading, setLoading] = useState(false);
  const [llmMessages, setLlmMessages] = useState<{role: "user" | "assistant", parts: { text: string }[];}[]>([]);
  const [webContainerBoot, setWebcontainerBoot] = useState(true);
  

  // Log updated state
  useEffect(() => {
    initializeWithTemplate(prompt)
  }, []); // This will trigger whenever fileContents updates
  
  useEffect(() => {

    if (Object.keys(fileContents).length === 0) {
      console.log("Waiting for fileContents to be populated...");
      return; // Don't run WebContainer until fileContents is updated
    }

    async function bootWebContainer() {
      try {
        // Boot WebContainer
        if (webContainerBoot) {
          const instance = await WebContainer.boot()
          await instance.fs.mkdir('src')
          setWebcontainerInstance(instance)
          setWebcontainerBoot(false)
        }
        
        // Add terminal message
        addTerminalMessage("WebContainer booted successfully")
        setServerStatus("Setting up files...")
        
        // Create file system structure
        
        // Mount all files
        await Promise.all(
          Object.entries(fileContents).map(async ([path, content]) => {
            // Ensure all parent directories exist
            const dirPath = path.includes("/") ? path.split("/").slice(0, -1).join("/") : null;
        
            if (dirPath) {
              try {
                await webcontainerInstance.fs.mkdir(dirPath, { recursive: true }); // Ensure all parent directories exist
              } catch (error) {
                console.log(`Directory ${dirPath} may already exist:`, error);
              }
            }
        
            // Write the file
            await webcontainerInstance.fs.writeFile(path, content);
          })
        );
        

        addTerminalMessage("File system created")
        setServerStatus("Installing dependencies...")

        // Install dependencies
        const installProcess = await webcontainerInstance.spawn('npm', ['install'])
        
        processStream(installProcess.output, (data) => {
          addTerminalMessage(data);
        });
        
        const installExitCode = await installProcess.exit;
        addTerminalMessage(`npm install completed with exit code ${installExitCode}`);
        
        if (installExitCode !== 0) {
          setServerStatus("Error installing dependencies");
          return;
        }
        
        // Start development server
        setServerStatus("Starting dev server...");
        addTerminalMessage("Starting Vite development server...");
        
        const devProcess = await webcontainerInstance.spawn('npx', ['vite', '--host']);
        
        processStream(devProcess.output, (data) => {
          addTerminalMessage(data);
          
          if (data.includes('Local:') && data.includes('http')) {
            try {
              const urlMatch = data.match(/Local:\s+(https?:\/\/[^\s]+)/);
              if (urlMatch && urlMatch[1]) {
                const extractedUrl = urlMatch[1];
                console.log("Server URL found:", extractedUrl);
                setPreviewUrl(extractedUrl);
                setServerStatus("Running");
              }
            } catch (err) {
              console.error("Error parsing server URL:", err);
            }
          }
        });

        // Listen for the server-ready event
        webcontainerInstance.on('server-ready', (port: number, url: string) => {
          console.log(`Server ready event: port ${port}, URL ${url}`)
          setPreviewUrl(url)
          setServerStatus("Server ready")
          addTerminalMessage(`Server ready on ${url}`)
        })

      } catch (error) {
        console.error('Failed to boot WebContainer:', error)
        setServerStatus(`Error: ${error.message || 'Unknown error'}`)
        addTerminalMessage(`ERROR: ${error.message || 'Unknown error'}`)
      }
    }
    
    bootWebContainer()
  }, [fileContent])


  async function initializeWithTemplate(userPrompt: string) {
    setLoading(true);
    try {
      // Fetch template response and parse
      const templateResponse = await axios.post(`${BACKEND_URL}/template`, {
        prompt: userPrompt.trim()
      });
      const {prompts, uiPrompts} = templateResponse.data;
      const templateSteps = parseResponse(uiPrompts[0]);
      setServerStatus("Template created succesfully")

      // Fetch chat response and parse
      setServerStatus("Waiting for fileContents to be populated...")
      const chatResponse = await axios.post(`${BACKEND_URL}/chat`, {
        messages: [...templateResponse.data.prompts, userPrompt].map(content => ({
          role: "user",
          parts: [{ text: content }]
        }))
      });
      const chatSteps = parseResponse(chatResponse.data.response);
      
      //  Saving llm resposne so we can use for chat
      setLlmMessages([...prompts, prompt].map(content => ({
        role: "user",
        parts: [
          {
            text:content
          }
        ]
      })));
  
      setLlmMessages(x => [...x, {
        role: "assistant", 
        parts: [{
          text:chatResponse.data.response
        }]
      }])

      // Merge templateSteps and chatSteps into fileContents
      setFileContents((prev) => ({
        ...prev,
        ...templateSteps,
        ...chatSteps // Ensure chatSteps are also added
      }));

      return { templateSteps, chatSteps };
      } 
    catch (error) {
      console.error("Error initializing with template:", error);
      addTerminalMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { templateSteps: [], chatSteps: [] };
    } 
    finally {
      setLoading(false);
    }
  }


  // Helper function to add messages to terminal output
  const addTerminalMessage = (message: string) => {
    setTerminalOutput(prev => [...prev, message]);
  };

  useEffect(() => {
    if (selectedFile) {
      const content = fileContents[selectedFile]
      if (content) {
        setFileContent(content)
      } else {
        console.error(`Content not found for file: ${selectedFile}`)
        setFileContent('// File content not found')
      }
    }
  }, [selectedFile, fileContents])

  const handleSendMessage = async () => {
    setServerStatus("Making changes in file")
    if (inputMessage.trim()) {
      setMessages((prev) => [...prev, { text: inputMessage, isUser: true }])

      // Simulate AI response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            text: "I'm analyzing your code. making relevant changes?",
            isUser: false,
          },
        ])

        // Scroll to bottom of chat
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
      }, 1000)
      setInputMessage("")

      // Scroll to bottom of chat
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
      }, 100)

      // Fetch chat response and parse
      console.log(inputMessage)
      const newMessage = {
        role: "user" as "user",
        parts: [{
          text:inputMessage
        }]
        
      };
      const updatedMessages = [...llmMessages, newMessage];
      setLlmMessages(updatedMessages);
      console.log(updatedMessages);
      
      const chatResponse = await axios.post(`${BACKEND_URL}/chat`, {
        messages: updatedMessages });
      const chatSteps = parseResponse(chatResponse.data.response);
      
      //  Saving llm resposne so we can use for chat
  
      setLlmMessages(x => [...x, {
        role: "assistant", 
        parts: [{
          text:chatResponse.data.response
        }]
      }])

      // Merge templateSteps and chatSteps into fileContents
      setFileContents((prev) => ({
        ...prev,
        ...chatSteps // Ensure chatSteps are also added
      }));
      setServerStatus("All changes are done")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const refreshPreview = () => {
    if (previewUrl) {
      // Force refresh the iframe
      setPreviewUrl(prev => {
        // Add or change a query parameter to force refresh
        const urlObj = new URL(prev);
        urlObj.searchParams.set('refresh', Date.now().toString());
        return urlObj.toString();
      });
    }
  }

  const handleFileContentChange = async (newContent: string | undefined) => {
    if (!selectedFile || !newContent) return
    
    setFileContents(prev => ({
      ...prev,
      [selectedFile]: newContent
    }))
    setFileContent(newContent)

    if (webcontainerInstance) {
      try {
        await webcontainerInstance.fs.writeFile(selectedFile, newContent)
      } catch (error) {
        console.error('Failed to write file:', error)
        addTerminalMessage(`Error writing to ${selectedFile}: ${error.message}`)
      }
    }
  }

  const toggleTerminal = () => {
    setTerminalVisible(prev => !prev)
  }

  const runDevServer = async () => {
    if (!webcontainerInstance) return;
    
    setServerStatus("Starting server...");
    addTerminalMessage("Starting Vite development server...");
    
    try {
      const devProcess = await webcontainerInstance.spawn('npx', ['vite', '--host']);
      
      processStream(devProcess.output, (data) => {
        addTerminalMessage(data);
        
        if (data.includes('Local:') && data.includes('http')) {
          try {
            const urlMatch = data.match(/Local:\s+(https?:\/\/[^\s]+)/);
            if (urlMatch && urlMatch[1]) {
              const extractedUrl = urlMatch[1];
              console.log("Server URL found:", extractedUrl);
              setPreviewUrl(extractedUrl);
              setServerStatus("Running");
            }
          } catch (err) {
            console.error("Error parsing server URL:", err);
          }
        }
      });
      
    } catch (error) {
      console.error('Failed to start dev server:', error);
      setServerStatus(`Server Error: ${error.message}`);
      addTerminalMessage(`ERROR starting server: ${error.message}`);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-black text-gray-200">
      {/* Header */}
      <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <div className="text-blue-500 bg-blue-500/10 p-1.5 rounded">
            <button onClick={runDevServer}>
              <Play className="w-5 h-5" />
            </button>
          </div>
          <h1 className="text-lg font-medium tracking-tight text-white">Bolt</h1>
          <div className="ml-4 text-xs text-gray-400">{serverStatus}</div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            className={`text-gray-400 hover:text-white transition-colors p-2 rounded-md hover:bg-zinc-800 ${terminalVisible ? 'bg-zinc-800 text-white' : ''}`}
            onClick={toggleTerminal}
          >
            <TerminalIcon className="w-4 h-4" />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors p-2 rounded-md hover:bg-zinc-800">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="flex items-center h-10 bg-zinc-900 border-b border-zinc-800 px-2">
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === "code" ? "bg-zinc-800 text-white" : "text-gray-400 hover:text-white hover:bg-zinc-800/50"
          }`}
          onClick={() => setActiveTab("code")}
        >
          <Code className="w-4 h-4" />
          Code
        </button>
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ml-1 transition-colors ${
            activeTab === "preview" ? "bg-zinc-800 text-white" : "text-gray-400 hover:text-white hover:bg-zinc-800/50"
          }`}
          onClick={() => setActiveTab("preview")}
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
        {activeTab === "preview" && (
          <button
            className="ml-auto p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
            onClick={refreshPreview}
            title="Refresh Preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={20} minSize={15}>
              <FileExplorer
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                webcontainerInstance={webcontainerInstance}
                fileContents={fileContents}
              />
            </Panel>

            <PanelResizeHandle className="w-[1px] bg-zinc-800 relative before:absolute before:w-1 before:h-full before:left-[-2px] before:top-0 before:bg-transparent before:cursor-col-resize" />

            <Panel defaultSize={55} minSize={30}>
              <div className="h-full bg-[#1e1e1e]">
                {activeTab === "code" ? (
                  <CodeEditor
                    selectedFile={selectedFile}
                    fileContent={fileContent}
                    onChange={handleFileContentChange}
                  />
                ) : (
                  <PreviewFrame 
                    onRefresh={refreshPreview} 
                    previewUrl={previewUrl}
                  />
                )}
              </div>
            </Panel>

            <PanelResizeHandle className="w-[1px] bg-zinc-800 relative before:absolute before:w-1 before:h-full before:left-[-2px] before:top-0 before:bg-transparent before:cursor-col-resize" />

            {/* Chat */}
            <Panel defaultSize={25} minSize={15}>
              <div className="h-full bg-zinc-950 flex flex-col">
                <div className="p-3 text-xs font-medium text-gray-400 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" />
                    CHAT
                  </div>
                </div>
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-3 ${
                        message.isUser
                          ? "bg-blue-600/20 border border-blue-600/30 ml-6"
                          : "bg-zinc-800/80 border border-zinc-700/50 mr-6"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-zinc-800">
                  <div className="flex gap-2 bg-zinc-900 rounded-lg p-1">
                    <div className="flex-1 relative">
                      <textarea
                        className="w-full bg-transparent rounded px-3 py-2 text-sm text-gray-200 resize-none focus:outline-none"
                        rows={1}
                        placeholder="Type a message..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                      />
                    </div>
                    <button
                      className="p-2 rounded-md hover:bg-zinc-800 text-gray-400 hover:text-white transition-colors"
                      title="Upload image"
                    >
                      <Image className="w-4 h-4" />
                    </button>
                    <button
                      className={`p-2 rounded-md ${
                        inputMessage.trim()
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "text-gray-500 bg-zinc-800 cursor-not-allowed"
                      } transition-colors`}
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>
        
        {/* Terminal Area */}
        {terminalVisible && (
          <Terminal 
            webcontainerInstance={webcontainerInstance}
            visible={terminalVisible}
          />
        )}
      </div>
    </div>
  )
}

export default BuilderTest