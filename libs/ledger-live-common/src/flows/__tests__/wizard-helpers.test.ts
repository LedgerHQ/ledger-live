import {
  getStepIndex,
  getNextStep,
  getPreviousStep,
  determineDirection,
  isFirstStep,
  isLastStep,
  createInitialNavigationState,
  createNavigationReducer,
  canNavigateBack,
  canNavigateForward,
} from "../wizard/helpers";
import { FLOW_NAVIGATION_DIRECTION } from "../wizard/types";
import type { FlowStepConfig } from "../wizard/types";

// Test step configuration
type TestStep = "STEP_A" | "STEP_B" | "STEP_C" | "STEP_D";

const TEST_STEP_ORDER: readonly TestStep[] = ["STEP_A", "STEP_B", "STEP_C", "STEP_D"];

const TEST_STEP_CONFIGS: Record<TestStep, FlowStepConfig<TestStep>> = {
  STEP_A: { id: "STEP_A", canGoBack: false },
  STEP_B: { id: "STEP_B", canGoBack: true },
  STEP_C: { id: "STEP_C", canGoBack: true },
  STEP_D: { id: "STEP_D", canGoBack: false },
};

describe("getStepIndex", () => {
  it("should return the correct index for a valid step", () => {
    expect(getStepIndex("STEP_A", TEST_STEP_ORDER)).toBe(0);
    expect(getStepIndex("STEP_B", TEST_STEP_ORDER)).toBe(1);
    expect(getStepIndex("STEP_C", TEST_STEP_ORDER)).toBe(2);
    expect(getStepIndex("STEP_D", TEST_STEP_ORDER)).toBe(3);
  });

  it("should return -1 for an invalid step", () => {
    expect(getStepIndex("INVALID_STEP", TEST_STEP_ORDER)).toBe(-1);
  });
});

describe("getNextStep", () => {
  it("should return the next step when not at the last step", () => {
    expect(getNextStep("STEP_A", TEST_STEP_ORDER)).toBe("STEP_B");
    expect(getNextStep("STEP_B", TEST_STEP_ORDER)).toBe("STEP_C");
    expect(getNextStep("STEP_C", TEST_STEP_ORDER)).toBe("STEP_D");
  });

  it("should return null when at the last step", () => {
    expect(getNextStep("STEP_D", TEST_STEP_ORDER)).toBeNull();
  });
});

describe("getPreviousStep", () => {
  it("should return the previous step when not at the first step", () => {
    expect(getPreviousStep("STEP_B", TEST_STEP_ORDER)).toBe("STEP_A");
    expect(getPreviousStep("STEP_C", TEST_STEP_ORDER)).toBe("STEP_B");
    expect(getPreviousStep("STEP_D", TEST_STEP_ORDER)).toBe("STEP_C");
  });

  it("should return null when at the first step", () => {
    expect(getPreviousStep("STEP_A", TEST_STEP_ORDER)).toBeNull();
  });
});

describe("determineDirection", () => {
  it("should return FORWARD when navigating to a later step", () => {
    expect(determineDirection("STEP_A", "STEP_B", TEST_STEP_ORDER)).toBe(
      FLOW_NAVIGATION_DIRECTION.FORWARD,
    );
    expect(determineDirection("STEP_A", "STEP_D", TEST_STEP_ORDER)).toBe(
      FLOW_NAVIGATION_DIRECTION.FORWARD,
    );
  });

  it("should return BACKWARD when navigating to an earlier step", () => {
    expect(determineDirection("STEP_D", "STEP_A", TEST_STEP_ORDER)).toBe(
      FLOW_NAVIGATION_DIRECTION.BACKWARD,
    );
    expect(determineDirection("STEP_C", "STEP_B", TEST_STEP_ORDER)).toBe(
      FLOW_NAVIGATION_DIRECTION.BACKWARD,
    );
  });

  it("should return BACKWARD when navigating to the same step", () => {
    expect(determineDirection("STEP_B", "STEP_B", TEST_STEP_ORDER)).toBe(
      FLOW_NAVIGATION_DIRECTION.BACKWARD,
    );
  });
});

describe("isFirstStep", () => {
  it("should return true for the first step", () => {
    expect(isFirstStep("STEP_A", TEST_STEP_ORDER)).toBe(true);
  });

  it("should return false for non-first steps", () => {
    expect(isFirstStep("STEP_B", TEST_STEP_ORDER)).toBe(false);
    expect(isFirstStep("STEP_C", TEST_STEP_ORDER)).toBe(false);
    expect(isFirstStep("STEP_D", TEST_STEP_ORDER)).toBe(false);
  });
});

describe("isLastStep", () => {
  it("should return true for the last step", () => {
    expect(isLastStep("STEP_D", TEST_STEP_ORDER)).toBe(true);
  });

  it("should return false for non-last steps", () => {
    expect(isLastStep("STEP_A", TEST_STEP_ORDER)).toBe(false);
    expect(isLastStep("STEP_B", TEST_STEP_ORDER)).toBe(false);
    expect(isLastStep("STEP_C", TEST_STEP_ORDER)).toBe(false);
  });
});

describe("createInitialNavigationState", () => {
  it("should create initial state with given step", () => {
    const state = createInitialNavigationState("STEP_B");
    expect(state).toEqual({
      currentStep: "STEP_B",
      direction: FLOW_NAVIGATION_DIRECTION.FORWARD,
      stepHistory: [],
    });
  });

  it("should create initial state with history", () => {
    const state = createInitialNavigationState("STEP_C", ["STEP_A", "STEP_B"]);
    expect(state).toEqual({
      currentStep: "STEP_C",
      direction: FLOW_NAVIGATION_DIRECTION.FORWARD,
      stepHistory: ["STEP_A", "STEP_B"],
    });
  });
});

describe("canNavigateBack", () => {
  it("should return true when step allows back and history exists", () => {
    expect(canNavigateBack("STEP_B", ["STEP_A"], TEST_STEP_CONFIGS)).toBe(true);
    expect(canNavigateBack("STEP_C", ["STEP_A", "STEP_B"], TEST_STEP_CONFIGS)).toBe(true);
  });

  it("should return false when step does not allow back", () => {
    expect(canNavigateBack("STEP_A", [], TEST_STEP_CONFIGS)).toBe(false);
    expect(canNavigateBack("STEP_D", ["STEP_A", "STEP_B", "STEP_C"], TEST_STEP_CONFIGS)).toBe(
      false,
    );
  });

  it("should return false when history is empty", () => {
    expect(canNavigateBack("STEP_B", [], TEST_STEP_CONFIGS)).toBe(false);
  });
});

describe("canNavigateForward", () => {
  it("should return true when not at the last step", () => {
    expect(canNavigateForward("STEP_A", TEST_STEP_ORDER)).toBe(true);
    expect(canNavigateForward("STEP_B", TEST_STEP_ORDER)).toBe(true);
    expect(canNavigateForward("STEP_C", TEST_STEP_ORDER)).toBe(true);
  });

  it("should return false at the last step", () => {
    expect(canNavigateForward("STEP_D", TEST_STEP_ORDER)).toBe(false);
  });
});

describe("createNavigationReducer", () => {
  const reducer = createNavigationReducer<TestStep, FlowStepConfig<TestStep>>(TEST_STEP_ORDER);

  it("should handle GO_TO_STEP action forward", () => {
    const initialState = createInitialNavigationState<TestStep>("STEP_A");
    const newState = reducer(initialState, { type: "GO_TO_STEP", step: "STEP_C" });

    expect(newState).toEqual({
      currentStep: "STEP_C",
      direction: FLOW_NAVIGATION_DIRECTION.FORWARD,
      stepHistory: ["STEP_A"],
    });
  });

  it("should handle GO_TO_STEP action backward", () => {
    const initialState = {
      currentStep: "STEP_C" as TestStep,
      direction: FLOW_NAVIGATION_DIRECTION.FORWARD,
      stepHistory: ["STEP_A", "STEP_B"] as TestStep[],
    };
    const newState = reducer(initialState, { type: "GO_TO_STEP", step: "STEP_A" });

    expect(newState).toEqual({
      currentStep: "STEP_A",
      direction: FLOW_NAVIGATION_DIRECTION.BACKWARD,
      stepHistory: ["STEP_A"],
    });
  });

  it("should not change state when going to same step", () => {
    const initialState = createInitialNavigationState<TestStep>("STEP_B");
    const newState = reducer(initialState, { type: "GO_TO_STEP", step: "STEP_B" });

    expect(newState).toBe(initialState);
  });

  it("should handle GO_FORWARD action", () => {
    const initialState = createInitialNavigationState<TestStep>("STEP_A");
    const newState = reducer(initialState, { type: "GO_FORWARD", stepOrder: TEST_STEP_ORDER });

    expect(newState).toEqual({
      currentStep: "STEP_B",
      direction: FLOW_NAVIGATION_DIRECTION.FORWARD,
      stepHistory: ["STEP_A"],
    });
  });

  it("should not change state when at last step and going forward", () => {
    const initialState = createInitialNavigationState<TestStep>("STEP_D");
    const newState = reducer(initialState, { type: "GO_FORWARD", stepOrder: TEST_STEP_ORDER });

    expect(newState).toBe(initialState);
  });

  it("should handle GO_BACKWARD action when allowed", () => {
    const initialState = {
      currentStep: "STEP_B" as TestStep,
      direction: FLOW_NAVIGATION_DIRECTION.FORWARD,
      stepHistory: ["STEP_A"] as TestStep[],
    };
    const newState = reducer(initialState, { type: "GO_BACKWARD", stepConfigs: TEST_STEP_CONFIGS });

    expect(newState).toEqual({
      currentStep: "STEP_A",
      direction: FLOW_NAVIGATION_DIRECTION.BACKWARD,
      stepHistory: [],
    });
  });

  it("should not change state when canGoBack is false", () => {
    const initialState = {
      currentStep: "STEP_D" as TestStep,
      direction: FLOW_NAVIGATION_DIRECTION.FORWARD,
      stepHistory: ["STEP_A", "STEP_B", "STEP_C"] as TestStep[],
    };
    const newState = reducer(initialState, { type: "GO_BACKWARD", stepConfigs: TEST_STEP_CONFIGS });

    expect(newState).toBe(initialState);
  });

  it("should not change state when history is empty", () => {
    const initialState = createInitialNavigationState<TestStep>("STEP_B");
    const newState = reducer(initialState, { type: "GO_BACKWARD", stepConfigs: TEST_STEP_CONFIGS });

    expect(newState).toBe(initialState);
  });
});
