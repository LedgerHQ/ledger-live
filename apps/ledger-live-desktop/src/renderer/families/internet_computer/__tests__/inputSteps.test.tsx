import {
  KNOWN_TOPICS,
  MIN_NEURON_STAKE,
  NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE,
  SECONDS_IN_DAY,
} from "@ledgerhq/live-common/families/internet_computer/consts";
import BigNumber from "bignumber.js";
import React from "react";
import { render, screen } from "tests/testSetup";
import StepAddHotKey from "../ManageNeuronFlowModal/steps/StepAddHotKey";
import StepFollowTopic from "../ManageNeuronFlowModal/steps/StepFollowTopic";
import StepSelectFollowees from "../ManageNeuronFlowModal/steps/StepSelectFollowees";
import StepSetDissolveDelay from "../ManageNeuronFlowModal/steps/StepSetDissolveDelay";
import StepSplitNeuron from "../ManageNeuronFlowModal/steps/StepSplitNeuron";
import StepStakeMaturity from "../ManageNeuronFlowModal/steps/StepStakeMaturity";
import SubmitFooter from "../ManageNeuronFlowModal/steps/SubmitFooter";
import { makeHealthyNeuron, makeStepProps } from "./testUtils";

const NEURON = makeHealthyNeuron({ id: 5n });

// The steps patch the transaction through onUpdateTransaction, so tests apply the updater to a
// starting transaction and assert on the result.
const applyUpdate = (
  onUpdateTransaction: jest.Mock,
  base: Record<string, unknown>,
  call = 0,
): Record<string, unknown> => onUpdateTransaction.mock.calls[call][0](base);

const stepProps = (overrides = {}) =>
  makeStepProps({ neurons: [NEURON], selectedNeuronId: "5", ...overrides });

describe("StepSetDissolveDelay", () => {
  it("converts the entered days into seconds on the increase field", async () => {
    const props = stepProps({
      transaction: { type: "increase_dissolve_delay", additionalDissolveDelay: "" },
    });
    const { user } = render(<StepSetDissolveDelay {...props} />);

    await user.type(screen.getByTestId("icp-dissolve-delay-input"), "30");

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {});
    expect(patched.additionalDissolveDelay).toBe(String(3 * SECONDS_IN_DAY));
  });

  it("writes to the set field instead when the neuron is setting its delay from zero", async () => {
    const props = stepProps({ transaction: { type: "set_dissolve_delay", dissolveDelay: "" } });
    const { user } = render(<StepSetDissolveDelay {...props} />);

    await user.type(screen.getByTestId("icp-dissolve-delay-input"), "7");

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {});
    expect(patched.dissolveDelay).toBe(String(7 * SECONDS_IN_DAY));
  });

  it("warns when the resulting delay would be too short to vote", () => {
    const props = stepProps({
      transaction: { type: "set_dissolve_delay", dissolveDelay: String(SECONDS_IN_DAY) },
    });
    render(<StepSetDissolveDelay {...props} />);

    expect(screen.getByText(/the neuron cannot vote and earns no rewards/)).toBeInTheDocument();
  });

  it("does not warn at exactly the voting threshold", () => {
    const props = stepProps({
      transaction: {
        type: "set_dissolve_delay",
        dissolveDelay: String(NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE),
      },
    });
    render(<StepSetDissolveDelay {...props} />);

    expect(screen.queryByText(/cannot vote and earns no rewards/)).not.toBeInTheDocument();
  });
});

describe("StepSplitNeuron", () => {
  it("shows the range the canister will accept for this neuron", () => {
    const neuron = makeHealthyNeuron({
      id: 5n,
      cachedNeuronStakeE8s: BigInt(4 * MIN_NEURON_STAKE),
    });
    const props = makeStepProps({
      neurons: [neuron],
      selectedNeuronId: "5",
      transaction: { amount: new BigNumber(0) },
    });
    const { container } = render(<StepSplitNeuron {...props} />);

    // The fee raises the floor only: min is 1 ICP + fee, max is the 4 ICP stake less the 1 ICP the
    // parent must keep. FormattedVal separates the code with a non-breaking space.
    const text = container.textContent?.replace(/\u00a0/g, " ");
    expect(text).toContain("1.0001");
    expect(text).toContain("3 ICP");
  });

  it("keeps continue disabled until an amount is entered", () => {
    const props = makeStepProps({ transaction: { amount: new BigNumber(0) } });
    render(<SubmitFooter {...props} canContinue={!!props.transaction?.amount.gt(0)} />);

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });
});

describe("StepStakeMaturity", () => {
  const withMaturity = makeHealthyNeuron({ id: 5n, maturityE8sEquivalent: 200_000_000n });

  it("renders nothing when the selected neuron has gone", () => {
    const { container } = render(
      <StepStakeMaturity
        {...makeStepProps({ neurons: [withMaturity], selectedNeuronId: "999" })}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("stores the typed percentage on the transaction", async () => {
    const props = makeStepProps({
      neurons: [withMaturity],
      selectedNeuronId: "5",
      transaction: { type: "stake_maturity", percentageToStake: "" },
    });
    const { user } = render(<StepStakeMaturity {...props} />);

    await user.type(screen.getByTestId("icp-stake-maturity-input"), "5");

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {});
    expect(patched.percentageToStake).toBe("5");
  });

  it("shows the share of maturity the entered percentage represents", () => {
    const props = makeStepProps({
      neurons: [withMaturity],
      selectedNeuronId: "5",
      transaction: { type: "stake_maturity", percentageToStake: "50" },
    });
    const { container } = render(<StepStakeMaturity {...props} />);

    // Half of 2 ICP of maturity.
    expect(container.textContent?.replace(/\u00a0/g, " ")).toContain("1 ICP");
  });

  it("caps the entry at three digits and drops non-numeric input", async () => {
    const props = makeStepProps({
      neurons: [withMaturity],
      selectedNeuronId: "5",
      transaction: { type: "stake_maturity", percentageToStake: "" },
    });
    const { user } = render(<StepStakeMaturity {...props} />);

    await user.type(screen.getByTestId("icp-stake-maturity-input"), "1a2b3c4");

    const calls = (props.onUpdateTransaction as jest.Mock).mock.calls;
    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {}, calls.length - 1);
    expect(patched.percentageToStake).toBe("4");
  });

  it("keeps continue disabled until a percentage is entered", () => {
    const props = makeStepProps({ transaction: { type: "stake_maturity" } });
    render(<SubmitFooter {...props} canContinue={!!props.transaction?.percentageToStake} />);

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });
});

describe("StepAddHotKey", () => {
  it("stores the typed principal on the transaction", async () => {
    const props = stepProps({ transaction: { type: "add_hot_key", hotKeyToAdd: "" } });
    const { user } = render(<StepAddHotKey {...props} />);

    await user.type(screen.getByTestId("icp-hot-key-input"), "aaaaa-aa");

    const patched = applyUpdate(
      props.onUpdateTransaction as jest.Mock,
      {},
      (props.onUpdateTransaction as jest.Mock).mock.calls.length - 1,
    );
    expect(patched.hotKeyToAdd).toBe("a");
  });
});

describe("StepFollowTopic", () => {
  it("lists every known governance topic with its current followee count", () => {
    const neuron = makeHealthyNeuron({
      id: 5n,
      followees: [{ topic: KNOWN_TOPICS.Governance, followeeIds: [1n, 2n] }],
    });
    render(<StepFollowTopic {...makeStepProps({ neurons: [neuron], selectedNeuronId: "5" })} />);

    expect(screen.getByTestId("icp-follow-topic-Governance")).toHaveTextContent("2 followees");
    expect(screen.getByTestId("icp-follow-topic-NodeAdmin")).toHaveTextContent("0 followees");
  });

  it("records the chosen topic and moves on to its followees", async () => {
    const props = stepProps();
    const { user } = render(<StepFollowTopic {...props} />);

    await user.click(screen.getByTestId("icp-follow-topic-Governance"));

    expect(props.setFollowTopic).toHaveBeenCalledWith("Governance");
    expect(props.transitionTo).toHaveBeenCalledWith("selectFollowees");
  });
});

describe("StepSelectFollowees", () => {
  it("renders nothing until a topic has been picked", () => {
    const { container } = render(<StepSelectFollowees {...stepProps({ followTopic: null })} />);

    expect(container.firstChild).toBeNull();
  });

  // Submitting an untouched list must be a no-op, not a wipe: `follow` replaces the whole list.
  it("seeds the transaction from the neuron's existing followees for that topic", () => {
    const neuron = makeHealthyNeuron({
      id: 5n,
      followees: [{ topic: KNOWN_TOPICS.Governance, followeeIds: [9n, 8n] }],
    });
    const props = makeStepProps({
      neurons: [neuron],
      selectedNeuronId: "5",
      followTopic: "Governance",
      transaction: { type: "follow" },
    });
    render(<StepSelectFollowees {...props} />);

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {});
    expect(patched).toMatchObject({ followTopic: "Governance", followeesIds: ["9", "8"] });
  });

  it("lists the followees already on the transaction and can drop one", async () => {
    const props = makeStepProps({
      neurons: [NEURON],
      selectedNeuronId: "5",
      followTopic: "Governance",
      transaction: { type: "follow", followTopic: "Governance", followeesIds: ["9", "8"] },
    });
    const { user } = render(<StepSelectFollowees {...props} />);

    await user.click(screen.getAllByText("Remove")[0]);

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {});
    expect(patched.followeesIds).toEqual(["8"]);
  });

  it("says the neuron will not vote while the list is empty", () => {
    const props = makeStepProps({
      neurons: [NEURON],
      selectedNeuronId: "5",
      followTopic: "Governance",
      transaction: { type: "follow", followTopic: "Governance", followeesIds: [] },
    });
    render(<StepSelectFollowees {...props} />);

    expect(screen.getByText(/No followees yet/)).toBeInTheDocument();
  });
});

describe("SubmitFooter", () => {
  it("blocks continue while the bridge reports an error", () => {
    const props = makeStepProps({
      status: {
        errors: { transaction: new Error("nope") },
        warnings: {},
        amount: new BigNumber(0),
      },
    });
    render(<SubmitFooter {...props} />);

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  it("blocks continue while the bridge is still recomputing", () => {
    render(<SubmitFooter {...makeStepProps({ bridgePending: true })} />);

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  it("moves to the signing step once everything checks out", async () => {
    const props = makeStepProps();
    const { user } = render(<SubmitFooter {...props} />);

    await user.click(screen.getByTestId("icp-continue-button"));

    expect(props.transitionTo).toHaveBeenCalledWith("manageAction");
  });
});
