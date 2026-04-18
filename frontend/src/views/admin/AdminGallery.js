"use client";
import { useState, useEffect } from 'react';
import { Images, Trash2, Copy, X, Upload, Loader2, Check } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { getGalleryImages, deleteGalleryImage } from '../../lib/api';
import api from '../../lib/api';

const AdminGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);

  useEffect(() => { loadImages(); }, []);

  const loadImages = async () => {
    try {
      const res = await getGalleryImages();
      setImages(res.data.images || []);
    } catch {
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success(`${files.length} image(s) uploaded`);
      loadImages();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (filename) => {
    try {
      await deleteGalleryImage(filename);
      toast.success('Image deleted');
      setDeleteConfirm(null);
      loadImages();
    } catch {
      toast.error('Delete failed');
    }
  };

  const copyUrl = (url) => {
    const fullUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(url);
    toast.success('URL copied!');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const baseUrl = '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="gallery-title">Image Gallery</h1>
          <p className="text-muted-foreground">{images.length} images uploaded</p>
        </div>
        <label className="cursor-pointer" data-testid="gallery-upload-btn">
          <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
          <Button asChild disabled={uploading} className="btn-gradient text-white rounded-full">
            <span>
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {uploading ? 'Uploading...' : 'Upload Images'}
            </span>
          </Button>
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Images className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No images uploaded yet</p>
          <p className="text-sm mt-1">Upload images to use in your blog posts</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" data-testid="gallery-grid">
          {images.map((img) => (
            <div key={img.filename}
              className="group relative rounded-xl overflow-hidden border border-border bg-card hover:shadow-lg transition-all duration-200"
              data-testid={`gallery-item-${img.filename}`}
            >
              <div className="aspect-square">
                <img
                  src={`${baseUrl}${img.url}`}
                  alt={img.filename}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.opacity = '0.3'; }}
                />
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                <Button size="sm" variant="secondary" className="rounded-full text-xs"
                  onClick={() => copyUrl(img.url)}
                  data-testid={`copy-url-${img.filename}`}
                >
                  {copiedUrl === img.url ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copiedUrl === img.url ? 'Copied' : 'Copy URL'}
                </Button>
                {deleteConfirm === img.filename ? (
                  <div className="flex gap-1">
                    <Button size="sm" variant="destructive" className="rounded-full text-xs"
                      onClick={() => handleDelete(img.filename)}
                    >Confirm</Button>
                    <Button size="sm" variant="secondary" className="rounded-full text-xs"
                      onClick={() => setDeleteConfirm(null)}
                    ><X className="w-3 h-3" /></Button>
                  </div>
                ) : (
                  <Button size="sm" variant="destructive" className="rounded-full text-xs"
                    onClick={() => setDeleteConfirm(img.filename)}
                    data-testid={`delete-${img.filename}`}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                  </Button>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs text-muted-foreground truncate">{img.filename}</p>
                <p className="text-xs text-muted-foreground">{formatSize(img.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
