import { ipcRenderer } from "electron";
import { CHANNELS, type Unsubscribe } from "~/bridge/contract";
import { bluetooth } from "./bluetooth";

type Listener = (...args: unknown[]) => void;
const mockListeners = new Map<string, Set<Listener>>();

jest.mock("electron", () => ({
  ipcRenderer: {
    send: jest.fn(),
    on: jest.fn((channel: string, listener: Listener) => {
      if (!mockListeners.has(channel)) mockListeners.set(channel, new Set());
      mockListeners.get(channel)?.add(listener);
    }),
    removeListener: jest.fn((channel: string, listener: Listener) => {
      mockListeners.get(channel)?.delete(listener);
    }),
  },
}));

const emit = (channel: string, payload: unknown) =>
  mockListeners
    .get(channel)
    ?.forEach(listener => listener({ sender: "privileged-web-contents" }, payload));

describe("preload bluetooth bridge", () => {
  beforeEach(() => mockListeners.clear());

  it.each([
    [
      "onSelectionRequest",
      (callback: (payload: unknown) => void): Unsubscribe => bluetooth.onSelectionRequest(callback),
      CHANNELS.bluetoothSelectionRequest,
      { requestId: 1, devices: [{ deviceId: "flex-id", deviceName: "Ledger Flex" }] },
    ],
    [
      "onSelectionEnd",
      (callback: (payload: unknown) => void): Unsubscribe => bluetooth.onSelectionEnd(callback),
      CHANNELS.bluetoothSelectionEnd,
      1,
    ],
    [
      "onPairingRequest",
      (callback: (payload: unknown) => void): Unsubscribe => bluetooth.onPairingRequest(callback),
      CHANNELS.bluetoothPairingRequest,
      { requestId: 2, deviceId: "flex-id", pairingKind: "confirmPin", pin: "123456" },
    ],
  ])(
    "%s should deliver the payload of its channel until unsubscribed",
    (_name, subscribe, channel, payload) => {
      const callback = jest.fn();
      const unsubscribe = subscribe(callback);

      emit(channel, payload);
      unsubscribe();
      emit(channel, payload);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(payload);
    },
  );

  it.each([
    [
      "selectDevice with an id",
      () => bluetooth.selectDevice(1, "flex-id"),
      CHANNELS.bluetoothSelectDevice,
      [1, "flex-id"],
    ],
    [
      "selectDevice with null",
      () => bluetooth.selectDevice(1, null),
      CHANNELS.bluetoothSelectDevice,
      [1, null],
    ],
    [
      "respondToPairing",
      () => bluetooth.respondToPairing(2, { confirmed: true, pin: "123456" }),
      CHANNELS.bluetoothPairingResponse,
      [2, { confirmed: true, pin: "123456" }],
    ],
  ])("%s should send on its channel", (_name, call, channel, args) => {
    call();

    expect(ipcRenderer.send).toHaveBeenCalledWith(channel, ...args);
  });
});
