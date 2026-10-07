import { ipcRenderer } from "electron";
import { CHANNELS } from "~/bridge/contract";
import { db } from "./db";

jest.mock("electron", () => ({ ipcRenderer: { invoke: jest.fn() } }));

describe("preload db bridge", () => {
  beforeEach(() => jest.mocked(ipcRenderer.invoke).mockReset());

  it.each([
    [
      "getKey",
      () => db.getKey("app", "settings", 1),
      [{ ns: "app", keyPath: "settings", defaultValue: 1 }],
    ],
    [
      "setKey",
      () => db.setKey("app", "settings", { a: 1 }),
      [{ ns: "app", keyPath: "settings", value: { a: 1 } }],
    ],
    [
      "hasEncryptionKey",
      () => db.hasEncryptionKey("app", "accounts"),
      [{ ns: "app", keyPath: "accounts" }],
    ],
    [
      "setEncryptionKey",
      () => db.setEncryptionKey("next", "current"),
      [{ encryptionKey: "next", currentEncryptionKey: "current" }],
    ],
    [
      "removeEncryptionKey",
      () => db.removeEncryptionKey("current"),
      [{ currentEncryptionKey: "current" }],
    ],
    ["isEncryptionKeyCorrect", () => db.isEncryptionKeyCorrect("pw"), [{ encryptionKey: "pw" }]],
    ["hasBeenDecrypted", () => db.hasBeenDecrypted(), [{}]],
    ["resetAll", () => db.resetAll(), []],
    ["reload", () => db.reload(), []],
    ["cleanCache", () => db.cleanCache(), []],
  ] as const)(
    "should send %s on its own channel with the payload main expects",
    async (channel, call, args) => {
      jest.mocked(ipcRenderer.invoke).mockResolvedValue("result");

      await expect(call()).resolves.toBe("result");
      expect(ipcRenderer.invoke).toHaveBeenCalledWith(CHANNELS[channel], ...args);
    },
  );
});
