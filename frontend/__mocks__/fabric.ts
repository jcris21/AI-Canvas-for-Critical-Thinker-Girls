/**
 * Manual mock for the `fabric` library.
 * Placed in __mocks__/fabric.ts so Vitest can resolve it automatically
 * when tests call vi.mock('fabric').
 *
 * All Fabric canvas API dependencies on real browser canvas elements are
 * replaced with lightweight vi.fn() stubs.
 */
import { vi } from 'vitest';

export const Canvas = vi.fn().mockImplementation(() => ({
  freeDrawingBrush: { color: '#000000', width: 5 },
  isDrawingMode: false,
  selection: true,
  backgroundColor: '#ffffff',
  on: vi.fn(),
  dispose: vi.fn(),
  setDimensions: vi.fn(),
  renderAll: vi.fn(),
  requestRenderAll: vi.fn(),
  clear: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
  setActiveObject: vi.fn(),
  getZoom: vi.fn(() => 1),
  zoomToPoint: vi.fn(),
  getWidth: vi.fn(() => 800),
  getHeight: vi.fn(() => 600),
  toDataURL: vi.fn(() => 'data:image/png;base64,fakeBase64Data'),
}));

export const PencilBrush = vi.fn().mockImplementation(() => ({
  color: '#000000',
  width: 5,
}));

export const FabricImage = {
  fromURL: vi.fn().mockResolvedValue({
    width: 400,
    height: 300,
    scale: vi.fn(),
    set: vi.fn(),
    controls: {},
  }),
};

export const Control = vi.fn().mockImplementation((opts: unknown) => opts);

export const Point = vi.fn().mockImplementation((x: number, y: number) => ({ x, y }));
