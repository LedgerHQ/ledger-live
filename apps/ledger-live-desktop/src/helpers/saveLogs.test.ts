/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcRenderer } from "electron";
import { memoryLogger } from "~/renderer/logger";
import { getJSONStringifyReplacer, saveLogs } from "./saveLogs";

jest.mock("electron", () => ({
  ipcRenderer: {
    invoke: jest.fn(),
  },
}));

jest.mock("~/renderer/logger", () => ({
  memoryLogger: {
    getMemoryLogs: jest.fn(),
  },
}));

describe("getJSONStringifyReplacer", () => {
  it("should properly format Uint8Array values", () => {
    // given
    const replacer = getJSONStringifyReplacer();
    const testObj = { buffer: new Uint8Array([250, 250]) };
    const json = JSON.stringify(testObj, replacer);

    // when
    const parsed = JSON.parse(json);

    // then
    expect(parsed.buffer).toEqual({
      hex: "0xfafa",
      readableHex: "fa fa",
      value: "250,250",
    });
  });

  it("should replace circular references with '[Circular]'", () => {
    //given
    const replacer = getJSONStringifyReplacer();
    const circularObj: any = { name: "circularObj" };
    circularObj.self = circularObj;
    const json = JSON.stringify(circularObj, replacer);

    // when
    const parsed = JSON.parse(json);

    // then
    expect(parsed.self).toBe("[Circular]");
  });
});

describe("saveLogs", () => {
  const fakePath = { filePath: "/fake/path" } as Electron.SaveDialogReturnValue;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should serialize logs and call ipcRenderer.invoke with correct arguments", async () => {
    // given
    const circularObj: any = { name: "circularObj" };
    circularObj.self = circularObj;
    const logs = { log: "test", circularObj };
    (memoryLogger.getMemoryLogs as jest.Mock).mockReturnValue(logs);
    (ipcRenderer.invoke as jest.Mock).mockResolvedValue(undefined);

    // when
    await saveLogs(fakePath);

    // then
    expect(ipcRenderer.invoke).toHaveBeenCalledTimes(1);
    expect(ipcRenderer.invoke).toHaveBeenCalledWith("save-logs", fakePath, expect.any(String));
    const serializedLogs = (ipcRenderer.invoke as jest.Mock).mock.calls[0][2];
    expect(serializedLogs).toContain("[Circular]");
  });

  it("should log an error if ipcRenderer.invoke rejects", async () => {
    // given
    const error = new Error("IPC error");
    (memoryLogger.getMemoryLogs as jest.Mock).mockReturnValue({ log: "test" });
    (ipcRenderer.invoke as jest.Mock).mockRejectedValue(error);
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // when
    await saveLogs(fakePath);

    // then
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error while requesting to save logs from the renderer process",
      error,
    );

    consoleErrorSpy.mockRestore();
  });
});
