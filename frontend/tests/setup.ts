import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// jsdom does not implement scrollIntoView. App.tsx calls it on a ref to auto-
// scroll the chat. We provide a no-op stub so the call does not throw.
// ---------------------------------------------------------------------------
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// ---------------------------------------------------------------------------
// Silence console.error output during tests.
// Individual tests that care about errors spy on console.error locally.
// ---------------------------------------------------------------------------
vi.spyOn(console, 'error').mockImplementation(() => {});
