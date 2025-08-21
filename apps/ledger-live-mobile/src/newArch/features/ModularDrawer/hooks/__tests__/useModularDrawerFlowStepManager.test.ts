import { renderHook, act } from "@tests/test-renderer";
import { ModularDrawerStep } from "../../types";
import { useModularDrawerFlowStepManager } from "../useModularDrawerFlowStepManager";

describe("useModularDrawerFlowStepManager", () => {
  it("should initialize at the first step by default", () => {
    const { result } = renderHook(() => useModularDrawerFlowStepManager());
    expect(result.current.currentStep).toBe(ModularDrawerStep.Asset);
    expect(result.current.currentStepIndex).toBe(0);
  });

  it("should go to a specific step with goToStep", () => {
    const { result } = renderHook(() => useModularDrawerFlowStepManager());
    act(() => result.current.goToStep(ModularDrawerStep.Account));
    expect(result.current.currentStep).toBe(ModularDrawerStep.Account);
    expect(result.current.currentStepIndex).toBe(2);
    act(() => result.current.goToStep(ModularDrawerStep.Network));
    expect(result.current.currentStep).toBe(ModularDrawerStep.Network);
    expect(result.current.currentStepIndex).toBe(1);
  });

  it("should reset to the first step", () => {
    const { result } = renderHook(() => useModularDrawerFlowStepManager());
    act(() => result.current.goToStep(ModularDrawerStep.Account));
    expect(result.current.currentStep).toBe(ModularDrawerStep.Account);
    act(() => result.current.reset());
    expect(result.current.currentStep).toBe(ModularDrawerStep.Asset);
    expect(result.current.currentStepIndex).toBe(0);
  });
});
