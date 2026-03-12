import { renderHook } from "tests/testSetup";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useLifeCycle } from "../hooks/walletSync.hooks";
import {
  TrustchainEjected,
  TrustchainNotAllowed,
  TrustchainOutdated,
} from "@ledgerhq/ledger-key-ring-protocol/errors";
import { ErrorType } from "../hooks/type.hooks";

const Mocks = {
  dispatch: jest.fn(),
  resetTrustchainStore: jest.fn(),
  setFlow: jest.fn(),
  track: jest.fn(),
  invalidateJwt: jest.fn(),
  refetch: jest.fn(),
};

jest.mock("LLD/hooks/redux", () => ({
  ...jest.requireActual("LLD/hooks/redux"),
  useDispatch: () => Mocks.dispatch,
}));

jest.mock("@ledgerhq/ledger-key-ring-protocol/store", () => ({
  ...jest.requireActual("@ledgerhq/ledger-key-ring-protocol/store"),
  resetTrustchainStore: () => Mocks.resetTrustchainStore(),
}));

jest.mock("~/renderer/actions/walletSync", () => ({
  setFlow: (payload: unknown) => ({ type: "WALLET_SYNC_CHANGE_FLOW", payload }),
}));

jest.mock("~/renderer/analytics/segment", () => ({
  track: (event: string) => Mocks.track(event),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

jest.mock("../hooks/useTrustchainSdk", () => ({
  useTrustchainSdk: () => ({ invalidateJwt: Mocks.invalidateJwt }),
}));

jest.mock("../hooks/useRestoreTrustchain", () => ({
  useRestoreTrustchain: () => ({ refetch: Mocks.refetch }),
}));

describe("useLifeCycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should expose handleError function", () => {
    const { result } = renderHook(() => useLifeCycle());
    expect(result.current.handleError).toBeInstanceOf(Function);
  });

  it("should reset and track on TrustchainEjected", () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(new TrustchainEjected());

    expect(Mocks.resetTrustchainStore).toHaveBeenCalled();
    expect(Mocks.track).toHaveBeenCalledWith("ledgersync_deactivated");
    expect(Mocks.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "WALLET_SYNC_CHANGE_FLOW",
        payload: { flow: Flow.Activation, step: Step.CreateOrSynchronize },
      }),
    );
    expect(Mocks.invalidateJwt).toHaveBeenCalled();
  });

  it("should reset and track on TrustchainNotAllowed", () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(new TrustchainNotAllowed());

    expect(Mocks.resetTrustchainStore).toHaveBeenCalled();
    expect(Mocks.track).toHaveBeenCalledWith("ledgersync_deactivated");
    expect(Mocks.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "WALLET_SYNC_CHANGE_FLOW",
        payload: { flow: Flow.Activation, step: Step.CreateOrSynchronize },
      }),
    );
  });

  it("should call restoreTrustchain refetch on TrustchainOutdated", () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(new TrustchainOutdated());

    expect(Mocks.refetch).toHaveBeenCalled();
    expect(Mocks.resetTrustchainStore).not.toHaveBeenCalled();
  });

  it("should reset when error message includes NO_TRUSTCHAIN", () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(new Error(ErrorType.NO_TRUSTCHAIN));

    expect(Mocks.resetTrustchainStore).toHaveBeenCalled();
    expect(Mocks.track).toHaveBeenCalledWith("ledgersync_deactivated");
    expect(Mocks.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "WALLET_SYNC_CHANGE_FLOW",
        payload: { flow: Flow.Activation, step: Step.CreateOrSynchronize },
      }),
    );
  });
});
