import { ipcRenderer } from "electron";
import { CHANNELS } from "~/bridge/contract";
import { db } from "./db";

jest.mock("electron", () => ({
  ipcRenderer: { invoke: jest.fn(), on: jest.fn(), removeListener: jest.fn(), send: jest.fn() },
}));

function receiveFlushRequest() {
  const [channel, listener] = jest.mocked(ipcRenderer.on).mock.calls[0];
  expect(channel).toBe(CHANNELS.flushWrites);
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  (listener as (event: unknown, requestId: number) => void)({}, 7);
  return listener;
}

describe("preload db bridge", () => {
  beforeEach(() => jest.clearAllMocks());

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

  it("answers a flush request once the callback settles", async () => {
    let finish: (() => void) | undefined;
    db.onFlushRequest(() => new Promise<void>(resolve => (finish = resolve)));

    receiveFlushRequest();
    await new Promise(process.nextTick);
    expect(ipcRenderer.send).not.toHaveBeenCalled();

    finish?.();
    await new Promise(process.nextTick);
    expect(ipcRenderer.send).toHaveBeenCalledWith(CHANNELS.flushWritesDone, 7);
  });

  it("answers a flush request when the callback fails", async () => {
    db.onFlushRequest(() => Promise.reject(new Error("store gone")));

    receiveFlushRequest();
    await new Promise(process.nextTick);

    expect(ipcRenderer.send).toHaveBeenCalledWith(CHANNELS.flushWritesDone, 7);
  });

  it("stops the flush requests on unsubscribe", () => {
    const unsubscribe = db.onFlushRequest(async () => {});
    const [, listener] = jest.mocked(ipcRenderer.on).mock.calls[0];

    unsubscribe();

    expect(ipcRenderer.removeListener).toHaveBeenCalledWith(CHANNELS.flushWrites, listener);
  });
});
