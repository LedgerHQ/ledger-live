import { app, ipcMain, type BrowserWindow, type IpcMainEvent } from "electron";
import { CHANNELS } from "~/bridge/contract";

export const RENDERER_FLUSH_TIMEOUT_MS = 3000;

/**
 * Ask the renderer to send its debounced `setKey` calls to main, and wait for its answer.
 * A renderer that does not answer in time does not block the quit.
 */
export function requestRendererFlush(
  window: BrowserWindow,
  timeoutMs = RENDERER_FLUSH_TIMEOUT_MS,
): Promise<void> {
  if (window.isDestroyed() || window.webContents.isDestroyed()) return Promise.resolve();
  const { webContents } = window;
  return new Promise(resolve => {
    const done = () => {
      clearTimeout(timeout);
      ipcMain.removeListener(CHANNELS.flushWritesDone, onDone);
      resolve();
    };
    const onDone = (event: IpcMainEvent) => {
      if (event.sender === webContents) done();
    };
    const timeout = setTimeout(done, timeoutMs);
    ipcMain.on(CHANNELS.flushWritesDone, onDone);
    webContents.send(CHANNELS.flushWrites);
  });
}

/**
 * The renderer writes go through main, so the renderer flushes first.
 */
export async function flushPendingWrites(
  flushRenderer: () => Promise<void>,
  flushMain: () => Promise<void>,
): Promise<void> {
  await flushRenderer().catch(error => console.warn("Renderer flush failed", error));
  await flushMain().catch(error => console.error("Database flush failed", error));
}

let flushForQuit: () => Promise<void> = () => Promise.resolve();

/**
 * Write the pending writes now, and let the next quit through without a new flush.
 * For a quit that does not go through `before-quit` first, such as an update install.
 */
export function flushBeforeQuit(): Promise<void> {
  return flushForQuit();
}

/**
 * Hold the main window close and the app quit until the pending writes are on disk.
 */
export function setupFlushOnQuit(window: BrowserWindow, flushMain: () => Promise<void>): void {
  const flushAll = () => flushPendingWrites(() => requestRendererFlush(window), flushMain);

  let quitFlush: Promise<void> | null = null;
  let quitFlushed = false;
  flushForQuit = () =>
    (quitFlush ??= flushAll().then(() => {
      quitFlushed = true;
    }));

  // The renderer "beforeunload" reloads the db, which clears main memory: flush before the close.
  let closeFlush: Promise<void> | null = null;
  let closeFlushed = false;
  window.on("close", event => {
    if (closeFlushed || quitFlushed) return;
    event.preventDefault();
    closeFlush ??= flushAll().then(() => {
      closeFlushed = true;
      if (!window.isDestroyed()) window.close();
    });
  });

  app.on("before-quit", event => {
    if (quitFlushed) return;
    event.preventDefault();
    void flushForQuit().then(() => app.quit());
  });
}
