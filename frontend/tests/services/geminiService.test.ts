import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { chatWithGemini, type HistoryMessage } from '../../services/geminiService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOkResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function makeErrorResponse(status: number): Response {
  return {
    ok: false,
    status,
    json: vi.fn().mockResolvedValue({}),
  } as unknown as Response;
}

const SAMPLE_HISTORY: HistoryMessage[] = [
  { role: 'user', text: 'Hola' },
  { role: 'model', text: '¡Hola! ¿Cómo puedo ayudarte?' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('chatWithGemini', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  it('returns { text } on a successful 200 response with reply field', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse({ reply: '¿Qué ves en el dibujo?' }));

    const result = await chatWithGemini(SAMPLE_HISTORY, 'Analiza esto');

    expect(result).toEqual({ text: '¿Qué ves en el dibujo?' });
  });

  it('sends correct JSON body including message and history', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse({ reply: 'ok' }));

    await chatWithGemini(SAMPLE_HISTORY, 'test message');

    expect(fetch).toHaveBeenCalledOnce();
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);

    expect(body.message).toBe('test message');
    expect(body.history).toEqual(SAMPLE_HISTORY);
    expect(body.session_id).toBe('local');
  });

  it('sends canvas_image_base64 when imageBase64 is provided', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse({ reply: 'imagen recibida' }));

    await chatWithGemini(SAMPLE_HISTORY, 'describe esto', 'abc123base64');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);

    expect(body.canvas_image_base64).toBe('abc123base64');
  });

  it('sends canvas_image_base64 as null when imageBase64 is omitted', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse({ reply: 'ok' }));

    await chatWithGemini(SAMPLE_HISTORY, 'sin imagen');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);

    expect(body.canvas_image_base64).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Uses the VITE_API_URL env variable for the base URL
  // -------------------------------------------------------------------------

  it('constructs the URL from VITE_API_URL env variable', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse({ reply: 'ok' }));

    await chatWithGemini([], 'msg');

    const [url] = vi.mocked(fetch).mock.calls[0];
    // The vitest.config.ts stubs VITE_API_URL as 'http://localhost:8000/api/v1'
    expect(url).toContain('/ai/chat');
    expect(url).toMatch(/^http/);
  });

  // -------------------------------------------------------------------------
  // Non-ok HTTP status – service returns a friendly fallback (does NOT throw)
  // -------------------------------------------------------------------------

  it('returns a Spanish fallback message on a non-ok HTTP status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeErrorResponse(500));

    const result = await chatWithGemini([], 'test');

    // The service returns a friendly fallback string, never throws on non-ok
    expect(result.text).toContain('¡Oh no!');
  });

  it('returns a fallback message on a 404 status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeErrorResponse(404));

    const result = await chatWithGemini([], 'test');

    expect(result.text).toBeTruthy();
    expect(typeof result.text).toBe('string');
  });

  // -------------------------------------------------------------------------
  // Missing `reply` field – service throws
  // -------------------------------------------------------------------------

  it('throws when response is 200 but reply field is absent', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse({ unexpected: 'field' }));

    await expect(chatWithGemini([], 'test')).rejects.toThrow(
      'Invalid response: missing reply field',
    );
  });

  it('throws when response is 200 but reply is null', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse({ reply: null }));

    await expect(chatWithGemini([], 'test')).rejects.toThrow(
      'Invalid response: missing reply field',
    );
  });

  it('throws when response body is an empty object', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse({}));

    await expect(chatWithGemini([], 'test')).rejects.toThrow();
  });

  // -------------------------------------------------------------------------
  // Network error (TypeError) – service wraps with descriptive message
  // -------------------------------------------------------------------------

  it('wraps TypeError as a Network error with descriptive message', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(chatWithGemini([], 'test')).rejects.toThrow(
      /Network error: unable to reach the server/,
    );
  });

  it('re-throws non-TypeError errors unchanged', async () => {
    const originalError = new Error('Some other error');
    vi.mocked(fetch).mockRejectedValueOnce(originalError);

    await expect(chatWithGemini([], 'test')).rejects.toThrow('Some other error');
  });

  // -------------------------------------------------------------------------
  // Timeout – AbortError is thrown when fetch takes longer than 15 s
  // -------------------------------------------------------------------------

  it('aborts and throws when fetch takes longer than 15 seconds', async () => {
    vi.useFakeTimers();

    // fetch never resolves until we manually advance the timer
    vi.mocked(fetch).mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          // When the AbortController fires it will reject the signal
          (init as RequestInit).signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        }),
    );

    const promise = chatWithGemini([], 'timeout test');

    // Advance 15 seconds + a little margin to trigger the setTimeout
    vi.advanceTimersByTime(15001);

    await expect(promise).rejects.toThrow();

    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  it('handles empty history array', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse({ reply: 'Primera vez' }));

    const result = await chatWithGemini([], 'primera pregunta');

    expect(result.text).toBe('Primera vez');
  });

  it('handles very long messages without error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse({ reply: 'ok' }));

    const longMessage = 'a'.repeat(10000);
    const result = await chatWithGemini([], longMessage);

    expect(result.text).toBe('ok');
  });

  it('handles special characters and Unicode in messages', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse({ reply: 'ok' }));

    const unicodeMessage = '¿Qué es esto? 🎨 "test" <script>alert(1)</script> & \'quote\'';
    await chatWithGemini([], unicodeMessage);

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);

    expect(body.message).toBe(unicodeMessage);
  });

  it('uses POST method', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse({ reply: 'ok' }));

    await chatWithGemini([], 'test');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init as RequestInit).method).toBe('POST');
  });

  it('sets Content-Type header to application/json', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse({ reply: 'ok' }));

    await chatWithGemini([], 'test');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
  });
});
