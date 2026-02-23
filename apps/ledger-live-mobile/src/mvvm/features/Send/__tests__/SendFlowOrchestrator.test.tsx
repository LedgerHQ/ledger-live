import React from "react";
import { Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { SendFlowOrchestrator } from "../SendFlowOrchestrator";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import type { SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import type { StepRegistry } from "@ledgerhq/live-common/flows/wizard/types";
import type { SendFlowConfig } from "../types";
import * as useSendFlowStateModule from "../hooks/useSendFlowState";

jest.mock("../hooks/useSendFlowState", () => ({
  useSendFlowBusinessLogic: jest.fn(),
}));

jest.mock("../context/SendFlowContext", () => ({
  SendFlowProvider: ({
    children,
  }: {
    children: React.ReactNode;
    value: unknown;
    onClose: () => void;
  }) => (
    <>
      <Text testID="send-flow-provider">SendFlowProvider</Text>
      {children}
    </>
  ),
}));

const MockFlowStackNavigator = jest.fn();
jest.mock("../../FlowWizard/FlowStackNavigator", () => ({
  FlowStackNavigator: (props: unknown) => {
    MockFlowStackNavigator(props);
    return <Text testID="flow-stack-navigator">FlowStackNavigator</Text>;
  },
}));

function createStepRegistry(): StepRegistry<SendFlowStep> {
  return {
    [SEND_FLOW_STEP.RECIPIENT]: () => null,
    [SEND_FLOW_STEP.AMOUNT]: () => null,
    [SEND_FLOW_STEP.SIGNATURE]: () => null,
    [SEND_FLOW_STEP.CONFIRMATION]: () => null,
  };
}

function createFlowConfig(overrides?: Partial<SendFlowConfig>): SendFlowConfig {
  return {
    stepOrder: [
      SEND_FLOW_STEP.RECIPIENT,
      SEND_FLOW_STEP.AMOUNT,
      SEND_FLOW_STEP.SIGNATURE,
      SEND_FLOW_STEP.CONFIRMATION,
    ],
    stepConfigs: {
      [SEND_FLOW_STEP.RECIPIENT]: {
        id: SEND_FLOW_STEP.RECIPIENT,
        canGoBack: false,
        screenName: "RecipientScreen",
      },
      [SEND_FLOW_STEP.AMOUNT]: { id: SEND_FLOW_STEP.AMOUNT, canGoBack: true },
      [SEND_FLOW_STEP.SIGNATURE]: {
        id: SEND_FLOW_STEP.SIGNATURE,
        canGoBack: true,
        screenName: "SignatureScreen",
        screenOptions: { title: "Sign" },
      },
      [SEND_FLOW_STEP.CONFIRMATION]: { id: SEND_FLOW_STEP.CONFIRMATION, canGoBack: true },
    },
    ...overrides,
  };
}

describe("SendFlowOrchestrator", () => {
  const mockOnClose = jest.fn();
  const mockBusinessContext = { state: {}, transaction: {}, operation: {} };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSendFlowStateModule.useSendFlowBusinessLogic as jest.Mock).mockReturnValue(
      mockBusinessContext,
    );
  });

  it("should render SendFlowProvider and FlowStackNavigator", () => {
    render(
      <SendFlowOrchestrator
        onClose={mockOnClose}
        stepRegistry={createStepRegistry()}
        flowConfig={createFlowConfig()}
      />,
    );

    expect(screen.getByTestId("send-flow-provider")).toBeOnTheScreen();
    expect(screen.getByTestId("flow-stack-navigator")).toBeOnTheScreen();
  });

  it("should pass flowConfig with initialStep RECIPIENT to FlowStackNavigator", () => {
    const flowConfig = createFlowConfig();

    render(
      <SendFlowOrchestrator
        onClose={mockOnClose}
        stepRegistry={createStepRegistry()}
        flowConfig={flowConfig}
      />,
    );

    expect(MockFlowStackNavigator).toHaveBeenCalledWith(
      expect.objectContaining({
        flowConfig: expect.objectContaining({
          initialStep: SEND_FLOW_STEP.RECIPIENT,
          stepOrder: flowConfig.stepOrder,
          stepConfigs: flowConfig.stepConfigs,
        }),
      }),
    );
  });

  it("should pass getScreenName that returns screenName from stepConfig or fallback", () => {
    const flowConfig = createFlowConfig();

    render(
      <SendFlowOrchestrator
        onClose={mockOnClose}
        stepRegistry={createStepRegistry()}
        flowConfig={flowConfig}
      />,
    );

    const { getScreenName } = MockFlowStackNavigator.mock.calls[0][0];
    expect(getScreenName(SEND_FLOW_STEP.RECIPIENT)).toBe("RecipientScreen");
    expect(getScreenName(SEND_FLOW_STEP.AMOUNT)).toBe(`SendFlow${SEND_FLOW_STEP.AMOUNT}`);
    expect(getScreenName(SEND_FLOW_STEP.SIGNATURE)).toBe("SignatureScreen");
  });

  it("should pass getScreenOptions that returns config.screenOptions or empty object", () => {
    render(
      <SendFlowOrchestrator
        onClose={mockOnClose}
        stepRegistry={createStepRegistry()}
        flowConfig={createFlowConfig()}
      />,
    );

    const { getScreenOptions } = MockFlowStackNavigator.mock.calls[0][0];
    const configWithOptions = { id: SEND_FLOW_STEP.SIGNATURE, screenOptions: { title: "Sign" } };
    const configWithoutOptions = { id: SEND_FLOW_STEP.AMOUNT };

    expect(getScreenOptions(SEND_FLOW_STEP.SIGNATURE, configWithOptions)).toEqual({
      title: "Sign",
    });
    expect(getScreenOptions(SEND_FLOW_STEP.AMOUNT, configWithoutOptions)).toEqual({});
  });

  it("should render children when provided", () => {
    render(
      <SendFlowOrchestrator
        onClose={mockOnClose}
        stepRegistry={createStepRegistry()}
        flowConfig={createFlowConfig()}
      >
        <Text testID="custom-child">Custom content</Text>
      </SendFlowOrchestrator>,
    );

    expect(screen.getByTestId("custom-child")).toHaveTextContent("Custom content");
  });
});
