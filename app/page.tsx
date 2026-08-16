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
  Trash2,
  ArrowLeft,
  Type,
  Square,
  Circle,
  Brush,
  Layers,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileText,
  Layout,
  Palette
} from 'lucide-react';

// Types & Interfaces
interface FilterSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  hueRotate: number;
}

interface TransformSettings {
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

interface PerspectiveWarp {
  topLeftX: number;
  topLeftY: number;
  topRightX: number;
  topRightY: number;
  bottomLeftX: number;
  bottomLeftY: number;
  bottomRightX: number;
  bottomRightY: number;
}

interface TextLayer {
  id: string;
  text: string;
  fontSize: number;
  color: string;
  letterSpacing: number;
  lineHeight: number;
  x: number;
  y: number;
}

interface ProjectConfig {
  id: string;
  name: string;
  description: string;
  aspectRatio: string; // '16:9' | '1:1' | '1:1.41' | 'freeform'
  ratioValue: number; // width / height
  type: 'image' | 'document' | 'whiteboard';
  icon: React.ReactNode;
  accentColor: string;
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

const DEFAULT_WARP: PerspectiveWarp = {
  topLeftX: 0, topLeftY: 0,
  topRightX: 100, topRightY: 0,
  bottomLeftX: 0, bottomLeftY: 100,
  bottomRightX: 100, bottomRightY: 100,
};

const PROJECT_TEMPLATES: ProjectConfig[] = [
  {
    id: 'thumbnail',
    name: 'Thumbnail Maker',
    description: 'Enforce 16:9 ratio bounding box. Perfect for YouTube & Twitch.',
    aspectRatio: '16:9',
    ratioValue: 16 / 9,
    type: 'image',
    icon: <Sparkles className="w-6 h-6 text-pink-400" />,
    accentColor: 'from-pink-500 to-rose-500',
  },
  {
    id: 'instagram',
    name: 'Instagram Post',
    description: 'Enforce 1:1 ratio square bounding box. Optimized for social feeds.',
    aspectRatio: '1:1',
    ratioValue: 1 / 1,
    type: 'image',
    icon: <ImageIcon className="w-6 h-6 text-indigo-400" />,
    accentColor: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'presentation',
    name: 'Presentation Slide',
    description: 'Enforce 16:9 widescreen bounding box. Multi-page layout & typography.',
    aspectRatio: '16:9',
    ratioValue: 16 / 9,
    type: 'document',
    icon: <Layout className="w-6 h-6 text-cyan-400" />,
    accentColor: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'docs',
    name: 'Document / Flyer',
    description: 'Enforce A4 standard portrait ratio (1:1.41). Margins & text layers.',
    aspectRatio: '1:1.41',
    ratioValue: 1 / 1.414,
    type: 'document',
    icon: <FileText className="w-6 h-6 text-emerald-400" />,
    accentColor: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'whiteboard',
    name: 'Infinite Whiteboard',
    description: 'Enforce an unconstrained, freeform grid canvas. Vector shapes & freehand drawing.',
    aspectRatio: 'freeform',
    ratioValue: 1.5, // default fallback ratio for preview
    type: 'whiteboard',
    icon: <Palette className="w-6 h-6 text-amber-400" />,
    accentColor: 'from-amber-500 to-orange-500',
  },
];

const PRESETS = [
  { name: 'Original', filters: DEFAULT_FILTERS },
  { name: 'Cinematic', filters: { brightness: 95, contrast: 125, saturation: 110, blur: 0, hueRotate: 345 } },
  { name: 'Vintage', filters: { brightness: 90, contrast: 85, saturation: 75, blur: 0, hueRotate: 25 } },
  { name: 'Dramatic B&W', filters: { brightness: 100, contrast: 145, saturation: 0, blur: 0, hueRotate: 0 } },
  { name: 'Warm Sun', filters: { brightness: 105, contrast: 100, saturation: 120, blur: 0, hueRotate: 10 } },
  { name: 'Cool Breeze', filters: { brightness: 100, contrast: 105, saturation: 90, blur: 0, hueRotate: 190 } },
];

export default function PhotoEditor() {
  // Navigation & Routing State
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [activeProject, setActiveProject] = useState<ProjectConfig>(PROJECT_TEMPLATES[0]);

  // Image & Canvas State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('image.jpg');
  const [filters, setFilters] = useState<FilterSettings>(DEFAULT_FILTERS);
  const [transforms, setTransforms] = useState<TransformSettings>(DEFAULT_TRANSFORMS);
  const [warp, setWarp] = useState<PerspectiveWarp>(DEFAULT_WARP);
  const [isDragging, setIsDragging] = useState(false);

  // Document Specific State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(3);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [documentMargin, setDocumentMargin] = useState<number>(24);

  // Whiteboard Specific State
  const [brushColor, setBrushColor] = useState<string>('#a855f7'); // Neon purple
  const [brushSize, setBrushSize] = useState<number>(5);
  const [activeTool, setActiveTool] = useState<'brush' | 'rect' | 'circle' | 'select'>('brush');
  const [isDrawing, setIsDrawing] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle Project Selection from Dashboard
  const handleSelectProject = (project: ProjectConfig) => {
    setActiveProject(project);
    setView('editor');
    setImageSrc(null);
    setFilters(DEFAULT_FILTERS);
    setTransforms(DEFAULT_TRANSFORMS);
    setWarp(DEFAULT_WARP);
    setTextLayers([]);
    setSelectedTextId(null);
    setCurrentPage(1);
  };

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
    setWarp(DEFAULT_WARP);
    setTextLayers([]);
    setSelectedTextId(null);
    // Clear canvas if whiteboard
    if (activeProject.type === 'whiteboard' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        drawGrid(ctx, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  // Draw background grid for whiteboard/canvas
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#1f2937'; // zinc-800
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // Initialize and draw canvas
  useEffect(() => {
    if (view !== 'editor' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-res canvas dimensions based on aspect ratio
    const baseWidth = 1200;
    const baseHeight = activeProject.aspectRatio === 'freeform' 
      ? 800 
      : Math.round(baseWidth / activeProject.ratioValue);

    canvas.width = baseWidth;
    canvas.height = baseHeight;

    // Clear and draw background
    ctx.fillStyle = '#09090b'; // zinc-950
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    if (activeProject.type === 'whiteboard') {
      drawGrid(ctx, baseWidth, baseHeight);
    }

    // Draw uploaded image if present
    if (imageSrc) {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        ctx.save();
        
        // Apply CSS-like filters to canvas context
        ctx.filter = `
          brightness(${filters.brightness}%) 
          contrast(${filters.contrast}%) 
          saturate(${filters.saturation}%) 
          blur(${filters.blur}px) 
          hue-rotate(${filters.hueRotate}deg)
        `;

        // Center and transform
        ctx.translate(baseWidth / 2, baseHeight / 2);
        ctx.rotate((transforms.rotation * Math.PI) / 180);
        ctx.scale(transforms.flipH ? -1 : 1, transforms.flipV ? -1 : 1);

        // Draw image scaled to fit canvas bounds with margins
        const margin = activeProject.type === 'document' ? documentMargin * 4 : 0;
        const maxW = baseWidth - margin;
        const maxH = baseHeight - margin;
        const imgRatio = img.width / img.height;
        const canvasRatio = maxW / maxH;

        let drawW = maxW;
        let drawH = maxH;

        if (imgRatio > canvasRatio) {
          drawH = maxW / imgRatio;
        } else {
          drawW = maxH * imgRatio;
        }

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // Draw Text Layers
        drawTextLayers(ctx);
      };
    } else {
      // Draw Text Layers even without image (for presentation/docs)
      drawTextLayers(ctx);
    }
  }, [view, activeProject, imageSrc, filters, transforms, textLayers, documentMargin]);

  const drawTextLayers = (ctx: CanvasRenderingContext2D) => {
    textLayers.forEach((layer) => {
      ctx.save();
      ctx.fillStyle = layer.color;
      ctx.font = `bold ${layer.fontSize * 2}px sans-serif`;
      ctx.textBaseline = 'top';
      
      // Apply letter spacing simulation if needed
      ctx.fillText(layer.text, layer.x * 2, layer.y * 2);
      ctx.restore();
    });
  };

  // Handle Whiteboard Drawing
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeProject.type !== 'whiteboard' || activeTool === 'select') return;
    setIsDrawing(true);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeProject.type !== 'whiteboard') return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (activeTool === 'brush') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (activeTool === 'rect') {
      // Simple preview or direct draw
      ctx.fillStyle = brushColor;
      ctx.fillRect(x - 15, y - 15, 30, 30);
    } else if (activeTool === 'circle') {
      ctx.fillStyle = brushColor;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  // Add Text Layer
  const addTextLayer = () => {
    const newLayer: TextLayer = {
      id: Date.now().toString(),
      text: 'Double click to edit',
      fontSize: 24,
      color: '#ffffff',
      letterSpacing: 0,
      lineHeight: 1.2,
      x: 50,
      y: 50 + textLayers.length * 40,
    };
    setTextLayers([...textLayers, newLayer]);
    setSelectedTextId(newLayer.id);
  };

  const updateSelectedText = (key: keyof TextLayer, value: any) => {
    if (!selectedTextId) return;
    setTextLayers(textLayers.map(layer => 
      layer.id === selectedTextId ? { ...layer, [key]: value } : layer
    ));
  };

  // Export edited image
  const handleExport = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.download = `${activeProject.id}_export.jpg`;
    link.href = dataUrl;
    link.click();
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
            <p className="text-xs text-zinc-400 hidden sm:block">Cyberpunk Creative Suite</p>
          </div>
        </div>

        {view === 'editor' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('dashboard')}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
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

      {/* View A: Main Home Dashboard */}
      {view === 'dashboard' && (
        <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full flex flex-col justify-center">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
              Select Your Creative Canvas
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm sm:text-base">
              Choose a specialized workspace template. PixelCraft dynamically configures aspect ratios, canvas engines, and contextual toolkits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROJECT_TEMPLATES.map((project) => (
              <div
                key={project.id}
                onClick={() => handleSelectProject(project)}
                className="group relative p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-indigo-500/50 hover:bg-zinc-900/80 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                {/* Cyberpunk Glow Effect */}
                <div className={`absolute -right-12 -top-12 w-24 h-24 bg-gradient-to-br ${project.accentColor} opacity-10 blur-2xl group-hover:opacity-20 transition-all duration-300`} />
                
                <div>
                  <div className="p-3 bg-zinc-800/80 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                    {project.icon}
                  </div>
                  <h3 className="text-lg font-bold text-zinc-100 mb-2 group-hover:text-indigo-300 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                    {project.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Ratio: {project.aspectRatio}
                  </span>
                  <span className="text-xs font-medium text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Launch Workspace &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View B: Active Editor Workspace */}
      {view === 'editor' && (
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left/Center: Dynamic Canvas Preview Area */}
          <div 
            ref={containerRef}
            className={`flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors ${
              isDragging ? 'bg-indigo-950/20 border-2 border-dashed border-indigo-500' : 'bg-zinc-950'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Dynamic Aspect Ratio Container */}
            <div 
              className="relative w-full h-full flex items-center justify-center"
              style={{
                maxHeight: '75vh',
              }}
            >
              <div 
                className="relative bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 overflow-hidden flex items-center justify-center"
                style={{
                  aspectRatio: activeProject.aspectRatio === 'freeform' ? 'auto' : activeProject.ratioValue,
                  width: '100%',
                  maxWidth: activeProject.aspectRatio === '1:1.41' ? '500px' : '850px',
                  height: activeProject.aspectRatio === 'freeform' ? '500px' : 'auto',
                }}
              >
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  className="w-full h-full object-contain cursor-crosshair"
                />

                {/* Perspective Warp Markers (Only for Image/Thumbnail/Instagram) */}
                {activeProject.type === 'image' && imageSrc && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Top Left Anchor */}
                    <div 
                      className="absolute w-4 h-4 border-2 border-pink-500 bg-zinc-950 rounded-full pointer-events-auto cursor-move shadow-lg shadow-pink-500/50"
                      style={{ left: `${warp.topLeftX}%`, top: `${warp.topLeftY}%`, transform: 'translate(-50%, -50%)' }}
                    />
                    {/* Top Right Anchor */}
                    <div 
                      className="absolute w-4 h-4 border-2 border-pink-500 bg-zinc-950 rounded-full pointer-events-auto cursor-move shadow-lg shadow-pink-500/50"
                      style={{ left: `${warp.topRightX}%`, top: `${warp.topRightY}%`, transform: 'translate(-50%, -50%)' }}
                    />
                    {/* Bottom Left Anchor */}
                    <div 
                      className="absolute w-4 h-4 border-2 border-pink-500 bg-zinc-950 rounded-full pointer-events-auto cursor-move shadow-lg shadow-pink-500/50"
                      style={{ left: `${warp.bottomLeftX}%`, top: `${warp.bottomLeftY}%`, transform: 'translate(-50%, -50%)' }}
                    />
                    {/* Bottom Right Anchor */}
                    <div 
                      className="absolute w-4 h-4 border-2 border-pink-500 bg-zinc-950 rounded-full pointer-events-auto cursor-move shadow-lg shadow-pink-500/50"
                      style={{ left: `${warp.bottomRightX}%`, top: `${warp.bottomRightY}%`, transform: 'translate(-50%, -50%)' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Upload Prompt Overlay if no image and not whiteboard */}
            {!imageSrc && activeProject.type !== 'whiteboard' && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 m-auto max-w-md h-fit p-8 border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 rounded-2xl bg-zinc-900/80 backdrop-blur-md hover:bg-zinc-900 transition-all cursor-pointer text-center group z-20"
              >
                <div className="w-14 h-14 bg-zinc-800 group-hover:bg-indigo-950/50 group-hover:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 transition-all">
                  <Upload className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-zinc-200 mb-1">Upload base image</h3>
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

          {/* Right Sidebar: Contextual Feature Sidebars */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-900/30 backdrop-blur-md flex flex-col h-[45vh] lg:h-full overflow-y-auto">
            <div className="p-6 space-y-8">
              
              {/* Contextual Sidebar A: Thumbnail / Instagram Post */}
              {activeProject.type === 'image' && (
                <>
                  {/* Presets */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Presets</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => setFilters(preset.filters)}
                          className={`p-3 text-left rounded-xl border transition-all ${
                            JSON.stringify(filters) === JSON.stringify(preset.filters)
                              ? 'bg-pink-600/10 border-pink-500 text-pink-300' 
                              : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                          }`}
                        >
                          <div className="font-medium text-sm">{preset.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Perspective Warp Controls */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Maximize2 className="w-4 h-4 text-pink-400" />
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Perspective Warp</h2>
                    </div>
                    <div className="space-y-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-500">Top Left X</label>
                          <input 
                            type="range" min="0" max="50" value={warp.topLeftX} 
                            onChange={(e) => setWarp({...warp, topLeftX: Number(e.target.value)})}
                            className="w-full accent-pink-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500">Top Right X</label>
                          <input 
                            type="range" min="50" max="100" value={warp.topRightX} 
                            onChange={(e) => setWarp({...warp, topRightX: Number(e.target.value)})}
                            className="w-full accent-pink-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Adjustments */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Sliders className="w-4 h-4 text-pink-400" />
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Adjustments</h2>
                    </div>
                    <div className="space-y-4">
                      {/* Brightness */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Brightness</span>
                          <span className="text-pink-400">{filters.brightness}%</span>
                        </div>
                        <input
                          type="range" min="0" max="200" value={filters.brightness}
                          onChange={(e) => setFilters({...filters, brightness: Number(e.target.value)})}
                          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                      </div>
                      {/* Contrast */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Contrast</span>
                          <span className="text-pink-400">{filters.contrast}%</span>
                        </div>
                        <input
                          type="range" min="0" max="200" value={filters.contrast}
                          onChange={(e) => setFilters({...filters, contrast: Number(e.target.value)})}
                          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Contextual Sidebar B: Presentation / Docs */}
              {activeProject.type === 'document' && (
                <>
                  {/* Multi-page Navigation */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Pages</h2>
                    </div>
                    <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="p-1.5 hover:bg-zinc-800 rounded-lg disabled:opacity-50"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                      <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="p-1.5 hover:bg-zinc-800 rounded-lg disabled:opacity-50"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Text Layer Inserts */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Type className="w-4 h-4 text-cyan-400" />
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Typography</h2>
                    </div>
                    <button
                      onClick={addTextLayer}
                      className="w-full py-2.5 bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/30 hover:border-cyan-500 text-cyan-300 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Text Layer
                    </button>

                    {/* Active Text Layer Settings */}
                    {selectedTextId && (
                      <div className="mt-4 space-y-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                        <div>
                          <label className="text-xs text-zinc-400">Text Content</label>
                          <input
                            type="text"
                            value={textLayers.find(l => l.id === selectedTextId)?.text || ''}
                            onChange={(e) => updateSelectedText('text', e.target.value)}
                            className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-400">Font Size</label>
                          <input
                            type="range" min="12" max="72"
                            value={textLayers.find(l => l.id === selectedTextId)?.fontSize || 24}
                            onChange={(e) => updateSelectedText('fontSize', Number(e.target.value))}
                            className="w-full accent-cyan-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Margins */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium mb-2">
                      <span className="text-zinc-400">Document Margins</span>
                      <span className="text-cyan-400">{documentMargin}px</span>
                    </div>
                    <input
                      type="range" min="0" max="100" value={documentMargin}
                      onChange={(e) => setDocumentMargin(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </>
              )}

              {/* Contextual Sidebar C: Whiteboard */}
              {activeProject.type === 'whiteboard' && (
                <>
                  {/* Vector Shapes & Tools */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Brush className="w-4 h-4 text-amber-400" />
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Drawing Tools</h2>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => setActiveTool('brush')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          activeTool === 'brush' ? 'bg-amber-500/10 border-amber-500 text-amber-300' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <Brush className="w-5 h-5" />
                        <span className="text-[10px]">Brush</span>
                      </button>
                      <button
                        onClick={() => setActiveTool('rect')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          activeTool === 'rect' ? 'bg-amber-500/10 border-amber-500 text-amber-300' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <Square className="w-5 h-5" />
                        <span className="text-[10px]">Square</span>
                      </button>
                      <button
                        onClick={() => setActiveTool('circle')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          activeTool === 'circle' ? 'bg-amber-500/10 border-amber-500 text-amber-300' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <Circle className="w-5 h-5" />
                        <span className="text-[10px]">Circle</span>
                      </button>
                    </div>
                  </div>

                  {/* Brush Properties */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Sliders className="w-4 h-4 text-amber-400" />
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Brush Properties</h2>
                    </div>
                    <div className="space-y-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                      <div>
                        <label className="text-xs text-zinc-400 block mb-2">Brush Color</label>
                        <div className="flex gap-2">
                          {['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ffffff'].map((color) => (
                            <button
                              key={color}
                              onClick={() => setBrushColor(color)}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${
                                brushColor === color ? 'border-white scale-110' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-400">Brush Size</span>
                          <span className="text-amber-400">{brushSize}px</span>
                        </div>
                        <input
                          type="range" min="1" max="50" value={brushSize}
                          onChange={(e) => setBrushSize(Number(e.target.value))}
                          className="w-full accent-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        </main>
      )}
    </div>
  );
}
