import { log } from "./internals/logger";
import { setCountervaluesLogger } from "./setCountervaluesLogger";

describe("setCountervaluesLogger", () => {
  it("drops diagnostics emitted before a logger is registered", () => {
    log("countervalues", "before setup");

    const logger = jest.fn();
    setCountervaluesLogger(logger);

    expect(logger).not.toHaveBeenCalled();
  });

  it("forwards each diagnostic to the registered logger with its arguments unchanged", () => {
    const logger = jest.fn();
    setCountervaluesLogger(logger);

    log("countervalues", "no data");
    log("countervaluesApi", "with data", { error: "boom" });

    expect(logger.mock.calls).toEqual([
      ["countervalues", "no data"],
      ["countervaluesApi", "with data", { error: "boom" }],
    ]);
    expect(logger.mock.calls[0]).toHaveLength(2);
  });

  it("replaces the previously registered logger", () => {
    const first = jest.fn();
    const second = jest.fn();
    setCountervaluesLogger(first);
    setCountervaluesLogger(second);

    log("countervalues", "after replace");

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith("countervalues", "after replace");
  });
});
