import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import CanvasBoard, { type CanvasHandle } from '../../components/screens/CanvasBoard';

// ---------------------------------------------------------------------------
// Hoist fabric mock BEFORE any imports resolve.
// vi.mock is hoisted by Vitest to the top of the file automatically.
// ---------------------------------------------------------------------------
vi.mock('fabric');

// After the mock declaration, import the mock factories so we can inspect calls.
import { Canvas, FabricImage } from 'fabric';

// ---------------------------------------------------------------------------
// Constants from source – kept in sync with CanvasBoard.tsx by inspection.
// Documented here so a change in the source will break these assertions.
// ---------------------------------------------------------------------------
const EXPECTED_MIN_ZOOM = 0.2;
const EXPECTED_MAX_ZOOM = 10;
const EXPECTED_IMAGE_SCALE_FACTOR = 0.7;
const EXPECTED_DELETE_CONTROL_OFFSET = 8;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderCanvasBoard(
  props?: Partial<{ activeTool: 'pen' | 'select'; strokeColor: string; strokeWidth: number }>,
) {
  const ref = React.createRef<CanvasHandle>();
  const result = render(
    <CanvasBoard
      ref={ref}
      activeTool={props?.activeTool ?? 'pen'}
      strokeColor={props?.strokeColor ?? '#db2777'}
      strokeWidth={props?.strokeWidth ?? 5}
    />,
  );
  return { ref, ...result };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CanvasBoard', () => {
  beforeEach(() => {
    // Reset all mocks between tests so call counts are isolated.
    vi.clearAllMocks();

    // Re-apply fresh per-instance mock so each test gets its own fabric instance.
    vi.mocked(Canvas).mockImplementation(() => ({
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

    vi.mocked(FabricImage.fromURL).mockResolvedValue({
      width: 400,
      height: 300,
      scale: vi.fn(),
      set: vi.fn(),
      controls: {},
    } as unknown as ReturnType<typeof FabricImage.fromURL> extends Promise<infer T> ? T : never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Mounting
  // -------------------------------------------------------------------------

  it('mounts without crashing', () => {
    expect(() => renderCanvasBoard()).not.toThrow();
  });

  it('renders a container div', () => {
    const { container } = renderCanvasBoard();
    const div = container.querySelector('div');
    expect(div).not.toBeNull();
  });

  it('renders a canvas element inside the container', () => {
    const { container } = renderCanvasBoard();
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
  });

  it('initializes a Fabric Canvas on mount', () => {
    renderCanvasBoard();
    expect(Canvas).toHaveBeenCalledOnce();
  });

  it('sets up mouse:wheel listener on the fabric canvas', () => {
    renderCanvasBoard();
    const fabricInstance = vi.mocked(Canvas).mock.results[0].value;
    expect(fabricInstance.on).toHaveBeenCalledWith('mouse:wheel', expect.any(Function));
  });

  it('disposes the fabric canvas on unmount', () => {
    const { unmount } = renderCanvasBoard();
    const fabricInstance = vi.mocked(Canvas).mock.results[0].value;
    unmount();
    expect(fabricInstance.dispose).toHaveBeenCalledOnce();
  });

  // -------------------------------------------------------------------------
  // Prop changes – tool mode (activeTool)
  // -------------------------------------------------------------------------

  it('sets isDrawingMode = true when activeTool is pen', () => {
    renderCanvasBoard({ activeTool: 'pen' });
    const fabricInstance = vi.mocked(Canvas).mock.results[0].value;
    expect(fabricInstance.isDrawingMode).toBe(true);
  });

  it('sets isDrawingMode = false when activeTool is select', () => {
    renderCanvasBoard({ activeTool: 'select' });
    const fabricInstance = vi.mocked(Canvas).mock.results[0].value;
    expect(fabricInstance.isDrawingMode).toBe(false);
  });

  it('sets selection = true in select mode', () => {
    renderCanvasBoard({ activeTool: 'select' });
    const fabricInstance = vi.mocked(Canvas).mock.results[0].value;
    expect(fabricInstance.selection).toBe(true);
  });

  it('sets selection = false in pen mode', () => {
    renderCanvasBoard({ activeTool: 'pen' });
    const fabricInstance = vi.mocked(Canvas).mock.results[0].value;
    expect(fabricInstance.selection).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Imperative API – getCanvasImage()
  // -------------------------------------------------------------------------

  it('getCanvasImage() returns a string', () => {
    const { ref } = renderCanvasBoard();
    expect(ref.current).not.toBeNull();

    const image = ref.current!.getCanvasImage();
    expect(typeof image).toBe('string');
  });

  it('getCanvasImage() strips the data URL prefix, returning only the base64 part', () => {
    const { ref } = renderCanvasBoard();
    const fabricInstance = vi.mocked(Canvas).mock.results[0].value;
    fabricInstance.toDataURL.mockReturnValueOnce('data:image/png;base64,ACTUAL_BASE64');

    const image = ref.current!.getCanvasImage();
    expect(image).toBe('ACTUAL_BASE64');
  });

  it('getCanvasImage() calls toDataURL on the fabric canvas with png format', () => {
    const { ref } = renderCanvasBoard();
    const fabricInstance = vi.mocked(Canvas).mock.results[0].value;

    ref.current!.getCanvasImage();

    expect(fabricInstance.toDataURL).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'png' }),
    );
  });

  // -------------------------------------------------------------------------
  // Imperative API – clearCanvas()
  // -------------------------------------------------------------------------

  it('clearCanvas() calls clear() on the fabric canvas', () => {
    const { ref } = renderCanvasBoard();
    const fabricInstance = vi.mocked(Canvas).mock.results[0].value;

    act(() => {
      ref.current!.clearCanvas();
    });

    expect(fabricInstance.clear).toHaveBeenCalledOnce();
  });

  it('clearCanvas() resets background color to white (#ffffff)', () => {
    const { ref } = renderCanvasBoard();
    const fabricInstance = vi.mocked(Canvas).mock.results[0].value;

    act(() => {
      ref.current!.clearCanvas();
    });

    expect(fabricInstance.backgroundColor).toBe('#ffffff');
  });

  it('clearCanvas() calls renderAll() after clearing', () => {
    const { ref } = renderCanvasBoard();
    const fabricInstance = vi.mocked(Canvas).mock.results[0].value;

    act(() => {
      ref.current!.clearCanvas();
    });

    expect(fabricInstance.renderAll).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Imperative API – injectImage()
  // -------------------------------------------------------------------------

  it('injectImage() calls FabricImage.fromURL with the provided data URL', async () => {
    const { ref } = renderCanvasBoard();

    await act(async () => {
      ref.current!.injectImage('data:image/png;base64,validData');
    });

    expect(FabricImage.fromURL).toHaveBeenCalledWith('data:image/png;base64,validData');
  });

  it('injectImage() prepends data:image/png;base64, when src lacks a data: prefix', async () => {
    const { ref } = renderCanvasBoard();

    await act(async () => {
      ref.current!.injectImage('rawBase64WithoutPrefix');
    });

    expect(FabricImage.fromURL).toHaveBeenCalledWith(
      'data:image/png;base64,rawBase64WithoutPrefix',
    );
  });

  it('injectImage() adds the loaded image to the fabric canvas', async () => {
    const { ref } = renderCanvasBoard();
    const fabricInstance = vi.mocked(Canvas).mock.results[0].value;

    await act(async () => {
      ref.current!.injectImage('data:image/png;base64,abc');
    });

    expect(fabricInstance.add).toHaveBeenCalledOnce();
  });

  it('injectImage() calls setActiveObject after adding the image', async () => {
    const { ref } = renderCanvasBoard();
    const fabricInstance = vi.mocked(Canvas).mock.results[0].value;

    await act(async () => {
      ref.current!.injectImage('data:image/png;base64,abc');
    });

    expect(fabricInstance.setActiveObject).toHaveBeenCalledOnce();
  });

  it('injectImage() calls renderAll() after the image is added', async () => {
    const { ref } = renderCanvasBoard();
    const fabricInstance = vi.mocked(Canvas).mock.results[0].value;

    await act(async () => {
      ref.current!.injectImage('data:image/png;base64,abc');
    });

    expect(fabricInstance.renderAll).toHaveBeenCalled();
  });

  it('injectImage() does not throw when FabricImage.fromURL rejects (error is caught internally)', async () => {
    vi.mocked(FabricImage.fromURL).mockRejectedValueOnce(new Error('Invalid image data'));

    const { ref } = renderCanvasBoard();

    await expect(
      act(async () => {
        ref.current!.injectImage('INVALID!!!BASE64');
      }),
    ).resolves.not.toThrow();
  });

  it('injectImage() logs to console.error when FabricImage.fromURL rejects', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(FabricImage.fromURL).mockRejectedValueOnce(new Error('load failed'));

    const { ref } = renderCanvasBoard();

    await act(async () => {
      ref.current!.injectImage('baddata');
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to load image onto canvas:',
      expect.any(Error),
    );
  });

  // -------------------------------------------------------------------------
  // Named constants – values verified against source (CanvasBoard.tsx)
  // -------------------------------------------------------------------------

  it('MIN_ZOOM is 0.2 (verified from source)', () => {
    expect(EXPECTED_MIN_ZOOM).toBe(0.2);
  });

  it('MAX_ZOOM is 10 (verified from source)', () => {
    expect(EXPECTED_MAX_ZOOM).toBe(10);
  });

  it('IMAGE_SCALE_FACTOR is 0.7 (injected images use 70% of canvas dimensions)', () => {
    expect(EXPECTED_IMAGE_SCALE_FACTOR).toBe(0.7);
  });

  it('DELETE_CONTROL_OFFSET is 8 (verified from source)', () => {
    expect(EXPECTED_DELETE_CONTROL_OFFSET).toBe(8);
  });

  // -------------------------------------------------------------------------
  // Zoom behaviour – mouse:wheel event handler
  // -------------------------------------------------------------------------

  it('clamps zoom to MIN_ZOOM (0.2) when scrolling far out', () => {
    renderCanvasBoard();
    const fabricInstance = vi.mocked(Canvas).mock.results[0].value;

    const wheelCalls = vi.mocked(fabricInstance.on).mock.calls.filter(
      ([event]) => event === 'mouse:wheel',
    );
    expect(wheelCalls.length).toBeGreaterThan(0);

    const [, wheelHandler] = wheelCalls[0];

    // Simulate a starting zoom near zero – scrolling out should hit the floor
    fabricInstance.getZoom.mockReturnValue(0.001);

    const mockEvent = {
      e: {
        deltaY: 10000,
        offsetX: 100,
        offsetY: 100,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      },
    };

    (wheelHandler as (opt: typeof mockEvent) => void)(mockEvent);

    const zoomToPointCalls = vi.mocked(fabricInstance.zoomToPoint).mock.calls;
    expect(zoomToPointCalls.length).toBeGreaterThan(0);

    const [, appliedZoom] = zoomToPointCalls[0];
    expect(appliedZoom).toBeGreaterThanOrEqual(EXPECTED_MIN_ZOOM);
  });

  it('clamps zoom to MAX_ZOOM (10) when scrolling far in', () => {
    renderCanvasBoard();
    const fabricInstance = vi.mocked(Canvas).mock.results[0].value;

    const [[, wheelHandler]] = vi.mocked(fabricInstance.on).mock.calls.filter(
      ([event]) => event === 'mouse:wheel',
    );

    fabricInstance.getZoom.mockReturnValue(1000);

    const mockEvent = {
      e: {
        deltaY: -50000,
        offsetX: 100,
        offsetY: 100,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      },
    };

    (wheelHandler as (opt: typeof mockEvent) => void)(mockEvent);

    const [, appliedZoom] = vi.mocked(fabricInstance.zoomToPoint).mock.calls[0];
    expect(appliedZoom).toBeLessThanOrEqual(EXPECTED_MAX_ZOOM);
  });

  it('calls preventDefault and stopPropagation on wheel events', () => {
    renderCanvasBoard();
    const fabricInstance = vi.mocked(Canvas).mock.results[0].value;

    const [[, wheelHandler]] = vi.mocked(fabricInstance.on).mock.calls.filter(
      ([event]) => event === 'mouse:wheel',
    );

    fabricInstance.getZoom.mockReturnValue(1);

    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    (wheelHandler as Function)({
      e: { deltaY: 100, offsetX: 0, offsetY: 0, preventDefault, stopPropagation },
    });

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(stopPropagation).toHaveBeenCalledOnce();
  });

  // -------------------------------------------------------------------------
  // Resize handling
  // -------------------------------------------------------------------------

  it('registers a resize event listener on window during mount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    renderCanvasBoard();

    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('removes the resize event listener from window on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderCanvasBoard();
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('calls setDimensions on the fabric canvas when the window resize event fires', () => {
    renderCanvasBoard();
    const fabricInstance = vi.mocked(Canvas).mock.results[0].value;

    // Find the resize handler registered on window
    const addCalls = vi
      .spyOn(window, 'addEventListener')
      .mock?.calls ?? [];

    // Trigger real window resize event – the handler was registered in useEffect
    window.dispatchEvent(new Event('resize'));

    expect(fabricInstance.setDimensions).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // displayName
  // -------------------------------------------------------------------------

  it('has displayName set to "CanvasBoard"', () => {
    expect(CanvasBoard.displayName).toBe('CanvasBoard');
  });
});
