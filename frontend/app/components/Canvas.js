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
  const isDrawingRef = useRef(false);
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
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip the initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Handle text tool deactivation
    if (prevActiveToolRef.current === 'text' && activeTool !== 'text') {
      if (submitTextRef.current) {
        submitTextRef.current();
      }
    }
    
    // Reset drawing state when switching tools
    if (isDrawing) {
      setIsDrawing(false);
      if (['pencil', 'brush', 'eraser'].includes(prevActiveToolRef.current)) {
        endCurrentStroke();
      } else if (['rectangle', 'circle', 'ellipse', 'line', 'triangle', 'pentagon', 'hexagon', 'star'].includes(prevActiveToolRef.current)) {
        completeShapeDrawing();
      }
    }
    
    prevActiveToolRef.current = activeTool;
  }, [activeTool, isDrawing, endCurrentStroke, completeShapeDrawing]);


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
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Handle both mouse and touch events
    let clientX, clientY;
    
    if (e.touches) {
      // For touch events
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.changedTouches && e.changedTouches.length > 0) {
        // For touch end events
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      }
    } else {
      // For mouse events
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    if (clientX === undefined || clientY === undefined) {
      return null;
    }
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    return { x, y };
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
    try {
      // Prevent default to avoid any unwanted behaviors
      e.preventDefault();
      
      // Get the position
      const pos = getMousePos(e);
      if (!pos) return;

      // Handle text tool separately
      if (activeTool === 'text') {
        // If there's an existing text input, submit it before creating a new one
        if (textInput && textInput.text) {
          submitText();
        }
        setTextInput({ position: pos, text: '' });
        return;
      }

      // For drawing tools, set the drawing state immediately
      isDrawingRef.current = true;
      setIsDrawing(true);

      // Use requestAnimationFrame to ensure state updates before drawing
      requestAnimationFrame(() => {
        try {
          // Start the appropriate drawing action based on the tool
          if (['rectangle', 'circle', 'ellipse', 'line', 'triangle', 'pentagon', 'hexagon', 'star'].includes(activeTool)) {
            startShapeDrawing(activeTool, pos);
          } else {
            let size = brushSize;
            if (activeTool === 'brush') {
              size = brushSize * 4;  // 2x size for brush
            } else if (activeTool === 'eraser') {
              size = brushSize * 6;  // 3x size for eraser
            }
            startStroke(pos, activeTool, strokeColor, size);
          }
          
          // Force focus to handle mouse events properly
          canvasRef.current?.focus();
          
          // Initial redraw
          const canvas = canvasRef.current;
          if (canvas) {
            redrawCanvas(canvas, canvas.width, canvas.height);
          }
        } catch (error) {
          console.error('Error in startDrawing animation frame:', error);
        }
      });
    } catch (error) {
      console.error('Error in startDrawing:', error);
    }
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    
    const pos = getMousePos(e);
    if (!pos) return;

    // Prevent default to avoid any unwanted behaviors
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // For freehand drawing tools (pencil, brush, eraser)
      if (['pencil', 'brush', 'eraser'].includes(activeTool)) {
        updateStroke(pos);
      } 
      // For shape tools
      else if (['rectangle', 'circle', 'ellipse', 'line', 'triangle', 'pentagon', 'hexagon', 'star'].includes(activeTool)) {
        updateShapeDrawing(pos);
      }
      
      // Redraw the canvas to show updates
      requestAnimationFrame(() => {
        redrawCanvas(canvas, canvas.width, canvas.height);
      });
    } catch (error) {
      console.error('Error in draw:', error);
    }
  };

  const finishDrawing = (e) => {
    try {
      // Prevent default to avoid any unwanted behaviors
      if (e) e.preventDefault();
      
      if (!isDrawingRef.current) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Use requestAnimationFrame to ensure state updates before completing the drawing
      requestAnimationFrame(() => {
        try {
          // Complete the current drawing action
          if (['rectangle', 'circle', 'ellipse', 'line', 'triangle', 'pentagon', 'hexagon', 'star'].includes(activeTool)) {
            completeShapeDrawing();
          } else if (['pencil', 'brush', 'eraser'].includes(activeTool)) {
            endCurrentStroke();
          }
          
          // Final redraw to ensure everything is up to date
          redrawCanvas(canvas, canvas.width, canvas.height);
        } catch (error) {
          console.error('Error in finishDrawing animation frame:', error);
        } finally {
          // Always reset drawing state, even if there was an error
          setIsDrawing(false);
          isDrawingRef.current = false;
        }
      });
    } catch (error) {
      console.error('Error in finishDrawing:', error);
      setIsDrawing(false);
      isDrawingRef.current = false;
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
        tabIndex="0"  // Make canvas focusable
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={finishDrawing}
        onMouseLeave={finishDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={finishDrawing}
        onTouchCancel={finishDrawing}
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
