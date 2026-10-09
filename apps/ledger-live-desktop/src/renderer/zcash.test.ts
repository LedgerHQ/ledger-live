import {
  createZCashClient as createZCashIPCClient,
  setZCashIpcRenderer,
  type IpcRendererLike,
} from "@ledgerhq/coin-zcash/network/ZCashIPC";
import { zcash } from "~/renderer/bridge";
import { createZCashClient } from "./zcash";

jest.mock("@ledgerhq/coin-zcash/network/ZCashIPC", () => ({
  createZCashClient: jest.fn(),
  setZCashIpcRenderer: jest.fn(),
}));

jest.mock("~/renderer/bridge", () => ({
  zcash: { invoke: jest.fn(), subscribe: jest.fn() },
}));

const CHANNEL = "zcash:stream";
const ARGS = { grpcUrl: "https://zaino.example", network: "mainnet" };

const setup = (): IpcRendererLike => {
  createZCashClient(ARGS);
  return jest.mocked(setZCashIpcRenderer).mock.calls[0][0];
};

describe("createZCashClient", () => {
  it("should register the bridge before building the IPC client", () => {
    const client = {};
    jest.mocked(createZCashIPCClient).mockReturnValue(client as never);

    expect(createZCashClient(ARGS)).toBe(client);
    expect(createZCashIPCClient).toHaveBeenCalledWith(ARGS);
    expect(jest.mocked(setZCashIpcRenderer).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(createZCashIPCClient).mock.invocationCallOrder[0],
    );
  });

  it("should forward invoke to the bridge and return its result", async () => {
    jest.mocked(zcash.invoke).mockResolvedValue(42);
    const ipc = setup();

    await expect(ipc.invoke("zcash:getChainTip", { requestId: "1" })).resolves.toBe(42);
    expect(zcash.invoke).toHaveBeenCalledWith("zcash:getChainTip", { requestId: "1" });
  });

  it("should hand the listener the bridge payload in Electron's (event, payload) shape", () => {
    jest.mocked(zcash.subscribe).mockReturnValue(jest.fn());
    const listener = jest.fn();
    setup().on(CHANNEL, listener);
    const [channel, callback] = jest.mocked(zcash.subscribe).mock.calls[0];

    callback({ kind: "complete" });

    expect(channel).toBe(CHANNEL);
    expect(listener).toHaveBeenCalledWith(undefined, { kind: "complete" });
  });

  it("should unsubscribe a listener once when it is removed", () => {
    const unsubscribe = jest.fn();
    jest.mocked(zcash.subscribe).mockReturnValue(unsubscribe);
    const listener = jest.fn();
    const ipc = setup();
    ipc.on(CHANNEL, listener);

    ipc.removeListener(CHANNEL, listener);
    ipc.removeListener(CHANNEL, listener);

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("should ignore the removal of a listener it never subscribed", () => {
    const unsubscribe = jest.fn();
    jest.mocked(zcash.subscribe).mockReturnValue(unsubscribe);
    const ipc = setup();
    ipc.on(CHANNEL, jest.fn());

    expect(() => ipc.removeListener(CHANNEL, jest.fn())).not.toThrow();
    expect(unsubscribe).not.toHaveBeenCalled();
  });
});
