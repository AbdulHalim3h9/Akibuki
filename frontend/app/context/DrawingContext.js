'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';

const DrawingContext = createContext();

export const useDrawing = () => {
  const context = useContext(DrawingContext);
  if (!context) {
    throw new Error('useDrawing must be used within a DrawingProvider');
  }
  return context;
};

export const DrawingProvider = ({ children }) => {
  const [activeTool, setActiveTool] = useState('pencil');
  const [brushSize, setBrushSize] = useState(5);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#ffffff');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [shapes, setShapes] = useState({
    currentShape: null,
    isDrawing: false,
  });

  // Use a ref to hold the latest state to keep callbacks stable
  const stateRef = useRef();
  useEffect(() => {
    stateRef.current = { history, historyIndex, shapes, activeTool, brushSize, strokeColor, fillColor };
  }, [history, historyIndex, shapes, activeTool, brushSize, strokeColor, fillColor]);

  const addHistoryAction = useCallback((action) => {
    setHistory(prevHistory => {
      const { historyIndex } = stateRef.current;
      const historyToUpdate = prevHistory.slice(0, historyIndex + 1);
      return [...historyToUpdate, action];
    });
    setHistoryIndex(prev => prev + 1);
  }, []);

  const startStroke = useCallback((point, tool, strokeColor, size) => {
    const newAction = {
      type: 'draw',
      tool,
      points: [point],
      strokeColor,
      fillColor: stateRef.current.fillColor,
      size,
      isEnded: false,
      id: Date.now()
    };
    addHistoryAction(newAction);
  }, [addHistoryAction]);

  const updateStroke = useCallback((point) => {
    setHistory(prevHistory => {
      const { historyIndex } = stateRef.current;
      if (historyIndex < 0) return prevHistory;

      const newHistory = [...prevHistory];
      const lastAction = newHistory[historyIndex];

      if (lastAction && lastAction.type === 'draw' && !lastAction.isEnded) {
        const newPoints = [...lastAction.points, point];
        newHistory[historyIndex] = { ...lastAction, points: newPoints };
        return newHistory;
      }
      return prevHistory;
    });
  }, []);

  const endCurrentStroke = useCallback(() => {
    setHistory(prevHistory => {
      const { historyIndex } = stateRef.current;
      if (historyIndex < 0) return prevHistory;

      const newHistory = [...prevHistory];
      const lastAction = newHistory[historyIndex];

      if (lastAction && lastAction.type === 'draw' && !lastAction.isEnded) {
        newHistory[historyIndex] = { ...lastAction, isEnded: true };
      }
      return newHistory;
    });
  }, []);

  const startShapeDrawing = useCallback((tool, point) => {
    setShapes({
      isDrawing: true,
      currentShape: {
        tool,
        points: [point, point],
        strokeColor: stateRef.current.strokeColor,
        fillColor: stateRef.current.fillColor,
        size: stateRef.current.brushSize,
        fill: true,
        type: 'draw',
        isShape: true,
        id: Date.now()
      },
    });
  }, []);

  const updateShapeDrawing = useCallback((point) => {
    setShapes(prev => {
      if (!prev.isDrawing || !prev.currentShape) return prev;
      const newPoints = [prev.currentShape.points[0], point];
      return { ...prev, currentShape: { ...prev.currentShape, points: newPoints } };
    });
  }, []);

  const completeShapeDrawing = useCallback(() => {
    const { shapes } = stateRef.current;
    if (!shapes.isDrawing || !shapes.currentShape) return;

    if (shapes.currentShape.points.length >= 2) {
      const { ...shapeData } = shapes.currentShape;
      addHistoryAction({
        ...shapeData,
        strokeColor: shapes.currentShape.strokeColor,
        fillColor: shapes.currentShape.fillColor,
        isEnded: true
      });
    }
    setShapes({ currentShape: null, isDrawing: false });
  }, [addHistoryAction]);

  const drawAction = useCallback((ctx, action) => {
    if (!action) return;

    ctx.save(); // Save context state before drawing

    try {
      if (action.type === 'draw') {
        // Setup for drawing shapes and lines
        ctx.globalCompositeOperation = action.tool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.strokeStyle = action.strokeColor || action.color || '#000';
        ctx.fillStyle = action.fillColor || 'rgba(0,0,0,0)';
        ctx.lineWidth = action.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (action.isShape) {
          if (action.tool === 'rectangle') {
            const [start, end] = action.points;
            const width = end.x - start.x;
            const height = end.y - start.y;
            ctx.beginPath();
            ctx.rect(start.x, start.y, width, height);
            if (action.fill) {
  ctx.fill();
  ctx.stroke();
} else {
  ctx.stroke();
}
          } else if (action.tool === 'circle') {
            const [center, radiusPoint] = action.points;
            const radius = Math.sqrt(Math.pow(radiusPoint.x - center.x, 2) + Math.pow(radiusPoint.y - center.y, 2));
            ctx.beginPath();
            ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
            if (action.fill) {
  ctx.fill();
  ctx.stroke();
} else {
  ctx.stroke();
}
          } else if (action.tool === 'ellipse') {
            const [start, end] = action.points;
            const centerX = (start.x + end.x) / 2;
            const centerY = (start.y + end.y) / 2;
            const radiusX = Math.abs(end.x - start.x) / 2;
            const radiusY = Math.abs(end.y - start.y) / 2;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
            if (action.fill) {
  ctx.fill();
  ctx.stroke();
} else {
  ctx.stroke();
}
          } else if (action.tool === 'triangle') {
            const [start, end] = action.points;
            const third = { x: (start.x + end.x) / 2, y: start.y - Math.abs(end.x - start.x) * Math.sqrt(3) / 2 };
            ctx.beginPath();
            ctx.moveTo(start.x, end.y);
            ctx.lineTo(end.x, end.y);
            ctx.lineTo(third.x, start.y);
            ctx.closePath();
            if (action.fill) {
  ctx.fill();
  ctx.stroke();
} else {
  ctx.stroke();
}
          } else if (action.tool === 'pentagon') {
            const [start, end] = action.points;
            const centerX = (start.x + end.x) / 2;
            const centerY = (start.y + end.y) / 2;
            const radius = Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
              const angle = ((Math.PI * 2) / 5) * i - Math.PI / 2;
              const x = centerX + radius * Math.cos(angle);
              const y = centerY + radius * Math.sin(angle);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            if (action.fill) {
  ctx.fill();
  ctx.stroke();
} else {
  ctx.stroke();
}
          } else if (action.tool === 'hexagon') {
            const [start, end] = action.points;
            const centerX = (start.x + end.x) / 2;
            const centerY = (start.y + end.y) / 2;
            const radius = Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = ((Math.PI * 2) / 6) * i - Math.PI / 2;
              const x = centerX + radius * Math.cos(angle);
              const y = centerY + radius * Math.sin(angle);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            if (action.fill) {
  ctx.fill();
  ctx.stroke();
} else {
  ctx.stroke();
}
          } else if (action.tool === 'star') {
            const [start, end] = action.points;
            const centerX = (start.x + end.x) / 2;
            const centerY = (start.y + end.y) / 2;
            const outerRadius = Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;
            const innerRadius = outerRadius * 0.5;
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
              const angle = ((Math.PI * 2) / 10) * i - Math.PI / 2;
              const radius = i % 2 === 0 ? outerRadius : innerRadius;
              const x = centerX + radius * Math.cos(angle);
              const y = centerY + radius * Math.sin(angle);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            if (action.fill) {
  ctx.fill();
  ctx.stroke();
} else {
  ctx.stroke();
}
          } else if (action.tool === 'line') {
            const [start, end] = action.points;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
          }
        } else { // Freehand drawing
          ctx.beginPath();
          if (action.points.length > 0) {
              ctx.moveTo(action.points[0].x, action.points[0].y);
              for (let i = 1; i < action.points.length; i++) {
                  ctx.lineTo(action.points[i].x, action.points[i].y);
              }
              ctx.stroke();
          }
        }
      } else if (action.type === 'text') {
        // Setup for drawing text
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = action.strokeColor || '#000';
        ctx.font = `${action.size}px sans-serif`;
        
        ctx.fillText(action.text, action.position.x, action.position.y);
      }
    } finally {
      ctx.restore(); // Always restore context state
    }
  }, []);

  const redrawCanvas = useCallback((ctx, width, height, history, historyIndex) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const historyToDraw = history.slice(0, historyIndex + 1);
    for (const action of historyToDraw) {
      if (action.type === 'clear') {
        ctx.clearRect(0, 0, width, height);
      } else {
        drawAction(ctx, action);
      }
    }
  }, [drawAction]);

  const undo = () => {
    if (historyIndex > -1) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const clearCanvas = () => {
    addHistoryAction({ type: 'clear', id: Date.now() });
  };

  const addText = useCallback((text, position) => {
    const { color, brushSize } = stateRef.current;
    addHistoryAction({
      type: 'text',
      text,
      position,
      color,
      size: brushSize * 4,
      id: Date.now(),
    });
  }, [addHistoryAction]);

  const saveDrawing = useCallback(() => {
    const data = { history, historyIndex };
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drawing.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [history, historyIndex]);

  const loadDrawing = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data && data.history && typeof data.historyIndex === 'number') {
          setHistory(data.history);
          setHistoryIndex(data.historyIndex);
        }
      } catch (error) {
        console.error('Error loading drawing:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  const contextValue = useMemo(() => ({
    activeTool, setActiveTool,
    brushSize, setBrushSize,
    strokeColor, setStrokeColor,
    fillColor, setFillColor,
    shapes,
    history, historyIndex,
    startShapeDrawing,
    updateShapeDrawing,
    completeShapeDrawing,
    addHistoryAction,
    startStroke,
    updateStroke,
    endCurrentStroke,
    redrawCanvas,
    addText,
    drawAction,
    clearCanvas,
    undo,
    redo,
    saveDrawing,
    loadDrawing,
    canUndo: historyIndex > -1,
    canRedo: historyIndex < history.length - 1,
  }), [activeTool, brushSize, strokeColor, fillColor, shapes, history, historyIndex, startShapeDrawing, updateShapeDrawing, completeShapeDrawing, addHistoryAction, startStroke, updateStroke, endCurrentStroke, redrawCanvas, addText, drawAction, clearCanvas, undo, redo, saveDrawing, loadDrawing]);

  return (
    <DrawingContext.Provider value={contextValue}>
      {children}
    </DrawingContext.Provider>
  );
};

