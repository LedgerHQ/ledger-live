import { EventEmitter } from "events";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { app, ipcMain, type BrowserWindow } from "electron";
import { CHANNELS } from "~/bridge/contract";
import db from "~/main/db";
import {
  RENDERER_FLUSH_TIMEOUT_MS,
  flushBeforeQuit,
  requestRendererFlush,
  setupFlushOnQuit,
} from "./flushOnQuit";

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

function createWindow(onFlushRequest: () => Promise<void> = async () => {}): FakeWindow {
  const webContents = {
    isDestroyed: () => false,
    send: jest.fn((channel: string) => {
      if (channel !== CHANNELS.flushWrites) return;
      void onFlushRequest().then(() =>
        ipcMain.emit(CHANNELS.flushWritesDone, { sender: webContents }),
      );
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

function preventableEvent() {
  return { preventDefault: jest.fn() };
}

const nextQuit = () =>
  new Promise<void>(resolve => jest.mocked(app.quit).mockImplementationOnce(() => resolve()));

const settle = () => new Promise(process.nextTick);

describe("flushOnQuit", () => {
  beforeEach(() => {
    app.removeAllListeners();
    ipcMain.removeAllListeners();
    jest.mocked(app.quit).mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("holds the quit until the renderer and then main have flushed", async () => {
    const calls: string[] = [];
    const window = createWindow(async () => {
      calls.push("renderer");
    });
    setupFlushOnQuit(asBrowserWindow(window), async () => {
      calls.push("main");
    });

    const quit = nextQuit();
    const event = preventableEvent();
    app.emit("before-quit", event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(app.quit).not.toHaveBeenCalled();
    await quit;

    expect(calls).toEqual(["renderer", "main"]);
  });

  it("lets the quit through once the writes are flushed", async () => {
    setupFlushOnQuit(asBrowserWindow(createWindow()), async () => {});
    const quit = nextQuit();
    app.emit("before-quit", preventableEvent());
    await quit;

    const secondEvent = preventableEvent();
    app.emit("before-quit", secondEvent);

    expect(secondEvent.preventDefault).not.toHaveBeenCalled();
  });

  it("holds the window close until the renderer and then main have flushed", async () => {
    const calls: string[] = [];
    const window = createWindow(async () => {
      calls.push("renderer");
    });
    setupFlushOnQuit(asBrowserWindow(window), async () => {
      calls.push("main");
    });

    const event = preventableEvent();
    window.emit("close", event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(window.close).not.toHaveBeenCalled();
    await settle();

    expect(calls).toEqual(["renderer", "main"]);
    expect(window.close).toHaveBeenCalledTimes(1);
  });

  it("lets the window close through once the writes are flushed", async () => {
    const window = createWindow();
    setupFlushOnQuit(asBrowserWindow(window), async () => {});
    window.emit("close", preventableEvent());
    await settle();

    const secondEvent = preventableEvent();
    window.emit("close", secondEvent);

    expect(secondEvent.preventDefault).not.toHaveBeenCalled();
  });

  it("lets the window close through after the quit flush", async () => {
    const window = createWindow();
    setupFlushOnQuit(asBrowserWindow(window), async () => {});
    const quit = nextQuit();
    app.emit("before-quit", preventableEvent());
    await quit;

    const closeEvent = preventableEvent();
    window.emit("close", closeEvent);

    expect(closeEvent.preventDefault).not.toHaveBeenCalled();
  });

  it("flushes main again on quit after the window close", async () => {
    const window = createWindow();
    const flushMain = jest.fn(async () => {});
    setupFlushOnQuit(asBrowserWindow(window), flushMain);
    window.emit("close", preventableEvent());
    await settle();

    const quit = nextQuit();
    app.emit("before-quit", preventableEvent());
    await quit;

    expect(flushMain).toHaveBeenCalledTimes(2);
  });

  it("quits when the renderer does not answer in time", async () => {
    jest.useFakeTimers();
    const flushMain = jest.fn(async () => {});
    setupFlushOnQuit(asBrowserWindow(createWindow(() => new Promise(() => {}))), flushMain);

    const quit = nextQuit();
    app.emit("before-quit", preventableEvent());
    await jest.advanceTimersByTimeAsync(RENDERER_FLUSH_TIMEOUT_MS);
    await quit;

    expect(flushMain).toHaveBeenCalled();
    expect(ipcMain.listenerCount(CHANNELS.flushWritesDone)).toBe(0);
  });

  it("quits when the main flush fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    setupFlushOnQuit(asBrowserWindow(createWindow()), () => Promise.reject(new Error("disk full")));

    const quit = nextQuit();
    app.emit("before-quit", preventableEvent());
    await quit;

    expect(consoleError).toHaveBeenCalledWith("Database flush failed", expect.any(Error));
    consoleError.mockRestore();
  });

  it("flushes on demand and then lets the quit through", async () => {
    const flushMain = jest.fn(async () => {});
    setupFlushOnQuit(asBrowserWindow(createWindow()), flushMain);

    await flushBeforeQuit();
    const event = preventableEvent();
    app.emit("before-quit", event);

    expect(flushMain).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("ignores the answer of another renderer", async () => {
    const window = createWindow(() => new Promise(() => {}));
    let answered = false;
    void requestRendererFlush(asBrowserWindow(window), 1000).then(() => (answered = true));

    ipcMain.emit(CHANNELS.flushWritesDone, { sender: {} });
    await settle();
    expect(answered).toBe(false);

    ipcMain.emit(CHANNELS.flushWritesDone, { sender: window.webContents });
    await settle();
    expect(answered).toBe(true);
  });
});

describe("flushOnQuit with the database on disk", () => {
  let dir: string;

  beforeEach(async () => {
    app.removeAllListeners();
    ipcMain.removeAllListeners();
    jest.mocked(app.quit).mockReset();
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "lld-flush-on-quit-"));
    db.init(dir);
    await db.load("app");
    await db.load("windowParams");
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  const readFromDisk = async (ns: string) =>
    JSON.parse(await fs.readFile(path.join(dir, `${ns}.json`), "utf8")).data;

  it("writes to disk a write made just before quit", async () => {
    const window = createWindow(() => db.setKey("app", "settings", { theme: "dark" }));
    setupFlushOnQuit(asBrowserWindow(window), db.flush);
    void db.setKey("windowParams", "MainWindow.positions", { x: 1, y: 2 });

    const quit = nextQuit();
    app.emit("before-quit", preventableEvent());
    await quit;

    expect(await readFromDisk("app")).toEqual({ settings: { theme: "dark" } });
    expect(await readFromDisk("windowParams")).toEqual({
      MainWindow: { positions: { x: 1, y: 2 } },
    });
  });

  it("writes to disk a write made just before the window closes", async () => {
    const window = createWindow(() => db.setKey("app", "settings", { theme: "dark" }));
    setupFlushOnQuit(asBrowserWindow(window), db.flush);
    const closed = new Promise<void>(resolve => window.close.mockImplementation(() => resolve()));

    window.emit("close", preventableEvent());
    await closed;

    expect(await readFromDisk("app")).toEqual({ settings: { theme: "dark" } });
  });
});
