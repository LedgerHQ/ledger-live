import { ipcMain, webContents as allWebContents, type WebContents } from "electron";
import {
  BLUETOOTH_PAIRING_TIMEOUT_MS,
  BLUETOOTH_PASSKEY_PATTERN,
  CHANNELS,
  type BluetoothPairingKind,
  type BluetoothPairingRequest,
  type BluetoothPairingResponse,
} from "~/bridge/contract";

const REFUSED: BluetoothPairingResponse = { confirmed: false };

type PairingRequest = {
  requestId: number;
  webContents: WebContents;
  pairingKind: BluetoothPairingKind;
  callback: (response: BluetoothPairingResponse) => void;
  timeout: NodeJS.Timeout;
};

let pending: PairingRequest | undefined;
let lastRequestId = 0;

function endRequest(request: PairingRequest, response: BluetoothPairingResponse): void {
  clearTimeout(request.timeout);
  if (pending === request) pending = undefined;
  request.callback(response);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** Anything but an explicit, well-formed confirmation refuses the pairing. */
function toPairingResponse(
  pairingKind: BluetoothPairingKind,
  response: unknown,
): BluetoothPairingResponse {
  if (!isRecord(response) || response.confirmed !== true) return REFUSED;
  if (pairingKind === "confirmPin") return { confirmed: true };
  const { pin } = response;
  return typeof pin === "string" && BLUETOOTH_PASSKEY_PATTERN.test(pin)
    ? { confirmed: true, pin }
    : REFUSED;
}

const isFromWebContents = (frame: Electron.WebFrameMain | null, webContents: WebContents) =>
  frame !== null && allWebContents.fromFrame(frame)?.id === webContents.id;

/**
 * Windows and Linux pairing prompts (macOS pairs through the OS). Electron cancels them
 * without a handler. Just Works (`confirm`) is unauthenticated, so it is refused; the pin
 * kinds go to the renderer and are never confirmed without the user.
 */
export function setupBluetoothPairing(webContents: WebContents): void {
  webContents.session.setBluetoothPairingHandler((details, callback) => {
    if (details.pairingKind === "confirm" || !isFromWebContents(details.frame, webContents)) {
      callback(REFUSED);
      return;
    }

    if (pending) endRequest(pending, REFUSED);

    const requestId = ++lastRequestId;
    const request: PairingRequest = {
      requestId,
      webContents,
      pairingKind: details.pairingKind,
      callback,
      timeout: setTimeout(() => endRequest(request, REFUSED), BLUETOOTH_PAIRING_TIMEOUT_MS),
    };
    pending = request;

    const pairingRequest: BluetoothPairingRequest = {
      requestId,
      deviceId: details.deviceId,
      pairingKind: details.pairingKind,
      ...(details.pin === undefined ? {} : { pin: details.pin }),
    };
    webContents.send(CHANNELS.bluetoothPairingRequest, pairingRequest);
  });
}

ipcMain.on(
  CHANNELS.bluetoothPairingResponse,
  (event: Electron.IpcMainEvent, requestId: unknown, response: unknown) => {
    if (!pending || event.sender.id !== pending.webContents.id || requestId !== pending.requestId)
      return;
    endRequest(pending, toPairingResponse(pending.pairingKind, response));
  },
);
