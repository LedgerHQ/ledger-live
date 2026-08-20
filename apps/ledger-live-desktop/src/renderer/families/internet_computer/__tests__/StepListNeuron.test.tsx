import { SECONDS_IN_DAY } from "@ledgerhq/live-common/families/internet_computer/consts";
import React from "react";
import { render, screen } from "tests/testSetup";
import { makeICPAccount, makeNeuron, makeStepProps } from "./testUtils";

const bridgeMock = {
  createTransaction: jest.fn(() => ({ family: "internet_computer", type: "send" })),
  updateTransaction: jest.fn((transaction, patch) => ({ ...transaction, ...patch })),
};

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  __esModule: true,
  useAccountBridge: () => bridgeMock,
}));

import StepListNeuron, {
  StepListNeuronFooter,
} from "../ManageNeuronFlowModal/steps/StepListNeuron";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("StepListNeuron", () => {
  it("shows the empty state when the account holds no neurons", () => {
    render(<StepListNeuron {...makeStepProps()} />);

    expect(screen.getByText(/You have no neurons yet/)).toBeInTheDocument();
    expect(screen.queryByTestId("icp-neuron-row")).not.toBeInTheDocument();
  });

  it("renders one row per neuron with its id, stake and state", () => {
    const neurons = [
      makeNeuron({ id: 11n, cachedNeuronStakeE8s: 300_000_000n }),
      makeNeuron({ id: 22n, cachedNeuronStakeE8s: 100_000_000n }),
    ];
    render(<StepListNeuron {...makeStepProps({ neurons })} />);

    expect(screen.getAllByTestId("icp-neuron-row")).toHaveLength(2);
    expect(screen.getByText("11")).toBeInTheDocument();
    expect(screen.getByText("22")).toBeInTheDocument();
    expect(screen.getAllByText("Locked")).toHaveLength(2);
  });

  // The cell showed the raw cached stake, so a penalised neuron was listed with more stake than the
  // manage screen and the account footer credit it with.
  it("lists the stake net of the fees the neuron has accrued", () => {
    const neurons = [
      makeNeuron({ id: 11n, cachedNeuronStakeE8s: 300_000_000n, neuronFeesE8s: 50_000_000n }),
    ];
    render(<StepListNeuron {...makeStepProps({ neurons })} />);

    expect(screen.getByText("2.5 ICP")).toBeInTheDocument();
    expect(screen.queryByText("3 ICP")).not.toBeInTheDocument();
  });

  it("formats a dissolve delay and falls back to a dash when there is none", () => {
    const neurons = [
      makeNeuron({ id: 11n, dissolveState: { DissolveDelaySeconds: BigInt(SECONDS_IN_DAY * 3) } }),
      makeNeuron({ id: 22n }),
    ];
    render(<StepListNeuron {...makeStepProps({ neurons })} />);

    expect(screen.getByText("3 days")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("selects the clicked neuron and moves to the manage step", async () => {
    const props = makeStepProps({ neurons: [makeNeuron({ id: 42n })] });
    const { user } = render(<StepListNeuron {...props} />);

    await user.click(screen.getByTestId("icp-neuron-row"));

    expect(props.setSelectedNeuronId).toHaveBeenCalledWith("42");
    expect(props.transitionTo).toHaveBeenCalledWith("manage");
  });

  it("renders the error instead of the list when the flow has failed", () => {
    const props = makeStepProps({
      neurons: [makeNeuron()],
      error: new Error("device unplugged"),
    });
    render(<StepListNeuron {...props} />);

    expect(screen.queryByTestId("icp-neuron-row")).not.toBeInTheDocument();
  });
});

describe("StepListNeuronFooter", () => {
  it("reports never when no snapshot has ever been signed for", () => {
    render(<StepListNeuronFooter {...makeStepProps()} />);

    expect(screen.getByText(/Last synced: Never/i)).toBeInTheDocument();
  });

  it("builds a list_neurons transaction and goes to the device step", async () => {
    const props = makeStepProps({ account: makeICPAccount(), lastUpdatedMSecs: Date.now() });
    const { user } = render(<StepListNeuronFooter {...props} />);

    await user.click(screen.getByTestId("icp-sync-neurons-button"));

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(expect.anything(), {
      type: "list_neurons",
    });
    expect(props.setLastAction).toHaveBeenCalledWith("list_neurons");
    expect(props.transitionTo).toHaveBeenCalledWith("device");
  });
});
