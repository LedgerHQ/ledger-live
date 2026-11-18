import { app, ipcMain, type BrowserWindow, type IpcMainEvent } from "electron";
import { CHANNELS } from "~/bridge/contract";

export const RENDERER_FLUSH_TIMEOUT_MS = 3000;

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
 */
export async function flushPendingWrites(
  flushRenderer: () => Promise<void>,
  flushMain: () => Promise<void>,
): Promise<void> {
  await flushRenderer().catch(error => console.warn("Renderer flush failed", error));
  await flushMain().catch(error => console.error("Database flush failed", error));
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
