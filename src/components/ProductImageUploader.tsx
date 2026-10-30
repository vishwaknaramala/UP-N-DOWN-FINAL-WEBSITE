import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Check,
  Loader2,
  Sparkles,
  Eye,
  Trash2,
  RefreshCw,
  Maximize2,
  Database,
  FileCheck,
  SlidersHorizontal,
  FolderOpen,
  CheckCircle2,
} from 'lucide-react';
import { playTactileClick } from '../utils/audio';
import {
  getSupabaseProductImageUrl,
  fetchSupabaseStorageImages,
  SUPABASE_STORAGE_BUCKET,
  SupabaseStorageFileItem,
  VERIFIED_PRODUCT_CDN_IMAGES,
} from '../utils/supabaseStorage';

interface ProductImageUploaderProps {
  currentImageUrl?: string;
  onImageChange: (url: string) => void;
  label?: string;
  category?: 'tshirts' | 'pants' | 'caps';
  productId?: string;
  imageFit?: 'cover' | 'contain';
  onImageFitChange?: (fit: 'cover' | 'contain') => void;
}

interface ImageMetadata {
  fileName: string;
  fileSizeFormatted: string;
  fileSizeBytes?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  sourceType: 'local_file' | 'direct_url' | 'curated_preset';
}

export const ARCHIVE_IMAGE_PRESETS: {
  label: string;
  category: 'tshirts' | 'pants' | 'caps';
  url: string;
}[] = [
  {
    label: 'CAP.jpeg (Official Drop 01 Cap)',
    category: 'caps',
    url: 'https://uwoyznudoiwjttoxnptr.supabase.co/storage/v1/object/public/prodct-images/CAP.jpeg',
  },
  {
    label: 'BLUE BAGGY FIT DENIM JEANS.jpeg (Official Denim)',
    category: 'pants',
    url: 'https://uwoyznudoiwjttoxnptr.supabase.co/storage/v1/object/public/prodct-images/BLUE%20BAGGY%20FIT%20DENIM%20JEANS.jpeg',
  },
  {
    label: 'BLACK RED EYE BAGGY FIT T SHIRT.jpeg (Official Heavy Tee)',
    category: 'tshirts',
    url: 'https://uwoyznudoiwjttoxnptr.supabase.co/storage/v1/object/public/prodct-images/BLACK%20RED%20EYE%20BAGGY%20FIT%20T%20SHIRT.jpeg',
  },
  {
    label: 'BEIGE HAND T SHIRT.jpeg (Official Atelier Tee)',
    category: 'tshirts',
    url: 'https://uwoyznudoiwjttoxnptr.supabase.co/storage/v1/object/public/prodct-images/BEIGE%20HAND%20T%20SHIRT.jpeg',
  },
  {
    label: 'Vintage Black Heavy Tee',
    category: 'tshirts',
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
  },
  {
    label: 'Warm Ivory Minimal Tee',
    category: 'tshirts',
    url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80',
  },
  {
    label: 'Ice Blue Baggy Denim',
    category: 'pants',
    url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
  },
  {
    label: 'Washed Charcoal Denim',
    category: 'pants',
    url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1000&q=80',
  },
  {
    label: 'Stone Wash Grey Cap',
    category: 'caps',
    url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=80',
  },
  {
    label: 'Obsidian Black Strapback',
    category: 'caps',
    url: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=1000&q=80',
  },
];

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  currentImageUrl = '',
  onImageChange,
  label = 'Product Lookbook Photo',
  category,
  productId,
  imageFit = 'contain',
  onImageFitChange,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [inputUrl, setInputUrl] = useState(currentImageUrl);
  const [activeMethod, setActiveMethod] = useState<'url' | 'bucket' | 'file' | 'presets'>('url');
  const [isUploadingFromUrl, setIsUploadingFromUrl] = useState(false);
  const [urlUploadSuccess, setUrlUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [bucketFiles, setBucketFiles] = useState<SupabaseStorageFileItem[]>([]);
  const [isSyncingBucket, setIsSyncingBucket] = useState(false);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const [storageDestination, setStorageDestination] = useState<'supabase' | 'local_fallback' | 'local' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshBucketFiles = async () => {
    setIsSyncingBucket(true);
    try {
      const res = await fetchSupabaseStorageImages();
      if (res.success && res.files) {
        setBucketFiles(res.files);
      }
    } finally {
      setIsSyncingBucket(false);
    }
  };

  useEffect(() => {
    refreshBucketFiles();
  }, []);

  // Sync initial metadata when currentImageUrl is provided (e.g. during piece edit)
  useEffect(() => {
    if (currentImageUrl) {
      const isBase64 = currentImageUrl.startsWith('data:');
      const isUploadPath = currentImageUrl.startsWith('/uploads/');
      const isSupabase =
        currentImageUrl.includes('/storage/v1/object/public/prodct-images') ||
        currentImageUrl.includes('/storage/v1/object/public/product-images') ||
        currentImageUrl.includes('supabase.co');
      const detectedName = isUploadPath
        ? currentImageUrl.split('/').pop() || 'uploaded-product.jpg'
        : isBase64
        ? 'Staged Base64 Image'
        : currentImageUrl.split('/').pop()?.split('?')[0] || 'Lookbook Photograph';

      setMetadata((prev) => {
        if (prev && prev.fileName === detectedName) return prev;
        return {
          fileName: detectedName,
          fileSizeFormatted: isBase64
            ? 'Embedded'
            : isSupabase
            ? 'Supabase Bucket (prodct-images)'
            : 'Cloud Hosted',
          sourceType: isUploadPath || isBase64 ? 'local_file' : 'direct_url',
        };
      });

      // Measure dimensions
      const img = new Image();
      img.onload = () => {
        setMetadata((prev) =>
          prev ? { ...prev, width: img.naturalWidth, height: img.naturalHeight } : null
        );
      };
      img.src = currentImageUrl;
    } else {
      setMetadata(null);
    }
  }, [currentImageUrl]);

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP, SVG, GIF)');
      return;
    }

    setUploadError(null);
    playTactileClick();

    // 1. Immediately create a zero-latency local object URL for instant thumbnail preview
    const localThumbnailUrl = URL.createObjectURL(file);

    // 2. Set up rich metadata for the thumbnail preview card
    const fileMeta: ImageMetadata = {
      fileName: file.name,
      fileSizeFormatted: formatBytes(file.size),
      fileSizeBytes: file.size,
      mimeType: file.type || 'image/jpeg',
      sourceType: 'local_file',
    };
    setMetadata(fileMeta);

    // 3. Immediately display thumbnail to user
    onImageChange(localThumbnailUrl);
    setInputUrl(localThumbnailUrl);

    // 4. Measure image resolution in background
    const probeImg = new Image();
    probeImg.onload = () => {
      setMetadata((prev) =>
        prev ? { ...prev, width: probeImg.naturalWidth, height: probeImg.naturalHeight } : null
      );
    };
    probeImg.src = localThumbnailUrl;

    // 5. Asynchronously persist to Supabase Storage 'product-images' bucket
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        if (!base64) {
          setIsProcessing(false);
          return;
        }

        try {
          const res = await fetch('/api/upload-product-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64,
              filename: file.name,
              productId,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.url) {
              setStorageDestination(data.storage || 'supabase');
              if (data.storage === 'supabase') {
                setStorageNotice(`Stored in Supabase bucket ‘product-images’ as ${data.filename}`);
              } else if (data.notice) {
                setStorageNotice(data.notice);
              }
              onImageChange(data.url);
              setInputUrl(data.url);
              setIsProcessing(false);
              refreshBucketFiles();
              return;
            }
          }
        } catch (serverErr) {
          console.warn('[Server Upload Fallback to Local Data URL]:', serverErr);
        }

        // Fallback: persistent base64 data URL
        onImageChange(base64);
        setInputUrl(base64);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('[Image Processing Error]:', err);
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleApplyUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputUrl.trim();
    if (!clean) {
      setUploadError('Please enter a Supabase image URL or bucket filename (e.g. CAP.jpeg)');
      return;
    }

    setUploadError(null);
    setUrlUploadSuccess(null);
    playTactileClick();

    const resolved = getSupabaseProductImageUrl(clean);
    onImageChange(resolved);

    const name = decodeURIComponent(resolved.split('/').pop()?.split('?')[0] || clean);
    const isSupabase =
      resolved.includes('/storage/v1/object/public/prodct-images') ||
      resolved.includes('/storage/v1/object/public/product-images') ||
      resolved.includes('supabase.co');

    setMetadata({
      fileName: name,
      fileSizeFormatted: isSupabase ? 'Supabase Storage · prodct-images' : 'Remote Image Link',
      sourceType: 'direct_url',
    });

    const probe = new Image();
    probe.onload = () => {
      setMetadata((prev) =>
        prev ? { ...prev, width: probe.naturalWidth, height: probe.naturalHeight } : null
      );
      setUrlUploadSuccess('Supabase image link connected and verified successfully.');
    };
    probe.onerror = () => {
      setUploadError('Could not load image from provided link. Please verify URL or bucket filename.');
    };
    probe.src = resolved;
  };

  const handleUploadFromUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputUrl.trim();
    if (!clean) {
      setUploadError('Please enter an image link to upload');
      return;
    }

    setUploadError(null);
    setUrlUploadSuccess(null);
    setIsUploadingFromUrl(true);
    playTactileClick();

    try {
      const res = await fetch('/api/upload-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: clean,
          productId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        onImageChange(data.url);
        setInputUrl(data.url);
        setUrlUploadSuccess(
          data.storage === 'supabase'
            ? `Uploaded to Supabase Storage bucket '${SUPABASE_STORAGE_BUCKET}' as ${data.filename}`
            : (data.notice || 'Image saved to server.')
        );
        refreshBucketFiles();

        const name = data.filename || data.url.split('/').pop()?.split('?')[0] || 'Uploaded Image';
        setMetadata({
          fileName: name,
          fileSizeFormatted: 'Supabase Storage',
          sourceType: 'direct_url',
        });

        const probe = new Image();
        probe.onload = () => {
          setMetadata((prev) =>
            prev ? { ...prev, width: probe.naturalWidth, height: probe.naturalHeight } : null
          );
        };
        probe.src = data.url;
      } else {
        setUploadError(data.error || 'Failed to upload image from URL to Supabase');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Network error during upload from URL');
    } finally {
      setIsUploadingFromUrl(false);
    }
  };

  const handleSelectPreset = (presetUrl: string, presetLabel: string) => {
    playTactileClick();
    onImageChange(presetUrl);
    setInputUrl(presetUrl);
    setMetadata({
      fileName: `${presetLabel}.jpg`,
      fileSizeFormatted: 'Archival Preset',
      sourceType: 'curated_preset',
    });

    const probe = new Image();
    probe.onload = () => {
      setMetadata((prev) =>
        prev ? { ...prev, width: probe.naturalWidth, height: probe.naturalHeight } : null
      );
    };
    probe.src = presetUrl;
  };

  const handleRemoveImage = () => {
    playTactileClick();
    onImageChange('');
    setInputUrl('');
    setMetadata(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const relevantPresets = category
    ? ARCHIVE_IMAGE_PRESETS.filter((p) => p.category === category)
    : ARCHIVE_IMAGE_PRESETS;

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-[var(--border-subtle)]">
        <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-bold flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>{label}</span>
        </label>
        <span className="text-[10px] uppercase font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 border border-emerald-500/30 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Bucket: {SUPABASE_STORAGE_BUCKET}</span>
        </span>
      </div>

      {/* 4 Method Switcher Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[var(--bg-subtle)] border border-[var(--border-main)] overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => {
            playTactileClick();
            setActiveMethod('url');
          }}
          className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
            activeMethod === 'url'
              ? 'bg-emerald-600 text-white font-bold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Supabase Image Link</span>
        </button>
        <button
          type="button"
          onClick={() => {
            playTactileClick();
            setActiveMethod('bucket');
            refreshBucketFiles();
          }}
          className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
            activeMethod === 'bucket'
              ? 'bg-emerald-600 text-white font-bold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Bucket Files ({bucketFiles.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            playTactileClick();
            setActiveMethod('file');
          }}
          className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
            activeMethod === 'file'
              ? 'bg-emerald-600 text-white font-bold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload File</span>
        </button>
        <button
          type="button"
          onClick={() => {
            playTactileClick();
            setActiveMethod('presets');
          }}
          className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
            activeMethod === 'presets'
              ? 'bg-emerald-600 text-white font-bold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Presets</span>
        </button>
      </div>

      {/* METHOD 1: SUPABASE IMAGE LINK (DEFAULT & PRIMARY) */}
      {activeMethod === 'url' && (
        <div className="p-3.5 bg-[var(--bg-subtle)] border border-emerald-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-[var(--text-primary)] flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Attach Supabase Storage Image Link</span>
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              Auto-resolves spaces &amp; filenames
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Paste Supabase image URL or filename (e.g. CAP.jpeg or https://uwoyznudoiwjttoxnptr.supabase.co/...)"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyUrl();
                    }
                  }}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] px-3 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
                {inputUrl && (
                  <button
                    type="button"
                    onClick={() => setInputUrl('')}
                    className="absolute right-2 top-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleApplyUrl()}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Connect and load image preview from this link"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Load Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUploadFromUrl()}
                  disabled={isUploadingFromUrl || !inputUrl.trim()}
                  className="flex-1 sm:flex-none px-3 py-2 bg-[var(--bg-card)] hover:bg-[var(--bg-card-header)] border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="If you provide an external image URL, upload and store it directly in your Supabase Storage bucket"
                >
                  {isUploadingFromUrl ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Upload to Bucket</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[10px] text-[var(--text-muted)] font-mono leading-relaxed">
              • Enter a full Supabase URL or just the file name (e.g. <code className="text-emerald-300">CAP.jpeg</code> or <code className="text-emerald-300">BLUE BAGGY FIT DENIM JEANS.jpeg</code>).<br />
              • If you paste an external image link, click <strong className="text-emerald-300">Upload to Bucket</strong> to download and upload it into your Supabase <code className="text-emerald-300">prodct-images</code> bucket permanently.
            </p>
          </div>

          {/* Quick-Select Suggestions From Official Supabase Bucket */}
          <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
              Quick 1-Click Drop 01 Garment Photos in Bucket:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'CAP.jpeg', name: 'CAP.jpeg' },
                { label: 'BLUE BAGGY FIT DENIM JEANS.jpeg', name: 'BLUE%20BAGGY%20FIT%20DENIM%20JEANS.jpeg' },
                { label: 'BLACK RED EYE BAGGY FIT T SHIRT.jpeg', name: 'BLACK%20RED%20EYE%20BAGGY%20FIT%20T%20SHIRT.jpeg' },
                { label: 'BEIGE HAND T SHIRT.jpeg', name: 'BEIGE%20HAND%20T%20SHIRT.jpeg' },
              ].map((item) => {
                const directUrl = `https://uwoyznudoiwjttoxnptr.supabase.co/storage/v1/object/public/prodct-images/${item.name}`;
                const isSelected = currentImageUrl === directUrl;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      playTactileClick();
                      setInputUrl(directUrl);
                      onImageChange(directUrl);
                      setUrlUploadSuccess(`Connected ${decodeURIComponent(item.name)} from Supabase.`);
                      setMetadata({
                        fileName: decodeURIComponent(item.name),
                        fileSizeFormatted: 'Supabase Storage · prodct-images',
                        sourceType: 'direct_url',
                      });
                      const probe = new Image();
                      probe.onload = () => {
                        setMetadata((prev) =>
                          prev ? { ...prev, width: probe.naturalWidth, height: probe.naturalHeight } : null
                        );
                      };
                      probe.src = directUrl;
                    }}
                    className={`px-2 py-1 text-[10px] font-mono border transition-colors cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-emerald-500/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Database className="w-2.5 h-2.5 text-emerald-400" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* METHOD 2: BROWSE SUPABASE STORAGE BUCKET */}
      {activeMethod === 'bucket' && (
        <div className="p-3.5 bg-[var(--bg-subtle)] border border-emerald-500/40 space-y-2.5">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 text-[10px]">
            <span className="font-bold uppercase text-emerald-400 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Supabase Storage · {SUPABASE_STORAGE_BUCKET} ({bucketFiles.length} files)</span>
            </span>
            <button
              type="button"
              onClick={refreshBucketFiles}
              disabled={isSyncingBucket}
              className="text-emerald-300 hover:text-emerald-100 flex items-center gap-1 cursor-pointer font-bold"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingBucket ? 'animate-spin' : ''}`} />
              <span>{isSyncingBucket ? 'Refreshing...' : 'Refresh Bucket'}</span>
            </button>
          </div>

          {bucketFiles.length === 0 ? (
            <div className="text-[11px] text-[var(--text-muted)] py-3 text-center">
              No files returned yet. Click <strong className="text-emerald-400">Refresh Bucket</strong> or switch to the <strong className="text-emerald-400">Supabase Image Link</strong> tab to enter your public image URL.
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Click any file to stage its lookbook photo:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pt-1">
                {bucketFiles.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => {
                      playTactileClick();
                      onImageChange(f.publicUrl);
                      setInputUrl(f.publicUrl);
                      setUrlUploadSuccess(`Connected ${f.name} from Supabase.`);
                      setMetadata({
                        fileName: f.name,
                        fileSizeFormatted: 'Supabase Storage',
                        sourceType: 'direct_url',
                      });
                      const probe = new Image();
                      probe.onload = () => {
                        setMetadata((prev) =>
                          prev ? { ...prev, width: probe.naturalWidth, height: probe.naturalHeight } : null
                        );
                      };
                      probe.src = f.publicUrl;
                    }}
                    className={`p-2 text-left border flex items-center gap-2 transition-colors cursor-pointer ${
                      currentImageUrl === f.publicUrl
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-emerald-500/50 text-[var(--text-primary)]'
                    }`}
                  >
                    <FolderOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs truncate font-bold">{f.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)] truncate">{f.publicUrl}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* METHOD 3: LOCAL FILE DRAG & DROP ZONE (Auto-Uploads to Supabase) */}
      {activeMethod === 'file' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 sm:p-7 border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
            dragOver
              ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
              : 'border-[var(--border-main)] hover:border-emerald-500/70 bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-main)] text-emerald-400">
            <Upload className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider block text-[var(--text-primary)]">
              Click to Select or Drag Image File
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block">
              Automatically uploads to Supabase Storage bucket <code className="text-emerald-300">{SUPABASE_STORAGE_BUCKET}</code>
            </span>
            <span className="text-[9px] text-[var(--text-secondary)] block">
              PNG, JPG, WEBP, or SVG · Preserves native resolution (1451 × 1084 / 1084 × 1451)
            </span>
          </div>
        </div>
      )}

      {/* METHOD 4: ARCHIVE PRESETS */}
      {activeMethod === 'presets' && (
        <div className="p-3.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2">
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Select 1-Click Lookbook Preset:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {relevantPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset.url, preset.label)}
                className="px-2.5 py-1.5 bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-emerald-500 text-[10px] text-[var(--text-secondary)] hover:text-emerald-300 transition-colors cursor-pointer"
              >
                + {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Success Notification */}
      {urlUploadSuccess && (
        <div className="p-2.5 bg-emerald-950/50 border border-emerald-500/60 text-emerald-300 text-xs font-mono flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{urlUploadSuccess}</span>
          </span>
          <button
            type="button"
            onClick={() => setUrlUploadSuccess(null)}
            className="text-emerald-400 hover:text-emerald-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Notice Message */}
      {storageNotice && (
        <div className="p-2 bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[10px] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>{storageNotice}</span>
          </span>
          <button
            type="button"
            onClick={() => setStorageNotice(null)}
            className="text-emerald-400 hover:text-emerald-200 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* THUMBNAIL PREVIEW CARD (Visible as soon as an image is selected before official submission) */}
      {currentImageUrl ? (
        <div className="p-3.5 bg-[var(--bg-card)] border-2 border-emerald-500/60 shadow-lg relative group transition-all">
          {/* Staged status header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-subtle)] mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Thumbnail Preview Staged
              </span>
              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono flex items-center gap-1">
                <Database className="w-2.5 h-2.5 text-emerald-400" />
                <span>
                  {currentImageUrl.includes('product-images') || currentImageUrl.includes('supabase.co')
                    ? 'Supabase Storage · product-images'
                    : 'Ready for Supabase Storage'}
                </span>
              </span>
            </div>
            {isProcessing && (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Uploading to Supabase...</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Thumbnail Canvas with Hover Inspection */}
            <div
              onClick={() => setIsLightboxOpen(true)}
              className="w-28 h-28 sm:w-32 sm:h-32 bg-black/90 border border-[var(--border-main)] shrink-0 overflow-hidden relative group cursor-pointer flex items-center justify-center shadow-inner"
              title="Click to view full thumbnail preview"
            >
              <img
                src={getSupabaseProductImageUrl(currentImageUrl)}
                alt="Selected thumbnail preview"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  const cdnFallback = productId ? VERIFIED_PRODUCT_CDN_IMAGES[productId] : undefined;
                  const localFallback = productId ? `/uploads/${productId}.jpg` : undefined;
                  if (cdnFallback && target.src !== cdnFallback) {
                    target.src = cdnFallback;
                  } else if (localFallback && target.src !== localFallback) {
                    target.src = localFallback;
                  } else {
                    target.style.display = 'none';
                  }
                }}
                className={`w-full h-full transition-transform duration-300 group-hover:scale-105 ${
                  imageFit === 'cover' ? 'object-cover object-center' : 'object-contain p-2'
                } filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]`}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
                <Maximize2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] font-mono uppercase font-bold tracking-wider">
                  Inspect
                </span>
              </div>
              <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/85 text-[8px] font-mono text-emerald-400 font-bold border border-emerald-500/30">
                {imageFit === 'cover' ? 'FILL' : 'FIT'}
              </span>
            </div>

            {/* Selected File Details & Specs */}
            <div className="flex-1 space-y-2 text-left w-full min-w-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)] truncate">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate" title={metadata?.fileName || 'Selected Image'}>
                    {metadata?.fileName || 'Selected Image'}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Image staged in memory. Will be officially committed to product catalog and Supabase registry upon form submission.
                </p>
              </div>

              {/* Specs Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {metadata?.width && metadata?.height && (
                  <span className="px-2 py-0.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-primary)]">
                    {metadata.width} × {metadata.height} px
                  </span>
                )}
                {metadata?.fileSizeFormatted && (
                  <span className="px-2 py-0.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)]">
                    {metadata.fileSizeFormatted}
                  </span>
                )}
                {metadata?.mimeType && (
                  <span className="px-2 py-0.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)] uppercase">
                    {metadata.mimeType.replace('image/', '')}
                  </span>
                )}
              </div>

              {/* Card Fit Adjustment Mode Selector */}
              {onImageFitChange && (
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] font-bold">
                    <SlidersHorizontal className="w-3 h-3 text-emerald-400" />
                    <span>FIT IN PICTURE:</span>
                  </div>
                  <div className="inline-flex border border-[var(--border-main)] bg-[var(--bg-subtle)] p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        playTactileClick();
                        onImageFitChange('cover');
                      }}
                      className={`px-2 py-0.5 text-[9px] uppercase font-bold transition-all cursor-pointer ${
                        imageFit === 'cover'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                      title="Fill picture frame edge-to-edge (recommended for lookbook photographs)"
                    >
                      Fill Picture (Cover)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playTactileClick();
                        onImageFitChange('contain');
                      }}
                      className={`px-2 py-0.5 text-[9px] uppercase font-bold transition-all cursor-pointer ${
                        imageFit === 'contain'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                      title="Fit entire piece inside frame without cropping (best for transparent PNG cutouts)"
                    >
                      Fit Piece (Contain)
                    </button>
                  </div>
                  <span className="text-[9px] text-[var(--text-muted)] hidden sm:inline">
                    {imageFit === 'cover' ? '· Fills frame edge-to-edge' : '· Full silhouette visible'}
                  </span>
                </div>
              )}

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="px-2.5 py-1 bg-[var(--bg-subtle)] hover:bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-emerald-500 text-[var(--text-primary)] text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3 h-3 text-emerald-400" />
                  <span>Inspect Full Size</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--text-primary)] text-[var(--text-primary)] text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3 text-[var(--text-muted)]" />
                  <span>Replace Image</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="px-2.5 py-1 bg-red-950/40 border border-red-800/60 hover:bg-red-900/50 text-red-300 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Drag & Drop Zone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 sm:p-7 border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
            dragOver
              ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
              : 'border-[var(--border-main)] hover:border-emerald-500/70 bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-main)] text-emerald-400">
            <Upload className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider block text-[var(--text-primary)]">
              Select or Drag Image to Preview
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block">
              Generates instant thumbnail preview before submitting to Supabase / Database
            </span>
            <span className="text-[9px] text-[var(--text-secondary)] block">
              PNG, JPG, WEBP, or SVG · Preserves high resolution
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="p-2.5 bg-red-950/60 border border-red-800 text-[11px] text-red-300 flex items-center gap-2">
          <X className="w-3.5 h-3.5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Quick 1-Click Lookbook Presets */}
      <div className="pt-2 border-t border-[var(--border-subtle)]">
        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Quick Archival Lookbook Presets (1-Click Sample Thumbnails)</span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          {relevantPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(preset.url, preset.label)}
              className="px-2.5 py-1 bg-[var(--bg-subtle)] hover:bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-emerald-500 text-[10px] text-[var(--text-secondary)] hover:text-emerald-300 transition-colors cursor-pointer"
            >
              + {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Full-Screen Lightbox Preview Modal */}
      {isLightboxOpen && currentImageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6"
        >
          <div className="bg-[var(--bg-card)] border border-[var(--border-main)] max-w-2xl w-full p-4 sm:p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                  Thumbnail Inspection Preview
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 border border-emerald-500/30">
                  Ready to Submit
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-definition Image Canvas: Calibrated Frame */}
            {(() => {
              const isDenim = productId === 'upndown-denim-01';
              const lightboxRatio = isDenim ? '1451 / 1084' : '1084 / 1451';
              const lightboxLabel = isDenim ? '1451 × 1084 PX' : '1084 × 1451 PX';

              return (
                <div
                  style={{ aspectRatio: lightboxRatio, maxHeight: '68vh' }}
                  className="w-full bg-black/95 border border-[var(--border-subtle)] flex items-center justify-center relative overflow-hidden p-0 mx-auto"
                >
                  {/* Viewfinder Registration Marks */}
                  <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t-2 border-l-2 border-emerald-400/80 pointer-events-none z-10" />
                  <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t-2 border-r-2 border-emerald-400/80 pointer-events-none z-10" />
                  <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b-2 border-l-2 border-emerald-400/80 pointer-events-none z-10" />
                  <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b-2 border-r-2 border-emerald-400/80 pointer-events-none z-10" />

                  <div className="absolute top-3 left-3 z-10 pointer-events-none">
                    <span className="text-[10px] font-mono uppercase bg-black/85 backdrop-blur-xs text-emerald-400 px-2 py-0.5 border border-emerald-500/40 tracking-wider">
                      FRAME: {lightboxLabel}
                    </span>
                  </div>

              <img
                src={getSupabaseProductImageUrl(currentImageUrl)}
                alt="Enlarged thumbnail preview"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  const cdnFallback = productId ? VERIFIED_PRODUCT_CDN_IMAGES[productId] : undefined;
                  if (cdnFallback && target.src !== cdnFallback) {
                    target.src = cdnFallback;
                  } else {
                    target.style.display = 'none';
                  }
                }}
                className={`w-full h-full max-h-full max-w-full ${
                  imageFit === 'cover' ? 'object-cover object-center' : 'object-contain object-center'
                }`}
              />
              {onImageFitChange && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      playTactileClick();
                      onImageFitChange(imageFit === 'cover' ? 'contain' : 'cover');
                    }}
                    className="px-2.5 py-1 bg-black/85 hover:bg-black text-[10px] font-mono uppercase text-white border border-white/20 backdrop-blur-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-emerald-400" />
                    <span>Mode: {imageFit === 'cover' ? 'Fill Frame' : 'Fit Entire Piece'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })()}

            {/* Details Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-subtle)] text-[11px] font-mono">
              <div className="text-[var(--text-secondary)]">
                {metadata?.fileName && <span className="font-bold text-[var(--text-primary)]">{metadata.fileName}</span>}
                {metadata?.width && metadata?.height && (
                  <span className="text-[var(--text-muted)] ml-2">({metadata.width} × {metadata.height} px)</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider cursor-pointer"
              >
                Confirm &amp; Keep Thumbnail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
