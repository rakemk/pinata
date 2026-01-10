"use client";

import React, { useState, useRef, useEffect } from "react";
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
  thumbnail?: string;
}

export default function Home() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("root");
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
  }, [currentPath]);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/files?limit=100&offset=0&folder=${encodeURIComponent(currentPath)}`);

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
        setFiles(data.files || []);
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

      // Determine the upload path: currentPath + basePath
      const uploadFolder = basePath
        ? (currentPath === 'root' ? basePath : `${currentPath}/${basePath}`)
        : currentPath;

      formData.append('folderName', uploadFolder);

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

  const handlePreview = async (file: FileItem) => {
    try {
      setError(null);
      setSuccess(null);

      // Get the signed URL from backend
      const res = await fetch(`/api/signed-url/${file.ipfsHash}`);
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || data.details || "Failed to get signed URL");
      }

      // Open the signed URL directly in a new tab
      window.open(data.url, '_blank');
      setSuccess(`Opening preview for: ${file.name}`);
    } catch (err) {
      console.error("Preview Error:", err);
      setError(err instanceof Error ? err.message : "Preview failed");
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
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mb-6 text-sm">
            <button
              onClick={() => setCurrentPath("root")}
              className={`hover:text-blue-600 ${currentPath === "root" ? "text-gray-900 font-bold" : "text-blue-500"}`}
            >
              Root
            </button>
            {currentPath !== "root" && currentPath.split('/').map((segment, idx, arr) => (
              <React.Fragment key={idx}>
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => setCurrentPath(arr.slice(0, idx + 1).join('/'))}
                  className={`hover:text-blue-600 ${idx === arr.length - 1 ? "text-gray-900 font-bold" : "text-blue-500"}`}
                >
                  {segment}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Folders List */}
          {folders.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Folders</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {folders.map((folder) => (
                  <button
                    key={folder}
                    onClick={() => setCurrentPath(currentPath === "root" ? folder : `${currentPath}/${folder}`)}
                    className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-white hover:shadow-md transition-all rounded-lg border border-gray-200 text-left group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">📁</span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{folder}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Scanning directory...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500 italic">This folder is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Files</h3>
              {files.map((file) => (
                <div
                  key={file.ipfsHash}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    {file.isImage && file.thumbnail ? (
                      <div className="w-12 h-12 rounded bg-gray-200 overflow-hidden mr-4 flex-shrink-0">
                        <img
                          src={file.thumbnail}
                          alt={file.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-200 mr-4 flex-shrink-0 flex items-center justify-center text-gray-400">
                        {file.isImage ? '🖼️' : '📄'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(file.size)} • {file.isImage ? 'image' : 'file'}
                      </p>
                      <p className="text-xs text-gray-500">Created: {formatDate(file.uploadedAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {file.isImage && (
                      <button
                        onClick={() => handlePreview(file)}
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
