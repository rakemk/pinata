"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface FileItem {
  id: string;
  ipfsHash: string;
  name: string;
  size: number;
  uploadedAt: string;
  url: string;
  isImage: boolean;
  folder?: string;
  path?: string;
}

export default function Home() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preservePaths, setPreservePaths] = useState(false);
  const [basePath, setBasePath] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch files on mount
  useEffect(() => {
    fetchFiles();
  }, [selectedFolder]);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const folderParam = selectedFolder ? `&folder=${encodeURIComponent(selectedFolder)}` : '';
      const response = await fetch(`/api/files?limit=100&offset=0${folderParam}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(text);

      if (data.success) {
        setFolders(data.folders || []);
        setFiles((data.files || []).map((file: any) => ({
          ...file,
          isImage: /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name),
        })));
      } else {
        setError(data.error || "Failed to fetch files");
      }
    } catch (err) {
      console.error('Fetch files error:', err);
      setError(err instanceof Error ? err.message : "Failed to fetch files");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const filesArray = Array.from(selectedFiles);

    // Basic size validation: total 50MB
    const totalSize = filesArray.reduce((sum, f) => sum + f.size, 0);
    const maxSize = 50 * 1024 * 1024;
    if (totalSize > maxSize) {
      setError(`Total size too large: ${(totalSize / 1024 / 1024).toFixed(2)}MB (max 50MB)`);
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      filesArray.forEach((file) => formData.append('file', file));
      if (basePath) {
        formData.append('folderName', basePath);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(text);

      if (data.success) {
        setSuccess(`Uploaded ${filesArray.length} file(s)${data.folder ? ` to ${data.folder}` : ''}.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        await fetchFiles();
      } else {
        setError(data.error || "Upload failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      setError(null);
      console.log(`Downloading file: ${file.name} (${file.ipfsHash})`);
      
      // 1. Get the signed URL from backend
      const res = await fetch(`/api/signed-url/${file.ipfsHash}`);
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || data.details || "Failed to get signed URL");
      }

      console.log("Got signed URL, fetching file...");

      // 2. Fetch the actual file data as a Blob from the signed URL
      // This prevents the "No File" browser error by verifying the data exists first
      const fileRes = await fetch(data.url);
      if (!fileRes.ok) {
        throw new Error(`File data not found on gateway (${fileRes.status})`);
      }
      
      const blob = await fileRes.blob();
      console.log(`Downloaded blob: ${blob.size} bytes, type: ${blob.type}`);
      
      const blobUrl = URL.createObjectURL(blob);

      // 3. Trigger the download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = file.name || `download-${file.ipfsHash}.png`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
      setSuccess(`Downloaded: ${file.name}`);
    } catch (err) {
      console.error("Download Error:", err);
      setError(err instanceof Error ? err.message : "Download failed");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pinata File Manager
          </h1>
          <p className="text-gray-600">
            Upload and download files from your Pinata storage
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">❌ {error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200">✅ {success}</p>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
              <div className="flex gap-3 items-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-60"
                >
                  Choose File
                </button>
                <span className="text-sm text-gray-500 truncate">
                  {fileInputRef.current?.files?.length ? `${fileInputRef.current.files.length} selected` : "No file chosen"}
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
                {...(preservePaths ? { webkitdirectory: "" as any } : {})}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={preservePaths}
                onChange={(e) => setPreservePaths(e.target.checked)}
              />
              Upload folder (preserve paths)
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Optional base path/prefix</label>
              <input
                type="text"
                value={basePath}
                onChange={(e) => setBasePath(e.target.value)}
                placeholder="e.g. user-123/projects"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
              <button
                onClick={() => alert('Download folder as ZIP coming soon')}
                className="text-sm text-blue-600 hover:underline"
              >
                Download Folder as ZIP
              </button>
            </div>
          </div>
        </div>

        {/* Files List Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Files</h2>
            <button
              onClick={fetchFiles}
              disabled={loading}
              className="text-sm text-blue-600 hover:underline disabled:opacity-60"
            >
              Refresh
            </button>
          </div>

          <div className="mb-6 text-sm text-blue-600 cursor-pointer" onClick={() => setSelectedFolder(null)}>
            Root
          </div>

          {/* Folders */}
          {folders.length > 0 && !selectedFolder && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Folders ({folders.length})</h3>
              <div className="space-y-2">
                {folders.map((folder) => (
                  <button
                    key={folder}
                    onClick={() => setSelectedFolder(folder)}
                    className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200"
                  >
                    <span className="text-blue-600">{folder}</span>
                    <span className="text-xs text-gray-500">{folder}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading files...</div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No files uploaded yet.</div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.ipfsHash}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {formatFileSize(file.size)} • {file.isImage ? 'image' : 'file'}
                    </p>
                    <p className="text-xs text-gray-500">Created: {formatDate(file.uploadedAt)}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {file.isImage && (
                      <button
                        onClick={() => window.open(`/api/image/${file.ipfsHash}`, '_blank')}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Preview
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(file)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
