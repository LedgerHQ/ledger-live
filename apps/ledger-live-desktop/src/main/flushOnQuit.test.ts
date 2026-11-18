import { EventEmitter } from "events";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { app, ipcMain, type BrowserWindow } from "electron";
import { CHANNELS } from "~/bridge/contract";
import db from "~/main/db";
import {
  MAIN_FLUSH_TIMEOUT_MS,
  RENDERER_FLUSH_TIMEOUT_MS,
  flushThen,
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
    send: jest.fn((channel: string, requestId: number) => {
      if (channel !== CHANNELS.flushWrites) return;
      void onFlushRequest().then(() =>
        ipcMain.emit(CHANNELS.flushWritesDone, { sender: webContents }, requestId),
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

const nextImmediate = () => new Promise(setImmediate);

describe("flushOnQuit", () => {
  beforeEach(() => {
    app.removeAllListeners();
    ipcMain.removeAllListeners();
    jest.mocked(app.quit).mockReset();
  });

  afterEach(async () => {
    jest.useRealTimers();
    // The release of the last flush ends in a setImmediate.
    await nextImmediate();
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

  it("lets through the quit that the flush starts", async () => {
    setupFlushOnQuit(asBrowserWindow(createWindow()), async () => {});
    const releasedEvent = preventableEvent();
    const quit = new Promise<void>(resolve =>
      jest.mocked(app.quit).mockImplementationOnce(() => {
        app.emit("before-quit", releasedEvent);
        resolve();
      }),
    );

    app.emit("before-quit", preventableEvent());
    await quit;

    expect(releasedEvent.preventDefault).not.toHaveBeenCalled();
  });

  it("lets through the quit that the action starts in a setImmediate", async () => {
    setupFlushOnQuit(asBrowserWindow(createWindow()), async () => {});
    const releasedEvent = preventableEvent();
    let quit: Promise<void> = Promise.resolve();

    await flushThen(() => {
      quit = new Promise<void>(resolve =>
        setImmediate(() => {
          app.emit("before-quit", releasedEvent);
          resolve();
        }),
      );
    });
    await quit;

    expect(releasedEvent.preventDefault).not.toHaveBeenCalled();
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

  it("lets through the window close that the flush starts", async () => {
    const window = createWindow();
    setupFlushOnQuit(asBrowserWindow(window), async () => {});
    const releasedEvent = preventableEvent();
    const closed = new Promise<void>(resolve =>
      window.close.mockImplementationOnce(() => {
        window.emit("close", releasedEvent);
        resolve();
      }),
    );

    window.emit("close", preventableEvent());
    await closed;

    expect(releasedEvent.preventDefault).not.toHaveBeenCalled();
  });

  it("flushes again on the next quit when a released quit did not quit", async () => {
    const flushMain = jest.fn(async () => {});
    setupFlushOnQuit(asBrowserWindow(createWindow()), flushMain);
    await flushThen(() => {});
    await nextImmediate();

    const event = preventableEvent();
    const quit = nextQuit();
    app.emit("before-quit", event);
    await quit;

    expect(event.preventDefault).toHaveBeenCalled();
    expect(flushMain).toHaveBeenCalledTimes(2);
  });

  it("sends 1 renderer flush request at a time for a close and a quit together", async () => {
    const answers: Array<() => void> = [];
    const window = createWindow(() => new Promise<void>(resolve => answers.push(resolve)));
    const flushMain = jest.fn(async () => {});
    setupFlushOnQuit(asBrowserWindow(window), flushMain);

    window.emit("close", preventableEvent());
    const quit = nextQuit();
    app.emit("before-quit", preventableEvent());
    await settle();
    expect(window.webContents.send).toHaveBeenCalledTimes(1);

    answers[0]();
    await settle();
    expect(window.close).toHaveBeenCalledTimes(1);
    expect(window.webContents.send).toHaveBeenCalledTimes(2);
    expect(app.quit).not.toHaveBeenCalled();

    answers[1]();
    await quit;
    expect(flushMain).toHaveBeenCalledTimes(2);
  });

  it("runs the action after the renderer and then main have flushed", async () => {
    const calls: string[] = [];
    const window = createWindow(async () => {
      calls.push("renderer");
    });
    setupFlushOnQuit(asBrowserWindow(window), async () => {
      calls.push("main");
    });

    await flushThen(() => calls.push("action"));

    expect(calls).toEqual(["renderer", "main", "action"]);
  });

  it("flushes main again on quit after the window close", async () => {
    const window = createWindow();
    const flushMain = jest.fn(async () => {});
    setupFlushOnQuit(asBrowserWindow(window), flushMain);
    window.emit("close", preventableEvent());
    await settle();
    await nextImmediate();

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
    await jest.runOnlyPendingTimersAsync();

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

  it("quits when the main flush does not end in time", async () => {
    jest.useFakeTimers();
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    setupFlushOnQuit(asBrowserWindow(createWindow()), () => new Promise(() => {}));

    const quit = nextQuit();
    app.emit("before-quit", preventableEvent());
    await jest.advanceTimersByTimeAsync(MAIN_FLUSH_TIMEOUT_MS);
    await quit;
    await jest.runOnlyPendingTimersAsync();

    expect(consoleError).toHaveBeenCalledWith("Database flush failed", expect.any(Error));
    consoleError.mockRestore();
  });

  it("ignores the answer of another renderer", async () => {
    const window = createWindow(() => new Promise(() => {}));
    let answered = false;
    void requestRendererFlush(asBrowserWindow(window), 1000).then(() => (answered = true));
    const [, requestId] = window.webContents.send.mock.calls[0];

    ipcMain.emit(CHANNELS.flushWritesDone, { sender: {} }, requestId);
    await settle();
    expect(answered).toBe(false);

    ipcMain.emit(CHANNELS.flushWritesDone, { sender: window.webContents }, requestId);
    await settle();
    expect(answered).toBe(true);
  });

  it("ignores a late answer to a request that timed out", async () => {
    jest.useFakeTimers();
    const window = createWindow(() => new Promise(() => {}));
    const timedOut = requestRendererFlush(asBrowserWindow(window), 1000);
    await jest.advanceTimersByTimeAsync(1000);
    await timedOut;
    const [, lateId] = window.webContents.send.mock.calls[0];

    let answered = false;
    void requestRendererFlush(asBrowserWindow(window), 1000).then(() => (answered = true));
    ipcMain.emit(CHANNELS.flushWritesDone, { sender: window.webContents }, lateId);
    await jest.advanceTimersByTimeAsync(0);

    expect(answered).toBe(false);
    await jest.advanceTimersByTimeAsync(1000);
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
    await nextImmediate();
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
