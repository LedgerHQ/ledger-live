import { ipcMain, webContents as allWebContents } from "electron";
import { BLUETOOTH_PAIRING_TIMEOUT_MS, CHANNELS } from "~/bridge/contract";
import { setupBluetoothPairing } from "./pairing";

jest.mock("electron", () => ({
  ipcMain: { on: jest.fn() },
  webContents: { fromFrame: jest.fn() },
}));

type Listener = (...args: unknown[]) => void;
type PairingHandler = Parameters<Electron.Session["setBluetoothPairingHandler"]>[0];

// Captured before restoreMocks clears the registration calls.
const [[, pairingResponseListener]] = jest.mocked(ipcMain.on).mock.calls as [string, Listener][];

const MAIN_WINDOW_ID = 1;
const mainFrame = { name: "main-frame" } as unknown as Electron.WebFrameMain;
const guestFrame = { name: "guest-frame" } as unknown as Electron.WebFrameMain;

function setup() {
  let handler: PairingHandler = null;
  const webContents = {
    id: MAIN_WINDOW_ID,
    send: jest.fn(),
    session: {
      setBluetoothPairingHandler: jest.fn((next: PairingHandler) => {
        handler = next;
      }),
    },
  };
  jest
    .mocked(allWebContents.fromFrame)
    .mockImplementation(frame =>
      frame === mainFrame ? (webContents as unknown as Electron.WebContents) : undefined,
    );
  setupBluetoothPairing(webContents as unknown as Electron.WebContents);

  const requestPairing = (
    details: Partial<Electron.BluetoothPairingHandlerHandlerDetails> = {},
  ) => {
    const callback = jest.fn();
    handler?.(
      {
        deviceId: "flex-id",
        pairingKind: "confirmPin",
        pin: "123456",
        frame: mainFrame,
        ...details,
      },
      callback,
    );
    return callback;
  };
  const lastRequestId = (): number => {
    const requests = webContents.send.mock.calls;
    return requests[requests.length - 1][1].requestId;
  };
  const respond = (requestId: unknown, response: unknown, sender: unknown = webContents) =>
    pairingResponseListener({ sender }, requestId, response);

  return { webContents, requestPairing, lastRequestId, respond };
}

describe("setupBluetoothPairing", () => {
  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    // Ends any request left pending: the pairing state is module-wide.
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should refuse Just Works pairing without asking the renderer", () => {
    const { webContents, requestPairing } = setup();

    const callback = requestPairing({ pairingKind: "confirm", pin: undefined });

    expect(callback).toHaveBeenCalledWith({ confirmed: false });
    expect(webContents.send).not.toHaveBeenCalled();
  });

  it.each([
    ["a webview guest", guestFrame],
    ["a destroyed frame", null],
  ])("should refuse pairing requested by %s", (_name, frame) => {
    const { webContents, requestPairing } = setup();

    const callback = requestPairing({ frame });

    expect(callback).toHaveBeenCalledWith({ confirmed: false });
    expect(webContents.send).not.toHaveBeenCalled();
  });

  it("should forward a pin confirmation and wait for the user", () => {
    const { webContents, requestPairing, lastRequestId } = setup();

    const callback = requestPairing();

    expect(callback).not.toHaveBeenCalled();
    expect(webContents.send).toHaveBeenCalledWith(CHANNELS.bluetoothPairingRequest, {
      requestId: lastRequestId(),
      deviceId: "flex-id",
      pairingKind: "confirmPin",
      pin: "123456",
    });
  });

  it.each([
    ["confirmPin", { confirmed: true }, { confirmed: true }],
    ["confirmPin", { confirmed: false }, { confirmed: false }],
    ["confirmPin", { confirmed: "yes" }, { confirmed: false }],
    ["confirmPin", null, { confirmed: false }],
    ["providePin", { confirmed: true, pin: "654321" }, { confirmed: true, pin: "654321" }],
    ["providePin", { confirmed: true }, { confirmed: false }],
    ["providePin", { confirmed: true, pin: "12ab56" }, { confirmed: false }],
  ] as const)("%s: should answer %j with %j", (pairingKind, response, expected) => {
    const { requestPairing, lastRequestId, respond } = setup();
    const callback = requestPairing({ pairingKind, pin: undefined });

    respond(lastRequestId(), response);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(expected);
  });

  it("should ignore answers for another request or from another sender", () => {
    const { requestPairing, lastRequestId, respond } = setup();
    const callback = requestPairing();
    const requestId = lastRequestId();

    respond(requestId + 1, { confirmed: true });
    respond(requestId, { confirmed: true }, { id: 2 });

    expect(callback).not.toHaveBeenCalled();
  });

  it("should refuse the pending pairing when a new one starts", () => {
    const { requestPairing, lastRequestId, respond } = setup();
    const previous = requestPairing();
    const previousId = lastRequestId();
    const next = requestPairing();

    respond(previousId, { confirmed: true });

    expect(previous).toHaveBeenCalledWith({ confirmed: false });
    expect(next).not.toHaveBeenCalled();
  });

  it("should refuse the pairing after the timeout", () => {
    const { requestPairing } = setup();
    const callback = requestPairing();

    jest.advanceTimersByTime(BLUETOOTH_PAIRING_TIMEOUT_MS - 1);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledWith({ confirmed: false });
  });
});
