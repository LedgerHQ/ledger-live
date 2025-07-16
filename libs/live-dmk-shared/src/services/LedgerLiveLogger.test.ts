import { log } from "@ledgerhq/logs";
import { LedgerLiveLogger } from "./LedgerLiveLogger";
import { LogLevel } from "@ledgerhq/device-management-kit";

vi.mock("@ledgerhq/logs", () => ({
  log: vi.fn(),
}));

describe("LedgerLiveLogger", () => {
  const options = { tag: "test", timestamp: Date.now(), data: { key: "value" } };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs a message when the log level is less than or equal to maxLevel", () => {
    //given
    const logger = new LedgerLiveLogger(LogLevel.Debug);

    //when
    logger.log(LogLevel.Debug, "debug message", options);

    //then
    expect(log).toHaveBeenCalledWith("live-dmk-logger", "debug message", {
      level: LogLevel.Debug,
      ...options,
    });
  });

  it("does not log a message when the log level is above maxLevel", () => {
    //given
    const logger = new LedgerLiveLogger(LogLevel.Info);

    //when
    logger.log(LogLevel.Debug, "debug message", options);

    //then
    expect(log).not.toHaveBeenCalled();
  });

  it("logs a message when the level is null", () => {
    //given
    const logger = new LedgerLiveLogger(LogLevel.Error);

    //when
    logger.log(null, "null level message", options);

    //then
    expect(log).toHaveBeenCalledWith("live-dmk-logger", "null level message", {
      level: null,
      ...options,
    });
  });
});
