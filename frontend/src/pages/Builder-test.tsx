"use client"

import { useState, useRef } from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { Code, Eye, Play, Settings, Terminal, RefreshCw } from "lucide-react"
import { FileExplorer } from "../components/FileExplorer"
import { CodeEditor } from "../components/CodeEditor"
import { PreviewFrame } from "../components/PreviewFrame"

function BuilderTest() {
  console.log("Builder test is running");
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code")
  const [selectedFile, setSelectedFile] = useState<string>("index.html")
  const [fileContent, setFileContent] = useState<string>("// Start coding here")
  const previewRef = useRef<HTMLIFrameElement>(null)

  const refreshPreview = () => {
    if (previewRef.current) {
      previewRef.current.src = previewRef.current.src
    }
  }

  return (
    <div className="h-screen flex flex-col bg-black text-gray-200">
      {/* Header */}
      <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <div className="text-blue-500 bg-blue-500/10 p-1.5 rounded">
            <Play className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-medium tracking-tight text-white">Bolt</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-white transition-colors p-2 rounded-md hover:bg-zinc-800">
            <Terminal className="w-4 h-4" />
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
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={20} minSize={15}>
            <FileExplorer selectedFile={selectedFile} setSelectedFile={setSelectedFile} />
          </Panel>

          <PanelResizeHandle className="w-[1px] bg-zinc-800 relative before:absolute before:w-1 before:h-full before:left-[-2px] before:top-0 before:bg-transparent before:cursor-col-resize" />

          <Panel defaultSize={55} minSize={30}>
            <div className="h-full bg-[#1e1e1e]">
              {activeTab === "code" ? (
                <CodeEditor fileContent={fileContent} setFileContent={setFileContent} />
              ) : (
                <PreviewFrame fileContent={fileContent} />
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}

export default BuilderTest

