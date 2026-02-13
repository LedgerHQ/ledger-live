import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation, useRoute } from "@react-navigation/native";
import { render, screen } from "@tests/test-renderer";
import { FlowStackNavigator } from "../FlowStackNavigator";
import type { FlowStep, StepRegistry } from "@ledgerhq/live-common/flows/wizard/types";
import type { ReactNativeFlowConfig } from "../types";

const TestStack = createNativeStackNavigator();

const defaultScreenName = (step: string) => `Flow${step}`;

function createTestWrapper<TStep extends FlowStep>(
  stepRegistry: StepRegistry<TStep>,
  flowConfig: ReactNativeFlowConfig<TStep>,
  props?: Partial<Parameters<typeof FlowStackNavigator<TStep>>[0]>,
) {
  return function FlowTestWrapper() {
    return <FlowStackNavigator stepRegistry={stepRegistry} flowConfig={flowConfig} {...props} />;
  };
}

describe("FlowStackNavigator", () => {
  const stepOrder = ["step1", "step2"] as const;
  type TestStep = (typeof stepOrder)[number];

  const Step1Screen = () => <Text testID="flow-step1">Step 1</Text>;
  const Step2Screen = () => <Text testID="flow-step2">Step 2</Text>;

  /** Step1 with a button to navigate to step2 (for navigation tests) */
  const Step1WithNextButton = () => {
    const navigation = useNavigation<{ navigate: (name: string) => void }>();
    return (
      <>
        <Text testID="flow-step1">Step 1</Text>
        <TouchableOpacity
          testID="go-to-step2"
          onPress={() => navigation.navigate(defaultScreenName("step2"))}
        >
          <Text>Go to step 2</Text>
        </TouchableOpacity>
      </>
    );
  };

  /** Step2 with a button to go back (for navigation tests) */
  const Step2WithBackButton = () => {
    const navigation = useNavigation();
    return (
      <>
        <Text testID="flow-step2">Step 2</Text>
        <TouchableOpacity testID="go-back" onPress={() => navigation.goBack()}>
          <Text>Back</Text>
        </TouchableOpacity>
      </>
    );
  };

  const defaultStepRegistry: StepRegistry<TestStep> = {
    step1: Step1Screen,
    step2: Step2Screen,
  };

  const defaultFlowConfig: ReactNativeFlowConfig<TestStep> = {
    stepOrder: [...stepOrder],
    stepConfigs: {
      step1: { id: "step1", canGoBack: false },
      step2: { id: "step2", canGoBack: true },
    },
  };

  function renderFlowNavigator(
    stepRegistry = defaultStepRegistry,
    flowConfig = defaultFlowConfig,
    extraProps?: Partial<Parameters<typeof FlowStackNavigator>[0]>,
  ) {
    const Wrapper = createTestWrapper(stepRegistry, flowConfig, extraProps);
    return render(
      <TestStack.Navigator>
        <TestStack.Screen name="FlowWrapper" component={Wrapper} />
      </TestStack.Navigator>,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", () => {
    renderFlowNavigator();
    expect(screen.getByTestId("flow-step1")).toBeOnTheScreen();
  });

  it("should render the first step screen by default", () => {
    renderFlowNavigator();
    expect(screen.getByText("Step 1")).toBeOnTheScreen();
  });

  it("should use getScreenName when provided", () => {
    const getScreenName = (step: FlowStep) => `Custom_${step}`;
    renderFlowNavigator(defaultStepRegistry, defaultFlowConfig, { getScreenName });
    expect(screen.getByTestId("flow-step1")).toBeOnTheScreen();
  });

  it("should accept onClose callback without calling it on mount", () => {
    const onClose = jest.fn();
    renderFlowNavigator(defaultStepRegistry, defaultFlowConfig, { onClose });
    expect(screen.getByTestId("flow-step1")).toBeOnTheScreen();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should render first available step and not crash when a step has no component in stepRegistry", () => {
    const registryWithMissing: StepRegistry<TestStep> = {
      step1: Step1Screen,
    };
    renderFlowNavigator(registryWithMissing, defaultFlowConfig);
    expect(screen.getByTestId("flow-step1")).toBeOnTheScreen();
    expect(screen.getByText("Step 1")).toBeOnTheScreen();
  });

  describe("navigation", () => {
    it("should navigate from first step to second step when user triggers navigation", async () => {
      const registryWithNav: StepRegistry<TestStep> = {
        step1: Step1WithNextButton,
        step2: Step2WithBackButton,
      };
      const { user } = renderFlowNavigator(registryWithNav, defaultFlowConfig);

      expect(screen.getByText("Step 1")).toBeOnTheScreen();
      await user.press(screen.getByTestId("go-to-step2"));

      expect(screen.getByText("Step 2")).toBeOnTheScreen();
      expect(screen.queryByText("Step 1")).not.toBeOnTheScreen();
    });

    it("should go back to first step when user presses back on second step", async () => {
      const registryWithNav: StepRegistry<TestStep> = {
        step1: Step1WithNextButton,
        step2: Step2WithBackButton,
      };
      const { user } = renderFlowNavigator(registryWithNav, defaultFlowConfig);

      await user.press(screen.getByTestId("go-to-step2"));
      expect(screen.getByText("Step 2")).toBeOnTheScreen();

      await user.press(screen.getByTestId("go-back"));
      expect(screen.getByText("Step 1")).toBeOnTheScreen();
      expect(screen.queryByText("Step 2")).not.toBeOnTheScreen();
    });
  });

  it("should pass custom initial params to screen when getInitialParams is provided", () => {
    function hasCustomParam(obj: unknown): obj is { customParam?: string } {
      return typeof obj === "object" && obj !== null && "customParam" in obj;
    }
    const Step1WithParam = () => {
      const route = useRoute();
      const params = route.params;
      const customParam = (hasCustomParam(params) ? params.customParam : undefined) ?? "none";
      return <Text testID="flow-step1">Param: {customParam}</Text>;
    };
    const registry: StepRegistry<TestStep> = {
      step1: Step1WithParam,
      step2: Step2Screen,
    };
    const getInitialParams = (step: string) =>
      step === "step1" ? { customParam: "from-step1" } : {};
    renderFlowNavigator(registry, defaultFlowConfig, { getInitialParams });
    expect(screen.getByText("Param: from-step1")).toBeOnTheScreen();
  });
});
