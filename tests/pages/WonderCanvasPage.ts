import { type Page, type Locator, expect } from '@playwright/test';
import path from 'path';

const AI_CHAT_URL = '**/api/v1/ai/chat';

export const MOCK_AI_REPLY = '¡Qué interesante! ¿Por qué crees eso?';
export const ERROR_FALLBACK_TEXT = 'Ups, tuve un problema pensando. ¿Intentamos de nuevo?';

export class WonderCanvasPage {
  readonly page: Page;

  // Toolbar
  readonly penButton: Locator;
  readonly selectButton: Locator;
  readonly clearButton: Locator;
  readonly uploadButton: Locator;
  readonly fileInput: Locator;

  // Canvas
  readonly canvas: Locator;
  readonly analyzeButton: Locator;

  // Chat panel
  readonly chatInput: Locator;
  readonly sendButton: Locator;
  readonly messagesContainer: Locator;

  constructor(page: Page) {
    this.page = page;

    this.penButton = page.locator('button[title="Pincel"]');
    this.selectButton = page.locator('button[title="Mover objetos"]');
    this.clearButton = page.locator('button[title="Limpiar todo"]');
    this.uploadButton = page.locator('button[title="Cargar imagen"]');
    this.fileInput = page.locator('input[type="file"]');

    this.canvas = page.locator('canvas').first();
    this.analyzeButton = page.getByRole('button', { name: 'Mira esto' });

    this.chatInput = page.locator('textarea[placeholder="Pregunta algo o dibuja..."]');
    this.sendButton = page.locator('div:has(textarea) button:last-child');
    this.messagesContainer = page.locator('.no-scrollbar');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
    await expect(this.canvas).toBeVisible();
  }

  async mockAISuccess(reply = MOCK_AI_REPLY) {
    await this.page.route(AI_CHAT_URL, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reply }),
      });
    });
  }

  async mockAIError(status = 500) {
    await this.page.route(AI_CHAT_URL, async (route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });
  }

  async clearAIRoute() {
    await this.page.unroute(AI_CHAT_URL);
  }

  async mockSpeechRecognition() {
    await this.page.addInitScript(() => {
      class MockSpeechRecognition extends EventTarget {
        lang = 'es-ES';
        continuous = false;
        interimResults = false;
        onresult: ((e: Event) => void) | null = null;
        onerror: ((e: Event) => void) | null = null;
        onend: (() => void) | null = null;

        start() {
          // Simulate active listening — caller must stop() to trigger onend
        }

        stop() {
          if (this.onend) this.onend();
        }

        abort() {
          if (this.onend) this.onend();
        }
      }

      (window as unknown as Record<string, unknown>).SpeechRecognition = MockSpeechRecognition;
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition = MockSpeechRecognition;
    });
  }

  async sendChatMessage(text: string) {
    await this.chatInput.fill(text);
    await this.sendButton.click();
  }

  async sendChatMessageViaEnter(text: string) {
    await this.chatInput.fill(text);
    await this.chatInput.press('Enter');
  }

  async waitForProcessingDone() {
    await expect(
      this.page.locator('.animate-bounce').first(),
    ).not.toBeVisible({ timeout: 15_000 });
  }

  async getMessageTexts(): Promise<string[]> {
    const bubbles = this.page.locator('.max-w-\\[85\\%\\]');
    const texts: string[] = [];
    for (const bubble of await bubbles.all()) {
      texts.push((await bubble.innerText()).trim());
    }
    return texts;
  }

  async getLastMessageText(): Promise<string> {
    const bubbles = this.page.locator('.max-w-\\[85\\%\\]');
    const count = await bubbles.count();
    if (count === 0) return '';
    return (await bubbles.nth(count - 1).innerText()).trim();
  }

  async simulateDraw(fromX: number, fromY: number, toX: number, toY: number) {
    await this.canvas.hover({ position: { x: fromX, y: fromY } });
    await this.page.mouse.down();
    await this.page.mouse.move(toX, toY, { steps: 10 });
    await this.page.mouse.up();
  }

  async uploadImageFile(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }
}
