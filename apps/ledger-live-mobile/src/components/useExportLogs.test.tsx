import { renderHook, act } from "@testing-library/react-native";
import Share from "react-native-share";
import ReactNativeBlobUtil from "react-native-blob-util";
import { getEnv } from "@shared/env";
import { sendFile } from "~/e2e/bridge/client";
import useExportLogs from "./useExportLogs";

jest.mock("../log-report", () => ({
  __esModule: true,
  default: { getLogs: () => [{ type: "info", message: "hello" }] },
}));

jest.mock("~/logic/version", () => ({
  __esModule: true,
  default: () => "1.0.0",
}));

jest.mock("@shared/env", () => ({
  getEnv: jest.fn(() => false),
}));

jest.mock("~/e2e/bridge/client", () => ({
  sendFile: jest.fn(),
}));

const expectedPath = "/docs/ledgerwallet-mob-1.0.0-2026-09-22-logs.txt";

describe("useExportLogs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getEnv).mockReturnValue(false);
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-09-22T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should write logs to a file and open the share sheet", async () => {
    const { result } = renderHook(() => useExportLogs());

    await act(async () => {
      await result.current();
    });

    expect(ReactNativeBlobUtil.fs.writeFile).toHaveBeenCalledWith(
      expectedPath,
      expect.stringContaining("hello"),
      "utf8",
    );
    expect(Share.open).toHaveBeenCalledWith({
      failOnCancel: false,
      saveToFiles: true,
      type: "text/plain",
      url: `file://${expectedPath}`,
    });
  });

  it("should send the log file through the Detox bridge when DETOX is set", async () => {
    jest.mocked(getEnv).mockReturnValue(true);
    jest.mocked(ReactNativeBlobUtil.fs.readFile).mockResolvedValue("YmFzZTY0");

    const { result } = renderHook(() => useExportLogs());

    await act(async () => {
      await result.current();
    });

    expect(ReactNativeBlobUtil.fs.readFile).toHaveBeenCalledWith(expectedPath, "base64");
    expect(sendFile).toHaveBeenCalledWith({
      fileName: "ledgerwallet-logs.txt",
      fileContent: "YmFzZTY0",
    });
    expect(Share.open).not.toHaveBeenCalled();
  });
});
