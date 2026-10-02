import { contextBridge } from "electron";
import type { Bootstrap, LedgerBridge } from "~/bridge/contract";
import { installBridge } from "./index";

jest.mock("electron", () => ({
  contextBridge: { exposeInMainWorld: jest.fn() },
  ipcRenderer: {
    sendSync: jest.fn(() => ({ version: 1, env: { NODE_ENV: "test" }, store: { a: { b: 1 } } })),
    invoke: jest.fn(),
  },
}));

describe("installBridge", () => {
  it("should freeze the whole bootstrap snapshot", () => {
    Object.defineProperty(process, "contextIsolated", { value: true, configurable: true });

    installBridge();
    const [, bridge] = jest.mocked(contextBridge.exposeInMainWorld).mock.calls[0];
    const { bootstrap } = bridge as LedgerBridge;
    const store = bootstrap.store as Record<string, Bootstrap["store"]>;

    expect(Object.isFrozen(bootstrap)).toBe(true);
    expect(Object.isFrozen(bootstrap.env)).toBe(true);
    expect(Object.isFrozen(store.a)).toBe(true);
  });
});
