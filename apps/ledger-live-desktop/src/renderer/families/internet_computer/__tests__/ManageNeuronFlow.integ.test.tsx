import type { InternetComputerOperation } from "@ledgerhq/live-common/families/internet_computer/types";
import BigNumber from "bignumber.js";
import React, { useState } from "react";
import { act, render, screen } from "tests/testSetup";
import { makeHealthyNeuron, makeICPAccount, makeNeuron } from "./testUtils";
import type { StepId } from "../neuronFlow/types";

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

// The device steps drive a real DeviceAction; stub them so the flow can be walked without hardware,
// exposing the two callbacks the Body wires up.
jest.mock("~/renderer/modals/Send/steps/GenericStepConnectDevice", () => ({
  __esModule: true,
  default: (props: {
    onOperationBroadcasted: (operation: InternetComputerOperation) => void;
    onTransactionError: (error: Error) => void;
    transitionTo: (step: StepId) => void;
  }) => (
    <div data-testid="step-device">
      <button
        type="button"
        data-testid="device-broadcast"
        onClick={() => {
          props.onOperationBroadcasted({
            id: "op-1",
            accountId: "acc-1",
            type: "FEES",
            date: new Date(),
            extra: { neurons: [makeNeuron({ id: 9n })] },
          } as unknown as InternetComputerOperation);
          props.transitionTo("confirmation");
        }}
      >
        broadcast
      </button>
      <button
        type="button"
        data-testid="device-fail"
        onClick={() => props.onTransactionError(new Error("user refused"))}
      >
        fail
      </button>
    </div>
  ),
}));

import Body from "../neuronFlow/Body";
import ManageNeuronFlowModal from "../ManageNeuronFlowModal";
import RefreshVotingPowerFlowModal from "../RefreshVotingPowerFlowModal";
import { steps } from "../ManageNeuronFlowModal/steps";

const account = makeICPAccount({
  neurons: [makeHealthyNeuron({ id: 1n }), makeHealthyNeuron({ id: 2n })],
  spendableBalance: new BigNumber(500_000_000),
});

const ControlledBody = ({ initialStep = "listNeuron" as StepId }) => {
  const [stepId, setStepId] = useState<StepId>(initialStep);
  return (
    <Body
      stepId={stepId}
      onClose={jest.fn()}
      onChangeStepId={setStepId}
      params={{ account }}
      steps={steps}
      title="Manage neurons"
      trackEvent="CloseModalIcpManageNeurons"
      signingStepId="manageAction"
    />
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("manage neuron flow (integration)", () => {
  it("opens on the neuron list and shows the breadcrumb stages", async () => {
    await act(async () => {
      render(<ControlledBody />);
    });

    expect(screen.getAllByTestId("icp-neuron-row")).toHaveLength(2);
    // The input steps are excluded from the breadcrumb; these four are not.
    expect(screen.getByText("Neurons")).toBeInTheDocument();
    expect(screen.getByText("Manage")).toBeInTheDocument();
    expect(screen.getByText("Confirmation")).toBeInTheDocument();
  });

  it("walks list → manage and back again", async () => {
    const { user } = render(<ControlledBody />);

    await act(async () => {
      await user.click(screen.getAllByTestId("icp-neuron-row")[0]);
    });
    expect(screen.getByText("Voting power")).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByTestId("modal-back-button"));
    });
    expect(screen.getAllByTestId("icp-neuron-row")).toHaveLength(2);
  });

  it("routes the sync action to the device step", async () => {
    const { user } = render(<ControlledBody />);

    await act(async () => {
      await user.click(screen.getByTestId("icp-sync-neurons-button"));
    });

    expect(screen.getByTestId("step-device")).toBeInTheDocument();
  });

  // The flow shows the freshly signed snapshot before the account has finished syncing.
  it("shows the broadcast neuron snapshot on returning to the list", async () => {
    const { user } = render(<ControlledBody />);

    await act(async () => {
      await user.click(screen.getByTestId("icp-sync-neurons-button"));
    });
    await act(async () => {
      await user.click(screen.getByTestId("device-broadcast"));
    });

    expect(screen.getByText("Done")).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByTestId("icp-back-to-neurons-button"));
    });

    // The operation carried a single neuron, replacing the account's two.
    expect(screen.getAllByTestId("icp-neuron-row")).toHaveLength(1);
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("surfaces a signing failure without leaving the flow", async () => {
    const { user } = render(<ControlledBody />);

    await act(async () => {
      await user.click(screen.getByTestId("icp-sync-neurons-button"));
    });
    await act(async () => {
      await user.click(screen.getByTestId("device-fail"));
    });

    expect(screen.getByTestId("step-device")).toBeInTheDocument();
  });
});

describe("modal shells", () => {
  it.each([
    ["manage neurons", ManageNeuronFlowModal],
    ["refresh voting power", RefreshVotingPowerFlowModal],
  ])("mounts the %s modal without opening it", (_name, Component) => {
    const { container } = render(<Component />);

    expect(container).toBeInTheDocument();
  });
});
