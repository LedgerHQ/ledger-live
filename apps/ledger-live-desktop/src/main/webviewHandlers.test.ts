import { app, ipcMain, session, webContents } from "electron";
import { closeTrackedWebviewDevTools, setupWebviewHandlers } from "./webviewHandlers";
import {
  UNRESTRICTED_ORIGINS,
  serializeAllowedOrigins,
  serializeDomainCheckReport,
} from "~/bridge/webviewAllowedOrigins";
import { CHANNELS } from "~/bridge/contract";

jest.mock("electron", () => ({
  app: {
    on: jest.fn(),
    getVersion: jest.fn(() => "2.130.0"),
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
    getAllWebContents: jest.fn(() => []),
  },
}));

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

const makeWindow = () => ({
  getType: jest.fn(() => "window"),
  on: jest.fn(),
  send: jest.fn(),
  isDestroyed: jest.fn(() => false),
});

type Embedder = ReturnType<typeof makeWindow>;

const makeOwner = (id: number, type: string, devToolsWebContents: unknown) => ({
  id,
  getType: jest.fn(() => type),
  isDestroyed: jest.fn(() => false),
  devToolsWebContents,
});

const getBeforeRequest = () =>
  jest.mocked(session.defaultSession.webRequest.onBeforeRequest).mock.calls[0] as unknown as [
    Electron.WebRequestFilter,
    (
      details: {
        url: string;
        resourceType: string;
        webContents?: { id: number; getType: () => string };
      },
      callback: jest.Mock,
    ) => void,
  ];

const makeGuest = (id: number, hostWebContents?: Embedder) => ({
  id,
  hostWebContents,
  getType: jest.fn(() => "webview"),
  on: jest.fn(),
  once: jest.fn(),
  setWindowOpenHandler: jest.fn(),
  loadURL: jest.fn(() => Promise.resolve()),
});

type Guest = ReturnType<typeof makeGuest>;

describe("setupWebviewHandlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (globalThis as typeof globalThis & { __ledgerLiveWebviewHandlersSetup__?: boolean })
      .__ledgerLiveWebviewHandlersSetup__;
  });

  const getWebContentsCreatedHandler = () =>
    (jest.mocked(app.on) as jest.Mock).mock.calls.find(
      ([eventName]) => eventName === "web-contents-created",
    )?.[1] as WebContentsCreatedHandler | undefined;

  it("registers its one-time listeners during setup", () => {
    setupWebviewHandlers(["ledgerlive"]);

    expect(jest.mocked(app.on)).toHaveBeenCalledWith("session-created", expect.any(Function));
    expect(jest.mocked(app.on)).toHaveBeenCalledWith("web-contents-created", expect.any(Function));
    expect(jest.mocked(session.defaultSession.webRequest.onHeadersReceived)).toHaveBeenCalledWith(
      expect.any(Function),
    );
  });

  it("cancels file frame loads from webview guests only", () => {
    setupWebviewHandlers(["ledgerlive"]);

    const [filter, listener] = getBeforeRequest();
    const callback = jest.fn();

    listener(
      {
        url: "file:///etc/hosts",
        resourceType: "subFrame",
        webContents: { id: 7, getType: () => "webview" },
      },
      callback,
    );
    listener(
      {
        url: "file:///etc/hosts",
        resourceType: "mainFrame",
        webContents: { id: 1, getType: () => "window" },
      },
      callback,
    );

    expect(filter).toEqual({ urls: ["<all_urls>"], types: ["mainFrame", "subFrame"] });
    expect(callback.mock.calls).toEqual([[{ cancel: true }], [{}]]);
  });

  describe("manifest origin enforcement", () => {
    type AttachHandler = (
      event: { preventDefault: jest.Mock },
      webPreferences: Electron.WebPreferences,
      params: Record<string, string>,
    ) => void;

    // Mirrors Electron's createGuest: `will-attach-webview` on the embedder, then
    // `web-contents-created` for the guest, synchronously.
    const attachGuest = (
      webpreferences: string | undefined,
      { id = 7, src = "https://app.example.com" } = {},
    ): Guest => {
      const embedder = makeWindow();
      getWebContentsCreatedHandler()?.(
        {} as Electron.Event,
        embedder as unknown as Electron.WebContents,
      );
      const attach = embedder.on.mock.calls.find(
        ([eventName]) => eventName === "will-attach-webview",
      )?.[1] as AttachHandler;

      const webPreferences = Object.fromEntries(
        (webpreferences ?? "")
          .split(",")
          .filter(Boolean)
          .map(entry => entry.split("=")),
      ) as Electron.WebPreferences;
      const preventDefault = jest.fn();
      attach({ preventDefault }, webPreferences, { src });
      if (preventDefault.mock.calls.length > 0) return makeGuest(id, embedder);

      const guest = makeGuest(id, embedder);
      getWebContentsCreatedHandler()?.(
        {} as Electron.Event,
        guest as unknown as Electron.WebContents,
      );
      return guest;
    };

    const requestMainFrame = (guest: Guest, url: string) => {
      const [, listener] = getBeforeRequest();
      const callback = jest.fn();
      listener({ url, resourceType: "mainFrame", webContents: guest }, callback);
      return callback.mock.calls[0][0];
    };

    const getGuestListeners = (guest: Guest, eventName: string) =>
      guest.on.mock.calls
        .filter(([name]) => name === eventName)
        .map(([, listener]) => listener as ContentsListener);

    const emitWillEvent = (guest: Guest, eventName: string, url: string, isMainFrame = true) => {
      const preventDefault = jest.fn();
      for (const listener of getGuestListeners(guest, eventName)) {
        listener({ url, isMainFrame, preventDefault });
      }
      return preventDefault;
    };

    const emitDidFrameNavigate = (guest: Guest, url: string, isMainFrame = true) => {
      for (const listener of getGuestListeners(guest, "did-frame-navigate")) {
        listener({}, url, 200, "OK", isMainFrame, 1, 1);
      }
    };

    const domains = serializeAllowedOrigins(["https://app.example.com"]);

    beforeEach(() => {
      setupWebviewHandlers(["ledgerlive"]);
    });

    it("lets main-frame loads through only on the manifest origins", () => {
      const guest = attachGuest(`nativeWindowOpen=no,${domains}`);

      expect(requestMainFrame(guest, "https://app.example.com/path")).toEqual({});
      expect(requestMainFrame(guest, "ledgerlive://discover")).toEqual({});
      expect(requestMainFrame(guest, "https://evil.com/")).toEqual({ cancel: true });
      expect(requestMainFrame(guest, "http://app.example.com/")).toEqual({ cancel: true });
    });

    it("does not check subframe loads against the manifest origins", () => {
      const guest = attachGuest(domains);
      const [, listener] = getBeforeRequest();
      const callback = jest.fn();

      listener(
        { url: "https://3ds.bank.example/", resourceType: "subFrame", webContents: guest },
        callback,
      );

      expect(callback).toHaveBeenCalledWith({});
    });

    it("fails closed for a guest attached without allowed origins", () => {
      const guest = attachGuest("nativeWindowOpen=no");

      expect(requestMainFrame(guest, "https://app.example.com/")).toEqual({ cancel: true });
    });

    it("fails closed for a guest whose attach was blocked", () => {
      attachGuest(domains, { src: "file:///etc/hosts" });
      const guest = makeGuest(8);
      getWebContentsCreatedHandler()?.(
        {} as Electron.Event,
        guest as unknown as Electron.WebContents,
      );

      expect(requestMainFrame(guest, "https://app.example.com/")).toEqual({ cancel: true });
    });

    it("binds origins to the guest they were attached with", () => {
      const first = attachGuest(domains, { id: 7 });
      const second = attachGuest(serializeAllowedOrigins(["https://other.example"]), { id: 8 });

      expect(requestMainFrame(first, "https://other.example/")).toEqual({ cancel: true });
      expect(requestMainFrame(second, "https://other.example/")).toEqual({});
      expect(requestMainFrame(second, "https://app.example.com/")).toEqual({ cancel: true });
    });

    it("allows any web origin when the domain check is off", () => {
      const guest = attachGuest(serializeAllowedOrigins(UNRESTRICTED_ORIGINS));

      expect(requestMainFrame(guest, "https://evil.com/")).toEqual({});
    });

    it("forgets a guest's origins once it is destroyed", () => {
      const guest = attachGuest(domains);
      const destroyed = guest.once.mock.calls.find(([name]) => name === "destroyed")?.[1];

      destroyed();

      expect(requestMainFrame(guest, "https://app.example.com/")).toEqual({ cancel: true });
    });

    describe("violation reports", () => {
      const report = serializeDomainCheckReport({
        manifestId: "swap",
        domains: ["https://*", "https://app.example.com"],
      });

      const sentViolations = (guest: Guest) =>
        (guest.hostWebContents?.send.mock.calls ?? []).map(([channel, violation]) => {
          expect(channel).toBe(CHANNELS.webviewDomainCheckViolation);
          return violation;
        });

      const violation = (outcome: string, origin = "https://evil.com") => ({
        origin,
        manifestId: "swap",
        appVersion: "2.130.0",
        platform: "desktop",
        frameType: "main_frame",
        kind: "navigation",
        outcome,
      });

      it("reports a blocked main-frame load with its origin only", () => {
        const guest = attachGuest(`${domains},${report}`);

        requestMainFrame(guest, "https://evil.com/send?address=0xabc#secret");

        expect(sentViolations(guest)).toEqual([violation("blocked")]);
      });

      it("reports what the strict domains would block while the check is off", () => {
        const guest = attachGuest(`${serializeAllowedOrigins(UNRESTRICTED_ORIGINS)},${report}`);

        expect(requestMainFrame(guest, "https://evil.com/path")).toEqual({});
        requestMainFrame(guest, "https://app.example.com/path");
        requestMainFrame(guest, "ledgerlive://discover");
        requestMainFrame(guest, "about:blank");

        expect(sentViolations(guest)).toEqual([violation("would_block")]);
      });

      it("reports what the strict domains would block while the check is on", () => {
        const guest = attachGuest(
          `${serializeAllowedOrigins(["https://*", "https://app.example.com"])},${report}`,
        );

        expect(requestMainFrame(guest, "https://evil.com/")).toEqual({});

        expect(sentViolations(guest)).toEqual([violation("would_block")]);
      });

      it("forwards every violation: the embedder deduplicates what Datadog records", () => {
        const guest = attachGuest(`${domains},${report}`);

        requestMainFrame(guest, "https://evil.com/a");
        requestMainFrame(guest, "https://evil.com/b");
        requestMainFrame(guest, "https://other.com/");

        expect(sentViolations(guest)).toEqual([
          violation("blocked"),
          violation("blocked"),
          violation("blocked", "https://other.com"),
        ]);
      });

      it("reports a blocked main frame without a manifest id when none was sent", () => {
        const guest = attachGuest(domains);

        requestMainFrame(guest, "https://evil.com/");

        expect(sentViolations(guest)).toEqual([{ ...violation("blocked"), manifestId: "unknown" }]);
      });

      it("does not report what is allowed when no report context was sent", () => {
        const guest = attachGuest(serializeAllowedOrigins(UNRESTRICTED_ORIGINS));

        requestMainFrame(guest, "https://evil.com/");

        expect(sentViolations(guest)).toEqual([]);
      });

      it.each(["will-navigate", "will-redirect"])("reports a main frame cancelled on %s", event => {
        const guest = attachGuest(`${domains},${report}`);

        emitWillEvent(guest, event, "https://evil.com/next");

        expect(sentViolations(guest)).toEqual([violation("blocked")]);
      });

      it("reports a disallowed main-frame commit", () => {
        const guest = attachGuest(`${domains},${report}`);

        emitDidFrameNavigate(guest, "https://evil.com/");

        expect(sentViolations(guest)).toEqual([violation("blocked")]);
      });

      it("reports a commit the strict domains would block", () => {
        const guest = attachGuest(`${serializeAllowedOrigins(UNRESTRICTED_ORIGINS)},${report}`);

        emitDidFrameNavigate(guest, "https://evil.com/");

        expect(guest.loadURL).not.toHaveBeenCalled();
        expect(sentViolations(guest)).toEqual([violation("would_block")]);
      });

      it("does not report subframes", () => {
        const guest = attachGuest(`${domains},${report}`);
        const [, listener] = getBeforeRequest();

        listener(
          { url: "https://3ds.bank.example/", resourceType: "subFrame", webContents: guest },
          jest.fn(),
        );
        emitDidFrameNavigate(guest, "https://3ds.bank.example/", false);

        expect(sentViolations(guest)).toEqual([]);
      });

      it("drops a report once the embedder is gone", () => {
        const guest = attachGuest(`${domains},${report}`);
        guest.hostWebContents?.isDestroyed.mockReturnValue(true);

        requestMainFrame(guest, "https://evil.com/");

        expect(sentViolations(guest)).toEqual([]);
      });
    });

    it.each(["will-navigate", "will-redirect"])(
      "cancels %s early for a main frame leaving the manifest origins",
      eventName => {
        const guest = attachGuest(domains);

        expect(emitWillEvent(guest, eventName, "https://evil.com/")).toHaveBeenCalled();
        expect(
          emitWillEvent(guest, eventName, "https://app.example.com/next"),
        ).not.toHaveBeenCalled();
        expect(emitWillEvent(guest, eventName, "https://evil.com/", false)).not.toHaveBeenCalled();
      },
    );

    describe("bridge messages", () => {
      beforeEach(() => {
        jest.spyOn(console, "warn").mockImplementation(() => {});
      });

      afterEach(() => {
        jest.mocked(console.warn).mockRestore();
      });

      type BridgeListener = (
        event: { sender: unknown; senderFrame: unknown },
        channel: unknown,
        message: unknown,
      ) => void;

      const sendBridgeMessage = (
        guest: Guest,
        {
          origin = "https://app.example.com",
          isMainFrame = true,
          channel = "webviewToParent" as unknown,
        } = {},
      ) => {
        const listener = jest
          .mocked(ipcMain.on)
          .mock.calls.find(([name]) => name === CHANNELS.webviewBridgeMessage)?.[1] as
          | BridgeListener
          | undefined;
        const embedder = { send: jest.fn(), isDestroyed: () => false };
        listener?.(
          {
            sender: { ...guest, hostWebContents: embedder },
            senderFrame: { origin, parent: isMainFrame ? null : {} },
          },
          channel,
          "payload",
        );
        return embedder.send;
      };

      it("hands the guest main frame's messages to the embedder, tagged with its origin", () => {
        const guest = attachGuest(domains);

        expect(sendBridgeMessage(guest, { channel: "dappToParent" })).toHaveBeenCalledWith(
          CHANNELS.webviewBridgeMessage,
          {
            guestId: 7,
            origin: "https://app.example.com",
            channel: "dappToParent",
            message: "payload",
          },
        );
      });

      it("drops messages from a subframe, even on an allowed origin", () => {
        const guest = attachGuest(domains);

        expect(sendBridgeMessage(guest, { isMainFrame: false })).not.toHaveBeenCalled();
      });

      it("drops messages from a main frame outside the manifest origins", () => {
        const guest = attachGuest(domains);

        expect(sendBridgeMessage(guest, { origin: "https://evil.com" })).not.toHaveBeenCalled();
        expect(sendBridgeMessage(guest, { origin: "null" })).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledWith(expect.any(String), {
          origin: "https://evil.com",
          isMainFrame: true,
        });
      });

      it("drops messages from a guest without allowed origins", () => {
        const guest = attachGuest("nativeWindowOpen=no");

        expect(sendBridgeMessage(guest)).not.toHaveBeenCalled();
      });

      it("drops messages on an unknown channel or from a non-webview sender", () => {
        const guest = attachGuest(domains);
        const window = { ...makeGuest(9), getType: jest.fn(() => "window") };

        expect(sendBridgeMessage(guest, { channel: "openWindow" })).not.toHaveBeenCalled();
        expect(sendBridgeMessage(window)).not.toHaveBeenCalled();
      });

      it("answers any main-frame web origin when the domain check is off", () => {
        const guest = attachGuest(serializeAllowedOrigins(UNRESTRICTED_ORIGINS));

        expect(sendBridgeMessage(guest, { origin: "https://evil.com" })).toHaveBeenCalled();
        expect(
          sendBridgeMessage(guest, { origin: "https://evil.com", isMainFrame: false }),
        ).not.toHaveBeenCalled();
      });
    });

    it("sends a guest that committed a disallowed main frame to about:blank", () => {
      const guest = attachGuest(domains);

      emitDidFrameNavigate(guest, "https://app.example.com/");
      emitDidFrameNavigate(guest, "https://evil.com/", false);
      expect(guest.loadURL).not.toHaveBeenCalled();

      emitDidFrameNavigate(guest, "https://evil.com/");
      expect(guest.loadURL).toHaveBeenCalledWith("about:blank");

      emitDidFrameNavigate(guest, "about:blank");
      expect(guest.loadURL).toHaveBeenCalledTimes(1);
    });
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
