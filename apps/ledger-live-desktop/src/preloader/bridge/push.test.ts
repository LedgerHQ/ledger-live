import { ipcRenderer } from "electron";
import { CHANNELS, type Unsubscribe } from "~/bridge/contract";
import { deeplink, updater } from "./push";

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

describe("preload push bridge", () => {
  beforeEach(() => mockListeners.clear());

  describe.each([
    {
      name: "updater.onStatus",
      channel: CHANNELS.updater,
      subscribe: (callback: (payload: unknown) => void): Unsubscribe => updater.onStatus(callback),
      payload: { status: "download-progress", payload: { percent: 42 } },
    },
    {
      name: "deeplink.onOpen",
      channel: CHANNELS.deepLinking,
      subscribe: (callback: (payload: unknown) => void): Unsubscribe => deeplink.onOpen(callback),
      payload: "ledgerlive://accounts",
    },
  ])("$name", ({ channel, subscribe, payload }) => {
    it("should deliver the payload only, never the IPC event", () => {
      const callback = jest.fn();
      const unsubscribe = subscribe(callback);

      emit(channel, payload);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(payload);
      unsubscribe();
    });

    it("should remove the exact listener it registered", () => {
      const unsubscribe = subscribe(jest.fn());
      const [, registered] = jest.mocked(ipcRenderer.on).mock.calls[0];

      unsubscribe();

      expect(ipcRenderer.removeListener).toHaveBeenCalledWith(channel, registered);
    });

    it("should stop delivering after unsubscribe", () => {
      const callback = jest.fn();
      subscribe(callback)();

      emit(channel, payload);

      expect(callback).not.toHaveBeenCalled();
    });

    it("should keep other subscriptions on the channel active", () => {
      const first = jest.fn();
      const second = jest.fn();
      const unsubscribeFirst = subscribe(first);
      const unsubscribeSecond = subscribe(second);

      unsubscribeFirst();
      emit(channel, payload);

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledWith(payload);
      unsubscribeSecond();
    });
  });

  it.each([
    ["updater.init", () => updater.init(), CHANNELS.updater, "init"],
    [
      "updater.quitAndInstall",
      () => updater.quitAndInstall(),
      CHANNELS.updater,
      "quit-and-install",
    ],
    [
      "deeplink.open",
      () => deeplink.open("ledgerlive://accounts"),
      CHANNELS.deepLinking,
      "ledgerlive://accounts",
    ],
  ])("%s should send on its channel", (_name, call, channel, arg) => {
    call();

    expect(ipcRenderer.send).toHaveBeenCalledWith(channel, arg);
  });
});
