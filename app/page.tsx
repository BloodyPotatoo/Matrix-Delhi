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
  Layers,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  Maximize2,
  FileText,
  Layout,
  Palette,
  Move
} from 'lucide-react';

// Types & Interfaces
interface FilterSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  hueRotate: number;
}

interface Layer {
  id: string;
  type: 'image' | 'text' | 'shape';
  name: string;
  // Image specific
  src?: string;
  imgElement?: HTMLImageElement | null;
  // Shape specific
  shapeType?: 'rect' | 'circle';
  color?: string;
  // Common transform properties
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  opacity: number; // 0 to 100
  flipH: boolean;
  flipV: boolean;
  // Filters (for image layers)
  filters: FilterSettings;
  // Text specific
  text?: string;
  fontSize?: number;
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
    ratioValue: 1.5,
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

  // Layer Engine State
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [layerStartPos, setLayerStartPos] = useState({ x: 0, y: 0 });

  // Global Canvas Settings
  const [canvasBgColor, setCanvasBgColor] = useState<string>('#ffffff'); // Clean blank white base canvas

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle Project Selection from Dashboard
  const handleSelectProject = (project: ProjectConfig) => {
    setActiveProject(project);
    setView('editor');
    setLayers([]);
    setSelectedLayerId(null);
  };

  // Import Image as a Layer
  const handleImportImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const src = event.target.result as string;
          const img = new Image();
          img.src = src;
          img.onload = () => {
            const newLayer: Layer = {
              id: Date.now().toString(),
              type: 'image',
              name: file.name,
              src: src,
              imgElement: img,
              x: 100,
              y: 100,
              width: img.width > 400 ? 400 : img.width,
              height: img.width > 400 ? (400 / img.width) * img.height : img.height,
              rotation: 0,
              opacity: 100,
              flipH: false,
              flipV: false,
              filters: { ...DEFAULT_FILTERS },
            };
            setLayers((prev) => [...prev, newLayer]);
            setSelectedLayerId(newLayer.id);
          };
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Text Layer
  const addTextLayer = () => {
    const newLayer: Layer = {
      id: Date.now().toString(),
      type: 'text',
      name: 'Text Layer',
      text: 'Double click to edit',
      fontSize: 36,
      color: '#000000',
      x: 150,
      y: 150,
      width: 300,
      height: 60,
      rotation: 0,
      opacity: 100,
      flipH: false,
      flipV: false,
      filters: { ...DEFAULT_FILTERS },
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  // Add Shape Layer
  const addShapeLayer = (shapeType: 'rect' | 'circle') => {
    const newLayer: Layer = {
      id: Date.now().toString(),
      type: 'shape',
      name: `${shapeType === 'rect' ? 'Rectangle' : 'Circle'} Layer`,
      shapeType: shapeType,
      color: '#a855f7', // Neon purple default
      x: 200,
      y: 200,
      width: 150,
      height: 150,
      rotation: 0,
      opacity: 100,
      flipH: false,
      flipV: false,
      filters: { ...DEFAULT_FILTERS },
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  // Layer Stacking Order (z-index)
  const moveLayer = (direction: 'up' | 'down') => {
    if (!selectedLayerId) return;
    const index = layers.findIndex((l) => l.id === selectedLayerId);
    if (index === -1) return;

    const newLayers = [...layers];
    if (direction === 'up' && index < layers.length - 1) {
      const temp = newLayers[index];
      newLayers[index] = newLayers[index + 1];
      newLayers[index + 1] = temp;
    } else if (direction === 'down' && index > 0) {
      const temp = newLayers[index];
      newLayers[index] = newLayers[index - 1];
      newLayers[index - 1] = temp;
    }
    setLayers(newLayers);
  };

  const deleteLayer = () => {
    if (!selectedLayerId) return;
    setLayers(layers.filter((l) => l.id !== selectedLayerId));
    setSelectedLayerId(null);
  };

  // Update Selected Layer Properties
  const updateSelectedLayer = (updates: Partial<Layer>) => {
    if (!selectedLayerId) return;
    setLayers(layers.map((l) => (l.id === selectedLayerId ? { ...l, ...updates } : l)));
  };

  const updateSelectedLayerFilters = (updates: Partial<FilterSettings>) => {
    if (!selectedLayerId) return;
    setLayers(
      layers.map((l) => {
        if (l.id === selectedLayerId) {
          return {
            ...l,
            filters: { ...l.filters, ...updates },
          };
        }
        return l;
      })
    );
  };

  // Reset all edits
  const handleReset = () => {
    setLayers([]);
    setSelectedLayerId(null);
    setCanvasBgColor('#ffffff');
  };

  // Canvas Rendering Engine
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

    // 1. Draw Clean Blank Base Canvas
    ctx.fillStyle = canvasBgColor;
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    // 2. Draw Grid if Whiteboard
    if (activeProject.type === 'whiteboard') {
      ctx.strokeStyle = '#e5e7eb'; // light gray grid
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < baseWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, baseHeight);
        ctx.stroke();
      }
      for (let y = 0; y < baseHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(baseWidth, y);
        ctx.stroke();
      }
    }

    // 3. Draw Layers sequentially (z-index order)
    layers.forEach((layer) => {
      ctx.save();
      
      // Apply global layer opacity
      ctx.globalAlpha = layer.opacity / 100;

      // Translate to layer center for rotation & flips
      const centerX = layer.x + layer.width / 2;
      const centerY = layer.y + layer.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);

      // Apply filters if image layer
      if (layer.type === 'image' && layer.imgElement) {
        ctx.filter = `
          brightness(${layer.filters.brightness}%) 
          contrast(${layer.filters.contrast}%) 
          saturate(${layer.filters.saturation}%) 
          blur(${layer.filters.blur}px) 
          hue-rotate(${layer.filters.hueRotate}deg)
        `;
        ctx.drawImage(
          layer.imgElement, 
          -layer.width / 2, 
          -layer.height / 2, 
          layer.width, 
          layer.height
        );
      } else if (layer.type === 'text' && layer.text) {
        ctx.fillStyle = layer.color || '#000000';
        ctx.font = `bold ${layer.fontSize || 24}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(layer.text, 0, 0);
      } else if (layer.type === 'shape') {
        ctx.fillStyle = layer.color || '#a855f7';
        if (layer.shapeType === 'rect') {
          ctx.fillRect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);
        } else if (layer.shapeType === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, Math.min(layer.width, layer.height) / 2, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      ctx.restore();

      // Draw selection bounding box if active
      if (layer.id === selectedLayerId) {
        ctx.save();
        ctx.strokeStyle = '#6366f1'; // Indigo neon selection border
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        
        const centerX = layer.x + layer.width / 2;
        const centerY = layer.y + layer.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        
        ctx.strokeRect(-layer.width / 2 - 4, -layer.height / 2 - 4, layer.width + 8, layer.height + 8);
        
        // Draw corner handles
        ctx.fillStyle = '#a855f7';
        const handleSize = 8;
        ctx.fillRect(-layer.width / 2 - 8, -layer.height / 2 - 8, handleSize, handleSize);
        ctx.fillRect(layer.width / 2, -layer.height / 2 - 8, handleSize, handleSize);
        ctx.fillRect(-layer.width / 2 - 8, layer.height / 2, handleSize, handleSize);
        ctx.fillRect(layer.width / 2, layer.height / 2, handleSize, handleSize);
        
        ctx.restore();
      }
    });
  }, [view, activeProject, layers, selectedLayerId, canvasBgColor]);

  // Interactive Canvas Dragging & Selection
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Find clicked layer (traverse backwards to select top-most layer first)
    let foundLayerId: string | null = null;
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (
        clickX >= layer.x &&
        clickX <= layer.x + layer.width &&
        clickY >= layer.y &&
        clickY <= layer.y + layer.height
      ) {
        foundLayerId = layer.id;
        setIsDragging(true);
        setDragStart({ x: clickX, y: clickY });
        setLayerStartPos({ x: layer.x, y: layer.y });
        break;
      }
    }

    setSelectedLayerId(foundLayerId);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedLayerId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const dx = currentX - dragStart.x;
    const dy = currentY - dragStart.y;

    updateSelectedLayer({
      x: Math.round(layerStartPos.x + dx),
      y: Math.round(layerStartPos.y + dy),
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  // Export final canvas
  const handleExport = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.download = `pixelcraft_${activeProject.id}_export.jpg`;
    link.href = dataUrl;
    link.click();
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

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
              Back to Home
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Canvas
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
            {/* Hero Typography & Visual Hierarchy */}
            <h1 className="text-6xl md:text-8xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 drop-shadow-[0_5px_15px_rgba(99,102,241,0.4)] uppercase font-mono mb-4">
              PIXELCRAFT
            </h1>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-200 mb-3">
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
            className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-zinc-950"
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
                  className="w-full h-full object-contain cursor-move"
                />
              </div>
            </div>

            {/* Quick Layer Import Bar */}
            <div className="mt-4 flex items-center gap-3 bg-zinc-900/80 px-4 py-2.5 rounded-xl border border-zinc-800 backdrop-blur-md">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mr-2">Add Layer:</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                Image Layer
              </button>
              <button
                onClick={addTextLayer}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
              >
                <Type className="w-3.5 h-3.5" />
                Text Layer
              </button>
              <button
                onClick={() => addShapeLayer('rect')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
              >
                <Square className="w-3.5 h-3.5" />
                Rectangle
              </button>
              <button
                onClick={() => addShapeLayer('circle')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
              >
                <Circle className="w-3.5 h-3.5" />
                Circle
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImportImage}
                className="hidden"
              />
            </div>
          </div>

          {/* Right Sidebar: Unified "Single-Tab" Properties Dashboard */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-900/30 backdrop-blur-md flex flex-col h-[45vh] lg:h-full overflow-y-auto">
            <div className="p-6 space-y-6">
              
              {/* Section 1: Global Canvas Settings */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layout className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Canvas Settings</h2>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Active Template:</span>
                    <span className="text-indigo-400 font-semibold">{activeProject.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Aspect Ratio:</span>
                    <span className="text-indigo-400 font-semibold">{activeProject.aspectRatio}</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-zinc-400 block">Base Canvas Color</label>
                    <div className="flex gap-2">
                      {['#ffffff', '#f3f4f6', '#18181b', '#09090b', '#312e81'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setCanvasBgColor(color)}
                          className={`w-6 h-6 rounded-md border transition-all ${
                            canvasBgColor === color ? 'border-indigo-500 scale-110' : 'border-zinc-800'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Layer List & Stacking */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Layers ({layers.length})</h2>
                  </div>
                  {selectedLayerId && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveLayer('up')}
                        className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
                        title="Move Layer Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveLayer('down')}
                        className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
                        title="Move Layer Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={deleteLayer}
                        className="p-1 bg-red-950/50 hover:bg-red-900/50 rounded text-red-400 ml-1"
                        title="Delete Layer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {layers.length === 0 ? (
                  <div className="text-center py-6 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-xl text-xs text-zinc-500">
                    No layers added yet. Use the bar below the canvas to add layers.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {layers.map((layer) => (
                      <div
                        key={layer.id}
                        onClick={() => setSelectedLayerId(layer.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          layer.id === selectedLayerId
                            ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300'
                            : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <span className="truncate font-medium">{layer.name}</span>
                        <span className="text-[10px] text-zinc-500 uppercase">{layer.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: Selected Layer Properties (Unified Panel) */}
              {selectedLayer ? (
                <div className="space-y-5 pt-4 border-t border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Properties: <span className="text-purple-400">{selectedLayer.name}</span>
                    </h2>
                  </div>

                  {/* Text Specific Controls */}
                  {selectedLayer.type === 'text' && (
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-3">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Text Content</label>
                        <input
                          type="text"
                          value={selectedLayer.text || ''}
                          onChange={(e) => updateSelectedLayer({ text: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                          <span>Font Size</span>
                          <span>{selectedLayer.fontSize}px</span>
                        </div>
                        <input
                          type="range" min="12" max="120"
                          value={selectedLayer.fontSize || 24}
                          onChange={(e) => updateSelectedLayer({ fontSize: Number(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Text Color</label>
                        <div className="flex gap-2">
                          {['#000000', '#ffffff', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'].map((color) => (
                            <button
                              key={color}
                              onClick={() => updateSelectedLayer({ color })}
                              className={`w-5 h-5 rounded-full border transition-all ${
                                selectedLayer.color === color ? 'border-white scale-110' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shape Specific Controls */}
                  {selectedLayer.type === 'shape' && (
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-3">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Shape Color</label>
                        <div className="flex gap-2">
                          {['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ffffff'].map((color) => (
                            <button
                              key={color}
                              onClick={() => updateSelectedLayer({ color })}
                              className={`w-5 h-5 rounded-full border transition-all ${
                                selectedLayer.color === color ? 'border-white scale-110' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transform & Position Controls */}
                  <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Transform & Position</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-zinc-500">Position X</label>
                        <input
                          type="number"
                          value={selectedLayer.x}
                          onChange={(e) => updateSelectedLayer({ x: Number(e.target.value) })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500">Position Y</label>
                        <input
                          type="number"
                          value={selectedLayer.y}
                          onChange={(e) => updateSelectedLayer({ y: Number(e.target.value) })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500">Width</label>
                        <input
                          type="number"
                          value={selectedLayer.width}
                          onChange={(e) => updateSelectedLayer({ width: Number(e.target.value) })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500">Height</label>
                        <input
                          type="number"
                          value={selectedLayer.height}
                          onChange={(e) => updateSelectedLayer({ height: Number(e.target.value) })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Rotation */}
                    <div>
                      <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                        <span>Rotation</span>
                        <span>{selectedLayer.rotation}°</span>
                      </div>
                      <input
                        type="range" min="0" max="360"
                        value={selectedLayer.rotation}
                        onChange={(e) => updateSelectedLayer({ rotation: Number(e.target.value) })}
                        className="w-full accent-purple-500"
                      />
                    </div>

                    {/* Opacity */}
                    <div>
                      <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                        <span>Layer Opacity</span>
                        <span>{selectedLayer.opacity}%</span>
                      </div>
                      <input
                        type="range" min="0" max="100"
                        value={selectedLayer.opacity}
                        onChange={(e) => updateSelectedLayer({ opacity: Number(e.target.value) })}
                        className="w-full accent-purple-500"
                      />
                    </div>

                    {/* Flips */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => updateSelectedLayer({ flipH: !selectedLayer.flipH })}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 border rounded-lg text-xs transition-all ${
                          selectedLayer.flipH 
                            ? 'bg-purple-600/10 border-purple-500 text-purple-300' 
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <FlipHorizontal className="w-3.5 h-3.5" />
                        Flip H
                      </button>
                      <button
                        onClick={() => updateSelectedLayer({ flipV: !selectedLayer.flipV })}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 border rounded-lg text-xs transition-all ${
                          selectedLayer.flipV 
                            ? 'bg-purple-600/10 border-purple-500 text-purple-300' 
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <FlipVertical className="w-3.5 h-3.5" />
                        Flip V
                      </button>
                    </div>
                  </div>

                  {/* Image Filters (Only for Image Layers) */}
                  {selectedLayer.type === 'image' && (
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-4">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Filters & Adjustments</h3>
                      
                      {/* Brightness */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Brightness</span>
                          <span className="text-purple-400">{selectedLayer.filters.brightness}%</span>
                        </div>
                        <input
                          type="range" min="0" max="200" value={selectedLayer.filters.brightness}
                          onChange={(e) => updateSelectedLayerFilters({ brightness: Number(e.target.value) })}
                          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>

                      {/* Contrast */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Contrast</span>
                          <span className="text-purple-400">{selectedLayer.filters.contrast}%</span>
                        </div>
                        <input
                          type="range" min="0" max="200" value={selectedLayer.filters.contrast}
                          onChange={(e) => updateSelectedLayerFilters({ contrast: Number(e.target.value) })}
                          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>

                      {/* Saturation */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Saturation</span>
                          <span className="text-purple-400">{selectedLayer.filters.saturation}%</span>
                        </div>
                        <input
                          type="range" min="0" max="200" value={selectedLayer.filters.saturation}
                          onChange={(e) => updateSelectedLayerFilters({ saturation: Number(e.target.value) })}
                          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>

                      {/* Blur */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Blur</span>
                          <span className="text-purple-400">{selectedLayer.filters.blur}px</span>
                        </div>
                        <input
                          type="range" min="0" max="20" value={selectedLayer.filters.blur}
                          onChange={(e) => updateSelectedLayerFilters({ blur: Number(e.target.value) })}
                          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-xl text-xs text-zinc-500">
                  Select a layer on the canvas or in the list to view and edit properties.
                </div>
              )}

            </div>
          </div>
        </main>
      )}
    </div>
  );
}
