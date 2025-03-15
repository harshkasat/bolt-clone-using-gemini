import React, { useState, useEffect, useRef } from "react";
import { Terminal as TerminalIcon } from "lucide-react";

interface TerminalProps {
  webcontainerInstance: any;
  visible: boolean;
}

export function Terminal({ webcontainerInstance, visible }: TerminalProps) {
  const [output, setOutput] = useState<string[]>([]);
  const [command, setCommand] = useState("");
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Auto-scroll to bottom when terminal output changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  const runCommand = async () => {
    if (!webcontainerInstance || !command.trim()) return;
    
    setIsRunning(true);
    setOutput(prev => [...prev, `$ ${command}`]);
    
    try {
      // Parse command and arguments
      const [cmd, ...args] = command.split(" ");
      
      // Run command in WebContainer
      const process = await webcontainerInstance.spawn(cmd, args);
      
      // Handle stdout
      process.output.pipeTo(
        new WritableStream({
          write(data) {
            setOutput(prev => [...prev, data]);
          }
        })
      );
      
      // Handle exit code
      const exitCode = await process.exit;
      setOutput(prev => [...prev, `Process exited with code ${exitCode}`]);
      
    } catch (error) {
      console.error('Error running command:', error);
      setOutput(prev => [...prev, `Error: ${error.message || 'Unknown error'}`]);
    } finally {
      setIsRunning(false);
      setCommand("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runCommand();
    }
  };

  if (!visible) return null;

  return (
    <div className="h-64 bg-zinc-950 border-t border-zinc-800 flex flex-col">
      <div className="p-2 text-xs font-medium text-gray-400 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TerminalIcon className="w-4 h-4" />
          TERMINAL
        </div>
      </div>
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-2 font-mono text-sm text-gray-300"
      >
        {output.map((line, index) => (
          <div key={index} className="whitespace-pre-wrap">{line}</div>
        ))}
      </div>
      <div className="p-2 border-t border-zinc-800">
        <div className="flex items-center bg-zinc-900 rounded">
          <span className="px-2 text-green-400">$</span>
          <input
            type="text"
            className="flex-1 bg-transparent px-2 py-1 text-sm text-gray-200 focus:outline-none"
            placeholder="Enter command..."
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isRunning}
          />
        </div>
      </div>
    </div>
  );
}