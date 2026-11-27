/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "tests/testSetup";
import { mockKeyRingTreeRecord } from "@domain/entity-key-ring/schema.mock";
import { keyRingTreeUpdateFixture } from "@features/platform-key-ring/testing";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { AnalyticsFlow } from "../hooks/useLedgerSyncAnalytics";
import { useAddMember } from "../hooks/useAddMember";
import { INITIAL_STATE } from "~/renderer/reducers/settings";

jest.mock("~/renderer/reducers/walletSync", () => ({
  ...jest.requireActual("~/renderer/reducers/walletSync"),
  walletSyncOnboardingNewDeviceSelector: jest.fn().mockReturnValue(false),
}));

const device = { deviceId: "", modelId: DeviceModelId.stax, wired: true };
const TREE_RECORD = mockKeyRingTreeRecord();
const tree = keyRingTreeUpdateFixture(TREE_RECORD);

function keyRingError(name: string): Error {
  return Object.assign(new Error(name), { name });
}

const Mocks = {
  sdk: { activate: jest.fn() },
  setFlow: jest.fn(),
  track: jest.fn(),
};

describe("useAddMember", () => {
  it("should create a new trustchain", async () => {
    Mocks.sdk.activate.mockResolvedValue({ tree, outcome: "created" });

    const { result, store } = renderHook(() => useAddMember({ device }), {
      initialState: {
        settings: INITIAL_STATE,
      },
    });

    await waitFor(() => expect(Mocks.sdk.activate).toHaveBeenCalled());

    expect(result.current.error).toBeNull();
    expect(store.getState().trustchain.trustchain).toEqual(TREE_RECORD);
    expect(Mocks.setFlow).toHaveBeenCalledWith({
      flow: Flow.Activation,
      step: Step.ActivationLoading,
      nextStep: Step.ActivationFinal,
      hasTrustchainBeenCreated: true,
    });
    expect(Mocks.track).toHaveBeenCalledTimes(1);
    expect(Mocks.track).toHaveBeenCalledWith("ledgersync_activated", { flow: AnalyticsFlow });
  });

  it("should get an existing trustchain", async () => {
    Mocks.sdk.activate.mockResolvedValue({ tree, outcome: "restored" });
    const { result, store } = renderHook(() => useAddMember({ device }), {
      initialState: {
        settings: INITIAL_STATE,
      },
    });

    await waitFor(() => expect(Mocks.sdk.activate).toHaveBeenCalled());

    expect(result.current.error).toBeNull();
    expect(store.getState().trustchain.trustchain).toEqual(TREE_RECORD);
    expect(Mocks.setFlow).toHaveBeenCalledWith({
      flow: Flow.Activation,
      step: Step.ActivationLoading,
      nextStep: Step.SynchronizationFinal,
      hasTrustchainBeenCreated: false,
    });
    expect(Mocks.track).toHaveBeenCalledTimes(1);
    expect(Mocks.track).toHaveBeenCalledWith("ledgersync_activated", { flow: AnalyticsFlow });
  });

  it("should activate the key ring with the device and the device callbacks", async () => {
    Mocks.sdk.activate.mockResolvedValue({ tree, outcome: "created" });
    renderHook(() => useAddMember({ device }), {
      initialState: {
        settings: INITIAL_STATE,
      },
    });

    await waitFor(() => expect(Mocks.sdk.activate).toHaveBeenCalled());

    expect(Mocks.sdk.activate).toHaveBeenCalledWith(expect.anything(), {
      legacyDeviceId: "",
      callbacks: {
        onStartRequestUserInteraction: expect.any(Function),
        onEndRequestUserInteraction: expect.any(Function),
      },
    });
  });

  it("should handle missing device", async () => {
    const { result, store } = renderHook(() => useAddMember({ device: null }));

    expect(result.current.error).toBeNull();
    expect(store.getState().trustchain.trustchain).toBeNull();
    expect(Mocks.setFlow).toHaveBeenCalledWith({
      flow: Flow.Activation,
      step: Step.DeviceAction,
    });
    expect(Mocks.track).not.toHaveBeenCalled();
  });

  it("should handle already initialized trustchain", async () => {
    Mocks.sdk.activate.mockRejectedValue(keyRingError("TrustchainAlreadyInitialized"));
    const { result, store } = renderHook(() => useAddMember({ device }), {
      initialState: {
        settings: INITIAL_STATE,
      },
    });

    await waitFor(() => expect(Mocks.sdk.activate).toHaveBeenCalled());

    expect(result.current.error).toBeNull();
    expect(store.getState().trustchain.trustchain).toBeNull();
    expect(Mocks.setFlow).toHaveBeenCalledWith({
      flow: Flow.Synchronize,
      step: Step.AlreadySecuredSameSeed,
    });
    expect(Mocks.track).not.toHaveBeenCalled();
  });

  it("should handle trustchain initialized with other seed", async () => {
    Mocks.sdk.activate.mockRejectedValue(keyRingError("TrustchainAlreadyInitializedWithOtherSeed"));
    const { result, store } = renderHook(() => useAddMember({ device }), {
      initialState: {
        settings: INITIAL_STATE,
      },
    });

    await waitFor(() => expect(Mocks.sdk.activate).toHaveBeenCalled());

    expect(result.current.error).toBeNull();
    expect(store.getState().trustchain.trustchain).toBeNull();
    expect(Mocks.setFlow).toHaveBeenCalledWith({
      flow: Flow.Synchronize,
      step: Step.AlreadySecuredOtherSeed,
    });
    expect(Mocks.track).not.toHaveBeenCalled();
  });

  it("should handle other sdk errors", async () => {
    Mocks.sdk.activate.mockRejectedValue(new Error("Random error"));
    const { result, store } = renderHook(() => useAddMember({ device }), {
      initialState: {
        settings: INITIAL_STATE,
      },
    });

    await waitFor(() => expect(Mocks.sdk.activate).toHaveBeenCalled());
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error)); // Wait for the setError

    expect(result.current.error?.message).toBe("Random error");
    expect(store.getState().trustchain.trustchain).toBeNull();
    expect(Mocks.setFlow).not.toHaveBeenCalled();
    expect(Mocks.track).not.toHaveBeenCalled();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });
});

const mockDispatch = jest.fn();

jest.mock("LLD/hooks/redux", () => {
  const actual = jest.requireActual("LLD/hooks/redux");
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

jest.mock("~/renderer/actions/walletSync", () => ({
  setFlow: (flow: unknown) => Mocks.setFlow(flow),
}));

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: (event: string, props?: Record<string, unknown>) => Mocks.track(event, props),
}));

jest.mock("../hooks/useKeyRingClient", () => ({
  useKeyRingClient: () => Mocks.sdk,
}));
