"use client";
import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, RefreshCw, Images } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import api from '../lib/api';
import { getGalleryImages } from '../lib/api';

const ImageUpload = ({ 
  value, 
  onChange, 
  placeholder = "Upload an image",
  accept = "image/jpeg,image/png,image/gif,image/webp",
  maxSize = 5
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    const allowedTypes = accept.split(',');
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      return;
    }
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File too large. Maximum size: ${maxSize}MB`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = response.data.url;
      const fullUrl = uploadedUrl.startsWith('/') ? uploadedUrl : uploadedUrl;
      
      onChange(fullUrl);
      setImageError(false);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    setImageError(false);
  };

  const openGallery = async (e) => {
    e.stopPropagation();
    setShowGallery(true);
    setGalleryLoading(true);
    try {
      const res = await getGalleryImages();
      setGalleryImages(res.data.images || []);
    } catch {
      toast.error('Failed to load gallery');
    } finally {
      setGalleryLoading(false);
    }
  };

  const selectFromGallery = (img) => {
    const fullUrl = img.url.startsWith('/') ? img.url : img.url;
    onChange(fullUrl);
    setImageError(false);
    setShowGallery(false);
    toast.success('Image selected from gallery');
  };

  const baseUrl = '';

  return (
    <div className="space-y-3">
      {value && (
        <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30">
          {!imageError ? (
            <img 
              src={value} 
              alt="Preview" 
              className="w-full h-48 object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-24 flex items-center justify-center bg-muted/50 text-muted-foreground text-sm">
              <ImageIcon className="w-5 h-5 mr-2 opacity-50" />
              Image preview unavailable
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
            title="Remove image"
            data-testid="image-remove-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        data-testid="image-upload-input"
      />

      <div
        className={`relative border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer ${
          dragActive 
            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' 
            : 'border-border hover:border-violet-500/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center text-center">
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center mb-2">
                {value ? <RefreshCw className="w-5 h-5 text-violet-500" /> : <Upload className="w-5 h-5 text-violet-500" />}
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {value ? 'Change Image' : placeholder}
              </p>
              <p className="text-xs text-muted-foreground mb-2">Drag & drop or click to browse</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                  className="rounded-full"
                  data-testid="image-choose-file-btn"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {value ? 'Upload New' : 'Choose File'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openGallery}
                  className="rounded-full"
                  data-testid="image-gallery-btn"
                >
                  <Images className="w-4 h-4 mr-2" />
                  Gallery
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">JPG, PNG, GIF, WebP &bull; Max {maxSize}MB</p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Or paste URL:</span>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg or /api/uploads/..."
          className="flex-1 h-9 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          data-testid="image-url-input"
        />
      </div>

      {/* Gallery Picker Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowGallery(false)}>
          <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[70vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Images className="w-5 h-5 text-violet-500" />
                <h3 className="font-bold text-foreground">Select from Gallery</h3>
              </div>
              <button onClick={() => setShowGallery(false)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[55vh]">
              {galleryLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                </div>
              ) : galleryImages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Images className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No images in gallery</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {galleryImages.map((img) => (
                    <button
                      key={img.filename}
                      type="button"
                      onClick={() => selectFromGallery(img)}
                      className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-violet-500 transition-all duration-200 focus:outline-none focus:border-violet-500"
                      data-testid={`gallery-pick-${img.filename}`}
                    >
                      <img
                        src={`${baseUrl}${img.url}`}
                        alt={img.filename}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.opacity = '0.3'; }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
