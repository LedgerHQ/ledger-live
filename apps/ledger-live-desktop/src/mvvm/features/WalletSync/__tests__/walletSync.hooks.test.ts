import { renderHook, waitFor } from "tests/testSetup";
import { LedgerSyncErrorMessage } from "@features/flow-ledger-sync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useLifeCycle } from "../hooks/walletSync.hooks";

function keyRingError(name: string): Error {
  return Object.assign(new Error(name), { name });
}

const Mocks = {
  dispatch: jest.fn(),
  resetKeyRingState: jest.fn(),
  setFlow: jest.fn(),
  track: jest.fn(),
  invalidateAuth: jest.fn(),
  restore: jest.fn(() => new Promise(() => {})),
};

jest.mock("LLD/hooks/redux", () => ({
  ...jest.requireActual("LLD/hooks/redux"),
  useDispatch: () => Mocks.dispatch,
}));

jest.mock("@features/platform-key-ring", () => ({
  ...jest.requireActual("@features/platform-key-ring"),
  resetKeyRingState: () => {
    Mocks.resetKeyRingState();
    return { type: "test/resetKeyRingState" };
  },
}));

jest.mock("~/renderer/actions/walletSync", () => ({
  setFlow: (payload: unknown) => ({ type: "WALLET_SYNC_CHANGE_FLOW", payload }),
}));

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: (event: string) => Mocks.track(event),
}));

jest.mock("../hooks/useKeyRingClient", () => ({
  useKeyRingClient: () => ({ invalidateAuth: Mocks.invalidateAuth, restore: Mocks.restore }),
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

  it("should restore the trustchain on TrustchainOutdated", async () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(keyRingError("TrustchainOutdated"));

    await waitFor(() => expect(Mocks.restore).toHaveBeenCalled());
    expect(Mocks.resetKeyRingState).not.toHaveBeenCalled();
  });

  it("should reset when error message includes NO_TRUSTCHAIN", () => {
    const { result } = renderHook(() => useLifeCycle());
    result.current.handleError(new Error(LedgerSyncErrorMessage.noTrustchain));

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
