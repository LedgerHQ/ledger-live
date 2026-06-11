import { app, ipcMain, session, webContents } from "electron";
import { setupWebviewHandlers } from "./webviewHandlers";

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
      },
    },
  },
  webContents: {
    fromId: jest.fn(),
  },
}));

type DomReadyHandler = (event: Electron.IpcMainEvent, id: number, domains?: string[]) => void;
type WebContentsCreatedHandler = (event: Electron.Event, contents: Electron.WebContents) => void;
type SchemeGuard = (event: Electron.Event<{ url: string }>) => void;

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
