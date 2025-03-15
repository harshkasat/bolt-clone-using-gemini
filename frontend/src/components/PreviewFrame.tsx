import React, { useRef, useEffect } from "react";
import { RefreshCw } from "lucide-react";

interface PreviewFrameProps {
  onRefresh: () => void;
  previewUrl?: string;
}

export function PreviewFrame({ onRefresh, previewUrl }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = previewUrl;
    }
  }, [previewUrl]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 bg-zinc-900 border-b border-zinc-800 flex items-center">
        <button
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
          onClick={onRefresh}
          title="Refresh Preview"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        {previewUrl && (
          <div className="ml-2 text-xs text-gray-400 truncate">
            {previewUrl}
          </div>
        )}
      </div>
      <div className="flex-1 bg-white">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-none"
          title="Preview"
          sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
        />
      </div>
    </div>
  );
}