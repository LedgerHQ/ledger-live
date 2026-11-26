import { track } from "@shared/analytics";
import { renderHook } from "@tests/test-renderer";
import { useLifeCycle } from "../useLifeCycle";
import { ErrorType } from "../type.hooks";

const mockDispatch = jest.fn();
const mockNavigationDispatch = jest.fn();
const mockInvalidateAuth = jest.fn();
const mockRefetch = jest.fn();
const mockResetKeyRingState = jest.fn();
const mockedTrack = jest.mocked(track);

jest.mock("~/context/hooks", () => ({
  ...jest.requireActual("~/context/hooks"),
  useDispatch: () => mockDispatch,
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ dispatch: mockNavigationDispatch }),
  StackActions: { replace: jest.fn((...args: unknown[]) => ({ type: "REPLACE", ...args })) },
}));

jest.mock("@features/platform-key-ring", () => ({
  ...jest.requireActual("@features/platform-key-ring"),
  resetKeyRingState: () => mockResetKeyRingState(),
}));

jest.mock("../useKeyRingClient", () => ({
  useKeyRingClient: () => ({ invalidateAuth: mockInvalidateAuth }),
}));

jest.mock("../useRestoreTrustchain", () => ({
  useRestoreTrustchain: () => ({ refetch: mockRefetch }),
}));

// The v1 SDK errors reach the app unchanged: only their name identifies them.
function keyRingSdkError(name: string): Error {
  const error = new Error();
  error.name = name;
  return error;
}

describe("useLifeCycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should expose handleError function", () => {
    const { result } = renderHook(() => useLifeCycle());
    expect(result.current.handleError).toBeInstanceOf(Function);
  });

  it("should reset on TrustchainEjected", () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(keyRingSdkError("TrustchainEjected"));

    expect(mockResetKeyRingState).toHaveBeenCalled();
    expect(mockedTrack).toHaveBeenCalledWith("ledgersync_deactivated");
    expect(mockNavigationDispatch).toHaveBeenCalled();
    expect(mockInvalidateAuth).toHaveBeenCalled();
  });

  it("should reset on TrustchainNotAllowed", () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(keyRingSdkError("TrustchainNotAllowed"));

    expect(mockResetKeyRingState).toHaveBeenCalled();
    expect(mockedTrack).toHaveBeenCalledWith("ledgersync_deactivated");
    expect(mockNavigationDispatch).toHaveBeenCalled();
    expect(mockInvalidateAuth).toHaveBeenCalled();
  });

  it("should call restoreTrustchain on TrustchainOutdated", () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(keyRingSdkError("TrustchainOutdated"));

    expect(mockRefetch).toHaveBeenCalled();
    expect(mockResetKeyRingState).not.toHaveBeenCalled();
  });

  it("should reset when error message includes NO_TRUSTCHAIN", () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(new Error(ErrorType.NO_TRUSTCHAIN));

    expect(mockResetKeyRingState).toHaveBeenCalled();
    expect(mockedTrack).toHaveBeenCalledWith("ledgersync_deactivated");
    expect(mockNavigationDispatch).toHaveBeenCalled();
    expect(mockInvalidateAuth).toHaveBeenCalled();
  });

  it("should reset when error message includes NULL query key pattern", () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(new Error(ErrorType.NULL));

    expect(mockResetKeyRingState).toHaveBeenCalled();
    expect(mockedTrack).toHaveBeenCalledWith("ledgersync_deactivated");
    expect(mockInvalidateAuth).toHaveBeenCalled();
  });

  it("should not reset for unknown errors", () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(new Error("some random error"));

    expect(mockResetKeyRingState).not.toHaveBeenCalled();
    expect(mockedTrack).not.toHaveBeenCalledWith("ledgersync_deactivated");
    expect(mockRefetch).not.toHaveBeenCalled();
  });
});
