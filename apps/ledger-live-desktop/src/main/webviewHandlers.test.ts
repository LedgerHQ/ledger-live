import { app, ipcMain, session, webContents } from "electron";
import { closeTrackedWebviewDevTools, setupWebviewHandlers } from "./webviewHandlers";

jest.mock("electron", () => ({
  app: {
    on: jest.fn(),
  },
  ipcMain: {
    on: jest.fn(),
  },
  session: {
    defaultSession: {
      webRequest: {
        onHeadersReceived: jest.fn(),
        onBeforeRequest: jest.fn(),
      },
    },
  },
  webContents: {
    fromId: jest.fn(),
    getAllWebContents: jest.fn(() => []),
  },
}));

type DomReadyHandler = (event: Electron.IpcMainEvent, id: number, domains?: string[]) => void;
type WebContentsCreatedHandler = (event: Electron.Event, contents: Electron.WebContents) => void;
type SchemeGuard = (event: Electron.Event<{ url: string }>) => void;
type ContentsListener = (...args: unknown[]) => void;

const makeDevToolsContents = () => ({
  getType: jest.fn(() => "remote"),
  getURL: jest.fn(() => "devtools://devtools/bundled/inspector.html"),
  getTitle: jest.fn(() => "DevTools"),
  isDestroyed: jest.fn(() => false),
  close: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
});

const makeWindow = () => ({ getType: jest.fn(() => "window"), on: jest.fn() });

const makeOwner = (id: number, type: string, devToolsWebContents: unknown) => ({
  id,
  getType: jest.fn(() => type),
  isDestroyed: jest.fn(() => false),
  devToolsWebContents,
});

describe("setupWebviewHandlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (globalThis as typeof globalThis & { __ledgerLiveWebviewHandlersSetup__?: boolean })
      .__ledgerLiveWebviewHandlersSetup__;
  });

  const getDomReadyHandler = () =>
    (jest.mocked(ipcMain.on) as jest.Mock).mock.calls.find(
      ([eventName]) => eventName === "webview-dom-ready",
    )?.[1] as DomReadyHandler | undefined;

  const getWebContentsCreatedHandler = () =>
    (jest.mocked(app.on) as jest.Mock).mock.calls.find(
      ([eventName]) => eventName === "web-contents-created",
    )?.[1] as WebContentsCreatedHandler | undefined;

  it("ignores webview-dom-ready events for non-webview contents", () => {
    setupWebviewHandlers(["ledgerlive"]);

    const domReadyHandler = getDomReadyHandler();

    const nonWebviewContents = {
      getType: jest.fn(() => "window"),
      off: jest.fn(),
      on: jest.fn(),
    };
    jest.mocked(webContents.fromId).mockReturnValue(nonWebviewContents as never);

    domReadyHandler?.({} as Electron.IpcMainEvent, 42, ["https://app.example.com"]);

    expect(nonWebviewContents.getType).toHaveBeenCalled();
    expect(nonWebviewContents.off).not.toHaveBeenCalled();
    expect(nonWebviewContents.on).not.toHaveBeenCalled();
  });

  it("attaches a will-navigate handler for webview contents", () => {
    setupWebviewHandlers(["ledgerlive"]);

    const domReadyHandler = getDomReadyHandler();

    const webviewContents = {
      getType: jest.fn(() => "webview"),
      off: jest.fn(),
      on: jest.fn(),
    };
    jest.mocked(webContents.fromId).mockReturnValue(webviewContents as never);

    domReadyHandler?.({} as Electron.IpcMainEvent, 7, ["https://app.example.com"]);

    expect(webviewContents.on).toHaveBeenCalledWith("will-navigate", expect.any(Function));
    expect(webviewContents.off).not.toHaveBeenCalled();
  });

  it("registers its one-time listeners during setup", () => {
    setupWebviewHandlers(["ledgerlive"]);

    expect(jest.mocked(app.on)).toHaveBeenCalledWith("session-created", expect.any(Function));
    expect(jest.mocked(app.on)).toHaveBeenCalledWith("web-contents-created", expect.any(Function));
    expect(jest.mocked(session.defaultSession.webRequest.onHeadersReceived)).toHaveBeenCalledWith(
      expect.any(Function),
    );
  });

  it("cancels file requests from webview guests only", () => {
    setupWebviewHandlers(["ledgerlive"]);

    const [filter, listener] = jest.mocked(session.defaultSession.webRequest.onBeforeRequest).mock
      .calls[0] as unknown as [
      Electron.WebRequestFilter,
      (details: { webContents?: { getType: () => string } }, callback: jest.Mock) => void,
    ];
    const callback = jest.fn();

    listener({ webContents: { getType: () => "webview" } }, callback);
    listener({ webContents: { getType: () => "window" } }, callback);

    expect(filter).toEqual({ urls: ["file://*/*"] });
    expect(callback.mock.calls).toEqual([[{ cancel: true }], [{ cancel: false }]]);
  });

  describe("will-attach-webview", () => {
    type AttachHandler = (
      event: { preventDefault: jest.Mock },
      webPreferences: Electron.WebPreferences,
      params: Record<string, string>,
    ) => void;

    const getAttachHandler = (embedder: ReturnType<typeof makeWindow>) =>
      embedder.on.mock.calls.find(
        ([eventName]) => eventName === "will-attach-webview",
      )?.[1] as AttachHandler;

    it("guards windows that exist at setup and windows created later", () => {
      const existing = makeWindow();
      const created = makeWindow();
      jest
        .mocked(webContents.getAllWebContents)
        .mockReturnValueOnce([existing as unknown as Electron.WebContents]);

      setupWebviewHandlers(["ledgerlive"]);
      getWebContentsCreatedHandler()?.(
        {} as Electron.Event,
        created as unknown as Electron.WebContents,
      );

      expect(getAttachHandler(existing)).toBeDefined();
      expect(getAttachHandler(created)).toBeDefined();
    });

    it("blocks a disallowed src and pins the preferences of an allowed one", () => {
      const embedder = makeWindow();
      jest
        .mocked(webContents.getAllWebContents)
        .mockReturnValueOnce([embedder as unknown as Electron.WebContents]);
      setupWebviewHandlers(["ledgerlive"]);
      const handler = getAttachHandler(embedder);

      const blocked = { preventDefault: jest.fn() };
      handler(blocked, {}, { src: "file:///etc/hosts" });

      const allowed = { preventDefault: jest.fn() };
      const webPreferences: Electron.WebPreferences = { nodeIntegration: true, sandbox: false };
      handler(allowed, webPreferences, { src: "https://example.com" });

      expect(blocked.preventDefault).toHaveBeenCalled();
      expect(allowed.preventDefault).not.toHaveBeenCalled();
      expect(webPreferences).toMatchObject({ nodeIntegration: false, sandbox: true });
    });
  });

  it("attaches will-navigate, will-redirect and will-frame-navigate handlers for webview contents", () => {
    setupWebviewHandlers(["ledgerlive"]);

    const webContentsCreatedHandler = getWebContentsCreatedHandler();
    const guestContents = {
      id: 7,
      getType: jest.fn(() => "webview"),
      on: jest.fn(),
      once: jest.fn(),
      setWindowOpenHandler: jest.fn(),
    };

    webContentsCreatedHandler?.(
      {} as Electron.Event,
      guestContents as unknown as Electron.WebContents,
    );

    expect(guestContents.on).toHaveBeenCalledWith("will-navigate", expect.any(Function));
    expect(guestContents.on).toHaveBeenCalledWith("will-redirect", expect.any(Function));
    expect(guestContents.on).toHaveBeenCalledWith("will-frame-navigate", expect.any(Function));
  });

  it.each(["will-navigate", "will-redirect", "will-frame-navigate"])(
    "prevents %s for disallowed schemes",
    eventName => {
      setupWebviewHandlers(["ledgerlive"]);

      const webContentsCreatedHandler = getWebContentsCreatedHandler();
      const guestContents = {
        id: 7,
        getType: jest.fn(() => "webview"),
        on: jest.fn(),
        once: jest.fn(),
        setWindowOpenHandler: jest.fn(),
      };

      webContentsCreatedHandler?.(
        {} as Electron.Event,
        guestContents as unknown as Electron.WebContents,
      );

      const schemeGuard = (jest.mocked(guestContents.on) as jest.Mock).mock.calls.find(
        ([registeredEventName]) => registeredEventName === eventName,
      )?.[1] as SchemeGuard | undefined;
      const preventDefault = jest.fn();

      schemeGuard?.({
        url: "itms-apps://itunes.apple.com/app/id1234",
        defaultPrevented: false,
        preventDefault,
      } as unknown as Electron.Event<{ url: string }>);

      expect(preventDefault).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["will-navigate", "will-redirect", "will-frame-navigate"])(
    "allows %s for supported schemes",
    eventName => {
      setupWebviewHandlers(["ledgerlive"]);

      const webContentsCreatedHandler = getWebContentsCreatedHandler();
      const guestContents = {
        id: 7,
        getType: jest.fn(() => "webview"),
        on: jest.fn(),
        once: jest.fn(),
        setWindowOpenHandler: jest.fn(),
      };

      webContentsCreatedHandler?.(
        {} as Electron.Event,
        guestContents as unknown as Electron.WebContents,
      );

      const schemeGuard = (jest.mocked(guestContents.on) as jest.Mock).mock.calls.find(
        ([registeredEventName]) => registeredEventName === eventName,
      )?.[1] as SchemeGuard | undefined;
      const preventDefault = jest.fn();

      schemeGuard?.({
        url: "ledgerlive://discover",
        defaultPrevented: false,
        preventDefault,
      } as unknown as Electron.Event<{ url: string }>);

      expect(preventDefault).not.toHaveBeenCalled();
    },
  );
});

describe("guest DevTools tracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(webContents.getAllWebContents).mockReturnValue([]);
    delete (globalThis as typeof globalThis & { __ledgerLiveWebviewHandlersSetup__?: boolean })
      .__ledgerLiveWebviewHandlersSetup__;
  });

  const getWebContentsCreatedHandler = () =>
    (jest.mocked(app.on) as jest.Mock).mock.calls.find(
      ([eventName]) => eventName === "web-contents-created",
    )?.[1] as WebContentsCreatedHandler | undefined;

  const getListener = (contents: { on: jest.Mock; once: jest.Mock }, eventName: string) => {
    const call =
      contents.on.mock.calls.find(([name]) => name === eventName) ??
      contents.once.mock.calls.find(([name]) => name === eventName);
    return call?.[1] as ContentsListener | undefined;
  };

  // Drops the module-level tracking entry between tests.
  const cleanup = (dt: { on: jest.Mock; once: jest.Mock }) => getListener(dt, "destroyed")?.();

  // Runs the DevTools discovery path.
  const discover = (
    handler: WebContentsCreatedHandler | undefined,
    devtools: ReturnType<typeof makeDevToolsContents>,
  ) => {
    handler?.({} as Electron.Event, devtools as unknown as Electron.WebContents);
    getListener(devtools, "page-title-updated")?.();
  };

  it("tracks a guest's DevTools and closes it on that guest's teardown", () => {
    setupWebviewHandlers(["ledgerlive"]);
    const handler = getWebContentsCreatedHandler();

    const devtools = makeDevToolsContents();
    const guest = makeOwner(7, "webview", devtools);
    jest
      .mocked(webContents.getAllWebContents)
      .mockReturnValue([guest, devtools] as unknown as Electron.WebContents[]);

    discover(handler, devtools);

    closeTrackedWebviewDevTools(7);
    expect(devtools.close).toHaveBeenCalledTimes(1);

    cleanup(devtools);
  });

  it("does NOT close the main window's own DevTools", () => {
    setupWebviewHandlers(["ledgerlive"]);
    const handler = getWebContentsCreatedHandler();

    const mainDevtools = makeDevToolsContents();
    const mainWindow = makeOwner(1, "window", mainDevtools);
    jest
      .mocked(webContents.getAllWebContents)
      .mockReturnValue([mainWindow, mainDevtools] as unknown as Electron.WebContents[]);

    discover(handler, mainDevtools);

    // A guest teardown (or an app-wide close) must never reach the main window.
    closeTrackedWebviewDevTools(7);
    closeTrackedWebviewDevTools();
    expect(mainDevtools.close).not.toHaveBeenCalled();

    cleanup(mainDevtools);
  });

  it("closes a guest's DevTools without touching another guest's DevTools", () => {
    setupWebviewHandlers(["ledgerlive"]);
    const handler = getWebContentsCreatedHandler();

    const devtoolsA = makeDevToolsContents();
    const guestA = makeOwner(7, "webview", devtoolsA);
    const devtoolsB = makeDevToolsContents();
    const guestB = makeOwner(9, "webview", devtoolsB);

    jest
      .mocked(webContents.getAllWebContents)
      .mockReturnValue([guestA, devtoolsA, guestB, devtoolsB] as unknown as Electron.WebContents[]);

    discover(handler, devtoolsA);
    discover(handler, devtoolsB);

    closeTrackedWebviewDevTools(7);
    expect(devtoolsA.close).toHaveBeenCalledTimes(1);
    expect(devtoolsB.close).not.toHaveBeenCalled();

    cleanup(devtoolsA);
    cleanup(devtoolsB);
  });

  it("removes a tracked DevTools entry when its WebContents is destroyed", () => {
    setupWebviewHandlers(["ledgerlive"]);
    const handler = getWebContentsCreatedHandler();

    const devtools = makeDevToolsContents();
    const guest = makeOwner(7, "webview", devtools);
    jest
      .mocked(webContents.getAllWebContents)
      .mockReturnValue([guest, devtools] as unknown as Electron.WebContents[]);

    discover(handler, devtools);

    // Simulate the DevTools WebContents being destroyed - the entry must be
    // dropped so a later close is a no-op (no leak, no use-after-free close()).
    cleanup(devtools);

    closeTrackedWebviewDevTools(7);
    expect(devtools.close).not.toHaveBeenCalled();
  });

  it("drops a tracked DevTools entry when closing throws during teardown", () => {
    setupWebviewHandlers(["ledgerlive"]);
    const handler = getWebContentsCreatedHandler();

    const devtools = makeDevToolsContents();
    devtools.close.mockImplementation(() => {
      throw new Error("Object has been destroyed");
    });
    const guest = makeOwner(7, "webview", devtools);
    jest
      .mocked(webContents.getAllWebContents)
      .mockReturnValue([guest, devtools] as unknown as Electron.WebContents[]);

    discover(handler, devtools);

    expect(() => closeTrackedWebviewDevTools(7)).not.toThrow();
    expect(devtools.close).toHaveBeenCalledTimes(1);

    closeTrackedWebviewDevTools(7);
    expect(devtools.close).toHaveBeenCalledTimes(1);

    cleanup(devtools);
  });

  it("ignores DevTools contents when Electron probes throw during discovery", () => {
    setupWebviewHandlers(["ledgerlive"]);
    const handler = getWebContentsCreatedHandler();

    const devtools = makeDevToolsContents();
    devtools.getURL.mockImplementation(() => {
      throw new Error("Object has been destroyed");
    });

    expect(() => discover(handler, devtools)).not.toThrow();

    closeTrackedWebviewDevTools(7);
    expect(devtools.close).not.toHaveBeenCalled();

    cleanup(devtools);
  });

  it("retries attribution to a non-webview owner at close time and never closes it", () => {
    setupWebviewHandlers(["ledgerlive"]);
    const handler = getWebContentsCreatedHandler();

    const devtools = makeDevToolsContents();

    // Discovery happens with no owner visible yet -> tracked without attribution.
    jest.mocked(webContents.getAllWebContents).mockReturnValue([]);
    discover(handler, devtools);

    // By close time the owner is now visible and turns out to be the main
    // window (non-"webview"): the re-derivation must drop the entry and skip it.
    const mainWindow = makeOwner(1, "window", devtools);
    jest
      .mocked(webContents.getAllWebContents)
      .mockReturnValue([mainWindow, devtools] as unknown as Electron.WebContents[]);

    closeTrackedWebviewDevTools(7);
    expect(devtools.close).not.toHaveBeenCalled();

    // Entry was removed, so a subsequent app-wide close is also a no-op.
    closeTrackedWebviewDevTools();
    expect(devtools.close).not.toHaveBeenCalled();

    cleanup(devtools);
  });

  it("retries attribution to another guest at close time and closes only on that guest's teardown", () => {
    setupWebviewHandlers(["ledgerlive"]);
    const handler = getWebContentsCreatedHandler();

    const devtools = makeDevToolsContents();

    // Discovery with no owner visible -> tracked without attribution.
    jest.mocked(webContents.getAllWebContents).mockReturnValue([]);
    discover(handler, devtools);

    // At close time attribution resolves to a different, still-alive guest.
    const otherGuest = makeOwner(9, "webview", devtools);
    jest
      .mocked(webContents.getAllWebContents)
      .mockReturnValue([otherGuest, devtools] as unknown as Electron.WebContents[]);

    // Closing for the destroyed guest (7) must not touch guest 9's DevTools.
    closeTrackedWebviewDevTools(7);
    expect(devtools.close).not.toHaveBeenCalled();

    // Closing for guest 9 re-derives owner 9 and closes it.
    closeTrackedWebviewDevTools(9);
    expect(devtools.close).toHaveBeenCalledTimes(1);

    cleanup(devtools);
  });

  it("retries attribution to this guest at close time and closes it", () => {
    setupWebviewHandlers(["ledgerlive"]);
    const handler = getWebContentsCreatedHandler();

    const devtools = makeDevToolsContents();

    // Discovery with no owner visible -> tracked without attribution.
    jest.mocked(webContents.getAllWebContents).mockReturnValue([]);
    discover(handler, devtools);

    // At close time attribution resolves to the guest being torn down.
    const guest = makeOwner(7, "webview", devtools);
    jest
      .mocked(webContents.getAllWebContents)
      .mockReturnValue([guest, devtools] as unknown as Electron.WebContents[]);

    closeTrackedWebviewDevTools(7);
    expect(devtools.close).toHaveBeenCalledTimes(1);

    cleanup(devtools);
  });

  it("closes a still-unattributed DevTools entry as a safety net", () => {
    setupWebviewHandlers(["ledgerlive"]);
    const handler = getWebContentsCreatedHandler();

    const devtools = makeDevToolsContents();

    // Discovery with no owner visible, and the re-derivation at close time
    // still finds no owner.
    jest.mocked(webContents.getAllWebContents).mockReturnValue([]);
    discover(handler, devtools);

    closeTrackedWebviewDevTools(7);
    expect(devtools.close).toHaveBeenCalledTimes(1);

    cleanup(devtools);
  });
});
