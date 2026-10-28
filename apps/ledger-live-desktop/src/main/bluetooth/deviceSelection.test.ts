import { ipcMain } from "electron";
import { CHANNELS, type BluetoothSelectionRequest } from "~/bridge/contract";
import { BLUETOOTH_SELECTION_TIMEOUT_MS, setupBluetoothDeviceSelection } from "./deviceSelection";

jest.mock("electron", () => ({ ipcMain: { on: jest.fn() } }));

type Listener = (...args: unknown[]) => void;

// Captured before restoreMocks clears the registration calls.
const [[, selectDeviceListener]] = jest.mocked(ipcMain.on).mock.calls as [string, Listener][];

const FLEX = { deviceId: "flex-id", deviceName: "Ledger Flex" };
const STAX = { deviceId: "stax-id", deviceName: "Ledger Stax" };

function makeWebContents() {
  const listeners = new Map<string, Listener>();
  const register = (event: string, listener: Listener) => listeners.set(event, listener);
  const webContents = {
    id: 1,
    on: jest.fn(register),
    once: jest.fn(register),
    send: jest.fn(),
    isDestroyed: jest.fn(() => false),
  };
  setupBluetoothDeviceSelection(webContents as unknown as Electron.WebContents);

  const scan = (devices: Electron.BluetoothDevice[]) => {
    const callback = jest.fn();
    const preventDefault = jest.fn();
    listeners.get("select-bluetooth-device")?.({ preventDefault }, devices, callback);
    return { callback, preventDefault };
  };
  const lastRequest = (): BluetoothSelectionRequest => {
    const requests = webContents.send.mock.calls.filter(
      ([channel]) => channel === CHANNELS.bluetoothSelectionRequest,
    );
    return requests[requests.length - 1][1];
  };
  const select = (requestId: unknown, deviceId: unknown, sender: unknown = webContents) =>
    selectDeviceListener({ sender }, requestId, deviceId);
  const emit = (event: string) => listeners.get(event)?.();

  return { webContents, scan, lastRequest, select, emit };
}

describe("setupBluetoothDeviceSelection", () => {
  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    // Ends any request left pending: the selection state is module-wide.
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should forward the scanned devices to the renderer instead of picking one", () => {
    const { webContents, scan, lastRequest } = makeWebContents();

    const { callback, preventDefault } = scan([FLEX]);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(callback).not.toHaveBeenCalled();
    expect(webContents.send).toHaveBeenCalledWith(CHANNELS.bluetoothSelectionRequest, {
      requestId: lastRequest().requestId,
      devices: [FLEX],
    });
  });

  it("should keep the request id while the scan list grows and answer the latest callback", () => {
    const { webContents, scan, lastRequest, select } = makeWebContents();

    const first = scan([]);
    const { requestId } = lastRequest();
    scan([FLEX]);
    const latest = scan([FLEX, STAX]);

    expect(lastRequest()).toEqual({ requestId, devices: [FLEX, STAX] });

    select(requestId, STAX.deviceId);

    expect(first.callback).not.toHaveBeenCalled();
    expect(latest.callback).toHaveBeenCalledWith(STAX.deviceId);
    expect(webContents.send).toHaveBeenCalledWith(CHANNELS.bluetoothSelectionEnd, requestId);
  });

  it("should cancel when the renderer selects null", () => {
    const { webContents, scan, lastRequest, select } = makeWebContents();
    const { callback } = scan([FLEX]);
    const { requestId } = lastRequest();

    select(requestId, null);

    expect(callback).toHaveBeenCalledWith("");
    expect(webContents.send).toHaveBeenCalledWith(CHANNELS.bluetoothSelectionEnd, requestId);
  });

  it.each([
    ["an id outside of the candidates", "spoofed-id"],
    ["a non-string id", 42],
  ])("should cancel instead of selecting %s", (_name, deviceId) => {
    const { scan, lastRequest, select } = makeWebContents();
    const { callback } = scan([FLEX]);

    select(lastRequest().requestId, deviceId);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("");
  });

  it("should ignore answers for another request or from another sender", () => {
    const { webContents, scan, lastRequest, select } = makeWebContents();
    const { callback } = scan([FLEX]);
    const { requestId } = lastRequest();

    select(requestId + 1, FLEX.deviceId);
    select(requestId, FLEX.deviceId, { id: 2 });

    expect(callback).not.toHaveBeenCalled();
    expect(webContents.send).not.toHaveBeenCalledWith(
      CHANNELS.bluetoothSelectionEnd,
      expect.anything(),
    );
  });

  it("should end a request once: a late answer is ignored", () => {
    const { scan, lastRequest, select } = makeWebContents();
    const { callback } = scan([FLEX]);
    const { requestId } = lastRequest();

    select(requestId, FLEX.deviceId);
    select(requestId, null);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(FLEX.deviceId);
  });

  it("should supersede the pending request when a new scan starts", () => {
    const { webContents, scan, lastRequest } = makeWebContents();
    const previous = scan([FLEX]);
    const previousId = lastRequest().requestId;

    scan([]);

    expect(previous.callback).toHaveBeenCalledWith("");
    expect(webContents.send).toHaveBeenCalledWith(CHANNELS.bluetoothSelectionEnd, previousId);
    expect(lastRequest()).toEqual({ requestId: previousId + 1, devices: [] });
  });

  it("should cancel the request after the timeout", () => {
    const { webContents, scan, lastRequest } = makeWebContents();
    const { callback } = scan([FLEX]);
    const { requestId } = lastRequest();

    jest.advanceTimersByTime(BLUETOOTH_SELECTION_TIMEOUT_MS - 1);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledWith("");
    expect(webContents.send).toHaveBeenCalledWith(CHANNELS.bluetoothSelectionEnd, requestId);
  });

  it("should not time out a request that was answered", () => {
    const { scan, lastRequest, select } = makeWebContents();
    const { callback } = scan([FLEX]);

    select(lastRequest().requestId, FLEX.deviceId);
    jest.advanceTimersByTime(BLUETOOTH_SELECTION_TIMEOUT_MS);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should cancel the pending request when the page navigates", () => {
    const { scan, emit } = makeWebContents();
    const { callback } = scan([FLEX]);

    emit("did-navigate");

    expect(callback).toHaveBeenCalledWith("");
  });
});
