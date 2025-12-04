import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { ToolType, Point } from '../types';

interface CanvasBoardProps {
  activeTool: ToolType;
  strokeColor: string;
  strokeWidth: number;
}

export interface CanvasHandle {
  getCanvasImage: () => string | null;
  clearCanvas: () => void;
  injectImage: (imageData: string) => void;
}

const CanvasBoard = forwardRef<CanvasHandle, CanvasBoardProps>(({ activeTool, strokeColor, strokeWidth }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<Point | null>(null);

  useImperativeHandle(ref, () => ({
    getCanvasImage: () => {
      if (!canvasRef.current) return null;
      // Return base64 string without the data:image/png;base64, prefix for API
      return canvasRef.current.toDataURL('image/png').split(',')[1];
    },
    clearCanvas: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    },
    injectImage: (imageData: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        // Center the image or place it nicely
        // For PoC, we define a fixed size or proportional
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.8;
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        
        ctx.shadowColor = "rgba(0,0,0,0.2)";
        ctx.shadowBlur = 20;
        ctx.drawImage(img, x, y, w, h);
        ctx.shadowBlur = 0; // Reset
      };
      // Handle both raw base64 (from AI) and Data URLs (from file upload)
      img.src = imageData.startsWith('data:') 
        ? imageData 
        : `data:image/png;base64,${imageData}`;
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Initialize canvas size
      const resizeCanvas = () => {
        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
          
          // Fill white background initially
          const ctx = canvas.getContext('2d');
          if(ctx) {
             ctx.fillStyle = '#ffffff';
             ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }
      };
      window.addEventListener('resize', resizeCanvas);
      resizeCanvas();
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, []);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent): Point | null => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = (event as React.MouseEvent).clientX;
      clientY = (event as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling on touch
    const pos = getCoordinates(e);
    if (pos) {
      setIsDrawing(true);
      lastPos.current = pos;
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPos.current || !canvasRef.current) return;
    e.preventDefault();
    
    const pos = getCoordinates(e);
    if (!pos) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    
    ctx.strokeStyle = activeTool === 'eraser' ? '#ffffff' : strokeColor;
    ctx.lineWidth = activeTool === 'eraser' ? strokeWidth * 2 : strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.stroke();

    lastPos.current = pos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  return (
    <div className="w-full h-full relative bg-white shadow-inner rounded-xl overflow-hidden touch-none cursor-crosshair">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="block w-full h-full"
      />
    </div>
  );
});

CanvasBoard.displayName = "CanvasBoard";
export default CanvasBoard;