import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";

interface CodeEditorProps {
  selectedFile: string;
  fileContent: string;
  onChange: (content: string | undefined) => void;
}

export function CodeEditor({ selectedFile, fileContent, onChange }: CodeEditorProps) {
  const [language, setLanguage] = useState("typescript");
  
  // Set the language based on file extension
  useEffect(() => {
    if (selectedFile.endsWith(".html")) {
      setLanguage("html");
    } else if (selectedFile.endsWith(".css")) {
      setLanguage("css");
    } else if (selectedFile.endsWith(".js")) {
      setLanguage("javascript");
    } else if (selectedFile.endsWith(".tsx")) {      setLanguage("typescript");
    } else if (selectedFile.endsWith(".json")) {
      setLanguage("json");
    } else {
      setLanguage("typescript");
    }
  }, [selectedFile]);

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        value={fileContent}
        onChange={onChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          readOnly: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}