import { test, expect } from '@playwright/test';
import path from 'path';
import { WonderCanvasPage } from '../pages/WonderCanvasPage';

const FIXTURE_IMAGE = path.resolve(__dirname, '../fixtures/test-image.png');

test.describe('Canvas Drawing & Tools', () => {
  let wc: WonderCanvasPage;

  test.beforeEach(async ({ page }) => {
    wc = new WonderCanvasPage(page);
    await wc.mockAISuccess();
    await wc.goto();
  });

  test('canvas element is visible with non-zero dimensions', async () => {
    await expect(wc.canvas).toBeVisible();

    const box = await wc.canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(200);
    expect(box!.height).toBeGreaterThan(200);
  });

  test('pen tool is active by default', async () => {
    await expect(wc.penButton).toHaveClass(/bg-pink-500/);
    await expect(wc.selectButton).not.toHaveClass(/bg-pink-500/);
  });

  test('clicking Select tool activates it and deactivates pen', async () => {
    await wc.selectButton.click();

    await expect(wc.selectButton).toHaveClass(/bg-pink-500/);
    await expect(wc.penButton).not.toHaveClass(/bg-pink-500/);
  });

  test('clicking Pen tool re-activates it after switching to Select', async () => {
    await wc.selectButton.click();
    await wc.penButton.click();

    await expect(wc.penButton).toHaveClass(/bg-pink-500/);
    await expect(wc.selectButton).not.toHaveClass(/bg-pink-500/);
  });

  test('clicking a color swatch activates pen tool', async ({ page }) => {
    await wc.selectButton.click();
    await expect(wc.selectButton).toHaveClass(/bg-pink-500/);

    const colorSwatches = page.locator('button.rounded-full');
    await expect(colorSwatches.first()).toBeVisible();
    await colorSwatches.first().click();

    await expect(wc.penButton).toHaveClass(/bg-pink-500/);
  });

  test('drawing on canvas with mouse does not throw errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await wc.simulateDraw(150, 150, 300, 250);

    expect(errors).toHaveLength(0);
  });

  test('clear canvas button changes canvas state', async () => {
    await wc.simulateDraw(100, 100, 250, 250);
    const beforeClear = await wc.canvas.screenshot();

    await wc.clearButton.click();
    const afterClear = await wc.canvas.screenshot();

    expect(Buffer.compare(beforeClear, afterClear)).not.toBe(0);
  });

  test('upload valid image shows success message', async ({ page }) => {
    await wc.uploadImageFile(FIXTURE_IMAGE);

    await expect(
      page.locator('text=He cargado tu imagen en el lienzo'),
    ).toBeVisible({ timeout: 5000 });
  });

  test('upload invalid file type shows error message', async ({ page }) => {
    await wc.fileInput.setInputFiles({
      name: 'not-an-image.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello'),
    });

    await expect(
      page.locator('text=Formato no compatible'),
    ).toBeVisible({ timeout: 3000 });
  });

  test('upload file over 5MB shows size error', async ({ page }) => {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 0);

    await wc.fileInput.setInputFiles({
      name: 'big-image.png',
      mimeType: 'image/png',
      buffer: largeBuffer,
    });

    await expect(
      page.locator('text=La imagen es demasiado grande'),
    ).toBeVisible({ timeout: 3000 });
  });

  test('mic button toggles to MicOff when listening starts', async ({ page }) => {
    await wc.mockSpeechRecognition();
    await wc.goto();

    await expect(page.locator('button[title="Hablar"]')).toBeVisible();
    await page.locator('button[title="Hablar"]').click();

    await expect(page.locator('button[title="Detener"]')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('button[title="Hablar"]')).not.toBeVisible();
  });

  test('mic button returns to Mic after stopping', async ({ page }) => {
    await wc.mockSpeechRecognition();
    await wc.goto();

    await page.locator('button[title="Hablar"]').click();
    await expect(page.locator('button[title="Detener"]')).toBeVisible({ timeout: 2000 });

    await page.locator('button[title="Detener"]').click();
    await expect(page.locator('button[title="Hablar"]')).toBeVisible({ timeout: 2000 });
  });
});
