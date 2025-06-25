'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  FaPencilAlt, 
  FaFont, 
  FaEraser, 
  FaBrush, 
  FaChevronDown, 
  FaChevronRight,
  FaUndo, 
  FaRedo, 
  FaTrash,
  FaPalette,
  FaFile,
  FaSave,
  FaDownload,
  FaFolderOpen,
  FaSquare,
  FaCircle,
  FaMinus
} from "react-icons/fa";
import { BsSquare, BsCircle, BsSlashLg, BsTriangle, BsPentagon, BsHexagon, BsStar } from "react-icons/bs";
import { TbOvalVertical } from "react-icons/tb";
import { useDrawing } from "../context/DrawingContext";

// --- Popover state and refs for size slider ---
// Place these inside the Navigation component
// const [showSizeSlider, setShowSizeSlider] = useState(false);
// const sizeButtonRef = useRef(null);
// const sizeSliderRef = useRef(null);
// useEffect(() => {
//   function handleClickOutside(event) {
//     if (
//       sizeSliderRef.current &&
//       !sizeSliderRef.current.contains(event.target) &&
//       sizeButtonRef.current &&
//       !sizeButtonRef.current.contains(event.target)
//     ) {
//       setShowSizeSlider(false);
//     }
//   }
//   if (showSizeSlider) {
//     document.addEventListener('mousedown', handleClickOutside);
//   }
//   return () => {
//     document.removeEventListener('mousedown', handleClickOutside);
//   };
// }, [showSizeSlider]);


function FileMenu({ isMobile = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef(null);
  const { newDocument, saveDrawing, loadDrawing } = useDrawing();
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSave = () => {
    const data = saveDrawing();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `drawing-${new Date().toISOString().slice(0, 10)}.akibuki`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCanvas = () => {
    try {
      // Get the canvas by ID
      const canvas = document.getElementById('drawing-canvas');
      if (!canvas) {
        console.error('Canvas element not found');
        return;
      }
      
      // Create a temporary canvas to ensure we get the current drawing
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      
      // Fill with white background
      tempCtx.fillStyle = 'white';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw the original canvas onto the temp canvas
      tempCtx.drawImage(canvas, 0, 0);
      
      // Create download link
      const link = document.createElement('a');
      link.download = `drawing-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = tempCanvas.toDataURL('image/png');
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading canvas:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const success = loadDrawing(event.target.result);
      if (!success) {
        alert('Failed to load the drawing file. It might be corrupted or in an unsupported format.');
      }
    };
    reader.onerror = () => {
      alert('Error reading the file');
    };
    reader.readAsText(file);
  };

  const handleOpenClick = () => {
    fileInputRef.current?.click();
  };

  if (isMobile) {
    return (
      <div className="relative" ref={menuRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-white hover:bg-gray-700 rounded-md transition-colors"
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {isOpen && (
          <div className="absolute left-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-50 border border-gray-600 py-1">
            <div className="px-2 py-1 text-xs text-gray-400 uppercase tracking-wider">File</div>
            <button
              onClick={() => {
                newDocument();
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors text-sm"
            >
              <FaFile className="mr-3" /> New
            </button>
            <button
              onClick={() => {
                handleSave();
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors text-sm"
            >
              <FaSave className="mr-3" /> Save
            </button>
            <button
              onClick={() => {
                handleOpenClick();
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors text-sm"
            >
              <FaFolderOpen className="mr-3" /> Open
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">

    </div>
  );
}

function Dropdown({ title, children, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 hover:bg-gray-700 rounded text-white transition-colors"
      >
        {title}
        <FaChevronDown className="ml-1 text-xs" />
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-40 bg-gray-800 rounded-md shadow-lg border border-gray-600">
          <div className="py-1">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navigation() {
  const {
    activeTool,
    setActiveTool,
    brushSize,
    setBrushSize,
    strokeColor,
    setStrokeColor,
    fillColor,
    setFillColor,
    undo,
    redo,
    clearCanvas,
    canUndo,
    canRedo,
    canvasRef // Make sure to pass this from the parent component
  } = useDrawing();
  
  const [showStrokeColorPicker, setShowStrokeColorPicker] = useState(false);
  const [showFillColorPicker, setShowFillColorPicker] = useState(false);
  const strokeColorPickerRef = useRef(null);
  const fillColorPickerRef = useRef(null);
  const navRef = useRef(null);

  // --- Popover state and refs for stroke color ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        strokeColorPickerRef.current &&
        !strokeColorPickerRef.current.contains(event.target)
      ) {
        setShowStrokeColorPicker(false);
      }
    }
    if (showStrokeColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStrokeColorPicker]);

  // --- Popover state and refs for fill color ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        fillColorPickerRef.current &&
        !fillColorPickerRef.current.contains(event.target)
      ) {
        setShowFillColorPicker(false);
      }
    }
    if (showFillColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFillColorPicker]);

  // --- Popover state and refs for size slider ---
  const [showSizeSlider, setShowSizeSlider] = useState(false);
  const sizeButtonRef = useRef(null);
  const sizeSliderRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        sizeSliderRef.current &&
        !sizeSliderRef.current.contains(event.target) &&
        sizeButtonRef.current &&
        !sizeButtonRef.current.contains(event.target)
      ) {
        setShowSizeSlider(false);
      }
    }
    if (showSizeSlider) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSizeSlider]);

  // --- Popover state and refs for shape palette ---
  const [showShapePopover, setShowShapePopover] = useState(false);
  const shapeButtonRef = useRef(null);
  const shapePopoverRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        shapePopoverRef.current &&
        !shapePopoverRef.current.contains(event.target) &&
        shapeButtonRef.current &&
        !shapeButtonRef.current.contains(event.target)
      ) {
        setShowShapePopover(false);
      }
    }
    if (showShapePopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShapePopover]);



  // Common colors for quick selection
  const commonColors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', 
    '#ffff00', '#00ffff', '#ff00ff', '#808080', '#ffa500'
  ];

  const getShapeIcon = () => {
    switch (activeTool) {
      case 'rectangle': return <BsSquare className="text-lg" />;
      case 'circle': return <BsCircle className="text-lg" />;
      case 'line': return <BsSlashLg className="text-lg transform -rotate-45" />;
      case 'ellipse': return <TbOvalVertical className="text-lg" />;
      case 'triangle': return <BsTriangle className="text-lg" />;
      case 'pentagon': return <BsPentagon className="text-lg" />;
      case 'hexagon': return <BsHexagon className="text-lg" />;
      case 'star': return <BsStar className="text-lg" />;
      default: return <BsSquare className="text-lg" />;
    }
  };

  // Set CSS variable for nav height
  useEffect(() => {
    if (navRef.current) {
      document.documentElement.style.setProperty('--nav-height', `${navRef.current.offsetHeight}px`);
    }
  }, []);

  // Download canvas as image
  const downloadCanvas = () => {
    console.log('Download button clicked');
    
    // Get the canvas element
    const canvas = document.getElementById('drawing-canvas');
    console.log('Canvas element:', canvas);
    
    if (!canvas) {
      console.error('Canvas element not found');
      alert('Error: Could not find the drawing canvas');
      return;
    }
    
    try {
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
      
      // Create a temporary canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Fill with white background
      tempCtx.fillStyle = 'white';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw the original canvas onto the temp canvas
      tempCtx.drawImage(canvas, 0, 0);
      
      // Convert to data URL
      const dataUrl = tempCanvas.toDataURL('image/png');
      console.log('Generated data URL:', dataUrl.substring(0, 50) + '...');
      
      // Create and trigger download
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `drawing-${timestamp}.png`;
      
      link.download = filename;
      link.href = dataUrl;
      
      // Required for Firefox
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Download should start now');
    } catch (error) {
      console.error('Error in downloadCanvas:', error);
      alert('Error saving image: ' + error.message);
    }
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg" ref={navRef} style={{
      '--nav-height': '4rem' // fallback value
    }}>
      <div className="container mx-auto px-4">


        {/* Tools Section - Always visible on mobile */}
        <div className="border-t border-gray-700 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* File Menu */}
            <FileMenu />
            
            {/* Divider */}
            <div className="hidden md:block h-8 w-px bg-gray-600 mx-2"></div>
            
            {/* History Controls */}
            <div className="flex items-center space-x-1">
                              <button
            onClick={() => {
              downloadCanvas();
              setIsOpen(false);
            }}
            className="flex items-center w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors text-sm"
          >
            <FaDownload className="mr-3" /> Download
          </button>
              <button
                className={`p-2 rounded transition-colors ${canUndo ? 'text-white hover:bg-gray-700' : 'text-gray-500 cursor-not-allowed'}`}
                title="Undo"
                onClick={undo}
                disabled={!canUndo}
              >
                <FaUndo className="text-lg" />
              </button>
              <button
                className={`p-2 rounded transition-colors ${canRedo ? 'text-white hover:bg-gray-700' : 'text-gray-500 cursor-not-allowed'}`}
                title="Redo"
                onClick={redo}
                disabled={!canRedo}
              >
                <FaRedo className="text-lg" />
              </button>
            </div>

            {/* Divider */}
            <div className="hidden md:block h-8 w-px bg-gray-600 mx-2"></div>

            {/* Stroke & Fill Color Pickers */}
            <div className="flex items-center gap-2">
              {/* Stroke Color */}
              <div className="relative">
                <button
                  className="flex items-center px-2 py-1 rounded bg-gray-800 border border-gray-600 hover:bg-gray-700 focus:outline-none"
                  style={{ borderColor: strokeColor }}
                  onClick={() => setShowStrokeColorPicker((v) => !v)}
                  title="Stroke Color"
                >
                  <span className="w-5 h-5 rounded-full border border-gray-400 mr-1" style={{ background: strokeColor }} />
                  <span className="text-xs text-gray-200">Stroke</span>
                </button>
                {showStrokeColorPicker && (
                  <div ref={strokeColorPickerRef} className="absolute left-0 mt-2 p-2 bg-gray-800 rounded shadow z-50 border border-gray-600">
                    <input
                      type="color"
                      value={strokeColor}
                      onChange={e => setStrokeColor(e.target.value)}
                      className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer"
                    />
                  </div>
                )}
              </div>
              {/* Fill Color */}
              <div className="relative">
                <button
                  className="flex items-center px-2 py-1 rounded bg-gray-800 border border-gray-600 hover:bg-gray-700 focus:outline-none"
                  style={{ borderColor: fillColor }}
                  onClick={() => setShowFillColorPicker((v) => !v)}
                  title="Fill Color"
                >
                  <span className="w-5 h-5 rounded-full border border-gray-400 mr-1" style={{ background: fillColor }} />
                  <span className="text-xs text-gray-200">Fill</span>
                </button>
                {showFillColorPicker && (
                  <div ref={fillColorPickerRef} className="absolute left-0 mt-2 p-2 bg-gray-800 rounded shadow z-50 border border-gray-600">
                    <input
                      type="color"
                      value={fillColor}
                      onChange={e => setFillColor(e.target.value)}
                      className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
            {/* Drawing Tools */}
            <div className="flex flex-wrap items-center gap-1">
              <button 
                className={`p-2 rounded transition-colors ${activeTool === 'pencil' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} 
                title="Pencil"
                onClick={() => setActiveTool('pencil')}
              >
                <FaPencilAlt className="text-lg" />
              </button>
              <button 
                className={`p-2 rounded transition-colors ${activeTool === 'brush' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} 
                title="Brush"
                onClick={() => setActiveTool('brush')}
              >
                <FaBrush className="text-lg" />
              </button>

              <button 
                className={`p-2 rounded transition-colors ${activeTool === 'text' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} 
                title="Text"
                onClick={() => setActiveTool('text')}
              >
                <FaFont className="text-lg" />
              </button>
              <button 
                className={`p-2 rounded transition-colors ${activeTool === 'eraser' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} 
                title="Eraser"
                onClick={() => setActiveTool('eraser')}
              >
                <FaEraser className="text-lg" />
              </button>
            </div>

            
            {/* Size popover button and slider */}
            <div className="relative">
              <button
                onClick={() => setShowSizeSlider((v) => !v)}
                className="flex items-center px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                ref={sizeButtonRef}
                title="Adjust size"
              >
                <span className="text-xs mr-2">Size</span>
                <span className="text-xs font-bold">{brushSize}px</span>
                <FaChevronDown className="ml-2 text-xs" />
              </button>
              {showSizeSlider && (
                <div
                  ref={sizeSliderRef}
                  className="absolute left-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded shadow-lg p-4 z-30 flex flex-col items-center"
                >
                  <input
                    type="range"
                    min={1}
                    max={40}
                    value={brushSize}
                    onChange={e => setBrushSize(Number(e.target.value))}
                    className="w-full accent-gray-700 mb-2"
                  />
                  <span className="text-xs text-gray-300">{brushSize}px</span>
                </div>
              )}
            </div>

            {/* Shapes popover button and palette */}
            <div className="relative">
              <button
                onClick={() => setShowShapePopover((v) => !v)}
                className="flex items-center px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors ml-2 relative z-10"
                ref={shapeButtonRef}
                title="Select shape"
              >
                {getShapeIcon()}
                <FaChevronDown className="ml-2 text-xs" />
              </button>
              {showShapePopover && (
                <div
                  ref={shapePopoverRef}
                  className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg p-4 z-50 grid grid-cols-4 gap-3 max-h-[70vh] overflow-y-auto"
                  style={{
                    // maxWidth: 'calc(100vw - 1rem)',
                    minWidth: '320px',
                    top: '100%',
                    transform: 'translateX(0)'
                  }}
                >
                  <button className={`flex flex-col items-center p-2 rounded hover:bg-gray-600 ${activeTool === 'rectangle' ? 'bg-gray-600' : ''}`} onClick={() => { setActiveTool('rectangle'); setShowShapePopover(false); }}><BsSquare className="text-xl mb-1" /><span className="text-xs">Rectangle</span></button>
                  <button className={`flex flex-col items-center p-2 rounded hover:bg-gray-600 ${activeTool === 'circle' ? 'bg-gray-600' : ''}`} onClick={() => { setActiveTool('circle'); setShowShapePopover(false); }}><BsCircle className="text-xl mb-1" /><span className="text-xs">Circle</span></button>
                  <button className={`flex flex-col items-center p-2 rounded hover:bg-gray-600 ${activeTool === 'ellipse' ? 'bg-gray-600' : ''}`} onClick={() => { setActiveTool('ellipse'); setShowShapePopover(false); }}><TbOvalVertical className="text-xl mb-1" /><span className="text-xs">Ellipse</span></button>
                  <button className={`flex flex-col items-center p-2 rounded hover:bg-gray-600 ${activeTool === 'line' ? 'bg-gray-600' : ''}`} onClick={() => { setActiveTool('line'); setShowShapePopover(false); }}><BsSlashLg className="text-xl mb-1 transform -rotate-45" /><span className="text-xs">Line</span></button>
                  <button className={`flex flex-col items-center p-2 rounded hover:bg-gray-600 ${activeTool === 'triangle' ? 'bg-gray-600' : ''}`} onClick={() => { setActiveTool('triangle'); setShowShapePopover(false); }}><BsTriangle className="text-xl mb-1" /><span className="text-xs">Triangle</span></button>
                  <button className={`flex flex-col items-center p-2 rounded hover:bg-gray-600 ${activeTool === 'pentagon' ? 'bg-gray-600' : ''}`} onClick={() => { setActiveTool('pentagon'); setShowShapePopover(false); }}><BsPentagon className="text-xl mb-1" /><span className="text-xs">Pentagon</span></button>
                  <button className={`flex flex-col items-center p-2 rounded hover:bg-gray-600 ${activeTool === 'hexagon' ? 'bg-gray-600' : ''}`} onClick={() => { setActiveTool('hexagon'); setShowShapePopover(false); }}><BsHexagon className="text-xl mb-1" /><span className="text-xs">Hexagon</span></button>
                  <button className={`flex flex-col items-center p-2 rounded hover:bg-gray-600 ${activeTool === 'star' ? 'bg-gray-600' : ''}`} onClick={() => { setActiveTool('star'); setShowShapePopover(false); }}><BsStar className="text-xl mb-1" /><span className="text-xs">Star</span></button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}