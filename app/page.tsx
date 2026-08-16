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
  Smile
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
  type: 'image' | 'text' | 'shape' | 'element';
  name: string;
  // Image/Element specific
  src?: string;
  imgElement?: HTMLImageElement | null;
  warpMode: boolean;
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

export default function PhotoEditor() {
  // Navigation & Routing State
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [activeProject, setActiveProject] = useState<ProjectConfig>(PROJECT_TEMPLATES[0]);

  // Layer Engine State
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
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

  // Global Canvas Settings
  const [canvasBgColor, setCanvasBgColor] = useState<string>('#ffffff'); // Clean blank white base canvas

  // Collapsible Left Panel State
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);

  // Accordion States for Right Panel
  const [rightAccordion, setRightAccordion] = useState<{ [key: string]: boolean }>({
    opacity: true,
    filters: false,
    crop: false,
    brush: false,
    text: true,
  });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const capsuleFileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle Project Selection from Dashboard
  const handleSelectProject = (project: ProjectConfig) => {
    setActiveProject(project);
    setView('editor');
    setLayers([]);
    setSelectedLayerId(null);
    setLeftPanelOpen(true);
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
          const img = new Image();
          img.src = src;
          img.onload = () => {
            const width = img.width > 400 ? 400 : img.width;
            const height = img.width > 400 ? (400 / img.width) * img.height : img.height;
            const x = 100;
            const y = 100;
            const newLayer: Layer = {
              id: Date.now().toString(),
              type: 'image',
              name: file.name,
              src: src,
              imgElement: img,
              warpMode: false,
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
          };
        }
      };
      reader.readAsDataURL(file);
    }
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
    };
  };

  // Add Text Layer
  const addTextLayer = (presetType?: 'heading' | 'bold' | 'semibold') => {
    const x = 150;
    const y = 150 + layers.length * 20;
    const width = 300;
    const height = 60;
    
    let text = 'Double click to edit';
    let fontSize = 36;
    let isBold = false;

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
    }

    const newLayer: Layer = {
      id: Date.now().toString(),
      type: 'text',
      name: text,
      text: text,
      fontSize: fontSize,
      fontFamily: 'sans-serif',
      color: '#000000',
      isBold: isBold,
      isItalic: false,
      isUnderline: false,
      isStrikethrough: false,
      letterSpacing: 0,
      warpMode: false,
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
  };

  // Add Shape Layer
  const addShapeLayer = (shapeType: 'rect' | 'circle') => {
    const x = 200;
    const y = 200;
    const width = 150;
    const height = 150;
    const newLayer: Layer = {
      id: Date.now().toString(),
      type: 'shape',
      name: `${shapeType === 'rect' ? 'Rectangle' : 'Circle'} Layer`,
      shapeType: shapeType,
      color: '#a855f7', // Neon purple default
      warpMode: false,
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
    if (!selectedLayerId) return;
    setLayers(layers.filter((l) => l.id !== selectedLayerId));
    setSelectedLayerId(null);
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
    setCanvasBgColor('#ffffff');
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
          ctx.drawImage(
            layer.imgElement, 
            -layer.width / 2, 
            -layer.height / 2, 
            layer.width, 
            layer.height
          );
        }
      } else {
        // Text or Shape Layers
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
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Draw text
          ctx.fillText(layer.text, 0, 0);

          // Underline & Strikethrough simulation
          const textWidth = ctx.measureText(layer.text).width;
          if (layer.isUnderline) {
            ctx.beginPath();
            ctx.moveTo(-textWidth / 2, (layer.fontSize || 24) / 2);
            ctx.lineTo(textWidth / 2, (layer.fontSize || 24) / 2);
            ctx.strokeStyle = layer.color || '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          if (layer.isStrikethrough) {
            ctx.beginPath();
            ctx.moveTo(-textWidth / 2, 0);
            ctx.lineTo(textWidth / 2, 0);
            ctx.strokeStyle = layer.color || '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
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
      if (layer.id === selectedLayerId) {
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
          const hSize = 10;
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
          const hSize = 10;
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
  }, [view, activeProject, layers, selectedLayerId, canvasBgColor]);

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
          // Uniform scaling calculation based on aspect ratio
          const originalRatio = layerStartSize.width / layerStartSize.height;
          let newWidth = layerStartSize.width;
          let newHeight = layerStartSize.height;

          if (activeHandle === 'br') {
            newWidth = Math.max(20, layerStartSize.width + dx);
            newHeight = newWidth / originalRatio;
            updateSelectedLayer({
              width: Math.round(newWidth),
              height: Math.round(newHeight),
            });
          } else if (activeHandle === 'bl') {
            newWidth = Math.max(20, layerStartSize.width - dx);
            newHeight = newWidth / originalRatio;
            updateSelectedLayer({
              x: Math.round(layerStartPos.x + (layerStartSize.width - newWidth)),
              width: Math.round(newWidth),
              height: Math.round(newHeight),
            });
          } else if (activeHandle === 'tr') {
            newWidth = Math.max(20, layerStartSize.width + dx);
            newHeight = newWidth / originalRatio;
            updateSelectedLayer({
              y: Math.round(layerStartPos.y + (layerStartSize.height - newHeight)),
              width: Math.round(newWidth),
              height: Math.round(newHeight),
            });
          } else if (activeHandle === 'tl') {
            newWidth = Math.max(20, layerStartSize.width - dx);
            newHeight = newWidth / originalRatio;
            updateSelectedLayer({
              x: Math.round(layerStartPos.x + (layerStartSize.width - newWidth)),
              y: Math.round(layerStartPos.y + (layerStartSize.height - newHeight)),
              width: Math.round(newWidth),
              height: Math.round(newHeight),
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
        const handleRadius = 15; // Click tolerance
        
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
        // Simple bounding box check for warp mode selection
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

    setSelectedLayerId(foundLayerId);
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
    <div className="flex flex-col h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 text-zinc-100 overflow-hidden relative">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md z-10">
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
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/60 rounded-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-800/60 hover:bg-zinc-700 border border-zinc-800/60 rounded-lg transition-all"
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
        <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full flex flex-col justify-center z-10">
          <div className="text-center mb-12">
            {/* Hero Typography & Visual Hierarchy */}
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
                {/* Cyberpunk Glow Effect */}
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
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 rounded-full border border-zinc-800/60 shadow-xl backdrop-blur-md">
              {/* Import Button */}
              <button
                onClick={() => capsuleFileInputRef.current?.click()}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                Import
              </button>
              <input
                ref={capsuleFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImportImage}
                className="hidden"
              />

              <div className="h-4 w-[1px] bg-zinc-800/60 mx-1" />

              {/* Text Styling Actions (Conditional Formatting) */}
              <button
                disabled={!selectedLayer || selectedLayer.type !== 'text'}
                onClick={() => updateSelectedLayer({ isBold: !selectedLayer?.isBold })}
                className={`p-1.5 rounded-lg transition-all ${
                  !selectedLayer || selectedLayer.type !== 'text'
                    ? 'text-zinc-600 cursor-not-allowed'
                    : selectedLayer.isBold
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>

              <button
                disabled={!selectedLayer || selectedLayer.type !== 'text'}
                onClick={() => updateSelectedLayer({ isItalic: !selectedLayer?.isItalic })}
                className={`p-1.5 rounded-lg transition-all ${
                  !selectedLayer || selectedLayer.type !== 'text'
                    ? 'text-zinc-600 cursor-not-allowed'
                    : selectedLayer.isItalic
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>

              <button
                disabled={!selectedLayer || selectedLayer.type !== 'text'}
                onClick={() => updateSelectedLayer({ isUnderline: !selectedLayer?.isUnderline })}
                className={`p-1.5 rounded-lg transition-all ${
                  !selectedLayer || selectedLayer.type !== 'text'
                    ? 'text-zinc-600 cursor-not-allowed'
                    : selectedLayer.isUnderline
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
                title="Underline"
              >
                <Underline className="w-4 h-4" />
              </button>

              <button
                disabled={!selectedLayer || selectedLayer.type !== 'text'}
                onClick={() => updateSelectedLayer({ isStrikethrough: !selectedLayer?.isStrikethrough })}
                className={`p-1.5 rounded-lg transition-all ${
                  !selectedLayer || selectedLayer.type !== 'text'
                    ? 'text-zinc-600 cursor-not-allowed'
                    : selectedLayer.isStrikethrough
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
                title="Strikethrough"
              >
                <Strikethrough className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            
            {/* Collapsible Left Panel (Asset Library) */}
            {(activeProject.id === 'thumbnail' || activeProject.id === 'instagram') && (
              <div 
                className={`border-r border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md flex flex-col transition-all duration-300 relative z-10 ${
                  leftPanelOpen ? 'w-72' : 'w-0 overflow-hidden border-r-0'
                }`}
              >
                {/* Toggle Button */}
                <button
                  onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                  className="absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 bg-zinc-900 border border-zinc-800/60 rounded-full flex items-center justify-center text-zinc-400 hover:text-white shadow-lg z-30"
                >
                  {leftPanelOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {leftPanelOpen && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Templates Section */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Templates</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => addTextLayer('heading')}
                          className="p-3 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/60 rounded-xl text-left text-xs transition-all"
                        >
                          <div className="font-bold text-indigo-400">YouTube</div>
                          <div className="text-[10px] text-zinc-500">Thumbnail Layout</div>
                        </button>
                        <button 
                          onClick={() => addTextLayer('bold')}
                          className="p-3 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/60 rounded-xl text-left text-xs transition-all"
                        >
                          <div className="font-bold text-pink-400">Instagram</div>
                          <div className="text-[10px] text-zinc-500">Square Post</div>
                        </button>
                      </div>
                    </div>

                    {/* Memes Section */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Memes</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {MEME_TEMPLATES.map((meme) => (
                          <button
                            key={meme.name}
                            onClick={() => addMemeLayer(meme.name, meme.url)}
                            className="p-2 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/60 rounded-xl text-left text-xs transition-all"
                          >
                            <div className="font-bold text-amber-400 truncate">{meme.name}</div>
                            <div className="text-[9px] text-zinc-500">Add Meme</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Elements Section */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Elements</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { name: 'Star', emoji: '⭐' },
                          { name: 'Fire', emoji: '🔥' },
                          { name: 'Heart', emoji: '❤️' },
                          { name: 'Rocket', emoji: '🚀' },
                          { name: 'Cool', emoji: '😎' },
                          { name: 'Spark', emoji: '✨' },
                        ].map((el) => (
                          <button
                            key={el.name}
                            onClick={() => addElementLayer(el.name, el.emoji)}
                            className="p-2 bg-zinc-800/30 hover:bg-zinc-800/80 border border-zinc-800/60 rounded-lg text-center text-lg transition-all"
                            title={el.name}
                          >
                            {el.emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Texts Section */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Texts</h3>
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
                          onClick={() => addTextLayer('semibold')}
                          className="w-full py-2 px-3 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/60 rounded-lg text-left text-[11px] transition-all"
                        >
                          Add Body Text
                        </button>
                      </div>
                    </div>

                    {/* Tools Section */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Tools</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => addShapeLayer('rect')}
                          className="p-2.5 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/60 rounded-lg text-center text-xs transition-all flex flex-col items-center gap-1"
                        >
                          <Square className="w-4 h-4 text-indigo-400" />
                          Rectangle
                        </button>
                        <button
                          onClick={() => addShapeLayer('circle')}
                          className="p-2.5 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/60 rounded-lg text-center text-xs transition-all flex flex-col items-center gap-1"
                        >
                          <Circle className="w-4 h-4 text-indigo-400" />
                          Circle
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Left Panel Toggle Button when closed */}
            {(activeProject.id === 'thumbnail' || activeProject.id === 'instagram') && !leftPanelOpen && (
              <button
                onClick={() => setLeftPanelOpen(true)}
                className="absolute top-1/2 left-0 -translate-y-1/2 w-8 h-8 bg-zinc-900 border border-zinc-800/60 rounded-r-full flex items-center justify-center text-zinc-400 hover:text-white shadow-lg z-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Center: Canvas Workspace */}
            <div 
              ref={containerRef}
              className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-zinc-950/20"
            >
              {/* Dynamic Aspect Ratio Container */}
              <div 
                className="relative w-full h-full flex items-center justify-center"
                style={{
                  maxHeight: '70vh',
                }}
              >
                <div 
                  className="relative bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800/60 overflow-hidden flex items-center justify-center"
                  style={{
                    aspectRatio: activeProject.aspectRatio === 'freeform' ? 'auto' : activeProject.ratioValue,
                    width: '100%',
                    maxWidth: activeProject.aspectRatio === '1:1.41' ? '480px' : '800px',
                    height: activeProject.aspectRatio === 'freeform' ? '480px' : 'auto',
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleCanvasMouseDown}
                    className="w-full h-full object-contain cursor-move"
                  />
                </div>
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
                  onClick={() => {
                    const randomMeme = MEME_TEMPLATES[Math.floor(Math.random() * MEME_TEMPLATES.length)];
                    addMemeLayer(randomMeme.name, randomMeme.url);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
                >
                  <Smile className="w-3.5 h-3.5 text-amber-400" />
                  Meme
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
                          onClick={() => setSelectedLayerId(layer.id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            layer.id === selectedLayerId
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

                {/* Section 3: Selected Layer Properties (Accordion Panel) */}
                {selectedLayer ? (
                  <div className="space-y-4 pt-4 border-t border-zinc-800/60">
                    <div className="flex items-center gap-2 mb-2">
                      <Sliders className="w-4 h-4 text-purple-400" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Properties: <span className="text-purple-400">{selectedLayer.name}</span>
                      </h2>
                    </div>

                    {/* Accordion 1: Opacity & Layer Alpha */}
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

                    {/* Accordion 2: Filters & Adjustments */}
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

                          {/* Hue Rotate */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-zinc-400">Hue Rotate</span>
                              <span className="text-purple-400">{selectedLayer.filters.hueRotate}°</span>
                            </div>
                            <input
                              type="range" min="0" max="360" value={selectedLayer.filters.hueRotate}
                              onChange={(e) => updateSelectedLayerFilters({ hueRotate: Number(e.target.value) })}
                              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
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
                              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Accordion 3: Crop & Perspective Warp */}
                    {(selectedLayer.type === 'image' || selectedLayer.type === 'element') && (
                      <div className="border border-zinc-800/60 rounded-xl overflow-hidden bg-zinc-900/40 shadow-sm">
                        <button
                          onClick={() => toggleAccordion('crop')}
                          className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-zinc-300 hover:bg-zinc-800/50 transition-all"
                        >
                          <span>Crop & Perspective Warp</span>
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
                          </div>
                        )}
                      </div>
                    )}

                    {/* Accordion 4: Brush & Eraser Properties */}
                    {activeProject.type === 'whiteboard' && (
                      <div className="border border-zinc-800/60 rounded-xl overflow-hidden bg-zinc-900/40 shadow-sm">
                        <button
                          onClick={() => toggleAccordion('brush')}
                          className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-zinc-300 hover:bg-zinc-800/50 transition-all"
                        >
                          <span>Brush & Eraser Properties</span>
                          <Paintbrush className="w-4 h-4 text-zinc-500" />
                        </button>
                        {rightAccordion.brush && (
                          <div className="p-4 border-t border-zinc-800/40 space-y-4">
                            <div>
                              <label className="text-xs text-zinc-400 block mb-2">Brush Color</label>
                              <div className="flex gap-2">
                                {['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ffffff'].map((color) => (
                                  <button
                                    key={color}
                                    onClick={() => updateSelectedLayer({ color })}
                                    className={`w-6 h-6 rounded-full border-2 transition-all ${
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

                    {/* Accordion 5: Typography & Text Box */}
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
    </div>
  );
}
