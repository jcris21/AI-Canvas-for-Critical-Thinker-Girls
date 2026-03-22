# TestReview.md — WonderCanvas AI

**Fecha:** 2026-03-22
**Rama:** LocalSupreme
**Resultado final:** 22/22 E2E tests passing · 0 flaky · 53s

---

## CRÍTICO

### C-01 · API key real expuesta en historial de git

| Campo | Detalle |
|-------|---------|
| **Archivo** | `backend/.env` |
| **Commit** | `428efae` — _"feat: scaffold Python modular monolith backend"_ |
| **Clave** | `GEMINI_API_KEY=AIzaSyCPFYRK6r6rPhtaQl0MAKEgpa-PJymcvOA` |
| **Estado** | Persiste en el historial aunque `.env` ya está en `.gitignore` |

**Impacto:** Cualquier persona con acceso al repositorio (o fork/clone pasado) puede usar la clave para generar texto e imágenes con cargo a la cuenta de Google Cloud del proyecto.

**Acción requerida — hacer ahora:**
```bash
# 1. Rotar la clave en Google Cloud Console (Credentials → Regenerate)
# 2. Dejar de rastrear el archivo
git rm --cached backend/.env
git commit -m "chore: untrack backend/.env from git"
# 3. Opcional: limpiar historial con git-filter-repo si el repo es público
```

---

## ALTO

### A-01 · Fixture de test inexistente

| Campo | Detalle |
|-------|---------|
| **Archivo de test** | `tests/e2e/canvas-drawing.spec.ts:5` |
| **Referencia rota** | `tests/fixtures/test-image.png` |
| **Síntoma** | Test _"upload valid image shows success message"_ fallaba siempre |
| **Fix aplicado** | Creado `tests/fixtures/test-image.png` (PNG 1×1 válido, 70 bytes) |

### A-02 · Locator del botón Enviar demasiado frágil

| Campo | Detalle |
|-------|---------|
| **Archivo** | `tests/pages/WonderCanvasPage.ts:41` |
| **Locator roto** | `page.locator('div:has(textarea) button:last-child')` |
| **Síntoma** | El mensaje se escribía en el input pero nunca se enviaba |
| **Causa** | El selector era ambiguo con la jerarquía de divs anidados |
| **Fix aplicado** | `button[title="Enviar"]` + atributo `title="Enviar"` en `frontend/App.tsx:382` |

### A-03 · `ERROR_FALLBACK_TEXT` no coincidía con el comportamiento real

| Campo | Detalle |
|-------|---------|
| **Archivo** | `tests/pages/WonderCanvasPage.ts:7` |
| **Constante esperada** | `'Ups, tuve un problema pensando. ¿Intentamos de nuevo?'` |
| **Texto real del sistema** | `'¡Oh no! Me desconcentré un poco. ¿Puedes repetirlo?'` |
| **Causa** | `geminiService.ts:31` maneja el status 500 internamente y devuelve un texto propio — el `catch` de `App.tsx` nunca se ejecuta para errores HTTP |
| **Fix aplicado** | Constante actualizada en `WonderCanvasPage.ts` para reflejar el comportamiento real |

---

## MEDIO

### M-01 · `waitForLoadState('networkidle')` causaba timeouts masivos

| Campo | Detalle |
|-------|---------|
| **Archivo** | `tests/pages/WonderCanvasPage.ts:47` |
| **Síntoma** | 11 tests fallaban con timeout de 30s en `beforeEach` |
| **Causa** | La app carga librerías vía `importmap` desde CDN (React, Gemini SDK, Fabric.js). En Playwright esas peticiones CDN mantenían la red "activa", por lo que `networkidle` nunca se resolvía dentro del límite de 30s |
| **Fix aplicado** | `waitForLoadState('domcontentloaded')` — estado que se alcanza en cuanto el HTML está parseado, independientemente de recursos externos |

### M-02 · Canvas locator apuntaba a la capa incorrecta de Fabric.js

| Campo | Detalle |
|-------|---------|
| **Archivo** | `tests/pages/WonderCanvasPage.ts:37` |
| **Locator roto** | `page.locator('canvas').first()` |
| **Síntoma** | Todos los tests de dibujo (`simulateDraw`) y de limpieza hacían timeout porque el hover era bloqueado |
| **Causa** | Fabric.js renderiza dos elementos `<canvas>` superpuestos: `lower-canvas` (`data-fabric="main"`) para datos y `upper-canvas` (`data-fabric="top"`) para interacción. `canvas.first()` seleccionaba el inferior, que está tapado por el superior |
| **Fix aplicado** | `page.locator('canvas[data-fabric="top"]')` — la capa que efectivamente recibe los eventos de puntero |

### M-03 · Selector de burbuja de usuario colisionaba con el botón Enviar

| Campo | Detalle |
|-------|---------|
| **Archivo** | `tests/e2e/wonderbot-chat.spec.ts:26, 50` |
| **Locator roto** | `wc.page.locator('.bg-pink-500.text-white').last()` |
| **Síntoma** | Assertions de mensaje enviado fallaban porque `.last()` resolvía al botón Enviar (último en el DOM con esas clases) |
| **Causa** | El botón Enviar comparte las clases `bg-pink-500 text-white` con las burbujas de usuario. Al quedar después de los mensajes en el DOM, `.last()` siempre lo devolvía a él |
| **Fix aplicado** | `wc.messagesContainer.locator('.rounded-tr-none').last()` — la clase `rounded-tr-none` es exclusiva de la burbuja de usuario |

---

## BAJO

### B-01 · Tests de autenticación incompletos (código eliminado sin reemplazo)

| Campo | Detalle |
|-------|---------|
| **Archivos eliminados** | `backend/app/core/dependencies.py`, `backend/app/db/database.py`, `backend/pyproject.toml` |
| **TODOs huérfanos** | `TODO: implement Clerk JWT verification for production` / `TODO: verify Clerk JWT` |
| **Impacto actual** | Bajo — la app funciona en modo `development` con bypass de auth |
| **Riesgo futuro** | Sin capa de auth documentada, la ruta hacia producción queda indefinida |
| **Recomendación** | Documentar la deuda en el backlog antes de agregar las rutas de `/api/v1/` a producción |

### B-02 · 4 tests eran flaky antes de los fixes (ahora estables)

| Test | Causa original | Estado |
|------|---------------|--------|
| upload invalid file type shows error message | `networkidle` timeout intermitente | Resuelto (M-01) |
| mic button toggles to MicOff | `networkidle` timeout intermitente | Resuelto (M-01) |
| mic button returns to Mic | `networkidle` timeout intermitente | Resuelto (M-01) |
| "Mira esto" button sends predefined message | `networkidle` timeout intermitente | Resuelto (M-01) |

---

## Resultado antes / después

| Métrica | Antes | Después |
|---------|-------|---------|
| Tests pasando | 7 / 22 (32%) | **22 / 22 (100%)** |
| Tests fallidos | 11 | 0 |
| Tests flaky | 4 | 0 |
| Retries consumidos | 15 | 0 |
| Duración total | 14.8 min | **53 s** |

---

## Archivos modificados por los fixes

| Archivo | Cambio |
|---------|--------|
| `tests/pages/WonderCanvasPage.ts` | `networkidle` → `domcontentloaded`; canvas locator a `data-fabric="top"`; sendButton a `[title="Enviar"]`; `ERROR_FALLBACK_TEXT` corregido |
| `tests/e2e/wonderbot-chat.spec.ts` | Locator de burbuja scoped a `.messagesContainer .rounded-tr-none` |
| `frontend/App.tsx` | `title="Enviar"` añadido al botón de envío |
| `tests/fixtures/test-image.png` | Fixture PNG creado (nuevo archivo) |

---

> **Bloqueante para merge:** C-01 debe resolverse antes de hacer push a una rama pública o crear un PR.
