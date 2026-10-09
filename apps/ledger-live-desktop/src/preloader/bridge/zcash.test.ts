import { ipcRenderer } from "electron";
import { ZCASH_IPC } from "@ledgerhq/coin-zcash/network/ipc/contract";
import { zcash } from "./zcash";

type Listener = (...args: unknown[]) => void;
const mockListeners = new Map<string, Set<Listener>>();

jest.mock("electron", () => ({
  ipcRenderer: {
    invoke: jest.fn(),
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

const UNKNOWN_CHANNEL = "zcash:unknown";

describe("preload zcash bridge", () => {
  beforeEach(() => mockListeners.clear());

  it.each(Object.values(ZCASH_IPC))("should proxy invoke on %s", async channel => {
    const args = { requestId: "1" };
    jest.mocked(ipcRenderer.invoke).mockResolvedValueOnce("result");

    await expect(zcash.invoke(channel, args)).resolves.toBe("result");
    expect(ipcRenderer.invoke).toHaveBeenCalledWith(channel, args);
  });

  it("should refuse to invoke an unknown channel", () => {
    expect(() => zcash.invoke(UNKNOWN_CHANNEL, {})).toThrow(UNKNOWN_CHANNEL);
    expect(ipcRenderer.invoke).not.toHaveBeenCalled();
  });

  it("should refuse to subscribe to an unknown channel", () => {
    expect(() => zcash.subscribe(UNKNOWN_CHANNEL, jest.fn())).toThrow(UNKNOWN_CHANNEL);
    expect(ipcRenderer.on).not.toHaveBeenCalled();
  });

  describe("subscribe", () => {
    const channel = ZCASH_IPC.stream;
    const payload = { requestId: "1", kind: "complete" };

    it("should deliver the payload only, never the IPC event", () => {
      const callback = jest.fn();
      const unsubscribe = zcash.subscribe(channel, callback);

      emit(channel, payload);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(payload);
      unsubscribe();
    });

    it("should remove the exact listener it registered", () => {
      const unsubscribe = zcash.subscribe(channel, jest.fn());
      const [, registered] = jest.mocked(ipcRenderer.on).mock.calls[0];

      unsubscribe();

      expect(ipcRenderer.removeListener).toHaveBeenCalledWith(channel, registered);
    });

    it("should stop delivering after unsubscribe", () => {
      const callback = jest.fn();
      zcash.subscribe(channel, callback)();

      emit(channel, payload);

      expect(callback).not.toHaveBeenCalled();
    });

    it("should keep other subscriptions on the channel active", () => {
      const first = jest.fn();
      const second = jest.fn();
      const unsubscribeFirst = zcash.subscribe(channel, first);
      const unsubscribeSecond = zcash.subscribe(channel, second);

      unsubscribeFirst();
      emit(channel, payload);

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledWith(payload);
      unsubscribeSecond();
    });
  });
});
