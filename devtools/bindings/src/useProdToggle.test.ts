import { renderHook, act } from "@testing-library/react";
import { useProdToggle } from "./useProdToggle";

const mockUnsubscribe = jest.fn();
const mockSubscribe = jest.fn((_cb?: () => void) => ({ unsubscribe: mockUnsubscribe }));
const mockGetEnv = jest.fn((key: string) => `url-for-${key}`);

jest.mock("@shared/env", () => ({
  getEnv: (key: string) => mockGetEnv(key),
  changes: { subscribe: (cb: () => void) => mockSubscribe(cb) },
}));

describe("useProdToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscribe.mockReturnValue({ unsubscribe: mockUnsubscribe });
    mockGetEnv.mockImplementation((key: string) => `url-for-${key}`);
  });

  it("should start with useProd=false", () => {
    const { result } = renderHook(() => useProdToggle());
    expect(result.current.useProd).toBe(false);
  });

  it("should use staging URLs when useProd is false", () => {
    const { result } = renderHook(() => useProdToggle());
    expect(result.current.trustchainApiBaseUrl).toBe("url-for-TRUSTCHAIN_API_STAGING");
    expect(result.current.cloudSyncApiBaseUrl).toBe("url-for-CLOUD_SYNC_API_STAGING");
  });

  it("should use prod URLs when setUseProd(true) is called", () => {
    const { result } = renderHook(() => useProdToggle());
    act(() => {
      result.current.setUseProd(true);
    });
    expect(result.current.useProd).toBe(true);
    expect(result.current.trustchainApiBaseUrl).toBe("url-for-TRUSTCHAIN_API_PROD");
    expect(result.current.cloudSyncApiBaseUrl).toBe("url-for-CLOUD_SYNC_API_PROD");
  });

  it("should subscribe to changes on mount", () => {
    renderHook(() => useProdToggle());
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
  });

  it("should unsubscribe from changes on unmount", () => {
    const { unmount } = renderHook(() => useProdToggle());
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it("should re-render (forceUpdate) when changes fires", () => {
    const { result } = renderHook(() => useProdToggle());
    const urlBefore = result.current.trustchainApiBaseUrl;

    mockGetEnv.mockImplementation((key: string) => `new-url-for-${key}`);

    act(() => {
      const cb = (mockSubscribe.mock.calls[0] as unknown as [() => void])[0];
      cb();
    });

    expect(result.current.trustchainApiBaseUrl).toBe("new-url-for-TRUSTCHAIN_API_STAGING");
    expect(result.current.trustchainApiBaseUrl).not.toBe(urlBefore);
  });
});
