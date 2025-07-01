import { renderHook, act } from "@tests/test-renderer";
import { ModularDrawerStep } from "../../types";
import { useModularDrawerFlowStepManager } from "../useModularDrawerFlowStepManager";

describe("useModularDrawerFlowStepManager", () => {
  it("should initialize at the first step by default", () => {
    const { result } = renderHook(() =>
      useModularDrawerFlowStepManager({
        selectedStep: ModularDrawerStep.Asset,
      }),
    );
    expect(result.current.currentStep).toBe(ModularDrawerStep.Asset);
    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.isFirstStep).toBe(true);
    expect(result.current.isLastStep).toBe(false);
  });

  it("should initialize at the selected step if provided any other than Asset Step", () => {
    const { result } = renderHook(() =>
      useModularDrawerFlowStepManager({ selectedStep: ModularDrawerStep.Network }),
    );
    expect(result.current.currentStep).toBe(ModularDrawerStep.Network);
    expect(result.current.currentStepIndex).toBe(0);
  });

  it("should go to next and previous steps", () => {
    const { result } = renderHook(() =>
      useModularDrawerFlowStepManager({
        selectedStep: ModularDrawerStep.Asset,
      }),
    );
    act(() => result.current.nextStep());
    expect(result.current.currentStep).toBe(ModularDrawerStep.Network);
    act(() => result.current.nextStep());
    expect(result.current.currentStep).toBe(ModularDrawerStep.Account);
    act(() => result.current.prevStep());
    expect(result.current.currentStep).toBe(ModularDrawerStep.Network);
  });

  it("should not go past the last step", () => {
    const { result } = renderHook(() =>
      useModularDrawerFlowStepManager({ selectedStep: ModularDrawerStep.Account }),
    );
    act(() => result.current.nextStep());
    expect(result.current.currentStep).toBe(ModularDrawerStep.Account);
    expect(result.current.isLastStep).toBe(true);
  });

  it("should not go before the first step", () => {
    const { result } = renderHook(() =>
      useModularDrawerFlowStepManager({
        selectedStep: ModularDrawerStep.Network,
      }),
    );
    act(() => result.current.prevStep());
    expect(result.current.currentStep).toBe(ModularDrawerStep.Network);
    expect(result.current.isFirstStep).toBe(true);
  });

  it("should reset to the first step", () => {
    const { result } = renderHook(() =>
      useModularDrawerFlowStepManager({ selectedStep: ModularDrawerStep.Account }),
    );
    act(() => result.current.reset());
    expect(result.current.currentStep).toBe(ModularDrawerStep.Account);
    expect(result.current.currentStepIndex).toBe(0);
  });

  it("should have back button for this step", () => {
    const { result } = renderHook(() =>
      useModularDrawerFlowStepManager({ selectedStep: ModularDrawerStep.Asset }),
    );
    expect(result.current.hasBackButton).toBeFalsy();
    act(() => result.current.nextStep());
    expect(result.current.hasBackButton).toBeTruthy();
    expect(result.current.currentStep).toBe(ModularDrawerStep.Network);
  });
});
