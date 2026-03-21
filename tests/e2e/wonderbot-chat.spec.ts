import { test, expect } from '@playwright/test';
import { WonderCanvasPage, MOCK_AI_REPLY, ERROR_FALLBACK_TEXT } from '../pages/WonderCanvasPage';

test.describe('WonderBot Chat', () => {
  let wc: WonderCanvasPage;

  test.beforeEach(async ({ page }) => {
    wc = new WonderCanvasPage(page);
    await wc.mockAISuccess();
    await wc.goto();
  });

  test('loads with WonderBot greeting in Spanish', async () => {
    const texts = await wc.getMessageTexts();
    expect(texts.length).toBeGreaterThanOrEqual(1);
    expect(texts[0]).toContain('WonderBot');
    expect(texts[0]).toContain('Dibuja algo en el lienzo');
  });

  test('user message appears as bubble after sending', async () => {
    const userMessage = '¿Qué es la fotosíntesis?';
    await wc.chatInput.fill(userMessage);
    await wc.sendButton.click();

    await expect(
      wc.page.locator('.bg-pink-500.text-white').last(),
    ).toContainText(userMessage);
  });

  test('AI response appears after mock resolves', async () => {
    await wc.sendChatMessage('Hola WonderBot');
    await wc.waitForProcessingDone();

    const lastText = await wc.getLastMessageText();
    expect(lastText).toBe(MOCK_AI_REPLY);
  });

  test('input field is cleared after sending', async () => {
    await wc.chatInput.fill('Texto de prueba');
    await wc.sendButton.click();

    await expect(wc.chatInput).toHaveValue('');
  });

  test('Enter key sends the message', async () => {
    const msg = 'Mensaje con Enter';
    await wc.sendChatMessageViaEnter(msg);

    await expect(
      wc.page.locator('.bg-pink-500.text-white').last(),
    ).toContainText(msg);
  });

  test('Shift+Enter does NOT send the message', async ({ page }) => {
    const initialCount = await page.locator('.max-w-\\[85\\%\\]').count();

    await wc.chatInput.fill('Primera línea');
    await wc.chatInput.press('Shift+Enter');
    await wc.chatInput.type('Segunda línea');

    const newCount = await page.locator('.max-w-\\[85\\%\\]').count();
    expect(newCount).toBe(initialCount);
    await expect(wc.chatInput).not.toHaveValue('');
  });

  test('AI error fallback message shown on server error', async () => {
    await wc.clearAIRoute();
    await wc.mockAIError(500);

    await wc.sendChatMessage('Pregunta que falla');
    await wc.waitForProcessingDone();

    const lastText = await wc.getLastMessageText();
    expect(lastText).toBe(ERROR_FALLBACK_TEXT);
  });

  test('"Mira esto" button sends a predefined analyze message', async ({ page }) => {
    let capturedBody: Record<string, unknown> = {};

    await page.route('**/api/v1/ai/chat', async (route) => {
      capturedBody = JSON.parse(route.request().postData() ?? '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reply: MOCK_AI_REPLY }),
      });
    });

    await wc.analyzeButton.click();
    await wc.waitForProcessingDone();

    expect(capturedBody.message).toBe('¿Qué ves en mi dibujo? ¿Qué te hace pensar?');
  });

  test('canvas snapshot (base64) is sent with the chat message', async ({ page }) => {
    let requestBody: Record<string, unknown> = {};

    await page.route('**/api/v1/ai/chat', async (route) => {
      requestBody = JSON.parse(route.request().postData() ?? '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reply: MOCK_AI_REPLY }),
      });
    });

    await wc.simulateDraw(100, 100, 200, 200);
    await wc.sendChatMessage('¿Qué dibujé?');
    await wc.waitForProcessingDone();

    expect(typeof requestBody.canvas_image_base64).toBe('string');
    expect((requestBody.canvas_image_base64 as string).length).toBeGreaterThan(100);
  });

  test('processing spinner appears while waiting for AI', async ({ page }) => {
    await wc.clearAIRoute();
    await page.route('**/api/v1/ai/chat', async (route) => {
      await new Promise<void>(resolve => setTimeout(resolve, 600));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reply: MOCK_AI_REPLY }),
      });
    });

    await wc.chatInput.fill('Mensaje lento');
    await wc.sendButton.click();

    await expect(wc.page.locator('.animate-bounce').first()).toBeVisible();
    await wc.waitForProcessingDone();

    const lastText = await wc.getLastMessageText();
    expect(lastText).toBe(MOCK_AI_REPLY);
  });
});
