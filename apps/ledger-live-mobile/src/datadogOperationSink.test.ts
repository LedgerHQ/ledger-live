import { DdRum } from "@datadog/mobile-react-native";
import { createOperationTracker } from "@shared/observability-operations";
import { datadogOperationSink } from "./datadogOperationSink";

let mockIsDatadogRecording = true;

jest.mock("@datadog/mobile-react-native", () => require("@tests/mocks/datadogMobileReactNative"));
jest.mock("./datadog", () => ({
  isDatadogRecording: () => mockIsDatadogRecording,
}));

const startFeatureOperation = jest.mocked(DdRum.startFeatureOperation);
const succeedFeatureOperation = jest.mocked(DdRum.succeedFeatureOperation);
const failFeatureOperation = jest.mocked(DdRum.failFeatureOperation);

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

  it("should send a start as a RUM feature operation start", () => {
    datadogOperationSink.start("add_account", undefined, { currency_id: "bitcoin" });

    expect(startFeatureOperation).toHaveBeenCalledWith("add_account", null, {
      currency_id: "bitcoin",
    });
  });

  it("should send a success with its operation key", () => {
    datadogOperationSink.succeed("send", "account-1", { accounts_added: 1 });

    expect(succeedFeatureOperation).toHaveBeenCalledWith("send", "account-1", {
      accounts_added: 1,
    });
  });

  it.each(["ERROR", "ABANDONED", "OTHER"] as const)(
    "should send a %s failure with the matching RUM failure reason",
    reason => {
      datadogOperationSink.fail("add_account", undefined, reason, { trigger: "close" });

      expect(failFeatureOperation).toHaveBeenCalledWith("add_account", null, reason, {
        trigger: "close",
      });
    },
  );

  it("should swallow an SDK rejection", () => {
    const rejection = Promise.reject(new Error("bridge unavailable"));
    const catchSpy = jest.spyOn(rejection, "catch");
    startFeatureOperation.mockReturnValueOnce(rejection);

    expect(() => datadogOperationSink.start("add_account", undefined, {})).not.toThrow();
    expect(catchSpy).toHaveBeenCalledTimes(1);
  });

  it("should never let a throwing SDK reach the caller of the tracker", () => {
    const tracker = createOperationTracker();
    tracker.setSink(datadogOperationSink);
    startFeatureOperation.mockImplementationOnce(() => {
      throw new Error("native module missing");
    });
    failFeatureOperation.mockImplementationOnce(() => {
      throw new Error("native module missing");
    });

    expect(() => tracker.start("add_account")).not.toThrow();
    expect(() => tracker.fail("add_account", "ERROR")).not.toThrow();
    expect(failFeatureOperation).toHaveBeenCalledTimes(1);
    expect(tracker.isActive("add_account")).toBe(false);
  });
});
