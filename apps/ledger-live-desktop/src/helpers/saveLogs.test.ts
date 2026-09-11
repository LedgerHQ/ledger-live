/* eslint-disable @typescript-eslint/no-explicit-any */
import { files } from "~/renderer/bridge";
import { memoryLogger } from "~/renderer/logger";
import { getJSONStringifyReplacer, saveLogs } from "./saveLogs";

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
  const fakeRequest = { options: { defaultPath: "/fake/path" } };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should serialize logs and hand them to the bridge with correct arguments", async () => {
    // given
    const circularObj: any = { name: "circularObj" };
    circularObj.self = circularObj;
    const logs = { log: "test", circularObj };
    (memoryLogger.getMemoryLogs as jest.Mock).mockReturnValue(logs);
    jest.mocked(files.saveLogs).mockResolvedValue("saved");

    // when
    await saveLogs(fakeRequest);

    // then
    expect(files.saveLogs).toHaveBeenCalledTimes(1);
    expect(files.saveLogs).toHaveBeenCalledWith(fakeRequest, expect.any(String));
    const serializedLogs = jest.mocked(files.saveLogs).mock.calls[0][1];
    expect(serializedLogs).toContain("[Circular]");
  });

  it("should log an error if the bridge call rejects", async () => {
    // given
    const error = new Error("IPC error");
    (memoryLogger.getMemoryLogs as jest.Mock).mockReturnValue({ log: "test" });
    jest.mocked(files.saveLogs).mockRejectedValue(error);
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    // when
    await saveLogs(fakeRequest);

    // then
    expect(consoleWarnSpy).toHaveBeenCalledWith("Failed to save logs:", error);

    consoleWarnSpy.mockRestore();
  });
});
