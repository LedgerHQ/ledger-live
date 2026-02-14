import { Flow, Step, initialStateWalletSync } from "~/renderer/reducers/walletSync";
import { act, renderHook } from "tests/testSetup";
import { FlowOptions, useFlows } from "../hooks/useFlows";

const INITIAL_STATE = {
  walletSync: {
    ...initialStateWalletSync,
    flow: Flow.ManageBackup,
    step: Step.DeleteBackup,
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

  it("should reset Flow and Step", async () => {
    const steps = FlowOptions.ManageBackup.steps;

    const { result, store } = renderHook(() => useFlows(), { initialState: INITIAL_STATE });

    expect(result.current.currentStep).toBe(Object.values(steps)[0]);

    act(() => {
      result.current.goToWelcomeScreenWalletSync();
    });
    expect(store.getState().walletSync.step).toBe(Step.CreateOrSynchronize);
    expect(store.getState().walletSync.flow).toBe(Flow.Activation);
  });
});
