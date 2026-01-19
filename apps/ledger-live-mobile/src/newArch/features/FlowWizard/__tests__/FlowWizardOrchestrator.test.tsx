import React, { createContext, useContext } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { FlowWizardOrchestrator, createStepRegistry } from "../FlowWizardOrchestrator";
import type { FlowConfig, FlowWizardContextValue } from "../types";

const TEST_STEPS = {
  FIRST: "FIRST",
  SECOND: "SECOND",
  THIRD: "THIRD",
} as const;

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
    <View testID="step-one">
      <Text>Current: {currentStep}</Text>
      <Text>Label: {label}</Text>
      <TouchableOpacity onPress={navigation.goToNextStep}>
        <Text>Next to Step Two</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goToStep(TEST_STEPS.THIRD)}>
        <Text>Skip to Step Three</Text>
      </TouchableOpacity>
    </View>
  );
};

const StepTwo = () => {
  const { navigation, currentStep } = useTestFlowContext();

  return (
    <View testID="step-two">
      <Text>Current: {currentStep}</Text>
      <TouchableOpacity onPress={navigation.goToPreviousStep}>
        <Text>Back</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={navigation.goToNextStep}>
        <Text>Next to Step Three</Text>
      </TouchableOpacity>
    </View>
  );
};

const StepThree = () => {
  const { navigation, currentStep } = useTestFlowContext();

  return (
    <View testID="step-three">
      <Text>Current: {currentStep}</Text>
      <TouchableOpacity onPress={navigation.goToPreviousStep}>
        <Text>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const stepRegistry = createStepRegistry<TestStep>({
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

describe("FlowWizardOrchestrator (mobile)", () => {
  it("renders the initial step and merges base context", () => {
    renderFlow();

    expect(screen.getByTestId("step-one")).toBeTruthy();
    expect(screen.getByText(/Label: test-flow/i)).toBeTruthy();
  });

  it("navigates forward and backward using the provided actions", () => {
    renderFlow();

    fireEvent.press(screen.getByText(/Next to Step Two/i));
    expect(screen.getByTestId("step-two")).toBeTruthy();

    fireEvent.press(screen.getByText(/^Back$/i));
    expect(screen.getByTestId("step-one")).toBeTruthy();
  });

  it("supports jumping to any step", () => {
    renderFlow();

    fireEvent.press(screen.getByText(/Skip to Step Three/i));
    expect(screen.getByTestId("step-three")).toBeTruthy();
  });

  it("respects custom initial step and history", () => {
    renderFlow({
      ...flowConfig,
      initialStep: TEST_STEPS.SECOND,
      initialHistory: [TEST_STEPS.FIRST],
    });

    expect(screen.getByTestId("step-two")).toBeTruthy();
  });
});
