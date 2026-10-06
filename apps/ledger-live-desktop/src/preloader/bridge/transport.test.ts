import { ipcRenderer } from "electron";
import { CHANNELS } from "~/bridge/contract";
import { transport } from "./transport";

jest.mock("electron", () => ({ ipcRenderer: { invoke: jest.fn() } }));

describe("preload transport bridge", () => {
  beforeEach(() => jest.mocked(ipcRenderer.invoke).mockReset());

  it.each([
    [
      "transportOpen",
      () => transport.open("r1", "descriptor", 1000),
      { requestId: "r1", descriptor: "descriptor", timeout: 1000 },
    ],
    [
      "transportExchange",
      () => transport.exchange("r1", "e0010000", 1000),
      { requestId: "r1", apdu: "e0010000", timeout: 1000 },
    ],
    ["transportClose", () => transport.close("r1"), { requestId: "r1" }],
    ["transportListen", () => transport.listen("r1"), { requestId: "r1" }],
    ["transportListenUnsubscribe", () => transport.listenUnsubscribe("r1"), { requestId: "r1" }],
  ] as const)(
    "should send %s on its own channel with the payload main expects",
    async (channel, call, payload) => {
      jest.mocked(ipcRenderer.invoke).mockResolvedValue("result");

      await expect(call()).resolves.toBe("result");
      expect(ipcRenderer.invoke).toHaveBeenCalledWith(CHANNELS[channel], payload);
    },
  );
});
