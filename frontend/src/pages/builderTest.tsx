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
  const [webcontainerInstance, setWebcontainerInstance] = useState<any>(null)
  const [fileContents, setFileContents] = useState<Record<string, string>>({
    'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>React App</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.tsx"></script>\n</body>\n</html>',
    'package.json': '{\n  "name": "react-app",\n  "private": true,\n  "version": "0.0.0",\n  "type": "module",\n  "scripts": {\n    "dev": "vite --host",\n    "build": "tsc && vite build",\n    "preview": "vite preview"\n  },\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  },\n  "devDependencies": {\n    "@types/react": "^18.2.15",\n    "@types/react-dom": "^18.2.7",\n    "@vitejs/plugin-react": "^4.0.3",\n    "typescript": "^5.0.2",\n    "vite": "^4.4.5"\n  }\n}',
    'src/App.tsx': 'import React from "react";\n\nfunction App() {\n  return (\n    <div style={{ padding: "20px", fontFamily: "Arial" }}>\n      <h1>Hello from React!</h1>\n      <p>If you can see this, your app is working correctly.</p>\n    </div>\n  );\n}\n\nexport default App;',
    'src/index.css': 'body {\n  margin: 0;\n  padding: 0;\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;\n}\n\n#root {\n  height: 100%;\n}',
    'src/main.tsx': 'import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\nimport "./index.css";\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);',
    'vite.config.ts': 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({\n  plugins: [react()],\n  server: {\n    hmr: true,\n  },\n});',
    'tsconfig.json': '{\n  "compilerOptions": {\n    "target": "ES2020",\n    "useDefineForClassFields": true,\n    "lib": ["ES2020", "DOM", "DOM.Iterable"],\n    "module": "ESNext",\n    "skipLibCheck": true,\n    "moduleResolution": "bundler",\n    "allowImportingTsExtensions": true,\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "noEmit": true,\n    "jsx": "react-jsx",\n    "strict": true,\n    "noUnusedLocals": true,\n    "noUnusedParameters": true,\n    "noFallthroughCasesInSwitch": true\n  },\n  "include": ["src"],\n  "references": [{ "path": "./tsconfig.node.json" }]\n}',
    'tsconfig.node.json': '{\n  "compilerOptions": {\n    "composite": true,\n    "skipLibCheck": true,\n    "module": "ESNext",\n    "moduleResolution": "bundler",\n    "allowSyntheticDefaultImports": true\n  },\n  "include": ["vite.config.ts"]\n}'
  })
  const [terminalVisible, setTerminalVisible] = useState(true)
  const [terminalOutput, setTerminalOutput] = useState<string[]>([])

  useEffect(() => {
    async function bootWebContainer() {
      try {
        // Boot WebContainer
        const instance = await WebContainer.boot()
        setWebcontainerInstance(instance)
        
        // Add terminal message
        addTerminalMessage("WebContainer booted successfully")
        setServerStatus("Setting up files...")
        
        // Create file system structure
        await instance.fs.mkdir('src')
        
        // Mount all files
        await Promise.all(
          Object.entries(fileContents).map(async ([path, content]) => {
            // Check if we need to create parent directories
            const dirPath = path.includes('/') ? path.split('/').slice(0, -1).join('/') : null
            
            if (dirPath && dirPath !== 'src') {
              try {
                await instance.fs.mkdir(dirPath, { recursive: true })
              } catch (error) {
                console.log(`Directory ${dirPath} may already exist:`, error)
              }
            }
            
            // Write the file
            await instance.fs.writeFile(path, content)
          })
        )

        addTerminalMessage("File system created")
        setServerStatus("Installing dependencies...")

        // Install dependencies
        const installProcess = await instance.spawn('npm', ['install'])
        
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
        
        const devProcess = await instance.spawn('npx', ['vite', '--host']);
        
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
        instance.on('server-ready', (port, url) => {
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
  }, [])

  // Helper function to add messages to terminal output
  const addTerminalMessage = (message: string) => {
    console.log("Terminal:", message);
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

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      setMessages((prev) => [...prev, { text: inputMessage, isUser: true }])

      // Simulate AI response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            text: "I'm analyzing your code. How can I help you improve it?",
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