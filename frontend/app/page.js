'use client';

import { useRef } from 'react';
import { useDrawing } from './context/DrawingContext';
import Canvas from './components/Canvas';
import Navigation from './components/Navigation';

export default function Home() {
  const { activeTool, brushSize, color } = useDrawing();
  const canvasRef = useRef(null);

  // Pass the canvas ref to the DrawingContext if needed
  const drawingContext = useDrawing();
  drawingContext.canvasRef = canvasRef;

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden relative">
        <Canvas 
          ref={canvasRef}
          activeTool={activeTool}
          brushSize={brushSize}
          color={color}
          className="h-full w-full"
        />
      </div>
      <Navigation />
    </div>
  );
}
