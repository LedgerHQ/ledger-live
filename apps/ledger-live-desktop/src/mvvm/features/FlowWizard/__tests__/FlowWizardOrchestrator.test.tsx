import React from "react";
import { render, screen } from "tests/testSetup";
import { FlowWizardOrchestrator } from "../FlowWizardOrchestrator";
import { useFlowWizard } from "../FlowWizardContext";
import { FlowWizardProvider } from "../FlowWizardContext";
import type { FlowConfig, StepRegistry } from "@ledgerhq/live-common/flows/wizard/types";

const TEST_STEPS = {
  FIRST: "FIRST",
  SECOND: "SECOND",
  THIRD: "THIRD",
};

type TestStep = (typeof TEST_STEPS)[keyof typeof TEST_STEPS];

/**
 * Step components use useFlowWizard() for navigation.
 */
const StepOne = () => {
  const { navigation, currentStep } = useFlowWizard<TestStep>();
  return (
    <div data-testid="step-one">
      <p>Current: {currentStep}</p>
      <button onClick={navigation.goToNextStep}>Next to Step Two</button>
      <button onClick={() => navigation.goToStep(TEST_STEPS.THIRD)}>Skip to Step Three</button>
    </div>
  );
};

const StepTwo = () => {
  const { navigation, currentStep } = useFlowWizard<TestStep>();
  return (
    <div data-testid="step-two">
      <p>Current: {currentStep}</p>
      <button onClick={navigation.goToPreviousStep}>Back</button>
      <button onClick={navigation.goToNextStep}>Next to Step Three</button>
    </div>
  );
};

const StepThree = () => {
  const { navigation, currentStep } = useFlowWizard<TestStep>();
  return (
    <div data-testid="step-three">
      <p>Current: {currentStep}</p>
      <button onClick={navigation.goToPreviousStep}>Back</button>
    </div>
  );
};

const stepRegistry: StepRegistry<TestStep> = {
  [TEST_STEPS.FIRST]: StepOne,
  [TEST_STEPS.SECOND]: StepTwo,
  [TEST_STEPS.THIRD]: StepThree,
};

const flowConfig: FlowConfig<TestStep> = {
  stepOrder: [TEST_STEPS.FIRST, TEST_STEPS.SECOND, TEST_STEPS.THIRD],
  stepConfigs: {
    [TEST_STEPS.FIRST]: { id: TEST_STEPS.FIRST, canGoBack: false },
    [TEST_STEPS.SECOND]: { id: TEST_STEPS.SECOND, canGoBack: true },
    [TEST_STEPS.THIRD]: { id: TEST_STEPS.THIRD, canGoBack: true },
  },
};

// Mock business context for tests
type TestBusinessContext = Record<string, never>;

const TestContextProvider = FlowWizardProvider;

// Component that renders the current step using useFlowWizard
const TestFlowRenderer = () => {
  const { currentStepRenderer: StepComponent } = useFlowWizard<TestStep>();
  return StepComponent ? <StepComponent /> : null;
};

function renderFlow(config: FlowConfig<TestStep> = flowConfig) {
  const contextValue: TestBusinessContext = {};

  return render(
    <FlowWizardOrchestrator<TestStep, TestBusinessContext>
      flowConfig={config}
      stepRegistry={stepRegistry}
      contextValue={contextValue}
      ContextProvider={TestContextProvider}
    >
      <TestFlowRenderer />
    </FlowWizardOrchestrator>,
  );
}

describe("FlowWizardOrchestrator", () => {
  it("renders the initial step", () => {
    renderFlow();

    expect(screen.getByTestId("step-one")).toBeVisible();
    expect(screen.getByText(/Current: FIRST/i)).toBeVisible();
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

  it("supports custom layouts via children", () => {
    const CustomLayout = () => {
      const { currentStep, currentStepRenderer: StepComponent } = useFlowWizard<TestStep>();
      return (
        <div data-testid="custom-layout">
          <header>Custom Header - Step: {currentStep}</header>
          <main>{StepComponent && <StepComponent />}</main>
        </div>
      );
    };

    const contextValue: TestBusinessContext = {};

    render(
      <FlowWizardOrchestrator<TestStep, TestBusinessContext>
        flowConfig={flowConfig}
        stepRegistry={stepRegistry}
        contextValue={contextValue}
        ContextProvider={TestContextProvider}
      >
        <CustomLayout />
      </FlowWizardOrchestrator>,
    );

    expect(screen.getByTestId("custom-layout")).toBeVisible();
    expect(screen.getByText(/Custom Header - Step: FIRST/i)).toBeVisible();
    expect(screen.getByTestId("step-one")).toBeVisible();
  });
});
