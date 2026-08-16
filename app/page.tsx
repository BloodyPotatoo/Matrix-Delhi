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
  Move,
  ChevronLeft,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Scissors,
  Paintbrush,
  Eraser,
  Smile,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  CaseSensitive,
  Keyboard,
  StickyNote,
  MousePointer,
  PenTool,
  Crop,
  Play
} from 'lucide-react';

// Types & Interfaces
interface FilterSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  hueRotate: number;
  gamma: number;
}

interface Corner {
  x: number;
  y: number;
}

interface Layer {
  id: string;
  type: 'image' | 'text' | 'shape' | 'element' | 'sticky';
  name: string;
  // Image/Element specific
  src?: string;
  imgElement?: HTMLImageElement | null;
  warpMode: boolean;
  cropMode: boolean;
  cropBounds?: { x: number; y: number; width: number; height: number };
  corners: {
    tl: Corner;
    tr: Corner;
    bl: Corner;
    br: Corner;
  };
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
  fontFamily?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  isStrikethrough?: boolean;
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  isUppercase?: boolean;
}

interface ProjectConfig {
  id: string;
  name: string;
  description: string;
  aspectRatio: string; // '16:9' | '1:1' | '1:1.41' | '9:16' | 'freeform'
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
  gamma: 100,
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

const MEME_TEMPLATES = [
  {
    name: 'Doge',
    url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Distracted Boyfriend',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Drake Hotline',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Grumpy Cat',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Success Kid',
    url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=500&auto=format&fit=crop&q=80',
  },
];

const FONT_FAMILIES = [
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'Inter',
  'Roboto',
  'Playfair Display',
  'Montserrat',
  'Oswald',
  'Pacifico',
  'Courier New',
  'Georgia',
  'Impact',
  'Comic Sans MS'
];

export default function PhotoEditor() {
  // Navigation & Routing State
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [activeProject, setActiveProject] = useState<ProjectConfig>(PROJECT_TEMPLATES[0]);

  // Zoom Engine State
  const [zoom, setZoom] = useState<number>(100);

  // Document Mode Multi-Page State
  const [docPages, setDocPages] = useState<number>(1);

  // Presentation Mode Slides State
  const [slides, setSlides] = useState<{ id: string; layers: Layer[]; transition: 'fade' | 'slide' }[]>([
    { id: 'slide-1', layers: [], transition: 'fade' }
  ]);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  // Layer Engine State
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]); // Multi-select support
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<'tl' | 'tr' | 'bl' | 'br' | 'move' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [layerStartPos, setLayerStartPos] = useState({ x: 0, y: 0 });
  const [layerStartSize, setLayerStartSize] = useState({ width: 0, height: 0 });
  const [layerStartCorners, setLayerStartCorners] = useState({
    tl: { x: 0, y: 0 },
    tr: { x: 0, y: 0 },
    bl: { x: 0, y: 0 },
    br: { x: 0, y: 0 },
  });

  // Multi-select rubber-band state
  const [isRubberBanding, setIsRubberBanding] = useState(false);
  const [rubberBandStart, setRubberBandStart] = useState({ x: 0, y: 0 });
  const [rubberBandCurrent, setRubberBandCurrent] = useState({ x: 0, y: 0 });

  // Active Tool State
  const [activeTool, setActiveTool] = useState<'pointer' | 'crop' | 'draw'>('pointer');

  // Freeform Crop State
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Global Canvas Settings
  const [canvasBgColor, setCanvasBgColor] = useState<string>('#ffffff');

  // Left Panel & Drawer State
  const [activeLeftTab, setActiveLeftTab] = useState<'templates' | 'elements' | 'texts' | 'uploads' | 'tools' | 'shortcuts' | null>('templates');
  const [uploadedImages, setUploadedImages] = useState<{ name: string; src: string }[]>([]);
  const [addedShapesHistory, setAddedShapesHistory] = useState<{ type: 'rect' | 'circle'; color: string }[]>([]);

  // Meme Selector Modal State
  const [showMemeModal, setShowMemeModal] = useState(false);

  // Accordion States for Right Panel (Restructured priority)
  const [rightAccordion, setRightAccordion] = useState<{ [key: string]: boolean }>({
    filters: true,
    crop: true,
    rotation: true,
    opacity: false,
    text: true,
  });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkUploadInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle Project Selection from Dashboard
  const handleSelectProject = (project: ProjectConfig) => {
    setActiveProject(project);
    setView('editor');
    setLayers([]);
    setSelectedLayerId(null);
    setSelectedLayerIds([]);
    setZoom(100);
    setDocPages(1);
    setSlides([{ id: 'slide-1', layers: [], transition: 'fade' }]);
    setActiveSlideIndex(0);

    if (project.id === 'docs') {
      setActiveLeftTab('texts'); // Focus Left Drawer on Typography inserts first
    } else {
      setActiveLeftTab('templates');
    }
  };

  // Helper to generate default corners based on position and size
  const getInitialCorners = (x: number, y: number, width: number, height: number) => {
    return {
      tl: { x, y },
      tr: { x: x + width, y },
      bl: { x, y: y + height },
      br: { x: x + width, y: y + height },
    };
  };

  // Import Image as a Layer
  const handleImportImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const src = event.target.result as string;
          addImageLayerFromSrc(file.name, src);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Bulk Upload Handler
  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const src = event.target.result as string;
            setUploadedImages((prev) => [...prev, { name: file.name, src }]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const addImageLayerFromSrc = (name: string, src: string, isBackground = false) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const width = isBackground ? 1200 : (img.width > 400 ? 400 : img.width);
      const height = isBackground ? (1200 / img.width) * img.height : (img.width > 400 ? (400 / img.width) * img.height : img.height);
      const x = isBackground ? 0 : 100;
      const y = isBackground ? 0 : 100;
      const newLayer: Layer = {
        id: Date.now().toString(),
        type: 'image',
        name: name,
        src: src,
        imgElement: img,
        warpMode: false,
        cropMode: false,
        corners: getInitialCorners(x, y, width, height),
        x: x,
        y: y,
        width: width,
        height: height,
        rotation: 0,
        opacity: 100,
        flipH: false,
        flipV: false,
        filters: { ...DEFAULT_FILTERS },
      };
      setLayers((prev) => isBackground ? [newLayer, ...prev] : [...prev, newLayer]);
      setSelectedLayerId(newLayer.id);
      setSelectedLayerIds([newLayer.id]);
    };
  };

  // Add Meme Layer
  const addMemeLayer = (name: string, url: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      const width = 300;
      const height = (300 / img.width) * img.height;
      const x = 150;
      const y = 150 + layers.length * 15;
      const newLayer: Layer = {
        id: Date.now().toString(),
        type: 'image',
        name: `${name} Meme`,
        src: url,
        imgElement: img,
        warpMode: false,
        cropMode: false,
        corners: getInitialCorners(x, y, width, height),
        x: x,
        y: y,
        width: width,
        height: height,
        rotation: 0,
        opacity: 100,
        flipH: false,
        flipV: false,
        filters: { ...DEFAULT_FILTERS },
      };
      setLayers((prev) => [...prev, newLayer]);
      setSelectedLayerId(newLayer.id);
      setSelectedLayerIds([newLayer.id]);
    };
  };

  // Add Text Layer
  const addTextLayer = (presetType?: 'heading' | 'bold' | 'semibold' | 'body' | 'passive') => {
    const x = 150;
    const y = 150 + layers.length * 20;
    const width = 350;
    const height = 80;
    
    let text = 'Double click to edit';
    let fontSize = 36;
    let isBold = false;
    let color = '#000000';

    if (presetType === 'heading') {
      text = 'Main Heading';
      fontSize = 48;
      isBold = true;
    } else if (presetType === 'bold') {
      text = 'Bold Subtitle';
      fontSize = 32;
      isBold = true;
    } else if (presetType === 'semibold') {
      text = 'Semi-bold Text';
      fontSize = 24;
    } else if (presetType === 'body') {
      text = 'This is a paragraph of body text.';
      fontSize = 16;
    } else if (presetType === 'passive') {
      text = 'PASSIVE INCOME IDEAS';
      fontSize = 42;
      isBold = true;
      color = '#facc15'; // Bold yellow
    }

    const newLayer: Layer = {
      id: Date.now().toString(),
      type: 'text',
      name: text,
      text: text,
      fontSize: fontSize,
      fontFamily: 'Impact',
      color: color,
      isBold: isBold,
      isItalic: false,
      isUnderline: false,
      isStrikethrough: false,
      letterSpacing: 1,
      textAlign: 'center',
      isUppercase: true,
      warpMode: false,
      cropMode: false,
      corners: getInitialCorners(x, y, width, height),
      x: x,
      y: y,
      width: width,
      height: height,
      rotation: 0,
      opacity: 100,
      flipH: false,
      flipV: false,
      filters: { ...DEFAULT_FILTERS },
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setSelectedLayerIds([newLayer.id]);
  };

  // Add Shape Layer
  const addShapeLayer = (shapeType: 'rect' | 'circle', customColor?: string) => {
    const x = 200;
    const y = 200;
    const width = 150;
    const height = 150;
    const color = customColor || '#a855f7';
    const newLayer: Layer = {
      id: Date.now().toString(),
      type: 'shape',
      name: `${shapeType === 'rect' ? 'Rectangle' : 'Circle'} Layer`,
      shapeType: shapeType,
      color: color,
      warpMode: false,
      cropMode: false,
      corners: getInitialCorners(x, y, width, height),
      x: x,
      y: y,
      width: width,
      height: height,
      rotation: 0,
      opacity: 100,
      flipH: false,
      flipV: false,
      filters: { ...DEFAULT_FILTERS },
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setSelectedLayerIds([newLayer.id]);

    // Add to history
    setAddedShapesHistory((prev) => {
      const exists = prev.some((s) => s.type === shapeType && s.color === color);
      if (exists) return prev;
      return [{ type: shapeType, color }, ...prev].slice(0, 12);
    });
  };

  // Add Sticky Note Layer
  const addStickyNote = () => {
    const x = 200;
    const y = 200;
    const width = 180;
    const height = 180;
    const newLayer: Layer = {
      id: Date.now().toString(),
      type: 'sticky',
      name: 'Sticky Note',
      text: 'Sticky Note Content',
      color: '#fef08a', // Yellow sticky note
      warpMode: false,
      cropMode: false,
      corners: getInitialCorners(x, y, width, height),
      x: x,
      y: y,
      width: width,
      height: height,
      rotation: 0,
      opacity: 100,
      flipH: false,
      flipV: false,
      filters: { ...DEFAULT_FILTERS },
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setSelectedLayerIds([newLayer.id]);
  };

  // Add Element Layer (Stickers/Graphics)
  const addElementLayer = (name: string, emoji: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = '96px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 64, 64);
    }
    const src = canvas.toDataURL();
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const newLayer: Layer = {
        id: Date.now().toString(),
        type: 'element',
        name: name,
        src: src,
        imgElement: img,
        warpMode: false,
        cropMode: false,
        corners: getInitialCorners(150, 150, 128, 128),
        x: 150,
        y: 150,
        width: 128,
        height: 128,
        rotation: 0,
        opacity: 100,
        flipH: false,
        flipV: false,
        filters: { ...DEFAULT_FILTERS },
      };
      setLayers((prev) => [...prev, newLayer]);
      setSelectedLayerId(newLayer.id);
      setSelectedLayerIds([newLayer.id]);
    };
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
    if (selectedLayerIds.length > 0) {
      setLayers(layers.filter((l) => !selectedLayerIds.includes(l.id)));
      setSelectedLayerId(null);
      setSelectedLayerIds([]);
    } else if (selectedLayerId) {
      setLayers(layers.filter((l) => l.id !== selectedLayerId));
      setSelectedLayerId(null);
    }
  };

  // Update Selected Layer Properties
  const updateSelectedLayer = (updates: Partial<Layer>) => {
    if (!selectedLayerId) return;
    setLayers(layers.map((l) => {
      if (l.id === selectedLayerId) {
        const updated = { ...l, ...updates };
        // Keep corners in sync if position or size changes outside warp mode
        if (!updated.warpMode && (updates.x !== undefined || updates.y !== undefined || updates.width !== undefined || updates.height !== undefined)) {
          updated.corners = getInitialCorners(updated.x, updated.y, updated.width, updated.height);
        }
        return updated;
      }
      return l;
    }));
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

  // Toggle Accordion Section
  const toggleAccordion = (section: string) => {
    setRightAccordion(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Reset all edits
  const handleReset = () => {
    setLayers([]);
    setSelectedLayerId(null);
    setSelectedLayerIds([]);
    setCanvasBgColor('#ffffff');
    setZoom(100);
    setDocPages(1);
    setSlides([{ id: 'slide-1', layers: [], transition: 'fade' }]);
    setActiveSlideIndex(0);
  };

  // Affine Triangle Texture Mapper for Perspective Warp
  const drawTriangle = (
    ctx: CanvasRenderingContext2D,
    im: HTMLImageElement,
    x0: number, y0: number,
    x1: number, y1: number,
    x2: number, y2: number,
    sx0: number, sy0: number,
    sx1: number, sy1: number,
    sx2: number, sy2: number
  ) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sx0, sy0);
    ctx.lineTo(sx1, sy1);
    ctx.lineTo(sx2, sy2);
    ctx.closePath();
    ctx.clip();

    const dX10 = x1 - x0;
    const dY10 = y1 - y0;
    const dX20 = x2 - x0;
    const dY20 = y2 - y0;
    const det = dX10 * dY20 - dX20 * dY10;
    if (Math.abs(det) < 1e-6) {
      ctx.restore();
      return;
    }
    const idet = 1.0 / det;

    const dsX10 = sx1 - sx0;
    const dsY10 = sy1 - sy0;
    const dsX20 = sx2 - sx0;
    const dsY20 = sy2 - sy0;

    const a = (dY20 * dsX10 - dY10 * dsX20) * idet;
    const b = (dX10 * dsX20 - dX20 * dsX10) * idet;
    const c = sx0 - a * x0 - b * y0;

    const d = (dY20 * dsY10 - dY10 * dsY20) * idet;
    const e = (dX10 * dsY20 - dX20 * dsY10) * idet;
    const f = sy0 - d * x0 - e * y0;

    ctx.transform(a, d, b, e, c, f);
    ctx.drawImage(im, 0, 0);
    ctx.restore();
  };

  const drawWarpedImage = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    layer: Layer
  ) => {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const { tl, tr, bl, br } = layer.corners;

    // Triangle 1: Top-Left, Top-Right, Bottom-Left
    drawTriangle(ctx, img, 0, 0, w, 0, 0, h, tl.x, tl.y, tr.x, tr.y, bl.x, bl.y);
    // Triangle 2: Top-Right, Bottom-Right, Bottom-Left
    drawTriangle(ctx, img, w, 0, w, h, 0, h, tr.x, tr.y, br.x, br.y, bl.x, bl.y);
  };

  // Helper to wrap text inside a bounding box width
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  // Canvas Rendering Engine
  useEffect(() => {
    if (view !== 'editor' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-res canvas dimensions based on aspect ratio
    const baseWidth = 1200;
    let baseHeight = activeProject.aspectRatio === 'freeform' 
      ? 800 
      : Math.round(baseWidth / activeProject.ratioValue);

    // Document Mode Multi-Page Height Multiplier
    if (activeProject.id === 'docs') {
      baseHeight = baseHeight * docPages;
    }

    canvas.width = baseWidth;
    canvas.height = baseHeight;

    // 1. Draw Clean Blank Base Canvas
    ctx.fillStyle = canvasBgColor;
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    // Draw page dividers for Document Mode
    if (activeProject.id === 'docs' && docPages > 1) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 10]);
      const singlePageHeight = Math.round(baseWidth / activeProject.ratioValue);
      for (let p = 1; p < docPages; p++) {
        ctx.beginPath();
        ctx.moveTo(0, singlePageHeight * p);
        ctx.lineTo(baseWidth, singlePageHeight * p);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

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

      if ((layer.type === 'image' || layer.type === 'element') && layer.imgElement) {
        // Apply filters
        ctx.filter = `
          brightness(${layer.filters.brightness}%) 
          contrast(${layer.filters.contrast}%) 
          saturate(${layer.filters.saturation}%) 
          blur(${layer.filters.blur}px) 
          hue-rotate(${layer.filters.hueRotate}deg)
        `;

        if (layer.warpMode) {
          // Render with Perspective Warp
          drawWarpedImage(ctx, layer.imgElement, layer);
        } else {
          // Standard Affine Transform
          const centerX = layer.x + layer.width / 2;
          const centerY = layer.y + layer.height / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate((layer.rotation * Math.PI) / 180);
          ctx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);

          if (layer.cropMode && cropBox) {
            // Unconstrained Freeform Crop Engine
            ctx.drawImage(
              layer.imgElement,
              cropBox.x,
              cropBox.y,
              cropBox.width,
              cropBox.height,
              -layer.width / 2, 
              -layer.height / 2, 
              layer.width, 
              layer.height
            );
          } else {
            ctx.drawImage(
              layer.imgElement, 
              -layer.width / 2, 
              -layer.height / 2, 
              layer.width, 
              layer.height
            );
          }
        }
      } else {
        // Text, Shape, or Sticky Layers
        const centerX = layer.x + layer.width / 2;
        const centerY = layer.y + layer.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);

        if (layer.type === 'text' && layer.text) {
          ctx.fillStyle = layer.color || '#000000';
          
          // Build font string
          const fontStyle = layer.isItalic ? 'italic' : 'normal';
          const fontWeight = layer.isBold ? 'bold' : 'normal';
          ctx.font = `${fontStyle} ${fontWeight} ${layer.fontSize || 24}px ${layer.fontFamily || 'sans-serif'}`;
          ctx.textAlign = layer.textAlign || 'center';
          ctx.textBaseline = 'middle';
          
          const displayText = layer.isUppercase ? layer.text.toUpperCase() : layer.text;
          
          // Word-Wrap Enforcement
          const lines = wrapText(ctx, displayText, layer.width);
          const lineHeight = (layer.fontSize || 24) * 1.2;
          const totalHeight = lines.length * lineHeight;
          
          lines.forEach((line, index) => {
            const yOffset = -totalHeight / 2 + index * lineHeight + lineHeight / 2;
            
            // Apply letter spacing simulation
            if (layer.letterSpacing && layer.letterSpacing > 0) {
              const chars = line.split('');
              let currentX = 0;
              if (layer.textAlign === 'center') {
                const totalLineWidth = ctx.measureText(line).width + (chars.length - 1) * layer.letterSpacing;
                currentX = -totalLineWidth / 2;
              } else if (layer.textAlign === 'right') {
                const totalLineWidth = ctx.measureText(line).width + (chars.length - 1) * layer.letterSpacing;
                currentX = layer.width / 2 - totalLineWidth;
              } else {
                currentX = -layer.width / 2;
              }

              chars.forEach((char) => {
                ctx.fillText(char, currentX, yOffset);
                currentX += ctx.measureText(char).width + (layer.letterSpacing || 0);
              });
            } else {
              ctx.fillText(line, 0, yOffset);
            }

            // Underline & Strikethrough simulation
            const textWidth = ctx.measureText(line).width;
            if (layer.isUnderline) {
              ctx.beginPath();
              ctx.moveTo(-textWidth / 2, yOffset + (layer.fontSize || 24) / 2);
              ctx.lineTo(textWidth / 2, yOffset + (layer.fontSize || 24) / 2);
              ctx.strokeStyle = layer.color || '#000000';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
            if (layer.isStrikethrough) {
              ctx.beginPath();
              ctx.moveTo(-textWidth / 2, yOffset);
              ctx.lineTo(textWidth / 2, yOffset);
              ctx.strokeStyle = layer.color || '#000000';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          });
        } else if (layer.type === 'sticky') {
          // Draw sticky note background
          ctx.fillStyle = layer.color || '#fef08a';
          ctx.fillRect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);
          
          // Draw sticky note text
          ctx.fillStyle = '#1c1917';
          ctx.font = `16px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(layer.text || '', 0, 0);
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
      }

      ctx.restore();

      // Draw selection bounding box & corner handles if active
      const isSelected = selectedLayerIds.includes(layer.id) || layer.id === selectedLayerId;
      if (isSelected) {
        ctx.save();
        ctx.strokeStyle = '#ec4899'; // Neon pink selection border
        ctx.lineWidth = 2.5;
        
        if (layer.warpMode) {
          // Draw warped quad outline
          ctx.beginPath();
          ctx.moveTo(layer.corners.tl.x, layer.corners.tl.y);
          ctx.lineTo(layer.corners.tr.x, layer.corners.tr.y);
          ctx.lineTo(layer.corners.br.x, layer.corners.br.y);
          ctx.lineTo(layer.corners.bl.x, layer.corners.bl.y);
          ctx.closePath();
          ctx.stroke();

          // Draw neon pink corner handles
          ctx.fillStyle = '#ec4899';
          const hSize = 12;
          const drawHandle = (c: Corner) => {
            ctx.fillRect(c.x - hSize / 2, c.y - hSize / 2, hSize, hSize);
            ctx.strokeRect(c.x - hSize / 2, c.y - hSize / 2, hSize, hSize);
          };
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          drawHandle(layer.corners.tl);
          drawHandle(layer.corners.tr);
          drawHandle(layer.corners.bl);
          drawHandle(layer.corners.br);
        } else {
          // Standard bounding box
          ctx.setLineDash([6, 4]);
          const centerX = layer.x + layer.width / 2;
          const centerY = layer.y + layer.height / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate((layer.rotation * Math.PI) / 180);
          
          ctx.strokeRect(-layer.width / 2 - 4, -layer.height / 2 - 4, layer.width + 8, layer.height + 8);
          
          // Draw corner handles
          ctx.fillStyle = '#ec4899';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          const hSize = 12;
          ctx.fillRect(-layer.width / 2 - 4 - hSize / 2, -layer.height / 2 - 4 - hSize / 2, hSize, hSize);
          ctx.strokeRect(-layer.width / 2 - 4 - hSize / 2, -layer.height / 2 - 4 - hSize / 2, hSize, hSize);

          ctx.fillRect(layer.width / 2 + 4 - hSize / 2, -layer.height / 2 - 4 - hSize / 2, hSize, hSize);
          ctx.strokeRect(layer.width / 2 + 4 - hSize / 2, -layer.height / 2 - 4 - hSize / 2, hSize, hSize);

          ctx.fillRect(-layer.width / 2 - 4 - hSize / 2, layer.height / 2 + 4 - hSize / 2, hSize, hSize);
          ctx.strokeRect(-layer.width / 2 - 4 - hSize / 2, layer.height / 2 + 4 - hSize / 2, hSize, hSize);

          ctx.fillRect(layer.width / 2 + 4 - hSize / 2, layer.height / 2 + 4 - hSize / 2, hSize, hSize);
          ctx.strokeRect(layer.width / 2 + 4 - hSize / 2, layer.height / 2 + 4 - hSize / 2, hSize, hSize);
        }
        
        ctx.restore();
      }
    });

    // Draw Rubber-band selection box if active
    if (isRubberBanding) {
      ctx.save();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)'; // Indigo
      ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.lineWidth = 1.5;
      const rx = Math.min(rubberBandStart.x, rubberBandCurrent.x);
      const ry = Math.min(rubberBandStart.y, rubberBandCurrent.y);
      const rw = Math.abs(rubberBandStart.x - rubberBandCurrent.x);
      const rh = Math.abs(rubberBandStart.y - rubberBandCurrent.y);
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.restore();
    }
  }, [view, activeProject, layers, selectedLayerId, selectedLayerIds, canvasBgColor, isRubberBanding, rubberBandStart, rubberBandCurrent, cropBox, docPages]);

  // Global Window Dragging & Mouse Up Listeners to prevent stuck dragging outside canvas
  useEffect(() => {
    if (!isDragging || !selectedLayerId || !activeHandle) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const currentX = (e.clientX - rect.left) * scaleX;
      const currentY = (e.clientY - rect.top) * scaleY;

      const dx = currentX - dragStart.x;
      const dy = currentY - dragStart.y;

      const layer = layers.find((l) => l.id === selectedLayerId);
      if (!layer) return;

      if (layer.warpMode) {
        // Perspective Warp Mode: Drag individual corners independently
        if (activeHandle === 'move') {
          updateSelectedLayer({
            corners: {
              tl: { x: Math.round(layerStartCorners.tl.x + dx), y: Math.round(layerStartCorners.tl.y + dy) },
              tr: { x: Math.round(layerStartCorners.tr.x + dx), y: Math.round(layerStartCorners.tr.y + dy) },
              bl: { x: Math.round(layerStartCorners.bl.x + dx), y: Math.round(layerStartCorners.bl.y + dy) },
              br: { x: Math.round(layerStartCorners.br.x + dx), y: Math.round(layerStartCorners.br.y + dy) },
            }
          });
        } else {
          const updatedCorners = { ...layer.corners };
          updatedCorners[activeHandle] = {
            x: Math.round(layerStartCorners[activeHandle].x + dx),
            y: Math.round(layerStartCorners[activeHandle].y + dy),
          };
          updateSelectedLayer({ corners: updatedCorners });
        }
      } else {
        // Standard Uniform Scaling Mode
        if (activeHandle === 'move') {
          updateSelectedLayer({
            x: Math.round(layerStartPos.x + dx),
            y: Math.round(layerStartPos.y + dy),
          });
        } else {
          // Continuous Font Resizing Fix (Outward & Inward)
          const originalRatio = layerStartSize.width / layerStartSize.height;
          let newWidth = layerStartSize.width;
          let newHeight = layerStartSize.height;

          if (activeHandle === 'br') {
            newWidth = layerStartSize.width + dx;
            newHeight = newWidth / originalRatio;
            
            const fontUpdate = layer.type === 'text' ? { fontSize: Math.max(8, Math.round((newWidth / layerStartSize.width) * (layer.fontSize || 24))) } : {};

            updateSelectedLayer({
              width: Math.round(newWidth),
              height: Math.round(newHeight),
              ...fontUpdate
            });
          } else if (activeHandle === 'bl') {
            newWidth = layerStartSize.width - dx;
            newHeight = newWidth / originalRatio;
            
            const fontUpdate = layer.type === 'text' ? { fontSize: Math.max(8, Math.round((newWidth / layerStartSize.width) * (layer.fontSize || 24))) } : {};

            updateSelectedLayer({
              x: Math.round(layerStartPos.x + (layerStartSize.width - newWidth)),
              width: Math.round(newWidth),
              height: Math.round(newHeight),
              ...fontUpdate
            });
          } else if (activeHandle === 'tr') {
            newWidth = layerStartSize.width + dx;
            newHeight = newWidth / originalRatio;
            
            const fontUpdate = layer.type === 'text' ? { fontSize: Math.max(8, Math.round((newWidth / layerStartSize.width) * (layer.fontSize || 24))) } : {};

            updateSelectedLayer({
              y: Math.round(layerStartPos.y + (layerStartSize.height - newHeight)),
              width: Math.round(newWidth),
              height: Math.round(newHeight),
              ...fontUpdate
            });
          } else if (activeHandle === 'tl') {
            newWidth = layerStartSize.width - dx;
            newHeight = newWidth / originalRatio;
            
            const fontUpdate = layer.type === 'text' ? { fontSize: Math.max(8, Math.round((newWidth / layerStartSize.width) * (layer.fontSize || 24))) } : {};

            updateSelectedLayer({
              x: Math.round(layerStartPos.x + (layerStartSize.width - newWidth)),
              y: Math.round(layerStartPos.y + (layerStartSize.height - newHeight)),
              width: Math.round(newWidth),
              height: Math.round(newHeight),
              ...fontUpdate
            });
          }
        }
      }
    };

    const handleWindowMouseUp = () => {
      setIsDragging(false);
      setActiveHandle(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging, selectedLayerId, activeHandle, dragStart, layers, layerStartCorners, layerStartPos, layerStartSize]);

  // Global Window Listeners for Rubber-band selection to prevent hold glitch and out-of-canvas issues
  useEffect(() => {
    if (!isRubberBanding) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      // Clamp coordinates to canvas boundaries to prevent drawing rubber-band outside the canvas
      let currentX = (e.clientX - rect.left) * scaleX;
      let currentY = (e.clientY - rect.top) * scaleY;

      currentX = Math.max(0, Math.min(canvas.width, currentX));
      currentY = Math.max(0, Math.min(canvas.height, currentY));

      setRubberBandCurrent({ x: currentX, y: currentY });
    };

    const handleWindowMouseUp = () => {
      setIsRubberBanding(false);

      const rx = Math.min(rubberBandStart.x, rubberBandCurrent.x);
      const ry = Math.min(rubberBandStart.y, rubberBandCurrent.y);
      const rw = Math.abs(rubberBandStart.x - rubberBandCurrent.x);
      const rh = Math.abs(rubberBandStart.y - rubberBandCurrent.y);

      // Find all layers intersecting with the rubber-band box
      const selected = layers.filter((layer) => {
        const layerMaxX = layer.x + layer.width;
        const layerMaxY = layer.y + layer.height;
        return (
          layer.x < rx + rw &&
          layerMaxX > rx &&
          layer.y < ry + rh &&
          layerMaxY > ry
        );
      }).map((l) => l.id);

      setSelectedLayerIds(selected);
      if (selected.length > 0) {
        setSelectedLayerId(selected[0]);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isRubberBanding, rubberBandStart, rubberBandCurrent, layers]);

  // Interactive Canvas Dragging, Selection & Corner Handle Transformations
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // 1. Check if clicked on a corner handle of the currently selected layer
    if (selectedLayerId) {
      const layer = layers.find((l) => l.id === selectedLayerId);
      if (layer) {
        const handleRadius = 18; // Click tolerance
        
        if (layer.warpMode) {
          const dist = (p1: Corner, p2: { x: number; y: number }) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist(layer.corners.tl, { x: clickX, y: clickY }) < handleRadius) {
            setActiveHandle('tl');
            setIsDragging(true);
            setDragStart({ x: clickX, y: clickY });
            setLayerStartCorners({ ...layer.corners });
            return;
          }
          if (dist(layer.corners.tr, { x: clickX, y: clickY }) < handleRadius) {
            setActiveHandle('tr');
            setIsDragging(true);
            setDragStart({ x: clickX, y: clickY });
            setLayerStartCorners({ ...layer.corners });
            return;
          }
          if (dist(layer.corners.bl, { x: clickX, y: clickY }) < handleRadius) {
            setActiveHandle('bl');
            setIsDragging(true);
            setDragStart({ x: clickX, y: clickY });
            setLayerStartCorners({ ...layer.corners });
            return;
          }
          if (dist(layer.corners.br, { x: clickX, y: clickY }) < handleRadius) {
            setActiveHandle('br');
            setIsDragging(true);
            setDragStart({ x: clickX, y: clickY });
            setLayerStartCorners({ ...layer.corners });
            return;
          }
        } else {
          // Standard bounding box corner detection
          const cx = layer.x + layer.width / 2;
          const cy = layer.y + layer.height / 2;
          const rad = (layer.rotation * Math.PI) / 180;

          const getRotatedPoint = (px: number, py: number) => {
            const dx = px - cx;
            const dy = py - cy;
            return {
              x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
              y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
            };
          };

          const tlRot = getRotatedPoint(layer.x - 4, layer.y - 4);
          const trRot = getRotatedPoint(layer.x + layer.width + 4, layer.y - 4);
          const blRot = getRotatedPoint(layer.x - 4, layer.y + layer.height + 4);
          const brRot = getRotatedPoint(layer.x + layer.width + 4, layer.y + layer.height + 4);

          const dist = (p1: { x: number; y: number }, p2: { x: number; y: number }) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (dist(tlRot, { x: clickX, y: clickY }) < handleRadius) {
            setActiveHandle('tl');
            setIsDragging(true);
            setDragStart({ x: clickX, y: clickY });
            setLayerStartPos({ x: layer.x, y: layer.y });
            setLayerStartSize({ width: layer.width, height: layer.height });
            return;
          }
          if (dist(trRot, { x: clickX, y: clickY }) < handleRadius) {
            setActiveHandle('tr');
            setIsDragging(true);
            setDragStart({ x: clickX, y: clickY });
            setLayerStartPos({ x: layer.x, y: layer.y });
            setLayerStartSize({ width: layer.width, height: layer.height });
            return;
          }
          if (dist(blRot, { x: clickX, y: clickY }) < handleRadius) {
            setActiveHandle('bl');
            setIsDragging(true);
            setDragStart({ x: clickX, y: clickY });
            setLayerStartPos({ x: layer.x, y: layer.y });
            setLayerStartSize({ width: layer.width, height: layer.height });
            return;
          }
          if (dist(brRot, { x: clickX, y: clickY }) < handleRadius) {
            setActiveHandle('br');
            setIsDragging(true);
            setDragStart({ x: clickX, y: clickY });
            setLayerStartPos({ x: layer.x, y: layer.y });
            setLayerStartSize({ width: layer.width, height: layer.height });
            return;
          }
        }
      }
    }

    // 2. Check if clicked inside any layer to move it
    let foundLayerId: string | null = null;
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (layer.warpMode) {
        const minX = Math.min(layer.corners.tl.x, layer.corners.tr.x, layer.corners.bl.x, layer.corners.br.x);
        const maxX = Math.max(layer.corners.tl.x, layer.corners.tr.x, layer.corners.bl.x, layer.corners.br.x);
        const minY = Math.min(layer.corners.tl.y, layer.corners.tr.y, layer.corners.bl.y, layer.corners.br.y);
        const maxY = Math.max(layer.corners.tl.y, layer.corners.tr.y, layer.corners.bl.y, layer.corners.br.y);
        if (clickX >= minX && clickX <= maxX && clickY >= minY && clickY <= maxY) {
          foundLayerId = layer.id;
          setActiveHandle('move');
          setIsDragging(true);
          setDragStart({ x: clickX, y: clickY });
          setLayerStartCorners({ ...layer.corners });
          break;
        }
      } else {
        if (
          clickX >= layer.x &&
          clickX <= layer.x + layer.width &&
          clickY >= layer.y &&
          clickY <= layer.y + layer.height
        ) {
          foundLayerId = layer.id;
          setActiveHandle('move');
          setIsDragging(true);
          setDragStart({ x: clickX, y: clickY });
          setLayerStartPos({ x: layer.x, y: layer.y });
          break;
        }
      }
    }

    if (foundLayerId) {
      setSelectedLayerId(foundLayerId);
      setSelectedLayerIds([foundLayerId]);
    } else {
      // Start Rubber-band multi-select if clicked on empty canvas space
      setIsRubberBanding(true);
      setRubberBandStart({ x: clickX, y: clickY });
      setRubberBandCurrent({ x: clickX, y: clickY });
      setSelectedLayerId(null);
      setSelectedLayerIds([]);
    }
  };

  // Keyboard listener for Presentation Mode exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Trigger Full-Screen Presentation Mode
  const handlePresent = () => {
    if (containerRef.current) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Error enabling fullscreen:', err);
      });
    }
  };

  // Slide Management
  const addSlide = () => {
    const newSlideId = `slide-${slides.length + 1}`;
    setSlides([...slides, { id: newSlideId, layers: [], transition: 'fade' }]);
    setActiveSlideIndex(slides.length);
    setLayers([]);
  };

  const selectSlide = (index: number) => {
    // Save current layers to active slide
    const updatedSlides = [...slides];
    updatedSlides[activeSlideIndex].layers = [...layers];
    setSlides(updatedSlides);

    // Load selected slide layers
    setActiveSlideIndex(index);
    setLayers(updatedSlides[index].layers);
  };

  // Presentation Slide Transition Toggle
  const toggleTransition = (index: number) => {
    const updatedSlides = [...slides];
    updatedSlides[index].transition = updatedSlides[index].transition === 'fade' ? 'slide' : 'fade';
    setSlides(updatedSlides);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 text-zinc-100 overflow-hidden relative text-sm md:text-base">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              PixelCraft
            </h1>
            <p className="text-xs text-zinc-400 hidden sm:block">Cyberpunk Creative Suite</p>
          </div>
        </div>

        {view === 'editor' && (
          <div className="flex items-center gap-4">
            {activeProject.id === 'presentation' && (
              <button
                onClick={handlePresent}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Play className="w-4 h-4" />
                Present (Press Q to Exit)
              </button>
            )}
            <button
              onClick={() => setView('dashboard')}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/60 rounded-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-800/60 hover:bg-zinc-700 border border-zinc-800/60 rounded-lg transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Canvas
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        )}
      </header>

      {/* View A: Main Home Dashboard */}
      {view === 'dashboard' && (
        <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full flex flex-col justify-center z-10">
          <div className="text-center mb-12">
            <h1 className="text-6xl md:text-8xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-[0_6px_0_#4f46e5] uppercase font-mono mb-4">
              PIXELCRAFT
            </h1>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-200 mb-3">
              Select Your Creative Canvas
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm sm:text-base">
              Choose a specialized workspace template. PixelCraft dynamically configures aspect ratios, canvas engines, and contextual toolkits.
            </p>
          </div>

          {/* Navigation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROJECT_TEMPLATES.map((project) => (
              <div
                key={project.id}
                onClick={() => handleSelectProject(project)}
                className="group relative p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/60 hover:border-indigo-500/50 hover:bg-zinc-900/60 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden shadow-xl"
              >
                <div className={`absolute -right-12 -top-12 w-24 h-24 bg-gradient-to-br ${project.accentColor} opacity-10 blur-2xl group-hover:opacity-20 transition-all duration-300`} />
                
                <div>
                  <div className="p-3 bg-zinc-800/60 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                    {project.icon}
                  </div>
                  <h3 className="text-lg font-bold text-zinc-100 mb-2 group-hover:text-indigo-300 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                    {project.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-800/40">
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
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          
          {/* Context-Aware Capsule Header */}
          <div className="w-full flex justify-center py-3 bg-zinc-950/40 border-b border-zinc-800/40 z-20">
            <div className={`flex items-center gap-4 px-6 py-2.5 rounded-full border shadow-xl backdrop-blur-md transition-all duration-300 ${
              selectedLayer 
                ? 'bg-zinc-950 border-indigo-500/50 text-white' 
                : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-600 cursor-not-allowed'
            }`}>
              {/* Multi-Select Cursor Tool */}
              <button
                onClick={() => setActiveTool('pointer')}
                className={`p-2 rounded-lg transition-all ${
                  activeTool === 'pointer' ? 'bg-indigo-600 text-white' : 'hover:bg-zinc-800 text-zinc-400'
                }`}
                title="Multi-Select Cursor Tool"
              >
                <MousePointer className="w-5 h-5" />
              </button>

              <div className="h-5 w-[1px] bg-zinc-800/60" />

              {/* Opacity Slider Overlay */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Opacity</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  disabled={!selectedLayer}
                  value={selectedLayer ? selectedLayer.opacity : 100}
                  onChange={(e) => updateSelectedLayer({ opacity: Number(e.target.value) })}
                  className="w-24 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
                />
              </div>

              <div className="h-5 w-[1px] bg-zinc-800/60" />

              {/* Text Alignment Controls */}
              <div className="flex items-center gap-1">
                <button
                  disabled={!selectedLayer || selectedLayer.type !== 'text'}
                  onClick={() => updateSelectedLayer({ textAlign: 'left' })}
                  className={`p-2 rounded-lg transition-all ${
                    selectedLayer?.textAlign === 'left' ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-zinc-800 text-zinc-400'
                  }`}
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={!selectedLayer || selectedLayer.type !== 'text'}
                  onClick={() => updateSelectedLayer({ textAlign: 'center' })}
                  className={`p-2 rounded-lg transition-all ${
                    selectedLayer?.textAlign === 'center' ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-zinc-800 text-zinc-400'
                  }`}
                  title="Align Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  disabled={!selectedLayer || selectedLayer.type !== 'text'}
                  onClick={() => updateSelectedLayer({ textAlign: 'right' })}
                  className={`p-2 rounded-lg transition-all ${
                    selectedLayer?.textAlign === 'right' ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-zinc-800 text-zinc-400'
                  }`}
                  title="Align Right"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
                <button
                  disabled={!selectedLayer || selectedLayer.type !== 'text'}
                  onClick={() => updateSelectedLayer({ textAlign: 'justify' })}
                  className={`p-2 rounded-lg transition-all ${
                    selectedLayer?.textAlign === 'justify' ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-zinc-800 text-zinc-400'
                  }`}
                  title="Align Justify"
                >
                  <AlignJustify className="w-4 h-4" />
                </button>
              </div>

              <div className="h-5 w-[1px] bg-zinc-800/60" />

              {/* Case Transformer */}
              <button
                disabled={!selectedLayer || selectedLayer.type !== 'text'}
                onClick={() => updateSelectedLayer({ isUppercase: !selectedLayer?.isUppercase })}
                className={`p-2 rounded-lg transition-all ${
                  selectedLayer?.isUppercase ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-zinc-800 text-zinc-400'
                }`}
                title="Toggle UPPERCASE / lowercase"
              >
                <CaseSensitive className="w-5 h-5" />
              </button>

              <div className="h-5 w-[1px] bg-zinc-800/60" />

              {/* Colour Picker */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Color</span>
                <input
                  type="color"
                  disabled={!selectedLayer}
                  value={selectedLayer?.color || '#ffffff'}
                  onChange={(e) => updateSelectedLayer({ color: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                />
              </div>

              <div className="h-5 w-[1px] bg-zinc-800/60" />

              {/* Delete Layer */}
              <button
                disabled={!selectedLayer}
                onClick={deleteLayer}
                className="p-2 rounded-lg text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-all"
                title="Delete Layer"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            
            {/* Minimalist Left Icon Panel */}
            <div className="w-20 border-r border-zinc-800/60 bg-zinc-950 flex flex-col items-center py-6 gap-5 z-20">
              {[
                { id: 'templates', icon: <Layout className="w-8 h-8" />, label: 'Templates' },
                { id: 'elements', icon: <Smile className="w-8 h-8" />, label: 'Elements' },
                { id: 'texts', icon: <Type className="w-8 h-8" />, label: 'Texts' },
                { id: 'uploads', icon: <Upload className="w-8 h-8" />, label: 'Uploads' },
                { id: 'tools', icon: <Sliders className="w-8 h-8" />, label: 'Tools' },
                { id: 'shortcuts', icon: <Keyboard className="w-8 h-8" />, label: 'Shortcuts' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveLeftTab(activeLeftTab === tab.id ? null : (tab.id as any))}
                  className={`p-3.5 rounded-xl transition-all relative group ${
                    activeLeftTab === tab.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                  title={tab.label}
                >
                  {tab.icon}
                  <span className="absolute left-24 bg-zinc-950 text-white text-xs px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 border border-zinc-800">
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Interactive Drawer */}
            {activeLeftTab && (
              <div className="w-80 border-r border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md flex flex-col z-10 transition-all duration-300">
                <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">{activeLeftTab}</h3>
                  <button onClick={() => setActiveLeftTab(null)} className="text-zinc-500 hover:text-white">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>

                {/* Complete Scrollbar Box Fix */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent max-h-[calc(100vh-180px)]">
                  {/* Templates Drawer */}
                  {activeLeftTab === 'templates' && (
                    <div className="space-y-4">
                      <p className="text-xs text-zinc-400">
                        Active Mode: <span className="text-indigo-400 font-semibold">{activeProject.name} ({activeProject.aspectRatio})</span>
                      </p>
                      <div className="space-y-3">
                        {/* Default Passive Income Template */}
                        <div 
                          onClick={() => addImageLayerFromSrc('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&q=80', 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&q=80', true)}
                          className="group cursor-pointer bg-zinc-950 border border-zinc-800 hover:border-indigo-500 rounded-xl overflow-hidden transition-all"
                        >
                          <div className="aspect-[9/16] w-full bg-zinc-900 relative overflow-hidden flex flex-col justify-end p-4">
                            <img src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=300&q=80" className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Passive Income" />
                            <div className="relative z-10">
                              <span className="bg-yellow-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded uppercase">Passive Income</span>
                              <h4 className="text-white font-black text-sm leading-tight mt-1 drop-shadow-md">PASSIVE INCOME IDEAS</h4>
                            </div>
                          </div>
                          <div className="p-2 text-[11px] font-semibold text-zinc-300">Passive Income Ideas (9:16)</div>
                        </div>

                        {activeProject.aspectRatio === '16:9' ? (
                          <>
                            <div 
                              onClick={() => addImageLayerFromSrc('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80', true)}
                              className="group cursor-pointer bg-zinc-950 border border-zinc-800 hover:border-indigo-500 rounded-xl overflow-hidden transition-all"
                            >
                              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&q=80" className="w-full h-24 object-cover" alt="YouTube Template 1" />
                              <div className="p-2 text-[11px] font-semibold text-zinc-300">Cyberpunk Thumbnail Layout</div>
                            </div>
                            <div 
                              onClick={() => addImageLayerFromSrc('https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&q=80', 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&q=80', true)}
                              className="group cursor-pointer bg-zinc-950 border border-zinc-800 hover:border-indigo-500 rounded-xl overflow-hidden transition-all"
                            >
                              <img src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300&q=80" className="w-full h-24 object-cover" alt="YouTube Template 2" />
                              <div className="p-2 text-[11px] font-semibold text-zinc-300">Gaming Stream Layout</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div 
                              onClick={() => addImageLayerFromSrc('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80', true)}
                              className="group cursor-pointer bg-zinc-950 border border-zinc-800 hover:border-indigo-500 rounded-xl overflow-hidden transition-all"
                            >
                              <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&q=80" className="w-full h-24 object-cover" alt="Instagram Template 1" />
                              <div className="p-2 text-[11px] font-semibold text-zinc-300">Minimalist Square Post</div>
                            </div>
                            <div 
                              onClick={() => addImageLayerFromSrc('https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1200&q=80', 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1200&q=80', true)}
                              className="group cursor-pointer bg-zinc-950 border border-zinc-800 hover:border-indigo-500 rounded-xl overflow-hidden transition-all"
                            >
                              <img src="https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=300&q=80" className="w-full h-24 object-cover" alt="Instagram Template 2" />
                              <div className="p-2 text-[11px] font-semibold text-zinc-300">Neon Quote Layout</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Elements Drawer */}
                  {activeLeftTab === 'elements' && (
                    <div className="space-y-5">
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Graphic Stickers</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { name: 'Star', emoji: '⭐' },
                            { name: 'Fire', emoji: '🔥' },
                            { name: 'Heart', emoji: '❤️' },
                            { name: 'Rocket', emoji: '🚀' },
                            { name: 'Cool', emoji: '😎' },
                            { name: 'Spark', emoji: '✨' },
                            { name: 'Crown', emoji: '👑' },
                            { name: 'Ghost', emoji: '👻' },
                            { name: 'Alien', emoji: '👽' },
                          ].map((el) => (
                            <button
                              key={el.name}
                              onClick={() => addElementLayer(el.name, el.emoji)}
                              className="p-2 bg-zinc-800/30 hover:bg-zinc-800/80 border border-zinc-800/60 rounded-lg text-center text-lg transition-all"
                            >
                              {el.emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Shapes History</h4>
                        {addedShapesHistory.length === 0 ? (
                          <p className="text-[10px] text-zinc-500">No shapes added yet.</p>
                        ) : (
                          <div className="grid grid-cols-4 gap-2">
                            {addedShapesHistory.map((shape, idx) => (
                              <button
                                key={idx}
                                onClick={() => addShapeLayer(shape.type, shape.color)}
                                className="p-2 bg-zinc-800/30 hover:bg-zinc-800/80 border border-zinc-800/60 rounded-lg flex items-center justify-center"
                                title={`Re-add ${shape.type}`}
                              >
                                {shape.type === 'rect' ? (
                                  <Square className="w-4 h-4" style={{ color: shape.color }} />
                                ) : (
                                  <Circle className="w-4 h-4" style={{ color: shape.color }} />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Texts Drawer */}
                  {activeLeftTab === 'texts' && (
                    <div className="space-y-5">
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Presets</h4>
                        <div className="space-y-2">
                          <button
                            onClick={() => addTextLayer('heading')}
                            className="w-full py-2 px-3 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/60 rounded-lg text-left text-sm font-bold transition-all"
                          >
                            Add Heading
                          </button>
                          <button
                            onClick={() => addTextLayer('bold')}
                            className="w-full py-2 px-3 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/60 rounded-lg text-left text-xs font-semibold transition-all"
                          >
                            Add Subtitle
                          </button>
                          <button
                            onClick={() => addTextLayer('body')}
                            className="w-full py-2 px-3 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/60 rounded-lg text-left text-[11px] transition-all"
                          >
                            Add Paragraph Text
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Typography Selector</h4>
                        <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
                          {FONT_FAMILIES.map((font) => (
                            <button
                              key={font}
                              onClick={() => updateSelectedLayer({ fontFamily: font })}
                              className={`w-full text-left px-2.5 py-1.5 rounded text-xs border transition-all ${
                                selectedLayer?.fontFamily === font 
                                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                                  : 'bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700 text-zinc-300'
                              }`}
                              style={{ fontFamily: font }}
                            >
                              {font}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Uploads Drawer */}
                  {activeLeftTab === 'uploads' && (
                    <div className="space-y-4">
                      <div 
                        onClick={() => bulkUploadInputRef.current?.click()}
                        className="border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 rounded-xl p-4 text-center cursor-pointer transition-all bg-zinc-950/20"
                      >
                        <Upload className="w-6 h-6 mx-auto text-zinc-500 mb-2" />
                        <span className="text-xs font-semibold text-zinc-300 block">Bulk Upload</span>
                        <span className="text-[10px] text-zinc-500">Drop multiple images here</span>
                        <input
                          ref={bulkUploadInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleBulkUpload}
                          className="hidden"
                        />
                      </div>

                      {uploadedImages.length > 0 && (
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Vault Storage</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {uploadedImages.map((img, idx) => (
                              <div 
                                key={idx}
                                onClick={() => addImageLayerFromSrc(img.name, img.src)}
                                className="group cursor-pointer bg-zinc-950 border border-zinc-800 hover:border-indigo-500 rounded-lg overflow-hidden transition-all"
                              >
                                <img src={img.src} className="w-full h-16 object-cover" alt={img.name} />
                                <div className="p-1 text-[9px] text-zinc-400 truncate">{img.name}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tools Drawer */}
                  {activeLeftTab === 'tools' && (
                    <div className="space-y-3">
                      <button
                        onClick={() => setSelectedLayerId(null)}
                        className="w-full py-2.5 px-3 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/60 rounded-lg text-left text-xs font-semibold transition-all flex items-center gap-2"
                      >
                        <MousePointer className="w-4 h-4 text-indigo-400" />
                        Select / Pointer
                      </button>
                      <button
                        onClick={() => addShapeLayer('rect')}
                        className="w-full py-2.5 px-3 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/60 rounded-lg text-left text-xs font-semibold transition-all flex items-center gap-2"
                      >
                        <Square className="w-4 h-4 text-indigo-400" />
                        Vector Rectangle
                      </button>
                      <button
                        onClick={() => addShapeLayer('circle')}
                        className="w-full py-2.5 px-3 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/60 rounded-lg text-left text-xs font-semibold transition-all flex items-center gap-2"
                      >
                        <Circle className="w-4 h-4 text-indigo-400" />
                        Vector Circle
                      </button>
                      <button
                        onClick={addStickyNote}
                        className="w-full py-2.5 px-3 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/60 rounded-lg text-left text-xs font-semibold transition-all flex items-center gap-2"
                      >
                        <StickyNote className="w-4 h-4 text-indigo-400" />
                        Sticky Note
                      </button>
                      <button
                        onClick={() => addTextLayer()}
                        className="w-full py-2.5 px-3 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/60 rounded-lg text-left text-xs font-semibold transition-all flex items-center gap-2"
                      >
                        <Type className="w-4 h-4 text-indigo-400" />
                        Inline Floating Text
                      </button>
                    </div>
                  )}

                  {/* Shortcuts Drawer */}
                  {activeLeftTab === 'shortcuts' && (
                    <div className="space-y-2 text-xs text-zinc-400">
                      <div className="flex justify-between py-1 border-b border-zinc-800/40">
                        <span>Delete Layer</span>
                        <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">Del</kbd>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-800/40">
                        <span>Move Layer Up</span>
                        <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">Ctrl + Up</kbd>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-800/40">
                        <span>Move Layer Down</span>
                        <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">Ctrl + Down</kbd>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Center: Canvas Workspace */}
            <div 
              ref={containerRef}
              onWheel={handleWheelZoom}
              className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-zinc-950/20"
            >
              {/* Dynamic Aspect Ratio Container */}
              <div 
                className="relative w-full h-full flex items-center justify-center overflow-auto"
                style={{
                  maxHeight: '70vh',
                }}
              >
                {/* Isolated Workspace Canvas Zooming Engine */}
                <div 
                  className="relative bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800/60 overflow-hidden flex items-center justify-center transition-transform duration-100 ease-out"
                  style={{
                    aspectRatio: activeProject.aspectRatio === 'freeform' ? 'auto' : activeProject.ratioValue,
                    width: '100%',
                    maxWidth: activeProject.aspectRatio === '1:1.41' ? '480px' : '800px',
                    height: activeProject.aspectRatio === 'freeform' ? '480px' : 'auto',
                    transform: `scale(${zoom / 100})`,
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleCanvasMouseDown}
                    className="w-full h-full object-contain cursor-crosshair"
                  />
                </div>
              </div>

              {/* Document Mode Page Multiplier Button */}
              {activeProject.id === 'docs' && (
                <button
                  onClick={() => setDocPages((prev) => prev + 1)}
                  className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg font-bold text-xs z-20"
                >
                  <Plus className="w-4 h-4" />
                  Add Page
                </button>
              )}

              {/* Presentation Mode Slide Filmstrip Carousel */}
              {activeProject.id === 'presentation' && (
                <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-zinc-900/90 px-4 py-3 rounded-xl border border-zinc-800/60 backdrop-blur-md shadow-lg z-20 max-w-xl overflow-x-auto">
                  {slides.map((slide, idx) => (
                    <React.Fragment key={slide.id}>
                      <div 
                        onClick={() => selectSlide(idx)}
                        className={`relative w-20 aspect-video bg-zinc-950 rounded border cursor-pointer overflow-hidden flex-shrink-0 transition-all ${
                          idx === activeSlideIndex ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                          Slide {idx + 1}
                        </div>
                      </div>
                      {idx < slides.length - 1 && (
                        <button 
                          onClick={() => toggleTransition(idx)}
                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[9px] font-bold uppercase text-indigo-400 flex-shrink-0"
                          title="Toggle Transition"
                        >
                          {slides[idx].transition}
                        </button>
                      )}
                    </React.Fragment>
                  ))}
                  <button
                    onClick={addSlide}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center flex-shrink-0"
                    title="Add Slide"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Zoom Slider Control */}
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-zinc-900/90 px-4 py-2 rounded-full border border-zinc-800/60 backdrop-blur-md shadow-lg z-20">
                <button onClick={() => setZoom(Math.max(25, zoom - 10))} className="text-zinc-400 hover:text-white">
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min="25"
                  max="300"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-32 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-xs font-mono text-zinc-300 w-10 text-right">{zoom}%</span>
                <button onClick={() => setZoom(Math.min(300, zoom + 10))} className="text-zinc-400 hover:text-white">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Layer Import Bar */}
              <div className="mt-4 flex items-center gap-3 bg-zinc-900/80 px-4 py-2.5 rounded-xl border border-zinc-800/60 backdrop-blur-md shadow-lg">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mr-2">Add Layer:</span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Image Layer
                </button>
                <button
                  onClick={() => setShowMemeModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
                >
                  <Smile className="w-3.5 h-3.5 text-amber-400" />
                  Memes
                </button>
                <button
                  onClick={() => addTextLayer()}
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

            {/* Right Sidebar: Interactive Advanced Property Bar */}
            <div className="w-full lg:w-96 border-l border-zinc-800/60 bg-zinc-900/20 backdrop-blur-md flex flex-col h-full overflow-y-auto">
              <div className="p-6 space-y-6">
                
                {/* Section 1: Global Canvas Settings */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Layout className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Canvas Settings</h2>
                  </div>
                  <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60 space-y-3 shadow-md">
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
                              canvasBgColor === color ? 'border-indigo-500 scale-110' : 'border-zinc-800/60'
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
                    <div className="text-center py-6 bg-zinc-900/20 border border-dashed border-zinc-800/60 rounded-xl text-xs text-zinc-500">
                      No layers added yet. Use the bar below the canvas to add layers.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {layers.map((layer) => (
                        <div
                          key={layer.id}
                          onClick={() => {
                            setSelectedLayerId(layer.id);
                            setSelectedLayerIds([layer.id]);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            selectedLayerIds.includes(layer.id)
                              ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300'
                              : 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700 text-zinc-400'
                          }`}
                        >
                          <span className="truncate font-medium">{layer.name}</span>
                          <span className="text-[10px] text-zinc-500 uppercase">{layer.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 3: Selected Layer Properties (Accordion Panel - Restructured Priority) */}
                {selectedLayer ? (
                  <div className="space-y-4 pt-4 border-t border-zinc-800/60">
                    <div className="flex items-center gap-2 mb-2">
                      <Sliders className="w-4 h-4 text-purple-400" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Properties: <span className="text-purple-400">{selectedLayer.name}</span>
                      </h2>
                    </div>

                    {/* 1. Filter and Fine Adjustments (Sliders for Brightness, Hue, Saturation, Gamma) */}
                    <div className="border border-zinc-800/60 rounded-xl overflow-hidden bg-zinc-900/40 shadow-sm">
                      <button
                        onClick={() => toggleAccordion('filters')}
                        className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-zinc-300 hover:bg-zinc-800/50 transition-all"
                      >
                        <span>Filters & Adjustments</span>
                        <Sliders className="w-4 h-4 text-zinc-500" />
                      </button>
                      {rightAccordion.filters && (
                        <div className="p-4 border-t border-zinc-800/40 space-y-4">
                          {/* Brightness */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-zinc-400">Brightness</span>
                              <span className="text-purple-400">{selectedLayer.filters.brightness}%</span>
                            </div>
                            <input
                              type="range" min="0" max="200" value={selectedLayer.filters.brightness}
                              onChange={(e) => updateSelectedLayerFilters({ brightness: Number(e.target.value) })}
                              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
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
                              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
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
                              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                          </div>

                          {/* Hue Rotate */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-zinc-400">Hue Rotate</span>
                              <span className="text-purple-400">{selectedLayer.filters.hueRotate}°</span>
                            </div>
                            <input
                              type="range" min="0" max="360" value={selectedLayer.filters.hueRotate}
                              onChange={(e) => updateSelectedLayerFilters({ hueRotate: Number(e.target.value) })}
                              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                          </div>

                          {/* Gamma Correction */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-zinc-400">Gamma Correction</span>
                              <span className="text-purple-400">{selectedLayer.filters.gamma}%</span>
                            </div>
                            <input
                              type="range" min="10" max="200" value={selectedLayer.filters.gamma}
                              onChange={(e) => updateSelectedLayerFilters({ gamma: Number(e.target.value) })}
                              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Crop and Perspective Warp Core Selections */}
                    {(selectedLayer.type === 'image' || selectedLayer.type === 'element') && (
                      <div className="border border-zinc-800/60 rounded-xl overflow-hidden bg-zinc-900/40 shadow-sm">
                        <button
                          onClick={() => toggleAccordion('crop')}
                          className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-zinc-300 hover:bg-zinc-800/50 transition-all"
                        >
                          <span>Crop & Perspective Splitter</span>
                          <Maximize2 className="w-4 h-4 text-zinc-500" />
                        </button>
                        {rightAccordion.crop && (
                          <div className="p-4 border-t border-zinc-800/40 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs font-semibold text-zinc-300 block">Perspective Warp Mode</span>
                                <span className="text-[10px] text-zinc-500">Drag corners independently to distort</span>
                              </div>
                              <button
                                onClick={() => {
                                  const nextWarp = !selectedLayer.warpMode;
                                  updateSelectedLayer({ 
                                    warpMode: nextWarp,
                                    cropMode: false,
                                    corners: getInitialCorners(selectedLayer.x, selectedLayer.y, selectedLayer.width, selectedLayer.height)
                                  });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  selectedLayer.warpMode 
                                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' 
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {selectedLayer.warpMode ? 'Active' : 'Inactive'}
                              </button>
                            </div>

                            {/* Unconstrained Freeform Crop Engine */}
                            <div className="flex flex-col border-t border-zinc-800/40 pt-3 gap-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-xs font-semibold text-zinc-300 block">Freeform Crop Mode</span>
                                  <span className="text-[10px] text-zinc-500">Trim image dimensions instantly</span>
                                </div>
                                <button
                                  onClick={() => {
                                    const nextCrop = !selectedLayer.cropMode;
                                    updateSelectedLayer({ 
                                      cropMode: nextCrop,
                                      warpMode: false
                                    });
                                    if (nextCrop) {
                                      setCropBox({ x: 0, y: 0, width: 300, height: 300 });
                                    } else {
                                      setCropBox(null);
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    selectedLayer.cropMode 
                                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  {selectedLayer.cropMode ? 'Active' : 'Inactive'}
                                </button>
                              </div>

                              {selectedLayer.cropMode && cropBox && (
                                <div className="bg-zinc-950/40 p-3 rounded-lg space-y-2 border border-zinc-800">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Crop Boundaries</span>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[9px] text-zinc-500">Width</label>
                                      <input
                                        type="range" min="50" max="800" value={cropBox.width}
                                        onChange={(e) => setCropBox({ ...cropBox, width: Number(e.target.value) })}
                                        className="w-full accent-indigo-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] text-zinc-500">Height</label>
                                      <input
                                        type="range" min="50" max="800" value={cropBox.height}
                                        onChange={(e) => setCropBox({ ...cropBox, height: Number(e.target.value) })}
                                        className="w-full accent-indigo-500"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. Canvas Axis Rotation (90° Clockwise / 90° Anti-clockwise buttons) */}
                    <div className="border border-zinc-800/60 rounded-xl overflow-hidden bg-zinc-900/40 shadow-sm">
                      <button
                        onClick={() => toggleAccordion('rotation')}
                        className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-zinc-300 hover:bg-zinc-800/50 transition-all"
                      >
                        <span>Rotation Module</span>
                        <RotateCw className="w-4 h-4 text-zinc-500" />
                      </button>
                      {rightAccordion.rotation && (
                        <div className="p-4 border-t border-zinc-800/40 space-y-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateSelectedLayer({ rotation: (selectedLayer.rotation - 90) % 360 })}
                              className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              90° CCW
                            </button>
                            <button
                              onClick={() => updateSelectedLayer({ rotation: (selectedLayer.rotation + 90) % 360 })}
                              className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                              90° CW
                            </button>
                          </div>
                          <div>
                            <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                              <span>Fine Rotation</span>
                              <span>{selectedLayer.rotation}°</span>
                            </div>
                            <input
                              type="range" min="0" max="360"
                              value={selectedLayer.rotation}
                              onChange={(e) => updateSelectedLayer({ rotation: Number(e.target.value) })}
                              className="w-full accent-purple-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. Layer Transformation Mirroring (Flip Horizontal / Flip Vertical) */}
                    <div className="border border-zinc-800/60 rounded-xl overflow-hidden bg-zinc-900/40 shadow-sm">
                      <div className="px-4 py-3 flex items-center justify-between text-xs font-bold text-zinc-300">
                        <span>Mirror & Flip Controls</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateSelectedLayer({ flipH: !selectedLayer.flipH })}
                            className={`p-1.5 rounded border transition-all ${
                              selectedLayer.flipH ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                            }`}
                            title="Flip Horizontal"
                          >
                            <FlipHorizontal className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateSelectedLayer({ flipV: !selectedLayer.flipV })}
                            className={`p-1.5 rounded border transition-all ${
                              selectedLayer.flipV ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                            }`}
                            title="Flip Vertical"
                          >
                            <FlipVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Accordion: Opacity & Layer Alpha */}
                    <div className="border border-zinc-800/60 rounded-xl overflow-hidden bg-zinc-900/40 shadow-sm">
                      <button
                        onClick={() => toggleAccordion('opacity')}
                        className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-zinc-300 hover:bg-zinc-800/50 transition-all"
                      >
                        <span>Opacity & Layer Alpha</span>
                        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${rightAccordion.opacity ? 'rotate-180' : ''}`} />
                      </button>
                      {rightAccordion.opacity && (
                        <div className="p-4 border-t border-zinc-800/40 space-y-4">
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
                        </div>
                      )}
                    </div>

                    {/* Accordion: Typography & Text Box */}
                    {selectedLayer.type === 'text' && (
                      <div className="border border-zinc-800/60 rounded-xl overflow-hidden bg-zinc-900/40 shadow-sm">
                        <button
                          onClick={() => toggleAccordion('text')}
                          className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-zinc-300 hover:bg-zinc-800/50 transition-all"
                        >
                          <span>Typography & Text Box</span>
                          <Type className="w-4 h-4 text-zinc-500" />
                        </button>
                        {rightAccordion.text && (
                          <div className="p-4 border-t border-zinc-800/40 space-y-4">
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
                              <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                                <span>Letter Spacing</span>
                                <span>{selectedLayer.letterSpacing || 0}px</span>
                              </div>
                              <input
                                type="range" min="-5" max="20"
                                value={selectedLayer.letterSpacing || 0}
                                onChange={(e) => updateSelectedLayer({ letterSpacing: Number(e.target.value) })}
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
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="text-center py-8 bg-zinc-900/20 border border-dashed border-zinc-800/60 rounded-xl text-xs text-zinc-500">
                    Select a layer on the canvas or in the list to view and edit properties.
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Meme Selector Modal */}
      {showMemeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Smile className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg text-white">Select a Meme Template</h3>
              </div>
              <button
                onClick={() => setShowMemeModal(false)}
                className="text-zinc-400 hover:text-white text-sm font-medium"
              >
                Close
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              {MEME_TEMPLATES.map((meme) => (
                <div
                  key={meme.name}
                  onClick={() => {
                    addMemeLayer(meme.name, meme.url);
                    setShowMemeModal(false);
                  }}
                  className="group cursor-pointer bg-zinc-950 border border-zinc-800 hover:border-indigo-500 rounded-xl overflow-hidden transition-all"
                >
                  <div className="aspect-video w-full bg-zinc-900 relative overflow-hidden">
                    <img
                      src={meme.url}
                      alt={meme.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3 text-xs font-semibold text-zinc-200 group-hover:text-indigo-400 transition-colors">
                    {meme.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
