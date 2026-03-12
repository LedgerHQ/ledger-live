import { Flow, Step, initialStateWalletSync } from "~/renderer/reducers/walletSync";
import { act, renderHook } from "tests/testSetup";
import { FlowOptions, useFlows, STEPS_WITH_BACK } from "../hooks/useFlows";
import { simpleTrustChain } from "./shared";

const INITIAL_STATE = {
  walletSync: {
    ...initialStateWalletSync,
    flow: Flow.ManageBackup,
    step: Step.DeleteBackup,
  },
};

const INITIAL_STATE_WITH_TRUSTCHAIN = {
  ...INITIAL_STATE,
  trustchain: {
    trustchain: simpleTrustChain,
    memberCredentials: { pubkey: "pk", privatekey: "sk" },
  },
};

describe("useFlows", () => {
  it("should loads rights Steps for Flow.ManageBackup", async () => {
    const steps = FlowOptions.ManageBackup.steps;

    const { result } = renderHook(() => useFlows(), {
      initialState: INITIAL_STATE,
    });

    expect(result.current.currentStep).toBe(Object.values(steps)[0]);

    act(() => {
      result.current.goToNextScene();
    });
    expect(result.current.currentStep).toBe(Object.values(steps)[1]);

    act(() => {
      result.current.goToPreviousScene();
    });
    expect(result.current.currentStep).toBe(Object.values(steps)[0]);
  });

  it("should reset Flow and Step when no trustchain", async () => {
    const { result, store } = renderHook(() => useFlows(), { initialState: INITIAL_STATE });

    act(() => {
      result.current.goToWelcomeScreenWalletSync();
    });
    expect(store.getState().walletSync.step).toBe(Step.CreateOrSynchronize);
    expect(store.getState().walletSync.flow).toBe(Flow.Activation);
  });

  it("should go to LedgerSyncActivated when trustchain exists", async () => {
    const { result, store } = renderHook(() => useFlows(), {
      initialState: INITIAL_STATE_WITH_TRUSTCHAIN,
    });

    act(() => {
      result.current.goToWelcomeScreenWalletSync();
    });
    expect(store.getState().walletSync.step).toBe(Step.LedgerSyncActivated);
    expect(store.getState().walletSync.flow).toBe(Flow.LedgerSyncActivated);
  });

  it("should go to DeviceAction when onboardingNewDevice is true and no trustchain", async () => {
    const { result, store } = renderHook(() => useFlows(), { initialState: INITIAL_STATE });

    act(() => {
      result.current.goToWelcomeScreenWalletSync(true);
    });
    expect(store.getState().walletSync.step).toBe(Step.DeviceAction);
    expect(store.getState().walletSync.flow).toBe(Flow.Activation);
  });

  it("should expose FlowOptions and STEPS_WITH_BACK", () => {
    const { result } = renderHook(() => useFlows(), { initialState: INITIAL_STATE });
    expect(result.current.FlowOptions).toBeDefined();
    expect(result.current.FlowOptions[Flow.ManageBackup].steps).toBeDefined();
    expect(STEPS_WITH_BACK).toContain(Step.DeleteBackup);
  });
});
