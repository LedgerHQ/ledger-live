import { app, ipcMain, type BrowserWindow, type IpcMainEvent } from "electron";
import { CHANNELS } from "~/bridge/contract";

export const RENDERER_FLUSH_TIMEOUT_MS = 3000;
/** A disk that does not answer must not hold the quit. */
export const MAIN_FLUSH_TIMEOUT_MS = 10000;

let lastRequestId = 0;

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
  // A late answer to a request that timed out must not end this wait.
  const requestId = ++lastRequestId;
  return new Promise(resolve => {
    const done = () => {
      clearTimeout(timeout);
      ipcMain.removeListener(CHANNELS.flushWritesDone, onDone);
      resolve();
    };
    const onDone = (event: IpcMainEvent, answeredId: unknown) => {
      if (event.sender === webContents && answeredId === requestId) done();
    };
    const timeout = setTimeout(done, timeoutMs);
    ipcMain.on(CHANNELS.flushWritesDone, onDone);
    webContents.send(CHANNELS.flushWrites, requestId);
  });
}

/**
 * The renderer writes go through main, so the renderer flushes first.
 * The file writes are atomic: a quit after the main timeout keeps the previous file.
 */
export async function flushPendingWrites(
  flushRenderer: () => Promise<void>,
  flushMain: () => Promise<void>,
  mainTimeoutMs = MAIN_FLUSH_TIMEOUT_MS,
): Promise<void> {
  await flushRenderer().catch(error => console.warn("Renderer flush failed", error));
  await withTimeout(flushMain(), mainTimeoutMs).catch(error =>
    console.error("Database flush failed", error),
  );
}

function withTimeout(promise: Promise<void>, timeoutMs: number): Promise<void> {
  let timeout: NodeJS.Timeout | undefined;
  const timedOut = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timedOut]).finally(() => clearTimeout(timeout));
}

let flushWrites: () => Promise<void> = () => Promise.resolve();
let releasing = false;

/**
 * Write the pending writes, then run `action`. The close and quit that `action` starts go through,
 * also when it starts them in a `setImmediate`, as electron-updater `quitAndInstall` does.
 */
export async function flushThen(action: () => void): Promise<void> {
  await flushWrites();
  releasing = true;
  try {
    action();
  } finally {
    setImmediate(() => {
      releasing = false;
    });
  }
}

/**
 * Hold the main window close and the app quit until the pending writes are on disk.
 */
export function setupFlushOnQuit(window: BrowserWindow, flushMain: () => Promise<void>): void {
  let lastFlush = Promise.resolve();
  flushWrites = () =>
    (lastFlush = lastFlush.then(() =>
      flushPendingWrites(() => requestRendererFlush(window), flushMain),
    ));

  window.on("close", event => {
    if (releasing) return;
    event.preventDefault();
    void flushThen(() => {
      if (!window.isDestroyed()) window.close();
    });
  });

  app.on("before-quit", event => {
    if (releasing) return;
    event.preventDefault();
    void flushThen(() => app.quit());
  });
}
