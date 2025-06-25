'use client';

import { useDrawing } from './context/DrawingContext';
import Canvas from './components/Canvas';

export default function Home() {
  const { activeTool, brushSize, color } = useDrawing();

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-hidden">
        <Canvas 
          activeTool={activeTool}
          brushSize={brushSize}
          color={color}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
