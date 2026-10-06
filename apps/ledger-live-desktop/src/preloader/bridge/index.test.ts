import { contextBridge, ipcRenderer } from "electron";
import { BOOTSTRAP_VERSION, CHANNELS, type Bootstrap, type LedgerBridge } from "~/bridge/contract";
import { installBridge } from "./index";

jest.mock("electron", () => ({
  contextBridge: { exposeInMainWorld: jest.fn() },
  ipcRenderer: { sendSync: jest.fn(), invoke: jest.fn() },
}));

const installAndGetBridge = (): LedgerBridge => {
  Object.defineProperty(process, "contextIsolated", { value: true, configurable: true });
  jest.mocked(ipcRenderer.sendSync).mockReturnValue({
    version: BOOTSTRAP_VERSION,
    env: { NODE_ENV: "test" },
    store: { a: { b: 1 } },
  });

  installBridge();
  const [, bridge] = jest.mocked(contextBridge.exposeInMainWorld).mock.calls[0];
  return bridge as LedgerBridge;
};

describe("installBridge", () => {
  it("should freeze the whole bootstrap snapshot", () => {
    const { bootstrap } = installAndGetBridge();
    const store = bootstrap.store as Record<string, Bootstrap["store"]>;

    expect(Object.isFrozen(bootstrap)).toBe(true);
    expect(Object.isFrozen(bootstrap.env)).toBe(true);
    expect(Object.isFrozen(store.a)).toBe(true);
  });

  it("should hand the card session over only once per page load", async () => {
    jest.mocked(ipcRenderer.invoke).mockResolvedValue('{"accessToken":"secret"}');
    const { cardSession } = installAndGetBridge();

    await expect(cardSession.takeBootstrap()).resolves.toBe('{"accessToken":"secret"}');
    await expect(cardSession.takeBootstrap()).resolves.toBeNull();
    expect(ipcRenderer.invoke).toHaveBeenCalledTimes(1);
    expect(ipcRenderer.invoke).toHaveBeenCalledWith(CHANNELS.cardSessionBootstrap);
  });
});
