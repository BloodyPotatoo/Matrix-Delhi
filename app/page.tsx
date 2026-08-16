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
  Play,
  Copy,
  Sun,
  Moon,
  Folder,
  Grid,
  Save,
  CheckCircle,
  Info
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
  shapeType?: 'rect' | 'circle';
  color?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  flipH: boolean;
  flipV: boolean;
  filters: FilterSettings;
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
  aspectRatio: string;
  ratioValue: number;
  type: 'image' | 'document' | 'whiteboard';
  icon: React.ReactNode;
  accentColor: string;
}

interface DrawingPath {
  points: { x: number; y: number }[];
  color: string;
  brush: 'marker' | 'sketch' | 'bold' | 'paintbrush';
}

interface SavedProject {
  id: string;
  name: string;
  timestamp: string;
  layers: Layer[];
  projectConfig: ProjectConfig;
  canvasBgColor: string;
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
    icon: <Sparkles className="w-5 h-5 text-pink-400" />,
    accentColor: 'from-pink-500 to-rose-500',
  },
  {
    id: 'instagram',
    name: 'Instagram Post',
    description: 'Enforce 1:1 ratio square bounding box. Optimized for social feeds.',
    aspectRatio: '1:1',
    ratioValue: 1 / 1,
    type: 'image',
    icon: <ImageIcon className="w-5 h-5 text-indigo-400" />,
    accentColor: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'docs',
    name: 'Document / Flyer',
    description: 'Enforce A4 standard portrait ratio (1:1.41). Margins & text layers.',
    aspectRatio: '1:1.41',
    ratioValue: 1 / 1.414,
    type: 'document',
    icon: <FileText className="w-5 h-5 text-emerald-400" />,
    accentColor: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'presentation',
    name: 'Presentation Slide',
    description: 'Enforce 16:9 widescreen bounding box. Multi-page layout & typography.',
    aspectRatio: '16:9',
    ratioValue: 16 / 9,
    type: 'document',
    icon: <Layout className="w-5 h-5 text-cyan-400" />,
    accentColor: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'whiteboard',
    name: 'Infinite Whiteboard',
    description: 'Enforce an unconstrained, freeform grid canvas. Vector shapes & freehand drawing.',
    aspectRatio: 'freeform',
    ratioValue: 1.5,
    type: 'whiteboard',
    icon: <Palette className="w-5 h-5 text-amber-400" />,
    accentColor: 'from-amber-500 to-orange-500',
  },
];

const getProjectIcon = (id: string) => {
  switch (id) {
    case 'thumbnail':
      return <Sparkles className="w-5 h-5 text-pink-400" />;
    case 'instagram':
      return <ImageIcon className="w-5 h-5 text-indigo-400" />;
    case 'docs':
      return <FileText className="w-5 h-5 text-emerald-400" />;
    case 'presentation':
      return <Layout className="w-5 h-5 text-cyan-400" />;
    case 'whiteboard':
      return <Palette className="w-5 h-5 text-amber-400" />;
    default:
      return <Sparkles className="w-5 h-5 text-pink-400" />;
  }
};

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

const WHITEBOARD_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#ffffff',
  '#000000',
];

export default function PhotoEditor() {
  // Global Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Navigation & Routing State
  const [view, setView] = useState<'dashboard' | 'editor' | 'about'>('dashboard');
  const [dashboardSubView, setDashboardSubView] = useState<'home' | 'projects' | 'templates'>('home');
  const [activeProject, setActiveProject] = useState<ProjectConfig>(PROJECT_TEMPLATES[0]);

  // Saved Projects State
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Zoom Engine State
  const [zoom, setZoom] = useState<number>(100);

  // Document Mode Multi-Page State
  const [docPages, setDocPages] = useState<number>(1);

  // Presentation Mode Slides State
  const [slides, setSlides] = useState<{ id: string; layers: Layer[]; transition: 'fade' | 'slide' }[]>([
    { id: 'slide-1', layers: [], transition: 'fade' }
  ]);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isFullscreenPresentation, setIsFullscreenPresentation] = useState<boolean>(false);

  // Layer Engine State
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<'tl' | 'tr' | 'bl' | 'br' | 'move' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [layerStartPos, setLayerStartPos] = useState({ x: 0, y: 0 });
  const [layerStartSize, setLayerStartSize] = useState({ width: 0, height: 0 });
  const [layerStartFontSize, setLayerStartFontSize] = useState<number>(24);
  const [layerStartCorners, setLayerStartCorners] = useState({
    tl: { x: 0, y: 0 },
    tr: { x: 0, y: 0 },
    bl: { x: 0, y: 0 },
    br: { x: 0, y: 0 },
  });

  // Inline Text Editing State
  const [editingTextLayerId, setEditingTextLayerId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState<string>('');

  // Whiteboard Drawing State
  const [drawingPaths, setDrawingPaths] = useState<DrawingPath[]>([]);
  const [drawingUndoStack, setDrawingUndoStack] = useState<DrawingPath[][]>([]);
  const [drawingRedoStack, setDrawingRedoStack] = useState<DrawingPath[][]>([]);
  const [isDrawingOnCanvas, setIsDrawingOnCanvas] = useState(false);
  const [activeBrush, setActiveBrush] = useState<'marker' | 'sketch' | 'bold' | 'paintbrush'>('marker');
  const [activeBrushColor, setActiveBrushColor] = useState<string>('#ef4444');
  const [whiteboardStyle, setWhiteboardStyle] = useState<'grid' | 'plain'>('grid');

  // Derived active layer helper
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

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

  // Accordion States for Right Panel
  const [rightAccordion, setRightAccordion] = useState<{ [key: string]: boolean }>({
    filters: true,
    crop: true,
    rotation: true,
    opacity: true,
    text: true,
  });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkUploadInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inlineInputRef = useRef<HTMLTextAreaElement>(null);

  // Handle URL query parameter for standalone About Us page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'about') {
        setView('about');
      }
    }
  }, []);

  // Load Saved Projects from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('artisnap_saved_projects');
    if (saved) {
      try {
        setSavedProjects(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved projects', e);
      }
    }
  }, []);

  // Session Lifecycle (Auto-Save & Load)
  useEffect(() => {
    const saved = localStorage.getItem('artisnap_autosave_layers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLayers(parsed);
        }
      } catch (e) {
        console.error('Failed to load autosaved layers', e);
      }
    }

    const handleBeforeUnload = () => {
      if (layers.length > 0) {
        localStorage.setItem('artisnap_autosave_layers', JSON.stringify(layers));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [layers]);

  // Save Project Action
  const handleSaveProject = () => {
    const newProject: SavedProject = {
      id: Date.now().toString(),
      name: `${activeProject.name} Draft (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      layers: layers,
      projectConfig: activeProject,
      canvasBgColor: canvasBgColor
    };

    const updated = [newProject, ...savedProjects];
    setSavedProjects(updated);
    localStorage.setItem('artisnap_saved_projects', JSON.stringify(updated));

    // Trigger Toast Alert
    setToastMessage("Project Saved Successfully!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load Saved Project
  const handleLoadProject = (project: SavedProject) => {
    setActiveProject(project.projectConfig);
    setLayers(project.layers);
    setCanvasBgColor(project.canvasBgColor);
    setView('editor');
    setSelectedLayerId(null);
    setSelectedLayerIds([]);
    setZoom(100);
  };

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
    setDrawingPaths([]);
    setDrawingUndoStack([]);
    setDrawingRedoStack([]);

    if (project.id === 'docs') {
      setActiveLeftTab('texts');
    } else if (project.type === 'whiteboard') {
      setActiveTool('draw');
      setActiveLeftTab('tools');
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
  const addTextLayer = (presetType?: 'heading' | 'bold' | 'semibold' | 'body' | 'passive', customX?: number, customY?: number) => {
    const x = customX !== undefined ? customX : 150;
    const y = customY !== undefined ? customY : (150 + layers.length * 20);
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
      color = '#facc15';
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
      color: '#fef08a',
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

  // Duplicate Selected Layer
  const duplicateLayer = () => {
    if (!selectedLayer) return;
    const newLayer: Layer = {
      ...selectedLayer,
      id: Date.now().toString(),
      name: `${selectedLayer.name} (Copy)`,
      x: selectedLayer.x + 30,
      y: selectedLayer.y + 30,
      corners: getInitialCorners(selectedLayer.x + 30, selectedLayer.y + 30, selectedLayer.width, selectedLayer.height),
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setSelectedLayerIds([newLayer.id]);
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

  // Reset all edits with Canvas Flush Safeguard
  const handleReset = () => {
    const confirmReset = window.confirm("Are you sure you want to reset the canvas? This will clear all layers and drawings.");
    if (!confirmReset) return;
    setLayers([]);
    setSelectedLayerId(null);
    setSelectedLayerIds([]);
    setCanvasBgColor('#ffffff');
    setZoom(100);
    setDocPages(1);
    setSlides([{ id: 'slide-1', layers: [], transition: 'fade' }]);
    setActiveSlideIndex(0);
    setDrawingPaths([]);
    setDrawingUndoStack([]);
    setDrawingRedoStack([]);
  };

  // Export Canvas to PNG
  const handleExport = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `artisnap-${activeProject.name.toLowerCase().replace(/\s+/g, '-')}-export.png`;
    link.href = dataUrl;
    link.click();
  };

  // Handle Wheel Zoom
  const handleWheelZoom = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const zoomStep = e.deltaY < 0 ? 10 : -10;
      setZoom((prev) => Math.max(25, Math.min(300, prev + zoomStep)));
    }
  };

  // Whiteboard Undo/Redo
  const handleDrawingUndo = () => {
    if (drawingPaths.length === 0) return;
    const previous = [...drawingPaths];
    const popped = previous.pop();
    if (popped) {
      setDrawingRedoStack((prev) => [[popped], ...prev]);
    }
    setDrawingPaths(previous);
  };

  const handleDrawingRedo = () => {
    if (drawingRedoStack.length === 0) return;
    const nextRedo = [...drawingRedoStack];
    const toRestore = nextRedo.shift();
    if (toRestore && toRestore.length > 0) {
      setDrawingPaths((prev) => [...prev, toRestore[0]]);
    }
    setDrawingRedoStack(nextRedo);
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

    drawTriangle(ctx, img, 0, 0, w, 0, 0, h, tl.x, tl.y, tr.x, tr.y, bl.x, bl.y);
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

  // Presentation Mode Slide Navigation Helpers
  const selectSlide = (index: number) => {
    setActiveSlideIndex(index);
    setLayers(slides[index].layers);
  };

  const addSlide = () => {
    const newSlideId = `slide-${slides.length + 1}`;
    const newSlide = { id: newSlideId, layers: [], transition: 'fade' as const };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
    setLayers([]);
  };

  const toggleTransition = (index: number) => {
    const updated = [...slides];
    updated[index].transition = updated[index].transition === 'fade' ? 'slide' : 'fade';
    setSlides(updated);
  };

  const handlePresent = () => {
    if (containerRef.current) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreenPresentation(true);
    }
  };

  // Canvas Rendering Engine
  useEffect(() => {
    if (view !== 'editor' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseWidth = 1200;
    let baseHeight = activeProject.aspectRatio === 'freeform' 
      ? 800 
      : Math.round(baseWidth / activeProject.ratioValue);

    if (activeProject.id === 'docs') {
      baseHeight = baseHeight * docPages;
    }

    canvas.width = baseWidth;
    canvas.height = baseHeight;

    ctx.fillStyle = canvasBgColor;
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    if (activeProject.id === 'docs' && docPages > 1) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 12]);
      const singlePageHeight = Math.round(baseWidth / activeProject.ratioValue);
      for (let p = 1; p < docPages; p++) {
        ctx.beginPath();
        ctx.moveTo(0, singlePageHeight * p);
        ctx.lineTo(baseWidth, singlePageHeight * p);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    if (activeProject.type === 'whiteboard' && whiteboardStyle === 'grid') {
      ctx.strokeStyle = theme === 'dark' ? '#3f3f46' : '#e4e4e7';
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

    drawingPaths.forEach((path) => {
      if (path.points.length < 2) return;
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      
      let lineWidth = 4;
      if (path.brush === 'sketch') lineWidth = 2;
      if (path.brush === 'bold') lineWidth = 10;
      if (path.brush === 'paintbrush') lineWidth = 6;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    });

    layers.forEach((layer) => {
      if (layer.id === editingTextLayerId) return;

      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;

      if ((layer.type === 'image' || layer.type === 'element') && layer.imgElement) {
        ctx.filter = `
          brightness(${layer.filters.brightness}%) 
          contrast(${layer.filters.contrast}%) 
          saturate(${layer.filters.saturation}%) 
          blur(${layer.filters.blur}px) 
          hue-rotate(${layer.filters.hueRotate}deg)
        `;

        if (layer.warpMode) {
          drawWarpedImage(ctx, layer.imgElement, layer);
        } else {
          const centerX = layer.x + layer.width / 2;
          const centerY = layer.y + layer.height / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate((layer.rotation * Math.PI) / 180);
          ctx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);

          if (layer.cropMode && cropBox) {
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
        const centerX = layer.x + layer.width / 2;
        const centerY = layer.y + layer.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);

        if (layer.type === 'text' && layer.text) {
          ctx.fillStyle = layer.color || '#000000';
          
          const fontStyle = layer.isItalic ? 'italic' : 'normal';
          const fontWeight = layer.isBold ? 'bold' : 'normal';
          ctx.font = `${fontStyle} ${fontWeight} ${layer.fontSize || 24}px ${layer.fontFamily || 'sans-serif'}`;
          ctx.textAlign = layer.textAlign || 'center';
          ctx.textBaseline = 'middle';
          
          const displayText = layer.isUppercase ? layer.text.toUpperCase() : layer.text;
          
          const lines = wrapText(ctx, displayText, layer.width);
          const lineHeight = (layer.fontSize || 24) * 1.2;
          const totalHeight = lines.length * lineHeight;
          
          lines.forEach((line, index) => {
            const yOffset = -totalHeight / 2 + index * lineHeight + lineHeight / 2;
            
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
          ctx.fillStyle = layer.color || '#fef08a';
          ctx.fillRect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);
          
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

      const isSelected = selectedLayerIds.includes(layer.id) || layer.id === selectedLayerId;
      if (isSelected) {
        ctx.save();
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2.5;
        
        if (layer.warpMode) {
          ctx.beginPath();
          ctx.moveTo(layer.corners.tl.x, layer.corners.tl.y);
          ctx.lineTo(layer.corners.tr.x, layer.corners.tr.y);
          ctx.lineTo(layer.corners.br.x, layer.corners.br.y);
          ctx.lineTo(layer.corners.bl.x, layer.corners.bl.y);
          ctx.closePath();
          ctx.stroke();

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
          ctx.setLineDash([6, 4]);
          const centerX = layer.x + layer.width / 2;
          const centerY = layer.y + layer.height / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate((layer.rotation * Math.PI) / 180);
          
          ctx.strokeRect(-layer.width / 2 - 4, -layer.height / 2 - 4, layer.width + 8, layer.height + 8);
          
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

    if (isRubberBanding) {
      ctx.save();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
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
  }, [view, activeProject, layers, selectedLayerId, selectedLayerIds, canvasBgColor, isRubberBanding, rubberBandStart, rubberBandCurrent, cropBox, docPages, drawingPaths, editingTextLayerId, whiteboardStyle, theme]);

  // Global Window Dragging & Mouse Up Listeners
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
        if (activeHandle === 'move') {
          updateSelectedLayer({
            x: Math.round(layerStartPos.x + dx),
            y: Math.round(layerStartPos.y + dy),
          });
        } else {
          const originalRatio = layerStartSize.width / layerStartSize.height;
          let newWidth = layerStartSize.width;
          let newHeight = layerStartSize.height;

          if (activeHandle === 'br') {
            newWidth = layerStartSize.width + dx;
            newHeight = newWidth / originalRatio;
            
            const fontUpdate = layer.type === 'text' ? { fontSize: Math.max(8, Math.round((newWidth / layerStartSize.width) * layerStartFontSize)) } : {};

            updateSelectedLayer({
              width: Math.round(newWidth),
              height: Math.round(newHeight),
              ...fontUpdate
            });
          } else if (activeHandle === 'bl') {
            newWidth = layerStartSize.width - dx;
            newHeight = newWidth / originalRatio;
            
            const fontUpdate = layer.type === 'text' ? { fontSize: Math.max(8, Math.round((newWidth / layerStartSize.width) * layerStartFontSize)) } : {};

            updateSelectedLayer({
              x: Math.round(layerStartPos.x + (layerStartSize.width - newWidth)),
              width: Math.round(newWidth),
              height: Math.round(newHeight),
              ...fontUpdate
            });
          } else if (activeHandle === 'tr') {
            newWidth = layerStartSize.width + dx;
            newHeight = newWidth / originalRatio;
            
            const fontUpdate = layer.type === 'text' ? { fontSize: Math.max(8, Math.round((newWidth / layerStartSize.width) * layerStartFontSize)) } : {};

            updateSelectedLayer({
              y: Math.round(layerStartPos.y + (layerStartSize.height - newHeight)),
              width: Math.round(newWidth),
              height: Math.round(newHeight),
              ...fontUpdate
            });
          } else if (activeHandle === 'tl') {
            newWidth = layerStartSize.width - dx;
            newHeight = newWidth / originalRatio;
            
            const fontUpdate = layer.type === 'text' ? { fontSize: Math.max(8, Math.round((newWidth / layerStartSize.width) * layerStartFontSize)) } : {};

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
  }, [isDragging, selectedLayerId, activeHandle, dragStart, layers, layerStartCorners, layerStartPos, layerStartSize, layerStartFontSize]);

  // Global Window Listeners for Rubber-band selection
  useEffect(() => {
    if (!isRubberBanding) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

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

    if (activeTool === 'draw') {
      setIsDrawingOnCanvas(true);
      const newPath: DrawingPath = {
        points: [{ x: clickX, y: clickY }],
        color: activeBrushColor,
        brush: activeBrush,
      };
      setDrawingPaths((prev) => [...prev, newPath]);
      return;
    }

    if (selectedLayerId) {
      const layer = layers.find((l) => l.id === selectedLayerId);
      if (layer) {
        const handleRadius = 18;
        
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
            setLayerStartFontSize(layer.fontSize || 24);
            return;
          }
          if (dist(trRot, { x: clickX, y: clickY }) < handleRadius) {
            setActiveHandle('tr');
            setIsDragging(true);
            setDragStart({ x: clickX, y: clickY });
            setLayerStartPos({ x: layer.x, y: layer.y });
            setLayerStartSize({ width: layer.width, height: layer.height });
            setLayerStartFontSize(layer.fontSize || 24);
            return;
          }
          if (dist(blRot, { x: clickX, y: clickY }) < handleRadius) {
            setActiveHandle('bl');
            setIsDragging(true);
            setDragStart({ x: clickX, y: clickY });
            setLayerStartPos({ x: layer.x, y: layer.y });
            setLayerStartSize({ width: layer.width, height: layer.height });
            setLayerStartFontSize(layer.fontSize || 24);
            return;
          }
          if (dist(brRot, { x: clickX, y: clickY }) < handleRadius) {
            setActiveHandle('br');
            setIsDragging(true);
            setDragStart({ x: clickX, y: clickY });
            setLayerStartPos({ x: layer.x, y: layer.y });
            setLayerStartSize({ width: layer.width, height: layer.height });
            setLayerStartFontSize(layer.fontSize || 24);
            return;
          }
        }
      }
    }

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
      setIsRubberBanding(true);
      setRubberBandStart({ x: clickX, y: clickY });
      setRubberBandCurrent({ x: clickX, y: clickY });
      setSelectedLayerId(null);
      setSelectedLayerIds([]);
    }
  };

  // Handle Drawing Mouse Move
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'draw' || !isDrawingOnCanvas || drawingPaths.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const updatedPaths = [...drawingPaths];
    const activePath = updatedPaths[updatedPaths.length - 1];
    activePath.points.push({ x: currentX, y: currentY });
    setDrawingPaths(updatedPaths);
  };

  const handleCanvasMouseUp = () => {
    if (activeTool === 'draw') {
      setIsDrawingOnCanvas(false);
    }
  };

  const handleCanvasMouseLeave = () => {
    if (activeTool === 'draw') {
      setIsDrawingOnCanvas(false);
    }
  };

  // Double Click to Edit Text Layer
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (layer.type === 'text') {
        if (
          clickX >= layer.x &&
          clickX <= layer.x + layer.width &&
          clickY >= layer.y &&
          clickY <= layer.y + layer.height
        ) {
          setEditingTextLayerId(layer.id);
          setEditingTextValue(layer.text || '');
          setTimeout(() => {
            inlineInputRef.current?.focus();
          }, 50);
          break;
        }
      }
    }
  };

  // Keyboard listener for Presentation Mode exit, slide navigation, and shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.hasAttribute('contenteditable')
      );

      if (e.key === 'q' || e.key === 'Q') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreenPresentation(false);
      }

      if (isFullscreenPresentation) {
        if (e.key === 'ArrowRight') {
          if (activeSlideIndex < slides.length - 1) {
            selectSlide(activeSlideIndex + 1);
          }
        }
        if (e.key === 'ArrowLeft') {
          if (activeSlideIndex > 0) {
            selectSlide(activeSlideIndex - 1);
          }
        }
      }

      // If typing, do not trigger editor shortcuts
      if (isTyping) return;

      // Delete Layer Shortcut (Delete or Backspace)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteLayer();
      }

      // Move Layer Up (Ctrl + ArrowUp)
      if (e.ctrlKey && e.key === 'ArrowUp') {
        e.preventDefault();
        moveLayer('up');
      }

      // Move Layer Down (Ctrl + ArrowDown)
      if (e.ctrlKey && e.key === 'ArrowDown') {
        e.preventDefault();
        moveLayer('down');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenPresentation, activeSlideIndex, slides, layers, selectedLayerId, selectedLayerIds]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreenPresentation(false);
      } else {
        setIsFullscreenPresentation(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle Canvas Click to add floating text at exact coordinates
  const handleCanvasClickForText = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'pointer') return;
    if (e.target !== e.currentTarget) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    addTextLayer('body', clickX - 175, clickY - 40);
  };

  // Standalone About Us Page View
  if (view === 'about') {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-8 relative transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100' 
          : 'bg-gradient-to-b from-zinc-50 via-white to-zinc-100 text-zinc-900'
      }`}>
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2.5 rounded-lg border transition-all ${
              theme === 'dark' 
                ? 'bg-zinc-800/60 border-zinc-700 text-yellow-400 hover:bg-zinc-700' 
                : 'bg-zinc-100 border-zinc-300 text-indigo-600 hover:bg-zinc-200'
            }`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className={`max-w-3xl w-full p-10 rounded-3xl border backdrop-blur-xl shadow-2xl transition-all ${
          theme === 'dark' 
            ? 'bg-zinc-900/60 border-zinc-800/80 shadow-indigo-500/5' 
            : 'bg-white/80 border-zinc-200 shadow-zinc-300/50'
        }`}>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Artisnap
            </h1>
          </div>

          <div className="prose prose-indigo dark:prose-invert max-w-none space-y-6">
            <h2 className="text-2xl font-bold border-b pb-2 border-zinc-800">About Artisnap</h2>
            <h3 className="text-lg font-semibold text-indigo-400">Welcome to the Future of Cloud-Based Content Design</h3>
            
            <p className="leading-relaxed">
              Artisnap was built for modern creators who are tired of heavy, slow, and overly complicated design applications. We believe that photo editing, document formatting, presentation building, and freeform wireframing shouldn't require five different subscriptions or an advanced degree in software layout.
            </p>

            <h4 className="text-md font-bold text-indigo-400 uppercase tracking-wider">Our Mission: Click, Edit, Done.</h4>
            <p className="leading-relaxed">
              Artisnap bridges the gap between chaotic multi-tool suites and rigid template apps. By engineering an unconstrained, hardware-accelerated web canvas, we give you pixel-perfect accuracy for high-speed content delivery. From striking YouTube thumbnails and high-conversion Instagram posts to crisp multi-page business documents and presentation decks, Artisnap houses it all inside a centralized interface.
            </p>

            <h4 className="text-md font-bold text-indigo-400 uppercase tracking-wider">Core Structural Tenets</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Unified Tool Engine:</strong> Instantly shift layout presets while keeping your asset layers intact.</li>
              <li><strong>Hardware Isolation:</strong> Zoom, drag, crop, and transform complex design elements with dedicated canvas optimization that never slows down your system UI.</li>
              <li><strong>Secure Local Archiving:</strong> Your art belongs to you. Every draft, edit, and imported layer is continuously auto-saved directly inside your browser cache.</li>
            </ul>

            <div className="mt-10 pt-6 border-t border-zinc-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Lead Coder</p>
                <p className="text-sm font-bold text-indigo-400">Divyansh</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Lead Frontend</p>
                <p className="text-sm font-bold text-indigo-400">Varun</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen overflow-hidden relative text-sm md:text-base transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 text-zinc-100' 
        : 'bg-gradient-to-b from-zinc-50 via-white to-zinc-100 text-zinc-900'
    }`}>
      {/* Custom High-Contrast Scrollbars Style */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: ${theme === 'dark' ? '#1e1b4b' : '#4f46e5'};
          border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'dark' ? '#312e81' : '#4338ca'};
        }
      `}</style>

      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header - Hidden completely in full-screen presentation mode */}
      {!isFullscreenPresentation && (
        <header className={`flex items-center justify-between px-6 py-5 border-b backdrop-blur-md z-10 transition-colors ${
          theme === 'dark' ? 'border-zinc-800/60 bg-zinc-900/40' : 'border-zinc-200 bg-white/60'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                Artisnap
              </h1>
              <p className={`text-xs hidden sm:block ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>Premium Creative Suite</p>
            </div>
          </div>

          {/* Save Button at Top-Left of Editor Workspace */}
          {view === 'editor' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveProject}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/20 transition-all"
                title="Save Project"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          )}

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2.5 rounded-lg border transition-all ${
                theme === 'dark' 
                  ? 'bg-zinc-800/60 border-zinc-700 text-yellow-400 hover:bg-zinc-700' 
                  : 'bg-zinc-100 border-zinc-300 text-indigo-600 hover:bg-zinc-200'
              }`}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {view === 'editor' && (
              <>
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
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    theme === 'dark' 
                      ? 'text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/60' 
                      : 'text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </button>
                <button
                  onClick={handleReset}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    theme === 'dark' 
                      ? 'text-zinc-300 hover:text-white bg-zinc-800/60 hover:bg-zinc-700 border border-zinc-800/60' 
                      : 'text-zinc-700 hover:text-zinc-900 bg-zinc-200/60 hover:bg-zinc-200 border border-zinc-300'
                  }`}
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
              </>
            )}
          </div>
        </header>
      )}

      {/* View A: Main Home Dashboard */}
      {view === 'dashboard' && (
        <div className="flex-1 overflow-y-auto relative flex flex-col justify-between z-10">
          
          {/* Dynamic Live Background Video */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-20">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              src="https://cdn.pixabay.com/video/2018/09/19/18327-291012897_large.mp4"
            />
          </div>

          {/* Floating Capsule Top Header */}
          <div className="w-full flex justify-center pt-6 z-20">
            <div className={`flex items-center gap-6 px-8 py-3 rounded-full border backdrop-blur-md transition-colors ${
              theme === 'dark' ? 'bg-zinc-900/90 border-zinc-800/80 shadow-2xl' : 'bg-white/90 border-zinc-200 shadow-lg'
            }`}>
              <button
                onClick={() => {
                  setDashboardSubView('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`text-xs font-bold uppercase tracking-wider transition-all ${
                  dashboardSubView === 'home' ? 'text-indigo-400 scale-110' : 'text-zinc-400 hover:text-zinc-900'
                }`}
              >
                Home
              </button>
              <div className={`h-4 w-[1px] ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
              <button
                onClick={() => setDashboardSubView('projects')}
                className={`text-xs font-bold uppercase tracking-wider transition-all ${
                  dashboardSubView === 'projects' ? 'text-indigo-400 scale-110' : 'text-zinc-400 hover:text-zinc-900'
                }`}
              >
                Projects
              </button>
              <div className={`h-4 w-[1px] ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
              <button
                onClick={() => setDashboardSubView('templates')}
                className={`text-xs font-bold uppercase tracking-wider transition-all ${
                  dashboardSubView === 'templates' ? 'text-indigo-400 scale-110' : 'text-zinc-400 hover:text-zinc-900'
                }`}
              >
                Templates
              </button>
              <div className={`h-4 w-[1px] ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
              <a
                href="?view=about"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-900 transition-all"
              >
                About Us
              </a>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col justify-center items-center p-8 max-w-7xl mx-auto w-full z-10">
            
            {dashboardSubView === 'home' && (
              <div className="text-center mb-12 w-full">
                {/* Modernized Retro Hero Header */}
                <h1 className="text-6xl md:text-8xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-[0_6px_0_rgba(6,182,212,0.8)] uppercase font-mono mb-4 relative inline-block filter drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                  Artisnap
                  <span className="animate-pulse text-indigo-400">_</span>
                </h1>
                
                {/* Tagline Section */}
                <p className="text-sm font-semibold tracking-widest text-indigo-400 uppercase mb-8">
                  Click edit done, web based photo fun
                </p>

                {/* Compact Single-Row Navigation */}
                <div className={`flex flex-row justify-center gap-2 max-w-5xl mx-auto p-2 rounded-2xl border backdrop-blur-md transition-colors overflow-x-auto ${
                  theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-zinc-100/60 border-zinc-200'
                }`}>
                  {PROJECT_TEMPLATES.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => handleSelectProject(project)}
                      className={`group relative p-3 rounded-xl border hover:border-indigo-500/50 transition-all duration-300 cursor-pointer flex items-center gap-2 shadow-lg flex-1 min-w-[140px] ${
                        theme === 'dark' 
                          ? 'bg-zinc-950/60 border-zinc-800/60 hover:bg-zinc-900/80 text-zinc-100' 
                          : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-900'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg group-hover:scale-110 transition-transform ${
                        theme === 'dark' ? 'bg-zinc-800/60' : 'bg-zinc-200/60'
                      }`}>
                        {getProjectIcon(project.id)}
                      </div>
                      <div className="text-left">
                        <h3 className={`text-[11px] font-bold transition-colors ${
                          theme === 'dark' ? 'text-zinc-100 group-hover:text-indigo-300' : 'text-zinc-800 group-hover:text-indigo-600'
                        }`}>
                          {project.name}
                        </h3>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider">
                          {project.aspectRatio}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Saved Projects Display Shelf */}
                <div className="mt-12 text-left w-full max-w-5xl mx-auto">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Folder className="w-5 h-5 text-indigo-400" />
                    Saved Projects Shelf
                  </h2>
                  {savedProjects.length === 0 ? (
                    <div className={`p-8 text-center border border-dashed rounded-2xl text-xs text-zinc-500 ${
                      theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-100/40 border-zinc-200'
                    }`}>
                      No saved projects found. Click "Save" inside the editor to populate this shelf.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {savedProjects.map((proj) => (
                        <div
                          key={proj.id}
                          onClick={() => handleLoadProject(proj)}
                          className={`p-4 rounded-xl border hover:border-indigo-500 transition-all cursor-pointer flex flex-col justify-between ${
                            theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                              {getProjectIcon(proj.projectConfig.id)}
                            </div>
                            <div>
                              <h3 className="font-bold text-xs truncate max-w-[180px]">{proj.name}</h3>
                              <p className="text-[10px] text-zinc-500">{proj.timestamp}</p>
                            </div>
                          </div>
                          <div className={`h-20 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase tracking-wider ${
                            theme === 'dark' ? 'bg-zinc-950 text-zinc-600' : 'bg-zinc-100 text-zinc-400'
                          }`}>
                            {proj.projectConfig.aspectRatio} Canvas
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {dashboardSubView === 'projects' && (
              <div className="w-full max-w-5xl">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Folder className="w-6 h-6 text-indigo-400" />
                  Recent Edits
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`p-4 rounded-xl border hover:border-indigo-500 transition-all cursor-pointer ${
                    theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'
                  }`}>
                    <div className={`aspect-video rounded-lg mb-3 flex items-center justify-center text-zinc-600 ${
                      theme === 'dark' ? 'bg-zinc-950' : 'bg-zinc-100'
                    }`}>
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-sm">My Awesome Thumbnail</h3>
                    <p className="text-xs text-zinc-500">Edited 2 hours ago</p>
                  </div>
                  <div className={`p-4 rounded-xl border hover:border-indigo-500 transition-all cursor-pointer ${
                    theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'
                  }`}>
                    <div className={`aspect-video rounded-lg mb-3 flex items-center justify-center text-zinc-600 ${
                      theme === 'dark' ? 'bg-zinc-950' : 'bg-zinc-100'
                    }`}>
                      <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-sm">A4 Flyer Draft</h3>
                    <p className="text-xs text-zinc-500">Edited 1 day ago</p>
                  </div>
                  <div className={`p-4 rounded-xl border hover:border-indigo-500 transition-all cursor-pointer ${
                    theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'
                  }`}>
                    <div className={`aspect-video rounded-lg mb-3 flex items-center justify-center text-zinc-600 ${
                      theme === 'dark' ? 'bg-zinc-950' : 'bg-zinc-100'
                    }`}>
                      <Palette className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-sm">Infinite Whiteboard Sketch</h3>
                    <p className="text-xs text-zinc-500">Edited 3 days ago</p>
                  </div>
                </div>
              </div>
            )}

            {dashboardSubView === 'templates' && (
              <div className="w-full max-w-5xl">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Grid className="w-6 h-6 text-indigo-400" />
                  Curated Layout Gallery
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div 
                    onClick={() => {
                      handleSelectProject(PROJECT_TEMPLATES[0]);
                      addImageLayerFromSrc('Cyberpunk Thumbnail', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80', true);
                    }}
                    className={`group cursor-pointer border hover:border-indigo-500 rounded-xl overflow-hidden transition-all ${
                      theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'
                    }`}
                  >
                    <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80" className="w-full h-32 object-cover group-hover:scale-105 transition-transform" alt="Cyberpunk" />
                    <div className="p-3">
                      <h3 className="font-bold text-sm">Cyberpunk Thumbnail</h3>
                      <p className="text-xs text-zinc-500">16:9 Widescreen Preset</p>
                    </div>
                  </div>
                  <div 
                    onClick={() => {
                      handleSelectProject(PROJECT_TEMPLATES[1]);
                      addImageLayerFromSrc('Minimalist Square', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80', true);
                    }}
                    className={`group cursor-pointer border hover:border-indigo-500 rounded-xl overflow-hidden transition-all ${
                      theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'
                    }`}
                  >
                    <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80" className="w-full h-32 object-cover group-hover:scale-105 transition-transform" alt="Minimalist" />
                    <div className="p-3">
                      <h3 className="font-bold text-sm">Minimalist Square</h3>
                      <p className="text-xs text-zinc-500">1:1 Instagram Preset</p>
                    </div>
                  </div>
                  <div 
                    onClick={() => {
                      handleSelectProject(PROJECT_TEMPLATES[2]);
                      addTextLayer('heading');
                    }}
                    className={`group cursor-pointer border hover:border-indigo-500 rounded-xl overflow-hidden transition-all ${
                      theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'
                    }`}
                  >
                    <div className={`w-full h-32 flex items-center justify-center text-zinc-500 ${
                      theme === 'dark' ? 'bg-zinc-950' : 'bg-zinc-100'
                    }`}>
                      <FileText className="w-12 h-12" />
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-sm">A4 Document Layout</h3>
                      <p className="text-xs text-zinc-500">1:1.41 Portrait Preset</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* View B: Active Editor Workspace */}
      {view === 'editor' && (
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          
          {/* Context-Aware Capsule Header - Hidden completely in full-screen presentation mode */}
          {!isFullscreenPresentation && (
            <div className={`w-full flex justify-center py-3 border-b z-20 transition-colors ${
              theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/40' : 'bg-zinc-100/40 border-zinc-200'
            }`}>
              <div className={`flex items-center gap-4 px-6 py-2.5 rounded-full border shadow-xl backdrop-blur-md transition-all duration-300 ${
                selectedLayer 
                  ? (theme === 'dark' ? 'bg-zinc-950 border-indigo-500/50 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-md') 
                  : (theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/60 text-zinc-600 cursor-not-allowed' : 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed')
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

                <div className={`h-5 w-[1px] ${theme === 'dark' ? 'bg-zinc-800/60' : 'bg-zinc-200'}`} />

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

                <div className={`h-5 w-[1px] ${theme === 'dark' ? 'bg-zinc-800/60' : 'bg-zinc-200'}`} />

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

                <div className={`h-5 w-[1px] ${theme === 'dark' ? 'bg-zinc-800/60' : 'bg-zinc-200'}`} />

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

                <div className={`h-5 w-[1px] ${theme === 'dark' ? 'bg-zinc-800/60' : 'bg-zinc-200'}`} />

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

                <div className={`h-5 w-[1px] ${theme === 'dark' ? 'bg-zinc-800/60' : 'bg-zinc-200'}`} />

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
          )}

          <div className="flex-1 flex overflow-hidden">
            
            {/* Minimalist Left Icon Panel - Single Vertical Column - Hidden in full-screen presentation mode */}
            {!isFullscreenPresentation && (
              <div className={`w-24 border-r flex flex-col items-center py-6 gap-6 z-20 overflow-y-auto transition-colors ${
                theme === 'dark' ? 'border-zinc-800/60 bg-zinc-950' : 'border-zinc-200 bg-white'
              }`}>
                {[
                  { id: 'templates', icon: <Layout className="w-10 h-10" />, label: 'Templates' },
                  { id: 'elements', icon: <Smile className="w-10 h-10" />, label: 'Elements' },
                  { id: 'texts', icon: <Type className="w-10 h-10" />, label: 'Texts' },
                  { id: 'uploads', icon: <Upload className="w-10 h-10" />, label: 'Uploads' },
                  { id: 'tools', icon: <Sliders className="w-10 h-10" />, label: 'Tools' },
                  { id: 'shortcuts', icon: <Keyboard className="w-10 h-10" />, label: 'Shortcuts' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveLeftTab(activeLeftTab === tab.id ? null : (tab.id as any))}
                    className={`p-4 rounded-2xl transition-all relative group ${
                      activeLeftTab === tab.id 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                        : (theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-900' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100')
                    }`}
                    title={tab.label}
                  >
                    {tab.icon}
                    <span className={`absolute left-28 text-xs px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 border ${
                      theme === 'dark' ? 'bg-zinc-950 text-white border-zinc-800' : 'bg-white text-zinc-900 border-zinc-200 shadow-md'
                    }`}>
                      {tab.label}
                    </span>
                  </button>
                ))}

                {/* Whiteboard Mode Left Panel Drawing Color Palette */}
                {activeProject.type === 'whiteboard' && (
                  <div className={`mt-4 flex flex-col gap-2 border-t pt-4 w-full px-3 ${theme === 'dark' ? 'border-zinc-800/60' : 'border-zinc-200'}`}>
                    <span className="text-[10px] font-bold text-zinc-500 text-center uppercase tracking-wider">Brush</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {WHITEBOARD_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setActiveBrushColor(color)}
                          className={`w-6 h-6 rounded-full border transition-all ${
                            activeBrushColor === color ? 'border-white scale-110 ring-2 ring-indigo-500/50' : 'border-zinc-300'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Interactive Drawer - Hidden in full-screen presentation mode */}
            {!isFullscreenPresentation && activeLeftTab && (
              <div className={`w-80 border-r backdrop-blur-md flex flex-col z-10 transition-all duration-300 ${
                theme === 'dark' ? 'border-zinc-800/60 bg-zinc-900/40' : 'border-zinc-200 bg-white/80'
              }`}>
                <div className={`p-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-zinc-800/60' : 'border-zinc-200'}`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>{activeLeftTab}</h3>
                  <button onClick={() => setActiveLeftTab(null)} className="text-zinc-500 hover:text-zinc-900">
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
                          onClick={() => addImageLayerFromSrc('Passive Income', 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&q=80', true)}
                          className={`group cursor-pointer border hover:border-indigo-500 rounded-xl overflow-hidden transition-all ${
                            theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                          }`}
                        >
                          <div className="aspect-[9/16] w-full bg-zinc-900 relative overflow-hidden flex flex-col justify-end p-4">
                            <img src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=300&q=80" className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Passive Income" />
                            <div className="relative z-10">
                              <span className="bg-yellow-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded uppercase">Passive Income</span>
                              <h4 className="text-white font-black text-sm leading-tight mt-1 drop-shadow-md">PASSIVE INCOME IDEAS</h4>
                            </div>
                          </div>
                          <div className={`p-2 text-[11px] font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Passive Income Ideas (9:16)</div>
                        </div>

                        {activeProject.aspectRatio === '16:9' ? (
                          <>
                            <div 
                              onClick={() => addImageLayerFromSrc('Cyberpunk Thumbnail', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80', true)}
                              className={`group cursor-pointer border hover:border-indigo-500 rounded-xl overflow-hidden transition-all ${
                                theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                              }`}
                            >
                              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&q=80" className="w-full h-24 object-cover" alt="YouTube Template 1" />
                              <div className={`p-2 text-[11px] font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Cyberpunk Thumbnail Layout</div>
                            </div>
                            <div 
                              onClick={() => addImageLayerFromSrc('Gaming Stream', 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&q=80', true)}
                              className={`group cursor-pointer border hover:border-indigo-500 rounded-xl overflow-hidden transition-all ${
                                theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                              }`}
                            >
                              <img src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300&q=80" className="w-full h-24 object-cover" alt="YouTube Template 2" />
                              <div className={`p-2 text-[11px] font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Gaming Stream Layout</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div 
                              onClick={() => addImageLayerFromSrc('Minimalist Square', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80', true)}
                              className={`group cursor-pointer border hover:border-indigo-500 rounded-xl overflow-hidden transition-all ${
                                theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                              }`}
                            >
                              <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80" className="w-full h-24 object-cover" alt="Instagram Template 1" />
                              <div className={`p-2 text-[11px] font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Minimalist Square Post</div>
                            </div>
                            <div 
                              onClick={() => addImageLayerFromSrc('Neon Quote', 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1200&q=80', true)}
                              className={`group cursor-pointer border hover:border-indigo-500 rounded-xl overflow-hidden transition-all ${
                                theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                              }`}
                            >
                              <img src="https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=300&q=80" className="w-full h-24 object-cover" alt="Instagram Template 2" />
                              <div className={`p-2 text-[11px] font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Neon Quote Layout</div>
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
                              className={`p-2 border rounded-lg text-center text-lg transition-all ${
                                theme === 'dark' ? 'bg-zinc-800/30 hover:bg-zinc-800/80 border-zinc-800/60' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200'
                              }`}
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
                                className={`p-2 border rounded-lg flex items-center justify-center ${
                                  theme === 'dark' ? 'bg-zinc-800/30 hover:bg-zinc-800/80 border-zinc-800/60' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200'
                                }`}
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
                            className={`w-full py-2 px-3 border rounded-lg text-left text-sm font-bold transition-all ${
                              theme === 'dark' ? 'bg-zinc-800/40 hover:bg-zinc-800/80 border-zinc-800/60' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200'
                            }`}
                          >
                            Add Heading
                          </button>
                          <button
                            onClick={() => addTextLayer('bold')}
                            className={`w-full py-2 px-3 border rounded-lg text-left text-xs font-semibold transition-all ${
                              theme === 'dark' ? 'bg-zinc-800/40 hover:bg-zinc-800/80 border-zinc-800/60' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200'
                            }`}
                          >
                            Add Subtitle
                          </button>
                          <button
                            onClick={() => addTextLayer('body')}
                            className={`w-full py-2 px-3 border rounded-lg text-left text-[11px] transition-all ${
                              theme === 'dark' ? 'bg-zinc-800/40 hover:bg-zinc-800/80 border-zinc-800/60' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200'
                            }`}
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
                                  : (theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700 text-zinc-300' : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700')
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
                        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                          theme === 'dark' ? 'border-zinc-800 hover:border-indigo-500/50 bg-zinc-950/20' : 'border-zinc-300 hover:border-indigo-500 bg-zinc-50'
                        }`}
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
                                className={`group cursor-pointer border hover:border-indigo-500 rounded-lg overflow-hidden transition-all ${
                                  theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                                }`}
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
                        onClick={() => {
                          setActiveTool('pointer');
                          setSelectedLayerId(null);
                        }}
                        className={`w-full py-2.5 px-3 border rounded-lg text-left text-xs font-semibold transition-all flex items-center gap-2 ${
                          activeTool === 'pointer' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : (theme === 'dark' ? 'bg-zinc-800/40 border-zinc-800/60 hover:bg-zinc-800/80' : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200')
                        }`}
                      >
                        <MousePointer className="w-4 h-4 text-indigo-400" />
                        Select / Pointer
                      </button>
                      <button
                        onClick={() => {
                          setActiveTool('draw');
                          setSelectedLayerId(null);
                        }}
                        className={`w-full py-2.5 px-3 border rounded-lg text-left text-xs font-semibold transition-all flex items-center gap-2 ${
                          activeTool === 'draw' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : (theme === 'dark' ? 'bg-zinc-800/40 border-zinc-800/60 hover:bg-zinc-800/80' : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200')
                        }`}
                      >
                        <PenTool className="w-4 h-4 text-indigo-400" />
                        Freehand Draw Tool
                      </button>
                      <button
                        onClick={() => addShapeLayer('rect')}
                        className={`w-full py-2.5 px-3 border rounded-lg text-left text-xs font-semibold transition-all flex items-center gap-2 ${
                          theme === 'dark' ? 'bg-zinc-800/40 border-zinc-800/60 hover:bg-zinc-800/80' : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200'
                        }`}
                      >
                        <Square className="w-4 h-4 text-indigo-400" />
                        Vector Rectangle
                      </button>
                      <button
                        onClick={() => addShapeLayer('circle')}
                        className={`w-full py-2.5 px-3 border rounded-lg text-left text-xs font-semibold transition-all flex items-center gap-2 ${
                          theme === 'dark' ? 'bg-zinc-800/40 border-zinc-800/60 hover:bg-zinc-800/80' : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200'
                        }`}
                      >
                        <Circle className="w-4 h-4 text-indigo-400" />
                        Vector Circle
                      </button>
                      <button
                        onClick={addStickyNote}
                        className={`w-full py-2.5 px-3 border rounded-lg text-left text-xs font-semibold transition-all flex items-center gap-2 ${
                          theme === 'dark' ? 'bg-zinc-800/40 border-zinc-800/60 hover:bg-zinc-800/80' : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200'
                        }`}
                      >
                        <StickyNote className="w-4 h-4 text-indigo-400" />
                        Sticky Note
                      </button>
                      <button
                        onClick={() => addTextLayer()}
                        className={`w-full py-2.5 px-3 border rounded-lg text-left text-xs font-semibold transition-all flex items-center gap-2 ${
                          theme === 'dark' ? 'bg-zinc-800/40 border-zinc-800/60 hover:bg-zinc-800/80' : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200'
                        }`}
                      >
                        <Type className="w-4 h-4 text-indigo-400" />
                        Inline Floating Text
                      </button>
                    </div>
                  )}

                  {/* Shortcuts Drawer */}
                  {activeLeftTab === 'shortcuts' && (
                    <div className="space-y-2 text-xs text-zinc-400">
                      <div className={`flex justify-between py-1 border-b ${theme === 'dark' ? 'border-zinc-800/40' : 'border-zinc-200'}`}>
                        <span>Delete Layer</span>
                        <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">Del</kbd>
                      </div>
                      <div className={`flex justify-between py-1 border-b ${theme === 'dark' ? 'border-zinc-800/40' : 'border-zinc-200'}`}>
                        <span>Move Layer Up</span>
                        <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">Ctrl + Up</kbd>
                      </div>
                      <div className={`flex justify-between py-1 border-b ${theme === 'dark' ? 'border-zinc-800/40' : 'border-zinc-200'}`}>
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
              onClick={handleCanvasClickForText}
              className={`flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-all ${
                isFullscreenPresentation ? 'w-screen h-screen bg-black p-0 m-0' : 'bg-zinc-950/20'
              }`}
            >
              {/* Dynamic Aspect Ratio Container */}
              <div 
                className={`relative flex items-center justify-center overflow-auto ${
                  isFullscreenPresentation ? 'w-full h-full max-h-full' : 'w-full h-full'
                }`}
                style={{
                  maxHeight: isFullscreenPresentation ? '100vh' : '70vh',
                }}
              >
                {/* Isolated Workspace Canvas Zooming Engine */}
                <div 
                  className={`relative rounded-xl shadow-2xl overflow-hidden flex items-center justify-center transition-transform duration-100 ease-out ${
                    isFullscreenPresentation ? 'border-0 rounded-none' : 'bg-zinc-900 border border-zinc-800/60'
                  }`}
                  style={{
                    aspectRatio: activeProject.aspectRatio === 'freeform' ? 'auto' : activeProject.ratioValue,
                    width: isFullscreenPresentation ? '100vw' : '100%',
                    maxWidth: isFullscreenPresentation ? 'none' : (activeProject.aspectRatio === '1:1.41' ? '480px' : '800px'),
                    height: isFullscreenPresentation ? '100vh' : (activeProject.aspectRatio === 'freeform' ? '480px' : 'auto'),
                    transform: isFullscreenPresentation ? 'none' : `scale(${zoom / 100})`,
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseLeave}
                    onDoubleClick={handleCanvasDoubleClick}
                    className="w-full h-full object-contain cursor-crosshair"
                  />

                  {/* Inline Text Editor Overlay */}
                  {editingTextLayerId && (
                    (() => {
                      const layer = layers.find((l) => l.id === editingTextLayerId);
                      if (!layer) return null;
                      return (
                        <textarea
                          ref={inlineInputRef}
                          value={editingTextValue}
                          onChange={(e) => {
                            setEditingTextValue(e.target.value);
                            updateSelectedLayer({ text: e.target.value });
                          }}
                          onBlur={() => setEditingTextLayerId(null)}
                          className="absolute bg-white text-black border-2 border-indigo-500 rounded p-2 shadow-2xl focus:outline-none resize-none overflow-hidden"
                          style={{
                            left: `${layer.x}px`,
                            top: `${layer.y}px`,
                            width: `${layer.width}px`,
                            height: `${layer.height}px`,
                            fontSize: `${layer.fontSize || 24}px`,
                            fontFamily: layer.fontFamily || 'sans-serif',
                            textAlign: layer.textAlign || 'center',
                            fontWeight: layer.isBold ? 'bold' : 'normal',
                            fontStyle: layer.isItalic ? 'italic' : 'normal',
                            letterSpacing: `${layer.letterSpacing || 0}px`,
                            wordWrap: 'break-word',
                            whiteSpace: 'pre-wrap',
                          }}
                        />
                      );
                    })()
                  )}
                </div>
              </div>

              {/* Document Mode Page Multiplier Button - Hidden in full-screen presentation mode */}
              {!isFullscreenPresentation && activeProject.id === 'docs' && (
                <button
                  onClick={() => setDocPages((prev) => prev + 1)}
                  className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg font-bold text-xs z-20"
                >
                  <Plus className="w-4 h-4" />
                  Add Page
                </button>
              )}

              {/* Presentation Mode Slide Filmstrip Carousel - Hidden in full-screen presentation mode */}
              {!isFullscreenPresentation && activeProject.id === 'presentation' && (
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

              {/* Specialized Bottom Control Bar for Whiteboard Mode - Hidden in full-screen presentation mode */}
              {!isFullscreenPresentation && activeProject.type === 'whiteboard' && (
                <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-zinc-900/90 px-5 py-3 rounded-2xl border border-zinc-800/60 backdrop-blur-md shadow-xl z-20">
                  <div className="flex items-center gap-1 border-r border-zinc-800/60 pr-3">
                    <button
                      onClick={handleDrawingUndo}
                      className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-all"
                      title="Undo Drawing"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDrawingRedo}
                      className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-all"
                      title="Redo Drawing"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 border-r border-zinc-800/60 pr-3">
                    <button
                      onClick={() => addShapeLayer('rect')}
                      className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-all"
                      title="Add Rectangle"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => addShapeLayer('circle')}
                      className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-all"
                      title="Add Circle"
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => addTextLayer()}
                      className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-all"
                      title="Add Text"
                    >
                      <Type className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Pen/Brush Library Submenu */}
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'marker', label: 'Marker' },
                      { id: 'sketch', label: 'Sketch' },
                      { id: 'bold', label: 'Bold' },
                      { id: 'paintbrush', label: 'Paintbrush' },
                    ].map((brush) => (
                      <button
                        key={brush.id}
                        onClick={() => {
                          setActiveTool('draw');
                          setActiveBrush(brush.id as any);
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                          activeBrush === brush.id && activeTool === 'draw'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {brush.label}
                      </button>
                    ))}
                  </div>

                  {/* Workspace Toggle */}
                  <div className="flex items-center gap-1 border-l border-zinc-800/60 pl-3">
                    <button
                      onClick={() => setWhiteboardStyle(whiteboardStyle === 'grid' ? 'plain' : 'grid')}
                      className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-all"
                      title="Toggle Grid / Plain Background"
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Zoom Slider Control - Hidden in full-screen presentation mode */}
              {!isFullscreenPresentation && (
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
              )}

              {/* Quick Layer Import Bar - Hidden in full-screen presentation mode */}
              {!isFullscreenPresentation && (
                <div className={`mt-4 flex items-center gap-3 px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-lg transition-colors ${
                  theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800/60' : 'bg-white/80 border-zinc-200'
                }`}>
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mr-2">Add Layer:</span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      theme === 'dark' ? 'text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700' : 'text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Image Layer
                  </button>
                  <button
                    onClick={() => setShowMemeModal(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      theme === 'dark' ? 'text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700' : 'text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
                    }`}
                  >
                    <Smile className="w-3.5 h-3.5 text-amber-400" />
                    Memes
                  </button>
                  <button
                    onClick={() => addTextLayer()}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      theme === 'dark' ? 'text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700' : 'text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    Text Layer
                  </button>
                  <button
                    onClick={() => addShapeLayer('rect')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      theme === 'dark' ? 'text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700' : 'text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
                    }`}
                  >
                    <Square className="w-3.5 h-3.5" />
                    Rectangle
                  </button>
                  <button
                    onClick={() => addShapeLayer('circle')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      theme === 'dark' ? 'text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700' : 'text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
                    }`}
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
              )}
            </div>

            {/* Right Sidebar: Interactive Advanced Property Bar - Hidden in full-screen presentation mode */}
            {!isFullscreenPresentation && (
              <div className={`w-full lg:w-96 border-l backdrop-blur-md flex flex-col h-full overflow-y-auto transition-colors ${
                theme === 'dark' ? 'border-zinc-800/60 bg-zinc-900/20' : 'border-zinc-200 bg-white/80'
              }`}>
                <div className="p-6 space-y-6">
                  
                  {/* Section 1: Global Canvas Settings */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Layout className="w-4 h-4 text-indigo-400" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Canvas Settings</h2>
                    </div>
                    <div className={`p-4 rounded-xl border space-y-3 shadow-md transition-colors ${
                      theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'
                    }`}>
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
                                canvasBgColor === color ? 'border-indigo-500 scale-110' : 'border-zinc-300'
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
                      <div className={`text-center py-6 border border-dashed rounded-xl text-xs text-zinc-500 ${
                        theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'
                      }`}>
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
                                : (theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700 text-zinc-400' : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700')
                            }`}
                          >
                            <span className="truncate font-medium">{layer.name}</span>
                            <span className="text-[10px] text-zinc-500 uppercase">{layer.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 3: Selected Layer Properties (Restructured Priority Layout) */}
                  {selectedLayer ? (
                    <div className={`space-y-4 pt-4 border-t ${theme === 'dark' ? 'border-zinc-800/60' : 'border-zinc-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Sliders className="w-4 h-4 text-purple-400" />
                        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                          Properties: <span className="text-purple-400">{selectedLayer.name}</span>
                        </h2>
                      </div>

                      {/* [TOP HOUSING]: Canvas Axis Rotation, Duplicate, Flips, and Crop/Warp */}
                      
                      {/* Rotation Module */}
                      <div className={`border rounded-xl overflow-hidden shadow-sm transition-colors ${
                        theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'
                      }`}>
                        <button
                          onClick={() => toggleAccordion('rotation')}
                          className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-zinc-300 hover:bg-zinc-800/50 transition-all"
                        >
                          <span className={theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}>Rotation & Actions</span>
                          <RotateCw className="w-4 h-4 text-zinc-500" />
                        </button>
                        {rightAccordion.rotation && (
                          <div className={`p-4 border-t space-y-4 ${theme === 'dark' ? 'border-zinc-800/40' : 'border-zinc-200'}`}>
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateSelectedLayer({ rotation: (selectedLayer.rotation - 90) % 360 })}
                                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 text-white"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                90° CCW
                              </button>
                              <button
                                onClick={() => updateSelectedLayer({ rotation: (selectedLayer.rotation + 90) % 360 })}
                                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 text-white"
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
                            <button
                              onClick={duplicateLayer}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all"
                            >
                              <Copy className="w-4 h-4" />
                              Duplicate Layer
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Mirror & Flip Controls */}
                      <div className={`border rounded-xl overflow-hidden shadow-sm transition-colors ${
                        theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'
                      }`}>
                        <div className="px-4 py-3 flex items-center justify-between text-xs font-bold text-zinc-300">
                          <span className={theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}>Mirror & Flip Controls</span>
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

                      {/* Crop & Warp Split Modules */}
                      {(selectedLayer.type === 'image' || selectedLayer.type === 'element') && (
                        <div className={`border rounded-xl overflow-hidden shadow-sm transition-colors ${
                          theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'
                        }`}>
                          <button
                            onClick={() => toggleAccordion('crop')}
                            className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-zinc-300 hover:bg-zinc-800/50 transition-all"
                          >
                            <span className={theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}>Crop & Perspective Splitter</span>
                            <Maximize2 className="w-4 h-4 text-zinc-500" />
                          </button>
                          {rightAccordion.crop && (
                            <div className={`p-4 border-t space-y-4 ${theme === 'dark' ? 'border-zinc-800/40' : 'border-zinc-200'}`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className={`text-xs font-semibold block ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Perspective Warp Mode</span>
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

                              <div className={`flex flex-col border-t pt-3 gap-2 ${theme === 'dark' ? 'border-zinc-800/40' : 'border-zinc-200'}`}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className={`text-xs font-semibold block ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Freeform Crop Mode</span>
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
                                  <div className={`p-3 rounded-lg space-y-2 border ${
                                    theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                                  }`}>
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

                      {/* Typography & Text Box */}
                      {selectedLayer.type === 'text' && (
                        <div className={`border rounded-xl overflow-hidden shadow-sm transition-colors ${
                          theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'
                        }`}>
                          <button
                            onClick={() => toggleAccordion('text')}
                            className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-zinc-300 hover:bg-zinc-800/50 transition-all"
                          >
                            <span className={theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}>Typography & Text Box</span>
                            <Type className="w-4 h-4 text-zinc-500" />
                          </button>
                          {rightAccordion.text && (
                            <div className={`p-4 border-t space-y-4 ${theme === 'dark' ? 'border-zinc-800/40' : 'border-zinc-200'}`}>
                              <div>
                                <label className="text-[11px] text-zinc-400 block mb-1">Text Content</label>
                                <input
                                  type="text"
                                  value={selectedLayer.text || ''}
                                  onChange={(e) => updateSelectedLayer({ text: e.target.value })}
                                  className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 ${
                                    theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                                  }`}
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

                      {/* [BOTTOM HOUSING]: Advanced Color Filters & Opacity */}
                      
                      {/* Opacity & Layer Alpha */}
                      <div className={`border rounded-xl overflow-hidden shadow-sm transition-colors ${
                        theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'
                      }`}>
                        <button
                          onClick={() => toggleAccordion('opacity')}
                          className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-zinc-300 hover:bg-zinc-800/50 transition-all"
                        >
                          <span className={theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}>Opacity & Layer Alpha</span>
                          <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${rightAccordion.opacity ? 'rotate-180' : ''}`} />
                        </button>
                        {rightAccordion.opacity && (
                          <div className={`p-4 border-t space-y-4 ${theme === 'dark' ? 'border-zinc-800/40' : 'border-zinc-200'}`}>
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

                      {/* Filters & Adjustments */}
                      <div className={`border rounded-xl overflow-hidden shadow-sm transition-colors ${
                        theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'
                      }`}>
                        <button
                          onClick={() => toggleAccordion('filters')}
                          className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-zinc-300 hover:bg-zinc-800/50 transition-all"
                        >
                          <span className={theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}>Filters & Adjustments</span>
                          <Sliders className="w-4 h-4 text-zinc-500" />
                        </button>
                        {rightAccordion.filters && (
                          <div className={`p-4 border-t space-y-4 ${theme === 'dark' ? 'border-zinc-800/40' : 'border-zinc-200'}`}>
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

                    </div>
                  ) : (
                    <div className={`text-center py-8 border border-dashed rounded-xl text-xs text-zinc-500 ${
                      theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'
                    }`}>
                      Select a layer on the canvas or in the list to view and edit properties.
                    </div>
                  )}

                </div>
              </div>
            )}

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
