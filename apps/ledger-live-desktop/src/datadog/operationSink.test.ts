import { datadogRum } from "@datadog/browser-rum";
import { createOperationTracker } from "@shared/observability-operations";
import { datadogOperationSink } from "./operationSink";

let mockIsDatadogRecording = true;

jest.mock("@datadog/browser-rum", () => ({
  datadogRum: {
    startOperation: jest.fn(),
    succeedOperation: jest.fn(),
    failOperation: jest.fn(),
  },
}));

jest.mock("./renderer", () => ({
  isDatadogRecording: () => mockIsDatadogRecording,
}));

const startOperation = jest.mocked(datadogRum.startOperation);
const succeedOperation = jest.mocked(datadogRum.succeedOperation);
const failOperation = jest.mocked(datadogRum.failOperation);

describe("datadogOperationSink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDatadogRecording = true;
  });

  it("should record while Datadog records", () => {
    expect(datadogOperationSink.isRecording()).toBe(true);

    mockIsDatadogRecording = false;

    expect(datadogOperationSink.isRecording()).toBe(false);
  });

  it("should send a start as a RUM operation start with its attributes as context", () => {
    datadogOperationSink.start("add_account", undefined, { currency_id: "bitcoin" });

    expect(startOperation).toHaveBeenCalledWith("add_account", {
      operationKey: undefined,
      context: { currency_id: "bitcoin" },
    });
  });

  it("should send a success with its operation key", () => {
    datadogOperationSink.succeed("send", "account-1", { accounts_added: 1 });

    expect(succeedOperation).toHaveBeenCalledWith("send", {
      operationKey: "account-1",
      context: { accounts_added: 1 },
    });
  });

  it.each([
    ["ERROR", "error"],
    ["ABANDONED", "abandoned"],
    ["OTHER", "other"],
  ] as const)("should send a %s failure as the %s RUM failure reason", (reason, rumReason) => {
    datadogOperationSink.fail("add_account", undefined, reason, { trigger: "close" });

    expect(failOperation).toHaveBeenCalledWith("add_account", rumReason, {
      operationKey: undefined,
      context: { trigger: "close" },
    });
  });

  it("should never let a throwing SDK reach the caller of the tracker", () => {
    const tracker = createOperationTracker();
    tracker.setSink(datadogOperationSink);
    startOperation.mockImplementationOnce(() => {
      throw new Error("sdk failed");
    });
    failOperation.mockImplementationOnce(() => {
      throw new Error("sdk failed");
    });

    expect(() => tracker.start("add_account")).not.toThrow();
    expect(() => tracker.fail("add_account", "ERROR")).not.toThrow();
    expect(failOperation).toHaveBeenCalledTimes(1);
    expect(tracker.isActive("add_account")).toBe(false);
  });
});
