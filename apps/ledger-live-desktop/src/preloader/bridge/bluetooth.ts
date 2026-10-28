import { ipcRenderer } from "electron";
import {
  CHANNELS,
  type BluetoothBridge,
  type BluetoothPairingRequest,
  type BluetoothPairingResponse,
  type BluetoothSelectionRequest,
} from "~/bridge/contract";
import { subscribe } from "./subscribe";

export const bluetooth: BluetoothBridge = {
  onSelectionRequest: (callback: (request: BluetoothSelectionRequest) => void) =>
    subscribe<BluetoothSelectionRequest>(CHANNELS.bluetoothSelectionRequest, callback),
  onSelectionEnd: (callback: (requestId: number) => void) =>
    subscribe<number>(CHANNELS.bluetoothSelectionEnd, callback),
  selectDevice: (requestId: number, deviceId: string | null) =>
    ipcRenderer.send(CHANNELS.bluetoothSelectDevice, requestId, deviceId),
  onPairingRequest: (callback: (request: BluetoothPairingRequest) => void) =>
    subscribe<BluetoothPairingRequest>(CHANNELS.bluetoothPairingRequest, callback),
  respondToPairing: (requestId: number, response: BluetoothPairingResponse) =>
    ipcRenderer.send(CHANNELS.bluetoothPairingResponse, requestId, response),
};
