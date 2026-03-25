import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Canvas, PencilBrush, FabricImage, Control, Point } from 'fabric';
import { ToolType } from '../../types';

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

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 10;
const IMAGE_SCALE_FACTOR = 0.7;
const DELETE_CONTROL_OFFSET = 8;

// Pre-render delete icon
const DELETE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="11" fill="#ef4444"/>
  <line x1="8" y1="8" x2="16" y2="16" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="16" y1="8" x2="8" y2="16" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;
const deleteImg = new Image();
deleteImg.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(DELETE_SVG)}`;

function renderDeleteIcon(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
) {
  const size = 24;
  ctx.save();
  ctx.translate(left, top);
  ctx.drawImage(deleteImg, -size / 2, -size / 2, size, size);
  ctx.restore();
}

const deleteControl = new Control({
  x: 0.5,
  y: -0.5,
  offsetX: DELETE_CONTROL_OFFSET,
  offsetY: -DELETE_CONTROL_OFFSET,
  cursorStyle: 'pointer',
  mouseUpHandler: (_e, transform) => {
    const target = transform.target;
    target.canvas?.remove(target);
    target.canvas?.requestRenderAll();
    return true;
  },
  render: renderDeleteIcon,
});

const CanvasBoard = forwardRef<CanvasHandle, CanvasBoardProps>(
  ({ activeTool, strokeColor, strokeWidth }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<Canvas | null>(null);

    // Initialize Fabric canvas once
    useEffect(() => {
      if (!canvasElRef.current || !containerRef.current) return;
      const container = containerRef.current;

      const fc = new Canvas(canvasElRef.current, {
        backgroundColor: '#ffffff',
        width: container.clientWidth,
        height: container.clientHeight,
      });

      fc.freeDrawingBrush = new PencilBrush(fc);

      // Zoom with mouse wheel
      fc.on('mouse:wheel', (opt) => {
        const delta = opt.e.deltaY;
        let zoom = fc.getZoom();
        zoom *= 0.999 ** delta;
        zoom = Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);
        fc.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
      });

      fabricRef.current = fc;

      const handleResize = () => {
        fc.setDimensions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
        fc.renderAll();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        fc.dispose();
        fabricRef.current = null;
      };
    }, []);

    // Sync tool mode
    useEffect(() => {
      const fc = fabricRef.current;
      if (!fc) return;

      if (activeTool === 'pen') {
        fc.isDrawingMode = true;
        fc.selection = false;
        const brush = fc.freeDrawingBrush as PencilBrush;
        brush.color = strokeColor;
        brush.width = strokeWidth;
      } else {
        // select mode — drag objects
        fc.isDrawingMode = false;
        fc.selection = true;
      }
    }, [activeTool, strokeColor, strokeWidth]);

    useImperativeHandle(ref, () => ({
      getCanvasImage: () => {
        const fc = fabricRef.current;
        if (!fc) return null;
        return fc.toDataURL({ format: 'png', multiplier: 1 }).split(',')[1];
      },
      clearCanvas: () => {
        const fc = fabricRef.current;
        if (!fc) return;
        fc.clear();
        fc.backgroundColor = '#ffffff';
        fc.renderAll();
      },
      injectImage: (imageData: string) => {
        const fc = fabricRef.current;
        if (!fc) return;

        const src = imageData.startsWith('data:')
          ? imageData
          : `data:image/png;base64,${imageData}`;

        FabricImage.fromURL(src).then((img) => {
          const scale = Math.min(
            (fc.getWidth() * IMAGE_SCALE_FACTOR) / (img.width ?? 1),
            (fc.getHeight() * IMAGE_SCALE_FACTOR) / (img.height ?? 1),
          );
          img.scale(scale);
          img.set({
            left: (fc.getWidth() - (img.width ?? 0) * scale) / 2,
            top: (fc.getHeight() - (img.height ?? 0) * scale) / 2,
            selectable: true,
            hasControls: true,
          });
          // Attach delete control
          img.controls = { ...img.controls, deleteControl };
          fc.add(img);
          fc.setActiveObject(img);
          fc.renderAll();
        }).catch((err) => {
          console.error('Failed to load image onto canvas:', err);
        });
      },
    }));

    return (
      <div ref={containerRef} className="w-full h-full bg-white touch-none">
        <canvas ref={canvasElRef} />
      </div>
    );
  },
);

CanvasBoard.displayName = 'CanvasBoard';
export default CanvasBoard;
