import React, { createContext, useContext } from "react";
import { render, screen } from "tests/testSetup";
import { FlowWizardOrchestrator, createStepRegistry } from "../FlowWizardOrchestrator";
import type { FlowConfig, FlowWizardContextValue } from "../types";

const TEST_STEPS = {
  FIRST: "FIRST",
  SECOND: "SECOND",
  THIRD: "THIRD",
};

type TestStep = (typeof TEST_STEPS)[keyof typeof TEST_STEPS];

type BaseContext = {
  label: string;
};

type TestFlowContextValue = FlowWizardContextValue<TestStep, BaseContext>;

const TestFlowContext = createContext<TestFlowContextValue | null>(null);

const TestFlowProvider = ({
  value,
  children,
}: {
  value: TestFlowContextValue;
  children: React.ReactNode;
}) => <TestFlowContext.Provider value={value}>{children}</TestFlowContext.Provider>;

function useTestFlowContext() {
  const context = useContext(TestFlowContext);
  if (!context) {
    throw new Error("useTestFlowContext must be used within TestFlowProvider");
  }
  return context;
}

const StepOne = () => {
  const { navigation, label, currentStep } = useTestFlowContext();
  return (
    <div data-testid="step-one">
      <p>Current: {currentStep}</p>
      <p>Label: {label}</p>
      <button onClick={navigation.goToNextStep}>Next to Step Two</button>
      <button onClick={() => navigation.goToStep(TEST_STEPS.THIRD)}>Skip to Step Three</button>
    </div>
  );
};

const StepTwo = () => {
  const { navigation, currentStep } = useTestFlowContext();
  return (
    <div data-testid="step-two">
      <p>Current: {currentStep}</p>
      <button onClick={navigation.goToPreviousStep}>Back</button>
      <button onClick={navigation.goToNextStep}>Next to Step Three</button>
    </div>
  );
};

const StepThree = () => {
  const { navigation, currentStep } = useTestFlowContext();
  return (
    <div data-testid="step-three">
      <p>Current: {currentStep}</p>
      <button onClick={navigation.goToPreviousStep}>Back</button>
    </div>
  );
};

const stepRegistry = createStepRegistry({
  [TEST_STEPS.FIRST]: StepOne,
  [TEST_STEPS.SECOND]: StepTwo,
  [TEST_STEPS.THIRD]: StepThree,
});

const flowConfig: FlowConfig<TestStep> = {
  stepOrder: [TEST_STEPS.FIRST, TEST_STEPS.SECOND, TEST_STEPS.THIRD],
  stepConfigs: {
    [TEST_STEPS.FIRST]: { id: TEST_STEPS.FIRST, canGoBack: false },
    [TEST_STEPS.SECOND]: { id: TEST_STEPS.SECOND, canGoBack: true },
    [TEST_STEPS.THIRD]: { id: TEST_STEPS.THIRD, canGoBack: true },
  },
};

function renderFlow(config: FlowConfig<TestStep> = flowConfig) {
  return render(
    <FlowWizardOrchestrator
      flowConfig={config}
      stepRegistry={stepRegistry}
      contextValue={{ label: "test-flow" }}
      ContextProvider={TestFlowProvider}
    />,
  );
}

describe("FlowWizardOrchestrator", () => {
  it("renders the initial step and merges base context", () => {
    renderFlow();

    expect(screen.getByTestId("step-one")).toBeVisible();
    expect(screen.getByText(/Label: test-flow/i)).toBeVisible();
  });

  it("navigates forward and backward using the provided actions", async () => {
    const { user } = renderFlow();

    await user.click(screen.getByText(/Next to Step Two/));
    expect(screen.getByTestId("step-two")).toBeVisible();

    await user.click(screen.getByText(/Back/));
    expect(screen.getByTestId("step-one")).toBeVisible();
  });

  it("supports jumping to any step", async () => {
    const { user } = renderFlow();

    await user.click(screen.getByText(/Skip to Step Three/));

    expect(screen.getByTestId("step-three")).toBeVisible();
  });

  it("respects custom initial step and history", () => {
    renderFlow({
      ...flowConfig,
      initialStep: TEST_STEPS.SECOND,
      initialHistory: [TEST_STEPS.FIRST],
    });

    expect(screen.getByTestId("step-two")).toBeVisible();
  });
});
