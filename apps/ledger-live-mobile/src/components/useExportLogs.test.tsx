import useExportLogs from "./useExportLogs";
import { renderHook, act } from "@tests/test-renderer";
import Share from "react-native-share";
import { setEnv } from "@shared/env";
import type { Log } from "@ledgerhq/logs";
import logger from "../logger";
import logReport from "../log-report";
import { sendFile } from "~/e2e/bridge/client";

jest.mock("../log-report", () => ({
  __esModule: true,
  default: { getLogs: jest.fn(() => []) },
}));

jest.mock("../logger", () => ({
  __esModule: true,
  default: { critical: jest.fn() },
}));

jest.mock("~/e2e/bridge/client", () => ({
  sendFile: jest.fn(),
}));

describe("useExportLogs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(logReport.getLogs).mockReturnValue([]);
    setEnv("DETOX", "");
  });

  afterEach(() => {
    setEnv("DETOX", "");
  });

  it("writes the serialized logs to a file and opens the share sheet", async () => {
    const log: Log = { id: "1", date: new Date(), type: "info", message: "hello" };
    jest.mocked(logReport.getLogs).mockReturnValue([log]);

    const { result } = renderHook(() => useExportLogs());

    await act(async () => {
      await result.current();
    });

    expect(jest.mocked(Share.open)).toHaveBeenCalledTimes(1);
    const options = jest.mocked(Share.open).mock.calls[0][0];
    expect(options).toMatchObject({
      failOnCancel: false,
      saveToFiles: true,
      type: "text/plain",
    });
    expect(options.url).toMatch(/^file:\/\/\/mock\/document\/ledgerwallet-mob-.*-logs\.txt$/);
    expect(sendFile).not.toHaveBeenCalled();
  });

  it("sends the file over the e2e bridge instead of sharing when DETOX is enabled", async () => {
    setEnv("DETOX", "1");

    const { result } = renderHook(() => useExportLogs());

    await act(async () => {
      await result.current();
    });

    expect(sendFile).toHaveBeenCalledWith({
      fileName: "ledgerwallet-logs.txt",
      fileContent: "",
    });
    expect(Share.open).not.toHaveBeenCalled();
  });

  it("ignores a concurrent export while one is already running", async () => {
    const { result } = renderHook(() => useExportLogs());

    await act(async () => {
      await Promise.all([result.current(), result.current()]);
    });

    expect(Share.open).toHaveBeenCalledTimes(1);
  });

  it("swallows a share sheet cancellation without logging it", async () => {
    jest.mocked(Share.open).mockRejectedValueOnce({ error: { code: "ECANCELLED500" } });

    const { result } = renderHook(() => useExportLogs());

    await act(async () => {
      await result.current();
    });

    expect(logger.critical).not.toHaveBeenCalled();
  });

  it("logs any other error as critical", async () => {
    const error = new Error("boom");
    jest.mocked(Share.open).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useExportLogs());

    await act(async () => {
      await result.current();
    });

    expect(logger.critical).toHaveBeenCalledWith(error);
  });
});
