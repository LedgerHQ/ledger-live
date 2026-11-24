import { renderHook, act } from "@testing-library/react";
import { useEnvDevToolProps } from "./useEnvDevToolProps";

const mockUnsubscribe = jest.fn();
const mockSubscribe = jest.fn((_cb?: () => void) => ({ unsubscribe: mockUnsubscribe }));
const mockSetEnvUnsafe = jest.fn();
const mockGetAllEnvs = jest.fn(() => ({ MY_VAR: "hello" }));
const mockGetEnvDesc = jest.fn((_key: string) => "a description");
const mockIsEnvDefault = jest.fn((_key: string) => true);
const mockGetDefinition = jest.fn<{ def: string } | null, [string]>((_key: string) => ({
  def: "default_val",
}));

jest.mock("@shared/env", () => ({
  getAllEnvs: () => mockGetAllEnvs(),
  getEnvDesc: (key: string) => mockGetEnvDesc(key),
  isEnvDefault: (key: string) => mockIsEnvDefault(key),
  setEnvUnsafe: (key: string, value: string) => mockSetEnvUnsafe(key, value),
  getDefinition: (key: string) => mockGetDefinition(key),
  changes: { subscribe: (cb: () => void) => mockSubscribe(cb) },
}));

describe("useEnvDevToolProps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscribe.mockReturnValue({ unsubscribe: mockUnsubscribe });
    mockGetAllEnvs.mockReturnValue({ MY_VAR: "hello" });
    mockGetEnvDesc.mockReturnValue("a description");
    mockIsEnvDefault.mockReturnValue(true);
    mockGetDefinition.mockReturnValue({ def: "default_val" });
  });

  it("should build initial envVars snapshot from getAllEnvs", () => {
    const { result } = renderHook(() => useEnvDevToolProps());
    expect(result.current.envVars).toHaveLength(1);
    expect(result.current.envVars[0]).toMatchObject({
      key: "MY_VAR",
      value: "hello",
      defaultValue: "default_val",
      desc: "a description",
      isOverridden: false,
    });
  });

  it("should subscribe to changes on mount and unsubscribe on unmount", () => {
    const { unmount } = renderHook(() => useEnvDevToolProps());
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it("should rebuild envVars snapshot when changes fires", () => {
    const { result } = renderHook(() => useEnvDevToolProps());

    mockGetAllEnvs.mockReturnValue({ MY_VAR: "updated" });

    act(() => {
      const subscriberCallback = (mockSubscribe.mock.calls[0] as unknown as [() => void])[0];
      subscriberCallback();
    });

    expect(result.current.envVars[0].value).toBe("updated");
  });

  it("should call setEnvUnsafe when onOverride is invoked", () => {
    const { result } = renderHook(() => useEnvDevToolProps());
    act(() => {
      result.current.onOverride("MY_VAR", "new_value");
    });
    expect(mockSetEnvUnsafe).toHaveBeenCalledWith("MY_VAR", "new_value");
  });

  it("should call setEnvUnsafe with def value when onReset is invoked and definition exists", () => {
    const { result } = renderHook(() => useEnvDevToolProps());
    act(() => {
      result.current.onReset("MY_VAR");
    });
    expect(mockSetEnvUnsafe).toHaveBeenCalledWith("MY_VAR", "default_val");
  });

  it("should not call setEnvUnsafe when onReset is invoked and definition is null", () => {
    mockGetDefinition.mockReturnValue(null);
    const { result } = renderHook(() => useEnvDevToolProps());
    act(() => {
      result.current.onReset("UNKNOWN_VAR");
    });
    expect(mockSetEnvUnsafe).not.toHaveBeenCalled();
  });

  it("should mark isOverridden true when isEnvDefault returns false", () => {
    mockIsEnvDefault.mockReturnValue(false);
    const { result } = renderHook(() => useEnvDevToolProps());
    expect(result.current.envVars[0].isOverridden).toBe(true);
  });
});
