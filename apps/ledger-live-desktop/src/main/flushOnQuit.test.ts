import { EventEmitter } from "events";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { app, ipcMain, type BrowserWindow } from "electron";
import { CHANNELS } from "~/bridge/contract";
import db from "~/main/db";
import { flushPendingWrites, requestRendererFlush, setupFlushOnQuit } from "./flushOnQuit";

jest.mock("electron", () => {
  const events = jest.requireActual<typeof import("events")>("events");
  return {
    app: Object.assign(new events.EventEmitter(), { quit: jest.fn() }),
    ipcMain: new events.EventEmitter(),
  };
});

type FakeWindow = EventEmitter & {
  close: jest.Mock;
  isDestroyed: () => boolean;
  webContents: { isDestroyed: () => boolean; send: jest.Mock };
};

/** The renderer answers each flush request after `onFlush` settles. */
function createWindow(onFlush: () => Promise<void> = async () => {}): FakeWindow {
  const webContents = {
    isDestroyed: () => false,
    send: jest.fn((channel: string) => {
      if (channel !== CHANNELS.flushWrites) return;
      void onFlush().then(() => ipcMain.emit(CHANNELS.flushWritesDone, { sender: webContents }));
    }),
  };
  return Object.assign(new EventEmitter(), {
    close: jest.fn(),
    isDestroyed: () => false,
    webContents,
  });
}

function asBrowserWindow(window: FakeWindow): BrowserWindow {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return window as unknown as BrowserWindow;
}

function quitEvent() {
  return { preventDefault: jest.fn() };
}

const quitCalled = () =>
  new Promise<void>(resolve => jest.mocked(app.quit).mockImplementationOnce(() => resolve()));

describe("flushOnQuit", () => {
  beforeEach(() => {
    app.removeAllListeners();
    ipcMain.removeAllListeners();
    jest.mocked(app.quit).mockReset();
  });

  it("writes a write made just before quit to disk before the app quits", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "lld-flush-on-quit-"));
    db.init(dir);
    await db.load("app");
    // The renderer holds this write in its own debounce until main asks for it.
    const window = createWindow(() =>
      db.setKey("app", "settings", { theme: "dark" }).catch(() => undefined),
    );
    setupFlushOnQuit(asBrowserWindow(window), db.flush);

    const quit = quitCalled();
    const event = quitEvent();
    app.emit("before-quit", event);
    await quit;

    expect(event.preventDefault).toHaveBeenCalled();
    const onDisk = JSON.parse(await fs.readFile(path.join(dir, "app.json"), "utf8"));
    expect(onDisk.data.settings).toEqual({ theme: "dark" });
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("lets the quit through once the writes are flushed", async () => {
    setupFlushOnQuit(asBrowserWindow(createWindow()), async () => {});

    const quit = quitCalled();
    app.emit("before-quit", quitEvent());
    await quit;

    const secondEvent = quitEvent();
    app.emit("before-quit", secondEvent);
    expect(secondEvent.preventDefault).not.toHaveBeenCalled();
  });

  it("flushes the renderer before the window closes, and only once", async () => {
    const window = createWindow();
    window.close.mockImplementation(() => window.emit("close", quitEvent()));
    setupFlushOnQuit(asBrowserWindow(window), async () => {});

    const event = quitEvent();
    window.emit("close", event);
    expect(event.preventDefault).toHaveBeenCalled();
    await new Promise(process.nextTick);

    expect(window.webContents.send).toHaveBeenCalledTimes(1);
    expect(window.close).toHaveBeenCalledTimes(1);
  });

  it("flushes the renderer before main", async () => {
    const calls: string[] = [];
    await flushPendingWrites(
      async () => {
        calls.push("renderer");
      },
      async () => {
        calls.push("main");
      },
    );
    expect(calls).toEqual(["renderer", "main"]);
  });

  it("flushes main when the renderer flush fails", async () => {
    const flushMain = jest.fn(async () => {});
    jest.spyOn(console, "error").mockImplementationOnce(() => {});
    await flushPendingWrites(() => Promise.reject(new Error("gone")), flushMain);
    expect(flushMain).toHaveBeenCalled();
  });

  it("stops the wait when the renderer does not answer", async () => {
    const window = createWindow(() => new Promise(() => {}));
    await expect(requestRendererFlush(asBrowserWindow(window), 10)).resolves.toBeUndefined();
    expect(ipcMain.listenerCount(CHANNELS.flushWritesDone)).toBe(0);
  });

  it("ignores the answer of another renderer", async () => {
    const window = createWindow(() => new Promise(() => {}));
    let answered = false;
    void requestRendererFlush(asBrowserWindow(window), 1000).then(() => (answered = true));

    ipcMain.emit(CHANNELS.flushWritesDone, { sender: {} });
    await new Promise(process.nextTick);
    expect(answered).toBe(false);

    ipcMain.emit(CHANNELS.flushWritesDone, { sender: window.webContents });
    await new Promise(process.nextTick);
    expect(answered).toBe(true);
  });
});
