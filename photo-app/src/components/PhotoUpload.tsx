import React, { useState, useCallback } from 'react';
import { uploadData } from 'aws-amplify/storage';
import { Upload, Image as ImageIcon, Share2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const filename = `${Date.now()}-${selectedFile.name}`;
      await uploadData({
        key: filename,
        data: selectedFile,
        options: {
          contentType: selectedFile.type,
        },
      });
      toast.success('Photo uploaded successfully!');
      setSelectedFile(null);
      setPreview('');
    } catch (error) {
      toast.error('Error uploading photo');
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my photo!',
          text: 'I just uploaded this amazing photo.',
          url: window.location.href,
        });
        toast.success('Shared successfully!');
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      toast.error('Sharing is not supported on this device');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Upload Photo</h2>
            <button
              onClick={handleShare}
              className="text-purple-600 hover:text-purple-700 transition-colors"
            >
              <Share2 size={24} />
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {preview ? (
              <div className="space-y-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg object-contain"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview('');
                  }}
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="space-y-4">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="text-gray-600">
                    <span className="text-purple-600 font-semibold">Click to upload</span> or drag and
                    drop
                  </div>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </label>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg font-semibold text-white transition-all ${
              selectedFile && !uploading
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {uploading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Upload size={20} />
                <span>Upload Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}