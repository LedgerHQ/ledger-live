import { renderHook } from "@tests/test-renderer";
import { useLifeCycle } from "../useLifeCycle";
import {
  TrustchainEjected,
  TrustchainNotAllowed,
  TrustchainOutdated,
} from "@ledgerhq/ledger-key-ring-protocol/errors";
import { ErrorType } from "../type.hooks";

const mockDispatch = jest.fn();
const mockNavigationDispatch = jest.fn();
const mockInvalidateJwt = jest.fn();
const mockRefetch = jest.fn();
const mockResetTrustchainStore = jest.fn();
const mockTrack = jest.fn();

jest.mock("~/context/hooks", () => ({
  ...jest.requireActual("~/context/hooks"),
  useDispatch: () => mockDispatch,
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ dispatch: mockNavigationDispatch }),
  StackActions: { replace: jest.fn((...args: unknown[]) => ({ type: "REPLACE", ...args })) },
}));

jest.mock("@ledgerhq/ledger-key-ring-protocol/store", () => ({
  ...jest.requireActual("@ledgerhq/ledger-key-ring-protocol/store"),
  resetTrustchainStore: () => mockResetTrustchainStore(),
}));

jest.mock("~/analytics", () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

jest.mock("../useTrustchainSdk", () => ({
  useTrustchainSdk: () => ({ invalidateJwt: mockInvalidateJwt }),
}));

jest.mock("../useRestoreTrustchain", () => ({
  useRestoreTrustchain: () => ({ refetch: mockRefetch }),
}));

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
    result.current.handleError(new TrustchainEjected());

    expect(mockResetTrustchainStore).toHaveBeenCalled();
    expect(mockTrack).toHaveBeenCalledWith("ledgersync_deactivated");
    expect(mockNavigationDispatch).toHaveBeenCalled();
    expect(mockInvalidateJwt).toHaveBeenCalled();
  });

  it("should reset on TrustchainNotAllowed", () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(new TrustchainNotAllowed());

    expect(mockResetTrustchainStore).toHaveBeenCalled();
    expect(mockTrack).toHaveBeenCalledWith("ledgersync_deactivated");
    expect(mockNavigationDispatch).toHaveBeenCalled();
    expect(mockInvalidateJwt).toHaveBeenCalled();
  });

  it("should call restoreTrustchain on TrustchainOutdated", () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(new TrustchainOutdated());

    expect(mockRefetch).toHaveBeenCalled();
    expect(mockResetTrustchainStore).not.toHaveBeenCalled();
  });

  it("should reset when error message includes NO_TRUSTCHAIN", () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(new Error(ErrorType.NO_TRUSTCHAIN));

    expect(mockResetTrustchainStore).toHaveBeenCalled();
    expect(mockTrack).toHaveBeenCalledWith("ledgersync_deactivated");
    expect(mockNavigationDispatch).toHaveBeenCalled();
    expect(mockInvalidateJwt).toHaveBeenCalled();
  });

  it("should reset when error message includes NULL query key pattern", () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(new Error(ErrorType.NULL));

    expect(mockResetTrustchainStore).toHaveBeenCalled();
    expect(mockTrack).toHaveBeenCalledWith("ledgersync_deactivated");
    expect(mockInvalidateJwt).toHaveBeenCalled();
  });

  it("should not reset for unknown errors", () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(new Error("some random error"));

    expect(mockResetTrustchainStore).not.toHaveBeenCalled();
    expect(mockTrack).not.toHaveBeenCalledWith("ledgersync_deactivated");
    expect(mockRefetch).not.toHaveBeenCalled();
  });
});
