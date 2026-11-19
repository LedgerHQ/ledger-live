import { DdRum } from "@datadog/mobile-react-native";
import {
  RumOperation,
  failRumOperation,
  isRumOperationActive,
  resetRumOperationsForTests,
  startRumOperation,
  succeedRumOperation,
} from "../rumOperation";

let mockIsDatadogRecording = true;

jest.mock("@datadog/mobile-react-native", () => require("@tests/mocks/datadogMobileReactNative"));
jest.mock("~/datadog", () => ({
  isDatadogRecording: () => mockIsDatadogRecording,
}));

const startFeatureOperation = jest.mocked(DdRum.startFeatureOperation);
const succeedFeatureOperation = jest.mocked(DdRum.succeedFeatureOperation);
const failFeatureOperation = jest.mocked(DdRum.failFeatureOperation);

describe("rumOperation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRumOperationsForTests();
    mockIsDatadogRecording = true;
  });

  it("should send nothing when Datadog is not recording", () => {
    mockIsDatadogRecording = false;

    expect(startRumOperation(RumOperation.AddAccount)).toBe(false);
    expect(isRumOperationActive(RumOperation.AddAccount)).toBe(false);
    expect(succeedRumOperation(RumOperation.AddAccount)).toBe(false);
    expect(failRumOperation(RumOperation.AddAccount, "ERROR")).toBe(false);
    expect(startFeatureOperation).not.toHaveBeenCalled();
    expect(succeedFeatureOperation).not.toHaveBeenCalled();
    expect(failFeatureOperation).not.toHaveBeenCalled();
  });

  it("should keep the first start when an active operation is started again", () => {
    expect(startRumOperation(RumOperation.AddAccount, { attributes: { attempt: 1 } })).toBe(true);
    expect(startRumOperation(RumOperation.AddAccount, { attributes: { attempt: 2 } })).toBe(false);

    expect(startFeatureOperation).toHaveBeenCalledTimes(1);
    expect(startFeatureOperation).toHaveBeenCalledWith("add_account", null, { attempt: 1 });
    expect(isRumOperationActive(RumOperation.AddAccount)).toBe(true);
  });

  it("should send a single stop event when an operation is stopped twice", () => {
    startRumOperation(RumOperation.AddAccount);

    expect(succeedRumOperation(RumOperation.AddAccount)).toBe(true);
    expect(succeedRumOperation(RumOperation.AddAccount)).toBe(false);
    expect(failRumOperation(RumOperation.AddAccount, "ABANDONED")).toBe(false);

    expect(succeedFeatureOperation).toHaveBeenCalledTimes(1);
    expect(failFeatureOperation).not.toHaveBeenCalled();
    expect(isRumOperationActive(RumOperation.AddAccount)).toBe(false);
  });

  it("should drop a stop event when its start was not sent", () => {
    expect(succeedRumOperation(RumOperation.AddAccount)).toBe(false);
    expect(failRumOperation(RumOperation.AddAccount, "ERROR")).toBe(false);

    expect(succeedFeatureOperation).not.toHaveBeenCalled();
    expect(failFeatureOperation).not.toHaveBeenCalled();
  });

  it("should send the stop event when recording stopped after the start", () => {
    startRumOperation(RumOperation.AddAccount);
    mockIsDatadogRecording = false;

    expect(failRumOperation(RumOperation.AddAccount, "ERROR")).toBe(true);
    expect(failFeatureOperation).toHaveBeenCalledWith("add_account", null, "ERROR", {});
  });

  it("should merge the start attributes into the stop event and drop undefined values", () => {
    startRumOperation(RumOperation.AddAccount, {
      attributes: { currency_id: "bitcoin", context: undefined, attempt: 1 },
    });
    failRumOperation(RumOperation.AddAccount, "OTHER", {
      attributes: { outcome: "nothing_to_add", error_name: undefined, attempt: 2 },
    });

    expect(startFeatureOperation.mock.calls[0][2]).toStrictEqual({
      currency_id: "bitcoin",
      attempt: 1,
    });
    expect(failFeatureOperation).toHaveBeenCalledTimes(1);
    const [name, operationKey, reason, attributes] = failFeatureOperation.mock.calls[0];
    expect([name, operationKey, reason]).toEqual(["add_account", null, "OTHER"]);
    expect(attributes).toStrictEqual({
      currency_id: "bitcoin",
      attempt: 2,
      outcome: "nothing_to_add",
    });
  });

  it("should track each operation key separately", () => {
    expect(startRumOperation(RumOperation.Send, { operationKey: "a" })).toBe(true);
    expect(startRumOperation(RumOperation.Send, { operationKey: "b" })).toBe(true);
    expect(succeedRumOperation(RumOperation.Send, { operationKey: "a" })).toBe(true);

    expect(startFeatureOperation).toHaveBeenCalledWith("send", "a", {});
    expect(startFeatureOperation).toHaveBeenCalledWith("send", "b", {});
    expect(succeedFeatureOperation).toHaveBeenCalledWith("send", "a", {});
    expect(isRumOperationActive(RumOperation.Send, "a")).toBe(false);
    expect(isRumOperationActive(RumOperation.Send, "b")).toBe(true);
    expect(isRumOperationActive(RumOperation.Send)).toBe(false);
  });

  it("should swallow an SDK rejection", () => {
    const rejection = Promise.reject(new Error("bridge unavailable"));
    const catchSpy = jest.spyOn(rejection, "catch");
    startFeatureOperation.mockReturnValueOnce(rejection);

    expect(startRumOperation(RumOperation.AddAccount)).toBe(true);
    expect(catchSpy).toHaveBeenCalledTimes(1);
  });

  it("should swallow an SDK exception and still end the operation", () => {
    failFeatureOperation.mockImplementationOnce(() => {
      throw new Error("native module missing");
    });
    startRumOperation(RumOperation.AddAccount);

    expect(() => failRumOperation(RumOperation.AddAccount, "ERROR")).not.toThrow();
    expect(isRumOperationActive(RumOperation.AddAccount)).toBe(false);
  });

  it("should only declare operation names Datadog accepts", () => {
    for (const name of Object.values(RumOperation)) {
      expect(name).toMatch(/^[\w.@-]+$/);
    }
  });
});
