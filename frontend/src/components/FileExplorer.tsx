import React, { useState, useEffect } from "react";
import { FolderTree, FileCode, FileText, Package } from "lucide-react";

interface FileExplorerProps {
  selectedFile: string;
  onFileSelect: (fileName: string) => void;
  webcontainerInstance: any;
  fileContents: Record<string, string>;
}

export function FileExplorer({ 
  selectedFile, 
  onFileSelect,
  webcontainerInstance,
  fileContents
}: FileExplorerProps) {
  const [files, setFiles] = useState([
    { name: "src", path: "src", isFolder: true, icon: <FolderTree className="w-4 h-4" /> },
  ]);

  // Convert fileContents to file structure
  const getFilesFromContents = () => {
    const newFiles: Array<{ name: string; path: string; isFolder: boolean; icon: JSX.Element }> = [];
    const paths = Object.keys(fileContents);
    console.log("Paths "+paths + " ")
    
    // First add all root level files and folders
    paths.forEach(path => {
      const parts = path.split('/');
      if (parts.length === 1) {
        console.log("root level "+parts[0])
        // Root level file
        newFiles.push({
          name: parts[0],
          path: parts[0],
          isFolder: false,
          icon: getFileIcon(parts[0])
        });
      } else if (!newFiles.find(f => f.path === parts[0])) {
        // Root level folder
        console.log("root level folder "+parts[0])
        newFiles.push({
          name: parts[0],
          path: parts[0],
          isFolder: true,
          icon: <FolderTree className="w-4 h-4" />
        });
      }
    });

    // Then add all nested files
    paths.forEach(path => {
      const parts = path.split('/');
      if (parts.length > 1) {
        console.log("nested files "+path)
        newFiles.push({
          name: parts[parts.length - 1],
          path: path,
          isFolder: false,
          icon: getFileIcon(parts[parts.length - 1])
        });
      }
    });
    console.log("newFiles " + newFiles.map((x) => {
      console.log("Name of file " +x.name,
      console.log("Path of file " +x.path)
      )
    }))
    return newFiles;
  };
  
  // Function to sync file system with WebContainer
  const syncFileSystem = async () => {
    let newFiles: Array<{ name: string; path: string; isFolder: boolean; icon: JSX.Element }> = [];

    if (Object.keys(fileContents).length > 0) {
      newFiles = getFilesFromContents();
      setFiles(newFiles);
      return;
    }

    if (!webcontainerInstance) return;
    
    try {
      const entries = await webcontainerInstance.fs.readdir('/', { withFileTypes: true });
      console.log("All Enteries "+entries)
      
      for (const entry of entries) {
        if (entry.name === 'src') {
          console.log("Enteries === src " + entry.name)
          newFiles.push({ 
            name: entry.name, 
            path: entry.name, 
            isFolder: true, 
            icon: <FolderTree className="w-4 h-4" /> 
          });
          
          const srcEntries = await webcontainerInstance.fs.readdir('/src', { withFileTypes: true });
          for (const srcEntry of srcEntries) {
            console.log("srcEnteries /src " + srcEntry.name)
            newFiles.push({ 
              name: srcEntry.name, 
              path: `src/${srcEntry.name}`, 
              isFolder: false, 
              icon: getFileIcon(srcEntry.name)
            });
          }
        } else {
          console.log("Else src " + entry.name)
          newFiles.push({ 
            name: entry.name, 
            path: entry.name, 
            isFolder: false, 
            icon: getFileIcon(entry.name)
          });
        }
      }
      
      setFiles(newFiles);
    } catch (error) {
      console.error('Error syncing file system:', error);
    }
  };

  // Get appropriate icon based on file extension
  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.tsx') || fileName.endsWith('.jsx') || fileName.endsWith('.js') || fileName.endsWith('.ts')) {
      return <FileCode className="w-4 h-4 text-blue-400" />;
    } else if (fileName.endsWith('.css')) {
      return <FileText className="w-4 h-4 text-purple-400" />;
    } else if (fileName.endsWith('.html')) {
      return <FileCode className="w-4 h-4 text-orange-400" />;
    } else if (fileName === 'package.json') {
      return <Package className="w-4 h-4 text-yellow-400" />;
    }
    return <FileText className="w-4 h-4 text-gray-400" />;
  };
  
  // Sync files when WebContainer is initialized
  useEffect(() => {
    syncFileSystem();
  }, [webcontainerInstance, fileContents]);

  const organizeFiles = (files: Array<{ name: string; path: string; isFolder: boolean; icon: JSX.Element }>) => {
    // First, separate folders and files
    const folders = files.filter(f => f.isFolder);
    const allFiles = files.filter(f => !f.isFolder);
    
    // Group files by their parent folder
    const filesByFolder: Record<string, typeof files> = {
      root: allFiles.filter(f => !f.path.includes('/'))
    };
  
    // Group nested files under their parent folders
    folders.forEach(folder => {
      filesByFolder[folder.path] = allFiles.filter(f => 
        f.path.startsWith(folder.path + '/') && 
        f.path.split('/').length === folder.path.split('/').length + 1
      );
    });
  
    return { folders, filesByFolder };
  };

  return (
    <div className="h-full bg-zinc-950 flex flex-col">
      <div className="p-3 text-xs font-medium text-gray-400 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FolderTree className="w-4 h-4" />
          EXPLORER
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {/* Root level files */}
        {organizeFiles(files).filesByFolder.root.map((file) => (
          <div
            key={file.path}
            className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm ${
              selectedFile === file.path
                ? "bg-zinc-800 text-white"
                : "text-gray-400 hover:text-white hover:bg-zinc-900"
            }`}
            style={{ paddingLeft: "12px" }}
            onClick={() => onFileSelect(file.path)}
          >
            {file.icon}
            {file.name}
          </div>
        ))}
        
        {/* Folders and their files */}
        {organizeFiles(files).folders.map((folder) => (
          <React.Fragment key={folder.path}>
            <div
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm text-gray-400 hover:text-white"
              style={{ paddingLeft: "12px" }}
            >
              {folder.icon}
              {folder.name}
            </div>
            {/* Nested files */}
            {organizeFiles(files).filesByFolder[folder.path].map((file) => (
              <div
                key={file.path}
                className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm ${
                  selectedFile === file.path
                    ? "bg-zinc-800 text-white"
                    : "text-gray-400 hover:text-white hover:bg-zinc-900"
                }`}
                style={{ paddingLeft: "24px" }}
                onClick={() => onFileSelect(file.path)}
              >
                {file.icon}
                {file.name}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}