import { DdRum } from "@datadog/mobile-react-native";
import { act, renderHook } from "@tests/test-renderer";
import {
  RumOperation,
  isRumOperationActive,
  resetRumOperationsForTests,
  startRumOperation,
} from "LLM/utils/rumOperation";
import { useRumOperation } from "../useRumOperation";

jest.mock("@datadog/mobile-react-native", () => require("@tests/mocks/datadogMobileReactNative"));
jest.mock("~/datadog", () => ({ isDatadogRecording: () => true }));

const failFeatureOperation = jest.mocked(DdRum.failFeatureOperation);

describe("useRumOperation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRumOperationsForTests();
  });

  it("should keep the same handlers across renders", () => {
    const { result, rerender } = renderHook(() => useRumOperation(RumOperation.AddAccount));
    const first = result.current;

    rerender({});

    expect(result.current).toBe(first);
    expect(result.current.start).toBe(first.start);
    expect(result.current.succeed).toBe(first.succeed);
    expect(result.current.fail).toBe(first.fail);
    expect(result.current.isActive).toBe(first.isActive);
  });

  it("should abandon the operation it started when unmounted", () => {
    const { result, unmount } = renderHook(() => useRumOperation(RumOperation.AddAccount));
    act(() => {
      result.current.start({ attempt: 1 });
    });

    unmount();

    expect(failFeatureOperation).toHaveBeenCalledWith("add_account", null, "ABANDONED", {
      attempt: 1,
      trigger: "unmount",
    });
    expect(isRumOperationActive(RumOperation.AddAccount)).toBe(false);
  });

  it("should not abandon the operation when unmounted after a success", () => {
    const { result, unmount } = renderHook(() => useRumOperation(RumOperation.AddAccount));
    act(() => {
      result.current.start();
      result.current.succeed({ accounts_added: 1 });
    });

    unmount();

    expect(failFeatureOperation).not.toHaveBeenCalled();
  });

  it("should not abandon an operation another component started", () => {
    startRumOperation(RumOperation.AddAccount);
    const { result, unmount } = renderHook(() => useRumOperation(RumOperation.AddAccount));
    act(() => {
      expect(result.current.start()).toBe(false);
    });

    unmount();

    expect(failFeatureOperation).not.toHaveBeenCalled();
    expect(isRumOperationActive(RumOperation.AddAccount)).toBe(true);
  });

  it("should not abandon the operation on unmount when abandonOnUnmount is false", () => {
    const { result, unmount } = renderHook(() =>
      useRumOperation(RumOperation.AddAccount, { abandonOnUnmount: false }),
    );
    act(() => {
      result.current.start();
    });

    unmount();

    expect(failFeatureOperation).not.toHaveBeenCalled();
    expect(isRumOperationActive(RumOperation.AddAccount)).toBe(true);
  });

  it("should drive the operation instance of its operation key", () => {
    const { result } = renderHook(() =>
      useRumOperation(RumOperation.Send, { operationKey: "account-1" }),
    );
    act(() => {
      result.current.start();
    });

    expect(result.current.isActive()).toBe(true);
    expect(isRumOperationActive(RumOperation.Send, "account-1")).toBe(true);
    expect(isRumOperationActive(RumOperation.Send)).toBe(false);

    act(() => {
      result.current.fail("ERROR", { error_name: "DisconnectedDevice" });
    });

    expect(failFeatureOperation).toHaveBeenCalledWith("send", "account-1", "ERROR", {
      error_name: "DisconnectedDevice",
    });
    expect(result.current.isActive()).toBe(false);
  });
});
