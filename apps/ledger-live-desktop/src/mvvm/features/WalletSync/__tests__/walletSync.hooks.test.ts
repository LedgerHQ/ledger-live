import { renderHook } from "tests/testSetup";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useLifeCycle } from "../hooks/walletSync.hooks";
import { ErrorType } from "../hooks/type.hooks";

function keyRingError(name: string): Error {
  return Object.assign(new Error(name), { name });
}

const Mocks = {
  dispatch: jest.fn(),
  resetKeyRingState: jest.fn(),
  setFlow: jest.fn(),
  track: jest.fn(),
  invalidateAuth: jest.fn(),
  refetch: jest.fn(),
};

jest.mock("LLD/hooks/redux", () => ({
  ...jest.requireActual("LLD/hooks/redux"),
  useDispatch: () => Mocks.dispatch,
}));

jest.mock("@features/platform-key-ring", () => ({
  ...jest.requireActual("@features/platform-key-ring"),
  resetKeyRingState: () => Mocks.resetKeyRingState(),
}));

jest.mock("~/renderer/actions/walletSync", () => ({
  setFlow: (payload: unknown) => ({ type: "WALLET_SYNC_CHANGE_FLOW", payload }),
}));

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: (event: string) => Mocks.track(event),
}));

jest.mock("../hooks/useKeyRingClient", () => ({
  useKeyRingClient: () => ({ invalidateAuth: Mocks.invalidateAuth }),
}));

jest.mock("../hooks/useRestoreTrustchain", () => ({
  useRestoreTrustchain: () => ({ refetch: Mocks.refetch }),
}));

describe("useLifeCycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should expose handleError function", () => {
    const { result } = renderHook(() => useLifeCycle());
    expect(result.current.handleError).toBeInstanceOf(Function);
  });

  it("should reset and track on TrustchainEjected", () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(keyRingError("TrustchainEjected"));

    expect(Mocks.resetKeyRingState).toHaveBeenCalled();
    expect(Mocks.track).toHaveBeenCalledWith("ledgersync_deactivated");
    expect(Mocks.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "WALLET_SYNC_CHANGE_FLOW",
        payload: { flow: Flow.Activation, step: Step.CreateOrSynchronize },
      }),
    );
    expect(Mocks.invalidateAuth).toHaveBeenCalled();
  });

  it("should reset and track on TrustchainNotAllowed", () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(keyRingError("TrustchainNotAllowed"));

    expect(Mocks.resetKeyRingState).toHaveBeenCalled();
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
    result.current.handleError(keyRingError("TrustchainOutdated"));

    expect(Mocks.refetch).toHaveBeenCalled();
    expect(Mocks.resetKeyRingState).not.toHaveBeenCalled();
  });

  it("should reset when error message includes NO_TRUSTCHAIN", () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(new Error(ErrorType.NO_TRUSTCHAIN));

    expect(Mocks.resetKeyRingState).toHaveBeenCalled();
    expect(Mocks.track).toHaveBeenCalledWith("ledgersync_deactivated");
    expect(Mocks.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "WALLET_SYNC_CHANGE_FLOW",
        payload: { flow: Flow.Activation, step: Step.CreateOrSynchronize },
      }),
    );
  });
});
