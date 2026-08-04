import { ipcRenderer } from "electron";
import { CHANNELS } from "~/bridge/contract";
import { app, dialogs, files, power, store } from "./shell";

jest.mock("electron", () => ({ ipcRenderer: { send: jest.fn(), invoke: jest.fn() } }));

describe("preload shell bridge", () => {
  it.each([
    ["app.reload", () => app.reload(), CHANNELS.appReload, []],
    ["app.relaunch", () => app.relaunch(), CHANNELS.appRelaunch, []],
    ["app.quit", () => app.quit(), CHANNELS.appQuit, []],
    ["app.show", () => app.show(), CHANNELS.showApp, [{}]],
    ["store.set", () => store.set("a.b", 1), CHANNELS.storeSet, ["a.b", 1]],
    ["store.clear", () => store.clear(), CHANNELS.storeClear, []],
  ] as const)("%s should send on its channel", (_name, call, channel, args) => {
    call();

    expect(ipcRenderer.send).toHaveBeenCalledWith(channel, ...args);
  });

  it.each([
    [
      "dialogs.showSave",
      () => dialogs.showSave({ defaultPath: "logs.json" }),
      CHANNELS.showSaveDialog,
      [{ defaultPath: "logs.json" }],
    ],
    [
      "files.saveLogs",
      () => files.saveLogs({ canceled: false, filePath: "/tmp/logs.json" }, "[]"),
      CHANNELS.saveLogs,
      [{ canceled: false, filePath: "/tmp/logs.json" }, "[]"],
    ],
    [
      "files.exportOperations",
      () => files.exportOperations({ canceled: false, filePath: "/tmp/ops.csv" }, "csv"),
      CHANNELS.exportOperations,
      [{ canceled: false, filePath: "/tmp/ops.csv" }, "csv"],
    ],
    [
      "files.openUserDataDirectory",
      () => files.openUserDataDirectory(),
      CHANNELS.openUserDataDirectory,
      [],
    ],
    ["power.keepScreenAwake", () => power.keepScreenAwake(), CHANNELS.keepScreenAwake, []],
    ["power.release", () => power.release(7), CHANNELS.releaseScreenAwake, [7]],
  ] as const)(
    "%s should invoke its channel and return the result",
    async (_name, call, channel, args) => {
      jest.mocked(ipcRenderer.invoke).mockResolvedValue("result");

      await expect(call()).resolves.toBe("result");
      expect(ipcRenderer.invoke).toHaveBeenCalledWith(channel, ...args);
    },
  );
});
