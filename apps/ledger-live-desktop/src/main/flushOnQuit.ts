import { app, ipcMain, type BrowserWindow, type IpcMainEvent } from "electron";
import { CHANNELS } from "~/bridge/contract";

/** A renderer that does not answer in time must not block the quit. */
export const FLUSH_TIMEOUT_MS = 3000;

/**
 * Ask the renderer to write its debounced `setKey` calls, and wait for its answer.
 */
export function requestRendererFlush(
  window: BrowserWindow | null,
  timeoutMs = FLUSH_TIMEOUT_MS,
): Promise<void> {
  if (!window || window.isDestroyed() || window.webContents.isDestroyed()) {
    return Promise.resolve();
  }
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
 * The renderer writes go through main, so the renderer flushes first, then main writes to disk.
 */
export async function flushPendingWrites(
  flushRenderer: () => Promise<void>,
  flushMain: () => Promise<void>,
): Promise<void> {
  await flushRenderer().catch(error => console.error("renderer flush failed", error));
  await flushMain().catch(error => console.error("db flush failed", error));
}

/**
 * Hold the window close and the app quit until the pending writes are on disk.
 */
export function setupFlushOnQuit(window: BrowserWindow, flushMain: () => Promise<void>): void {
  let flush: Promise<void> | null = null;
  let flushed = false;
  let quitReady = false;
  const flushAll = () =>
    (flush ??= flushPendingWrites(() => requestRendererFlush(window), flushMain).then(() => {
      flushed = true;
    }));

  // The close button destroys the renderer before "window-all-closed" quits the app, and its
  // "beforeunload" reloads the main db: main must write its pending saves before that too.
  window.on("close", event => {
    if (flushed) return;
    event.preventDefault();
    void flushAll().then(() => {
      if (!window.isDestroyed()) window.close();
    });
  });

  app.on("before-quit", event => {
    if (quitReady) return;
    event.preventDefault();
    // After the window close, only main can still have pending saves.
    const done = flushed
      ? flushMain().catch(error => console.error("db flush failed", error))
      : flushAll();
    void done.then(() => {
      quitReady = true;
      app.quit();
    });
  });
}
