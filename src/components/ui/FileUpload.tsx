
'use client';

import { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, Loader } from 'lucide-react';
import { toast } from './Toast';

interface FileUploadProps {
  onUpload: (hash: string, url: string, filename: string) => void;
  accept?: string;
}

export default function FileUpload({ onUpload, accept = '*/*' }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<{ hash: string; url: string; name: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setUploaded({ hash: data.hash, url: data.url, name: file.name });
      onUpload(data.hash, data.url, file.name);
      toast('File uploaded to IPFS successfully!', 'success');
    } catch {
      toast('File upload failed. Try again.', 'error');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      {uploaded ? (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{uploaded.name}</p>
            <button
              onClick={() => window.open(uploaded.url, '_blank')}
              className="text-xs text-blue-500 hover:underline text-left"
            >
              View on IPFS
            </button>
          </div>
          <button onClick={() => setUploaded(null)} className="text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ' + (dragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-500/5')}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-500">Uploading to IPFS...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                {dragging ? <File className="w-6 h-6 text-blue-500" /> : <Upload className="w-6 h-6 text-blue-500" />}
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {dragging ? 'Drop file here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-gray-500">PDF, PNG, JPG, SVG, DOCX, ZIP up to 50MB</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}