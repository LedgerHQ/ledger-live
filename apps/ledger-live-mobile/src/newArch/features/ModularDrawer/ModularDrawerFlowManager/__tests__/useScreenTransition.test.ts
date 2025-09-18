import { renderHook, act } from "@tests/test-renderer";
import useScreenTransition from "../useScreenTransition";
import { ModularDrawerStep } from "../../types";

describe("useScreenTransition", () => {
  describe("Initial State", () => {
    it("should initialize with the current step in activeSteps", () => {
      const { result } = renderHook(() => useScreenTransition(ModularDrawerStep.Asset));

      expect(result.current.activeSteps).toEqual([ModularDrawerStep.Asset]);
    });

    it("should return animation data for Asset step", () => {
      const { result } = renderHook(() => useScreenTransition(ModularDrawerStep.Asset));

      const assetAnimations = result.current.getStepAnimations(ModularDrawerStep.Asset);
      expect(assetAnimations).toBeDefined();
      expect(assetAnimations?.animatedStyle).toBeDefined();
    });

    it("should return animation data for Network step", () => {
      const { result } = renderHook(() => useScreenTransition(ModularDrawerStep.Network));

      const networkAnimations = result.current.getStepAnimations(ModularDrawerStep.Network);
      expect(networkAnimations).toBeDefined();
      expect(networkAnimations?.animatedStyle).toBeDefined();
    });

    it("should return animation data for Account step", () => {
      const { result } = renderHook(() => useScreenTransition(ModularDrawerStep.Account));

      const accountAnimations = result.current.getStepAnimations(ModularDrawerStep.Account);
      expect(accountAnimations).toBeDefined();
      expect(accountAnimations?.animatedStyle).toBeDefined();
    });
  });

  describe("Step Transitions", () => {
    it("should add new step to activeSteps when transitioning", () => {
      let currentStep = ModularDrawerStep.Asset;
      const { result, rerender } = renderHook(() => useScreenTransition(currentStep));

      expect(result.current.activeSteps).toEqual([ModularDrawerStep.Asset]);

      act(() => {
        currentStep = ModularDrawerStep.Network;
        rerender(currentStep);
      });

      expect(result.current.activeSteps).toContain(ModularDrawerStep.Asset);
      expect(result.current.activeSteps).toContain(ModularDrawerStep.Network);
    });

    it("should handle transition from Asset to Network", () => {
      let currentStep = ModularDrawerStep.Asset;
      const { result, rerender } = renderHook(() => useScreenTransition(currentStep));

      act(() => {
        currentStep = ModularDrawerStep.Network;
        rerender(currentStep);
      });

      expect(result.current.activeSteps).toEqual([
        ModularDrawerStep.Asset,
        ModularDrawerStep.Network,
      ]);
    });

    it("should handle transition from Network to Account", () => {
      let currentStep = ModularDrawerStep.Network;
      const { result, rerender } = renderHook(() => useScreenTransition(currentStep));

      act(() => {
        currentStep = ModularDrawerStep.Account;
        rerender(currentStep);
      });

      expect(result.current.activeSteps).toEqual([
        ModularDrawerStep.Network,
        ModularDrawerStep.Account,
      ]);
    });

    it("should handle transition from Asset to Account", () => {
      let currentStep = ModularDrawerStep.Asset;
      const { result, rerender } = renderHook(() => useScreenTransition(currentStep));

      act(() => {
        currentStep = ModularDrawerStep.Account;
        rerender(currentStep);
      });

      expect(result.current.activeSteps).toEqual([
        ModularDrawerStep.Asset,
        ModularDrawerStep.Account,
      ]);
    });

    it("should not add duplicate steps to activeSteps", () => {
      let currentStep = ModularDrawerStep.Asset;
      const { result, rerender } = renderHook(() => useScreenTransition(currentStep));

      act(() => {
        currentStep = ModularDrawerStep.Asset;
        rerender(currentStep);
      });

      expect(result.current.activeSteps).toEqual([ModularDrawerStep.Asset]);
    });
  });

  describe("Animation Values", () => {
    it("should have correct initial animation values for Asset step", () => {
      const { result } = renderHook(() => useScreenTransition(ModularDrawerStep.Asset));

      const assetAnimations = result.current.getStepAnimations(ModularDrawerStep.Asset);
      expect(assetAnimations).toBeDefined();

      const animatedStyle = assetAnimations?.animatedStyle;
      expect(animatedStyle).toBeDefined();
    });

    it("should have correct initial animation values for Network step", () => {
      const { result } = renderHook(() => useScreenTransition(ModularDrawerStep.Network));

      const networkAnimations = result.current.getStepAnimations(ModularDrawerStep.Network);
      expect(networkAnimations).toBeDefined();

      const animatedStyle = networkAnimations?.animatedStyle;
      expect(animatedStyle).toBeDefined();
    });

    it("should have correct initial animation values for Account step", () => {
      const { result } = renderHook(() => useScreenTransition(ModularDrawerStep.Account));

      const accountAnimations = result.current.getStepAnimations(ModularDrawerStep.Account);
      expect(accountAnimations).toBeDefined();

      const animatedStyle = accountAnimations?.animatedStyle;
      expect(animatedStyle).toBeDefined();
    });
  });

  describe("Animation Styles", () => {
    it("should include position styles in animated styles", () => {
      const { result } = renderHook(() => useScreenTransition(ModularDrawerStep.Asset));

      const assetAnimations = result.current.getStepAnimations(ModularDrawerStep.Asset);
      const animatedStyle = assetAnimations?.animatedStyle;

      expect(animatedStyle).toBeDefined();
    });

    it("should provide unique animated styles for each step", () => {
      const { result } = renderHook(() => useScreenTransition(ModularDrawerStep.Asset));

      const assetAnimations = result.current.getStepAnimations(ModularDrawerStep.Asset);
      const networkAnimations = result.current.getStepAnimations(ModularDrawerStep.Network);
      const accountAnimations = result.current.getStepAnimations(ModularDrawerStep.Account);

      expect(assetAnimations?.animatedStyle).not.toBe(networkAnimations?.animatedStyle);
      expect(networkAnimations?.animatedStyle).not.toBe(accountAnimations?.animatedStyle);
      expect(assetAnimations?.animatedStyle).not.toBe(accountAnimations?.animatedStyle);
    });
  });

  describe("Step Cleanup", () => {
    it("should handle step transitions and maintain activeSteps during animation", () => {
      let currentStep = ModularDrawerStep.Asset;
      const { result, rerender } = renderHook(() => useScreenTransition(currentStep));

      expect(result.current.activeSteps).toEqual([ModularDrawerStep.Asset]);

      act(() => {
        currentStep = ModularDrawerStep.Network;
        rerender(currentStep);
      });

      expect(result.current.activeSteps).toContain(ModularDrawerStep.Asset);
      expect(result.current.activeSteps).toContain(ModularDrawerStep.Network);
      expect(result.current.activeSteps).toHaveLength(2);

      expect(result.current.getStepAnimations(ModularDrawerStep.Asset)).toBeDefined();
      expect(result.current.getStepAnimations(ModularDrawerStep.Network)).toBeDefined();
    });

    it("should handle multiple rapid transitions", () => {
      let currentStep = ModularDrawerStep.Asset;
      const { result, rerender } = renderHook(() => useScreenTransition(currentStep));

      act(() => {
        currentStep = ModularDrawerStep.Network;
        rerender(currentStep);
      });

      expect(result.current.activeSteps).toEqual([
        ModularDrawerStep.Asset,
        ModularDrawerStep.Network,
      ]);

      act(() => {
        currentStep = ModularDrawerStep.Account;
        rerender(currentStep);
      });

      expect(result.current.activeSteps).toContain(ModularDrawerStep.Account);
      expect(result.current.getStepAnimations(ModularDrawerStep.Account)).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid step gracefully", () => {
      const { result } = renderHook(() => useScreenTransition(ModularDrawerStep.Asset));

      // @ts-expect-error - Testing invalid step
      const invalidAnimations = result.current.getStepAnimations("InvalidStep");
      expect(invalidAnimations).toBeNull();
    });

    it("should maintain stable activeSteps reference when no transition occurs", () => {
      let currentStep = ModularDrawerStep.Asset;
      const { result, rerender } = renderHook(() => useScreenTransition(currentStep));

      const initialActiveSteps = result.current.activeSteps;

      act(() => {
        currentStep = ModularDrawerStep.Asset;
        rerender(currentStep);
      });

      expect(result.current.activeSteps).toBe(initialActiveSteps);
    });

    it("should handle rapid step changes", () => {
      let currentStep = ModularDrawerStep.Asset;
      const { result, rerender } = renderHook(() => useScreenTransition(currentStep));

      act(() => {
        currentStep = ModularDrawerStep.Network;
        rerender(currentStep);
      });

      act(() => {
        currentStep = ModularDrawerStep.Account;
        rerender(currentStep);
      });

      expect(result.current.activeSteps).toContain(ModularDrawerStep.Account);
      expect(result.current.getStepAnimations(ModularDrawerStep.Account)).toBeDefined();
    });
  });

  describe("getStepAnimations Function", () => {
    it("should return consistent animation data for the same step", () => {
      const { result } = renderHook(() => useScreenTransition(ModularDrawerStep.Asset));

      const animations1 = result.current.getStepAnimations(ModularDrawerStep.Asset);
      const animations2 = result.current.getStepAnimations(ModularDrawerStep.Asset);

      expect(animations1).toEqual(animations2);
    });

    it("should return null for invalid steps", () => {
      const { result } = renderHook(() => useScreenTransition(ModularDrawerStep.Asset));

      // @ts-expect-error - Testing invalid step
      const invalidAnimations = result.current.getStepAnimations("NonExistentStep");
      expect(invalidAnimations).toBeNull();
    });

    it("should return different animation data for different steps", () => {
      const { result } = renderHook(() => useScreenTransition(ModularDrawerStep.Asset));

      const assetAnimations = result.current.getStepAnimations(ModularDrawerStep.Asset);
      const networkAnimations = result.current.getStepAnimations(ModularDrawerStep.Network);

      expect(assetAnimations).not.toEqual(networkAnimations);
    });
  });
});
