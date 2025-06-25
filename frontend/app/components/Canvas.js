'use client';

import { forwardRef, useEffect, useRef, useState, useMemo, useImperativeHandle } from 'react';
import { useDrawing } from '../context/DrawingContext';

// Controlled component for text input
function TextInput({ textInput, onTextChange, onSubmit }) {
  const { brushSize, strokeColor } = useDrawing();
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ position: 'absolute', top: textInput.position.y, left: textInput.position.x, zIndex: 10 }}
    >
      <input
        ref={inputRef}
        type="text"
        value={textInput.text}
        onChange={onTextChange}
        // onBlur={onSubmit} // Removing onBlur submission
        style={{
          fontSize: `${brushSize * 5}px`,
          color: strokeColor,
          border: '1px solid #ccc',
          background: 'rgba(255, 255, 255, 0.8)',
          outline: 'none',
        }}
      />
    </form>
  );
}

const Canvas = forwardRef(function Canvas({ className = '' }, ref) {
  const {
    activeTool,
    brushSize,
    color,
    strokeColor,
    shapes,
    history,
    historyIndex,
    startShapeDrawing,
    updateShapeDrawing,
    completeShapeDrawing,
    startStroke,
    updateStroke,
    endCurrentStroke,
    redrawCanvas,
    addText,
    drawAction,
    clearCanvas,
  } = useDrawing();

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [textInput, setTextInput] = useState(null);

  // Expose the canvas ref to parent
  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current
  }));

  const submitTextRef = useRef();
  useEffect(() => {
    submitTextRef.current = submitText;
  });

  const prevActiveToolRef = useRef(activeTool);

  useEffect(() => {
    if (prevActiveToolRef.current === 'text' && activeTool !== 'text') {
      if (submitTextRef.current) {
        submitTextRef.current();
      }
    }
    prevActiveToolRef.current = activeTool;
  }, [activeTool]);


  // Effect for initialization and resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    setContext(ctx);

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent && ctx) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        redrawCanvas(ctx, canvas.width, canvas.height, history, historyIndex);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [redrawCanvas, history, historyIndex]);

  // Effect for redrawing when history changes (undo/redo)
  useEffect(() => {
    if (context) {
      redrawCanvas(context, canvasRef.current.width, canvasRef.current.height, history, historyIndex);
    }
  }, [history, historyIndex, context, redrawCanvas]);

  // Effect for drawing shape previews
  useEffect(() => {
    if (isDrawing && shapes.currentShape && context) {
      redrawCanvas(context, canvasRef.current.width, canvasRef.current.height, history, historyIndex);
      drawAction(context, shapes.currentShape);
    }
  }, [shapes.currentShape, isDrawing, context, redrawCanvas, drawAction, history, historyIndex]);

  // Memoize the canvas cursor based on active tool, only for the canvas element
  const canvasCursor = useMemo(() => {
    switch (activeTool) {
      case 'pencil':
        return "url('/cursors/pencil.svg') 4 20, auto";
      case 'brush':
        return "url('/cursors/brush.svg') 12 12, auto";
      case 'eraser':
        return "url('/cursors/eraser.svg') 12 12, auto";
      case 'text':
        return 'text';
      case 'rectangle':
      case 'circle':
      case 'line':
      case 'ellipse':
      case 'triangle':
      case 'pentagon':
      case 'hexagon':
      case 'star':
        return 'crosshair';
      default:
        return 'default';
    }
  }, [activeTool]);


  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    // Handle both mouse and touch events
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    
    if (clientX === undefined || clientY === undefined) {
      return null;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleTextChange = (e) => {
    setTextInput(prev => (prev ? { ...prev, text: e.target.value } : null));
  };

  const submitText = () => {
    if (textInput && textInput.text) {
      addText(textInput.text, textInput.position);
    }
    setTextInput(null);
  };

  const startDrawing = (e) => {
    if (!context || e.target.tagName !== 'CANVAS') return;

    const pos = getMousePos(e);

    if (activeTool === 'text') {
      // If there's an existing text input, submit it before creating a new one.
      if (textInput && textInput.text) {
        submitText();
      }
      setTextInput({ position: pos, text: '' });
    } else {
      setIsDrawing(true);

      if (['rectangle', 'circle', 'ellipse', 'line', 'triangle', 'pentagon', 'hexagon', 'star'].includes(activeTool)) {
        startShapeDrawing(activeTool, pos);
      } else {
        const size = ['brush', 'eraser'].includes(activeTool) ? brushSize * 2 : brushSize;
        // Use strokeColor from context for all drawing tools
        startStroke(pos, activeTool, strokeColor, size);
      }
    }
  };

  const draw = (e) => {
    if (!isDrawing || !context) return;
    const pos = getMousePos(e);

    if (['pencil', 'brush', 'eraser'].includes(activeTool)) {
      updateStroke(pos);
    } else if (['rectangle', 'circle', 'ellipse', 'line', 'triangle', 'pentagon', 'hexagon', 'star'].includes(activeTool)) {
      updateShapeDrawing(pos);
    }
  };

  const finishDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (['rectangle', 'circle', 'ellipse', 'line', 'triangle', 'pentagon', 'hexagon', 'star'].includes(activeTool)) {
      completeShapeDrawing();
    } else {
      endCurrentStroke();
    }
  };

  // Prevent scrolling when touching the canvas
  const preventDefault = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  return (
    <div className={`relative w-full h-full pb-16 ${className}`}>
      <canvas
        id="drawing-canvas"
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={finishDrawing}
        onMouseLeave={finishDrawing}
        onTouchStart={(e) => {
          preventDefault(e);
          startDrawing(e.touches[0]);
        }}
        onTouchMove={(e) => {
          preventDefault(e);
          if (e.touches.length === 1) { // Only handle single touch
            draw(e.touches[0]);
          }
        }}
        onTouchEnd={(e) => {
          preventDefault(e);
          finishDrawing();
        }}
        onTouchCancel={(e) => {
          preventDefault(e);
          finishDrawing();
        }}
        style={{
          cursor: canvasCursor,
          touchAction: 'none', // Prevent default touch behaviors like scrolling
          backgroundColor: 'white',
          display: 'block',
          width: '100%',
          height: '100%',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
        className="absolute top-0 left-0 touch-none"
      />
      {textInput && (
        <TextInput
          textInput={textInput}
          onTextChange={handleTextChange}
          onSubmit={submitText}
        />
      )}
      {/* This button should ideally be in a separate Toolbar component */}
      <button 
        onClick={clearCanvas} // Use the clearCanvas from context
        className="fixed md:absolute bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors z-20 pb-safe"
      >
        Clear Canvas
      </button>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
