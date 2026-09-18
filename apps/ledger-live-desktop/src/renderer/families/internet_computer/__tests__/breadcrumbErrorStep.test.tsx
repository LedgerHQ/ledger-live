import BigNumber from "bignumber.js";
import React from "react";
import { act, render, screen } from "tests/testSetup";
import { makeHealthyNeuron, makeICPAccount } from "./testUtils";
import type { Step, StepId } from "../neuronFlow/types";

const bridgeMock = {
  createTransaction: jest.fn(() => ({ family: "internet_computer", type: "send" })),
  updateTransaction: jest.fn((transaction, patch) => ({ ...transaction, ...patch })),
};

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  __esModule: true,
  useAccountBridge: () => bridgeMock,
}));

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: () => ({
    transaction: { family: "internet_computer", type: "send", amount: new BigNumber(0) },
    setTransaction: jest.fn(),
    updateTransaction: jest.fn(),
    status: { errors: {}, warnings: {}, estimatedFees: new BigNumber(0) },
    bridgeError: null,
    bridgePending: false,
  }),
}));

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  __esModule: true,
  SyncSkipUnderPriority: () => null,
  SyncOneAccountOnMount: () => null,
}));

// Stands in for the Stepper to read back the indices it would hand the breadcrumb. The real one is
// walked in ManageNeuronFlow.integ.test.tsx; here the indices themselves are the subject, and the
// breadcrumb renders an error as an icon with no accessible name to assert on.
jest.mock("~/renderer/components/Stepper", () => ({
  __esModule: true,
  default: (props: { errorSteps: number[]; onTransactionError: (error: Error) => void }) => (
    <div>
      <div data-testid="error-steps">{props.errorSteps.join(",")}</div>
      <button
        type="button"
        data-testid="fail"
        onClick={() => props.onTransactionError(new Error("user refused"))}
      >
        fail
      </button>
    </div>
  ),
}));

import Body from "../neuronFlow/Body";
import { steps as manageSteps } from "../ManageNeuronFlowModal/steps";
import { steps as refreshSteps } from "../RefreshVotingPowerFlowModal/steps";

const account = makeICPAccount({ neurons: [makeHealthyNeuron({ id: 1n })] });

const renderFlow = (steps: Step[]) =>
  render(
    <Body
      stepId="manageAction"
      onClose={jest.fn()}
      onChangeStepId={jest.fn()}
      params={{ account }}
      steps={steps}
      title="Manage neurons"
      trackEvent="CloseModalIcpManageNeurons"
      signingStepId="manageAction"
    />,
  );

const visibleIndexOf = (steps: Step[], id: StepId) =>
  steps.filter(step => !step.excludeFromBreadcrumb).findIndex(step => step.id === id);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("breadcrumb error step", () => {
  it("marks the signing step at its position among the visible steps", async () => {
    const { user } = renderFlow(manageSteps);

    await act(async () => {
      await user.click(screen.getByTestId("fail"));
    });

    expect(visibleIndexOf(manageSteps, "manageAction")).toBe(2);
    expect(screen.getByTestId("error-steps")).toHaveTextContent(/^2$/);
  });

  // The position in `steps` is the one thing the breadcrumb cannot use: the manage flow excludes
  // seven steps ahead of the signing one, so an index into the full array marks nothing at all.
  it("does not use the signing step's position in the full step list", async () => {
    expect(manageSteps.findIndex(step => step.id === "manageAction")).toBe(9);

    const { user } = renderFlow(manageSteps);
    await act(async () => {
      await user.click(screen.getByTestId("fail"));
    });

    expect(screen.getByTestId("error-steps")).not.toHaveTextContent("9");
  });

  // The refresh flow hides nothing, so both readings agree there — which is why the bug showed up
  // only in the manage flow.
  it("keeps marking the signing step in a flow whose steps are all visible", async () => {
    const { user } = renderFlow(refreshSteps);

    await act(async () => {
      await user.click(screen.getByTestId("fail"));
    });

    expect(screen.getByTestId("error-steps")).toHaveTextContent(/^1$/);
  });

  it("marks nothing before a failure", () => {
    renderFlow(manageSteps);

    expect(screen.getByTestId("error-steps")).toBeEmptyDOMElement();
  });
});
