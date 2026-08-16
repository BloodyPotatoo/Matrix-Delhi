'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Download, 
  RotateCcw, 
  Sliders, 
  Sparkles, 
  Image as ImageIcon,
  Trash2
} from 'lucide-react';

interface FilterSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  hueRotate: number;
}

interface TransformSettings {
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
}

const DEFAULT_FILTERS: FilterSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  hueRotate: 0,
};

const DEFAULT_TRANSFORMS: TransformSettings = {
  rotation: 0,
  flipH: false,
  flipV: false,
};

interface Preset {
  name: string;
  description: string;
  filters: FilterSettings;
}

const PRESETS: Preset[] = [
  {
    name: 'Original',
    description: 'Reset to default settings',
    filters: DEFAULT_FILTERS,
  },
  {
    name: 'Cinematic',
    description: 'Warm highlights & cool shadows',
    filters: { brightness: 95, contrast: 125, saturation: 110, blur: 0, hueRotate: 345 },
  },
  {
    name: 'Vintage',
    description: 'Faded, warm nostalgic look',
    filters: { brightness: 90, contrast: 85, saturation: 75, blur: 0, hueRotate: 25 },
  },
  {
    name: 'Dramatic B&W',
    description: 'High contrast monochrome',
    filters: { brightness: 100, contrast: 145, saturation: 0, blur: 0, hueRotate: 0 },
  },
  {
    name: 'Warm Sun',
    description: 'Golden hour glow',
    filters: { brightness: 105, contrast: 100, saturation: 120, blur: 0, hueRotate: 10 },
  },
  {
    name: 'Cool Breeze',
    description: 'Chilled, blue-toned aesthetic',
    filters: { brightness: 100, contrast: 105, saturation: 90, blur: 0, hueRotate: 190 },
  },
];

export default function PhotoEditor() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('image.jpg');
  const [filters, setFilters] = useState<FilterSettings>(DEFAULT_FILTERS);
  const [transforms, setTransforms] = useState<TransformSettings>(DEFAULT_TRANSFORMS);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImage(file);
    }
  };

  const loadImage = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
        // Reset settings on new image load
        setFilters(DEFAULT_FILTERS);
        setTransforms(DEFAULT_TRANSFORMS);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(file);
    }
  };

  // Reset all edits
  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setTransforms(DEFAULT_TRANSFORMS);
  };

  // Apply preset
  const applyPreset = (presetFilters: FilterSettings) => {
    setFilters(presetFilters);
  };

  // Update individual filter values
  const updateFilter = (key: keyof FilterSettings, value: number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Transformations
  const rotateClockwise = () => {
    setTransforms((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };

  const toggleFlipH = () => {
    setTransforms((prev) => ({ ...prev, flipH: !prev.flipH }));
  };

  const toggleFlipV = () => {
    setTransforms((prev) => ({ ...prev, flipV: !prev.flipV }));
  };

  // Export edited image using HTML5 Canvas
  const handleExport = () => {
    if (!imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isRotated90or270 = transforms.rotation === 90 || transforms.rotation === 270;
      
      // Set canvas dimensions based on rotation
      const width = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
      const height = isRotated90or270 ? img.naturalWidth : img.naturalHeight;
      
      canvas.width = width;
      canvas.height = height;

      // Apply CSS-like filters to canvas context
      const filterString = `
        brightness(${filters.brightness}%) 
        contrast(${filters.contrast}%) 
        saturate(${filters.saturation}%) 
        blur(${filters.blur}px) 
        hue-rotate(${filters.hueRotate}deg)
      `.trim().replace(/\s+/g, ' ');
      
      ctx.filter = filterString;

      // Move origin to center of canvas to perform transformations
      ctx.translate(width / 2, height / 2);

      // Apply rotation
      ctx.rotate((transforms.rotation * Math.PI) / 180);

      // Apply flips
      const scaleX = transforms.flipH ? -1 : 1;
      const scaleY = transforms.flipV ? -1 : 1;
      ctx.scale(scaleX, scaleY);

      // Draw image centered
      ctx.drawImage(
        img, 
        -img.naturalWidth / 2, 
        -img.naturalHeight / 2, 
        img.naturalWidth, 
        img.naturalHeight
      );

      // Trigger download
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      link.download = `${nameWithoutExtension}_edited.jpg`;
      link.href = dataUrl;
      link.click();
    };
  };

  // Generate CSS filter string for live preview
  const getFilterStyle = () => {
    return {
      filter: `
        brightness(${filters.brightness}%) 
        contrast(${filters.contrast}%) 
        saturate(${filters.saturation}%) 
        blur(${filters.blur}px) 
        hue-rotate(${filters.hueRotate}deg)
      `,
      transform: `
        rotate(${transforms.rotation}deg) 
        scaleX(${transforms.flipH ? -1 : 1}) 
        scaleY(${transforms.flipV ? -1 : 1})
      `,
      transition: 'transform 0.2s ease-out',
    };
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              PixelCraft
            </h1>
            <p className="text-xs text-zinc-400 hidden sm:block">Client-Side Photo Editor</p>
          </div>
        </div>

        {imageSrc && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        )}
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left/Center: Preview Area */}
        <div 
          className={`flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors ${
            isDragging ? 'bg-indigo-950/20 border-2 border-dashed border-indigo-500' : 'bg-zinc-950'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {imageSrc ? (
            <div className="relative w-full h-full flex items-center justify-center max-h-[70vh] lg:max-h-full">
              {/* Image Wrapper to handle rotation bounds cleanly */}
              <div className="relative max-w-full max-h-full flex items-center justify-center p-4">
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Preview"
                  style={getFilterStyle()}
                  className="max-w-full max-h-[60vh] lg:max-h-[75vh] object-contain rounded-lg shadow-2xl border border-zinc-800"
                />
              </div>
              
              {/* Quick Action Overlay */}
              <button 
                onClick={() => setImageSrc(null)}
                className="absolute top-4 right-4 p-2 bg-zinc-900/80 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 rounded-full backdrop-blur-md border border-zinc-800 transition-all"
                title="Remove Image"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="max-w-md w-full p-8 border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 rounded-2xl bg-zinc-900/30 hover:bg-zinc-900/50 transition-all cursor-pointer text-center group"
            >
              <div className="w-14 h-14 bg-zinc-800 group-hover:bg-indigo-950/50 group-hover:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 transition-all">
                <Upload className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400" />
              </div>
              <h3 className="text-base font-semibold text-zinc-200 mb-1">Upload your photo</h3>
              <p className="text-sm text-zinc-400 mb-4">Drag and drop your image here, or click to browse</p>
              <span className="inline-block px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-800/80 rounded-md">
                Supports PNG, JPEG
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Right Sidebar: Controls */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-900/30 backdrop-blur-md flex flex-col h-[45vh] lg:h-full overflow-y-auto">
          {!imageSrc ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-500">
              <ImageIcon className="w-10 h-10 mb-3 stroke-[1.5]" />
              <p className="text-sm">Upload an image to unlock editing tools</p>
            </div>
          ) : (
            <div className="p-6 space-y-8">
              {/* Presets Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Presets</h2>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map((preset) => {
                    const isActive = JSON.stringify(filters) === JSON.stringify(preset.filters);
                    return (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(preset.filters)}
                        className={`p-3 text-left rounded-xl border transition-all ${
                          isActive 
                            ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300' 
                            : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{preset.name}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{preset.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Transformations Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <RotateCw className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Transform</h2>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={rotateClockwise}
                    className="flex flex-col items-center justify-center p-3 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all text-zinc-300 hover:text-white"
                    title="Rotate 90° Clockwise"
                  >
                    <RotateCw className="w-5 h-5 mb-1" />
                    <span className="text-xs">Rotate</span>
                  </button>
                  <button
                    onClick={toggleFlipH}
                    className={`flex flex-col items-center justify-center p-3 border rounded-xl transition-all ${
                      transforms.flipH 
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300' 
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white'
                    }`}
                    title="Flip Horizontally"
                  >
                    <FlipHorizontal className="w-5 h-5 mb-1" />
                    <span className="text-xs">Flip H</span>
                  </button>
                  <button
                    onClick={toggleFlipV}
                    className={`flex flex-col items-center justify-center p-3 border rounded-xl transition-all ${
                      transforms.flipV 
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300' 
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white'
                    }`}
                    title="Flip Vertically"
                  >
                    <FlipVertical className="w-5 h-5 mb-1" />
                    <span className="text-xs">Flip V</span>
                  </button>
                </div>
              </div>

              {/* Adjustments Sliders */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Adjustments</h2>
                </div>
                <div className="space-y-5">
                  {/* Brightness */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-zinc-400">Brightness</span>
                      <span className="text-indigo-400">{filters.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={filters.brightness}
                      onChange={(e) => updateFilter('brightness', Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Contrast */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-zinc-400">Contrast</span>
                      <span className="text-indigo-400">{filters.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={filters.contrast}
                      onChange={(e) => updateFilter('contrast', Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Saturation */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-zinc-400">Saturation</span>
                      <span className="text-indigo-400">{filters.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={filters.saturation}
                      onChange={(e) => updateFilter('saturation', Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Blur */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-zinc-400">Blur</span>
                      <span className="text-indigo-400">{filters.blur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={filters.blur}
                      onChange={(e) => updateFilter('blur', Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Hue Rotate */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-zinc-400">Hue Rotate</span>
                      <span className="text-indigo-400">{filters.hueRotate}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={filters.hueRotate}
                      onChange={(e) => updateFilter('hueRotate', Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
