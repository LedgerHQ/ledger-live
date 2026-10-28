import { ipcMain, type WebContents } from "electron";
import { CHANNELS, type BluetoothDeviceCandidate } from "~/bridge/contract";

export const BLUETOOTH_SELECTION_TIMEOUT_MS = 60_000;
/** An empty device id cancels the pending `navigator.bluetooth.requestDevice` call. */
const CANCEL_REQUEST = "";

type SelectionRequest = {
  requestId: number;
  webContents: WebContents;
  candidates: BluetoothDeviceCandidate[];
  /** Electron hands a fresh callback on every event; all of them answer the same chooser. */
  callback: (deviceId: string) => void;
  timeout: NodeJS.Timeout;
};

let pending: SelectionRequest | undefined;
let lastRequestId = 0;

function endRequest(request: SelectionRequest, deviceId: string): void {
  clearTimeout(request.timeout);
  if (pending === request) pending = undefined;
  request.callback(deviceId);
  if (!request.webContents.isDestroyed()) {
    request.webContents.send(CHANNELS.bluetoothSelectionEnd, request.requestId);
  }
}

// A chooser's device list only grows: a list missing a known candidate comes from a new
// `requestDevice` call, whose chooser replaced the previous one.
const isSameChooser = (request: SelectionRequest, devices: BluetoothDeviceCandidate[]) =>
  request.candidates.every(candidate =>
    devices.some(device => device.deviceId === candidate.deviceId),
  );

function onDevicesFound(
  webContents: WebContents,
  devices: Electron.BluetoothDevice[],
  callback: (deviceId: string) => void,
): void {
  const candidates = devices.map(({ deviceId, deviceName }) => ({ deviceId, deviceName }));

  if (pending && (pending.webContents !== webContents || !isSameChooser(pending, candidates))) {
    endRequest(pending, CANCEL_REQUEST);
  }

  if (pending) {
    pending.candidates = candidates;
    pending.callback = callback;
  } else {
    const requestId = ++lastRequestId;
    const request: SelectionRequest = {
      requestId,
      webContents,
      candidates,
      callback,
      timeout: setTimeout(
        () => endRequest(request, CANCEL_REQUEST),
        BLUETOOTH_SELECTION_TIMEOUT_MS,
      ),
    };
    pending = request;
  }

  webContents.send(CHANNELS.bluetoothSelectionRequest, {
    requestId: pending.requestId,
    devices: candidates,
  });
}

const cancelPendingOf = (webContents: WebContents) => {
  if (pending?.webContents === webContents) endRequest(pending, CANCEL_REQUEST);
};

/**
 * Electron has no Web Bluetooth chooser: the scan results are forwarded to the renderer,
 * which picks the device (in-app chooser or remembered device).
 */
export function setupBluetoothDeviceSelection(webContents: WebContents): void {
  webContents.on("select-bluetooth-device", (event, devices, callback) => {
    event.preventDefault();
    onDevicesFound(webContents, devices, callback);
  });
  // A reload drops the renderer chooser along with the page.
  webContents.on("did-navigate", () => cancelPendingOf(webContents));
  webContents.once("destroyed", () => cancelPendingOf(webContents));
}

ipcMain.on(
  CHANNELS.bluetoothSelectDevice,
  (event: Electron.IpcMainEvent, requestId: unknown, deviceId: unknown) => {
    if (!pending || event.sender.id !== pending.webContents.id || requestId !== pending.requestId)
      return;

    if (deviceId === null) {
      endRequest(pending, CANCEL_REQUEST);
      return;
    }

    const isCandidate = pending.candidates.some(candidate => candidate.deviceId === deviceId);
    if (typeof deviceId !== "string" || !isCandidate) {
      console.warn("Bluetooth selection cancelled: the device is not a scanned candidate.");
      endRequest(pending, CANCEL_REQUEST);
      return;
    }

    endRequest(pending, deviceId);
  },
);
