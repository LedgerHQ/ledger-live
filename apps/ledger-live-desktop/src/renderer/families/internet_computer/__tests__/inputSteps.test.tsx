import {
  KNOWN_TOPICS,
  MAX_FOLLOWEES_PER_TOPIC,
  MIN_NEURON_STAKE,
  NNS_MAXIMUM_DISSOLVE_DELAY,
  NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE,
  SECONDS_IN_DAY,
} from "@ledgerhq/live-common/families/internet_computer/consts";
import BigNumber from "bignumber.js";
import React from "react";
import { fireEvent, render, screen } from "tests/testSetup";

const TEST_PRINCIPAL = "test-principal";

jest.mock("@ledgerhq/live-common/families/internet_computer/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/internet_computer/react"),
  // The account's real principal comes from a device-provided key genAccount cannot fake.
  useICPPrincipal: () => TEST_PRINCIPAL,
}));
import StepAddHotKey, { StepAddHotKeyFooter } from "../ManageNeuronFlowModal/steps/StepAddHotKey";
import StepFollowTopic from "../ManageNeuronFlowModal/steps/StepFollowTopic";
import StepSelectFollowees, {
  StepSelectFolloweesFooter,
} from "../ManageNeuronFlowModal/steps/StepSelectFollowees";
import StepSetDissolveDelay, {
  StepSetDissolveDelayFooter,
} from "../ManageNeuronFlowModal/steps/StepSetDissolveDelay";
import StepSplitNeuron, {
  StepSplitNeuronFooter,
} from "../ManageNeuronFlowModal/steps/StepSplitNeuron";
import StepStakeMaturity, {
  StepStakeMaturityFooter,
} from "../ManageNeuronFlowModal/steps/StepStakeMaturity";
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
  // Driven with a whole value for the reason documented on StepStakeMaturity below: the input is
  // controlled by a transaction prop these tests hold fixed, so typing "30" would report the "3".
  it("converts the entered days into seconds on the increase field", () => {
    const props = stepProps({
      transaction: { type: "increase_dissolve_delay", additionalDissolveDelay: "" },
    });
    render(<StepSetDissolveDelay {...props} />);

    fireEvent.change(screen.getByTestId("icp-dissolve-delay-input"), { target: { value: "30" } });

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {});
    expect(patched.additionalDissolveDelay).toBe(String(30 * SECONDS_IN_DAY));
  });

  it("writes to the set field instead when the neuron is setting its delay from zero", async () => {
    const props = stepProps({ transaction: { type: "set_dissolve_delay", dissolveDelay: "" } });
    const { user } = render(<StepSetDissolveDelay {...props} />);

    await user.type(screen.getByTestId("icp-dissolve-delay-input"), "7");

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {});
    expect(patched.dissolveDelay).toBe(String(7 * SECONDS_IN_DAY));
  });

  // The protocol maximum is 730.5 days; entry is in whole days, so the clamp lands on 730.
  const MAX_ENTERABLE_SECONDS = String(
    Math.floor(NNS_MAXIMUM_DISSOLVE_DELAY / SECONDS_IN_DAY) * SECONDS_IN_DAY,
  );

  // NEURON is already locked for the 14-day voting minimum, so an increase may only add the rest.
  const REMAINING_DAYS = Math.floor(
    (NNS_MAXIMUM_DISSOLVE_DELAY - NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE) / SECONDS_IN_DAY,
  );

  it("clamps an entry above the maximum to the maximum", () => {
    const props = stepProps({ transaction: { type: "set_dissolve_delay", dissolveDelay: "" } });
    render(<StepSetDissolveDelay {...props} />);

    fireEvent.change(screen.getByTestId("icp-dissolve-delay-input"), {
      target: { value: "99999" },
    });

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {});
    expect(patched.dissolveDelay).toBe(MAX_ENTERABLE_SECONDS);
  });

  // Number() turns a pasted 300-digit value into Infinity, which used to throw inside BigInt()
  // while rendering the resulting delay — a crash of the step, not a blocked submit.
  it("survives a pasted number too large for a double", () => {
    const props = stepProps({ transaction: { type: "set_dissolve_delay", dissolveDelay: "" } });
    render(<StepSetDissolveDelay {...props} />);

    fireEvent.change(screen.getByTestId("icp-dissolve-delay-input"), {
      target: { value: "9".repeat(400) },
    });

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {});
    expect(patched.dissolveDelay).toBe(MAX_ENTERABLE_SECONDS);
  });

  // The bridge rejects `current + additional > max`, so the room left under the cap is the real
  // bound. Clamping an increase to the absolute maximum still let the total overshoot it.
  it("clamps an increase to the room left under the maximum, not to the maximum itself", () => {
    const props = stepProps({
      transaction: { type: "increase_dissolve_delay", additionalDissolveDelay: "" },
    });
    render(<StepSetDissolveDelay {...props} />);

    fireEvent.change(screen.getByTestId("icp-dissolve-delay-input"), {
      target: { value: "99999" },
    });

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {});
    expect(patched.additionalDissolveDelay).toBe(String(REMAINING_DAYS * SECONDS_IN_DAY));
    expect(patched.additionalDissolveDelay).not.toBe(MAX_ENTERABLE_SECONDS);
  });

  it("quotes the days still available to add rather than the absolute cap", () => {
    const props = stepProps({
      transaction: { type: "increase_dissolve_delay", additionalDissolveDelay: "" },
    });
    render(<StepSetDissolveDelay {...props} />);

    expect(
      screen.getByText(`add up to ${REMAINING_DAYS} more days`, { exact: false }),
    ).toBeInTheDocument();
  });

  // Reachable only if the neuron reaches the cap while the step is open — StepManage stops offering
  // the action — but the entry has to collapse to a value the footer refuses rather than submit.
  it("leaves nothing to enter for a neuron already at the maximum", () => {
    const props = makeStepProps({
      neurons: [
        makeHealthyNeuron({
          id: 5n,
          dissolveState: { DissolveDelaySeconds: BigInt(NNS_MAXIMUM_DISSOLVE_DELAY) },
        }),
      ],
      selectedNeuronId: "5",
      transaction: { type: "increase_dissolve_delay", additionalDissolveDelay: "" },
    });
    render(<StepSetDissolveDelay {...props} />);

    fireEvent.change(screen.getByTestId("icp-dissolve-delay-input"), { target: { value: "5" } });

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {});
    expect(patched.additionalDissolveDelay).toBe("0");
  });

  it("warns when the resulting delay would be too short to vote", () => {
    const props = stepProps({
      transaction: { type: "set_dissolve_delay", dissolveDelay: String(SECONDS_IN_DAY) },
    });
    render(<StepSetDissolveDelay {...props} />);

    expect(screen.getByText(/the neuron cannot vote and earns no rewards/)).toBeInTheDocument();
  });

  // Entry is in whole days, so "0" is what a zero-day entry stores — a non-empty string the old
  // presence check waved through, leaving the bridge to reject it with an unreadable range error.
  it.each([
    ["set_dissolve_delay", { dissolveDelay: "0" }],
    ["increase_dissolve_delay", { additionalDissolveDelay: "0" }],
  ])("keeps continue disabled for a zero-day %s", (type, fields) => {
    const props = stepProps({ transaction: { type, ...fields } });
    render(<StepSetDissolveDelayFooter {...props} />);

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  // The bound errors carry the only pluralized copy in the errors block, and i18next selects the
  // form from `count`, not from minDays. Without it the banner falls back to "Something went wrong".
  it("renders the quoted day bound in its plural form", () => {
    const props = stepProps({
      transaction: { type: "set_dissolve_delay", dissolveDelay: "1" },
      status: {
        errors: {
          transaction: Object.assign(new Error("ICPDissolveDelayLTMin"), {
            name: "ICPDissolveDelayLTMin",
            minDays: 7,
            count: 7,
          }),
        },
      },
    });
    render(<StepSetDissolveDelayFooter {...props} />);

    expect(screen.getByText(/at least 7 days/)).toBeInTheDocument();
  });

  it.each([
    ["set_dissolve_delay", { dissolveDelay: String(NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE) }],
    ["increase_dissolve_delay", { additionalDissolveDelay: String(SECONDS_IN_DAY) }],
  ])("allows continue for a positive %s", (type, fields) => {
    const props = stepProps({ transaction: { type, ...fields } });
    render(<StepSetDissolveDelayFooter {...props} />);

    expect(screen.getByTestId("icp-continue-button")).toBeEnabled();
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
    const props = stepProps({ transaction: { amount: new BigNumber(0) } });
    render(<SubmitFooter {...props} canContinue={!!props.transaction?.amount.gt(0)} />);

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });
});

describe("StepStakeMaturity", () => {
  const withMaturity = makeHealthyNeuron({ id: 5n, maturityE8sEquivalent: 200_000_000n });

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

  // The input is controlled by the transaction prop, which these tests hold fixed, so typing a
  // multi-character string would only ever exercise the last keystroke. Drive the handler with a
  // whole value instead.
  it.each([
    ["50", "50"],
    ["1a2b", "12"],
    ["1234", "100"],
    ["007", "7"],
  ])("normalizes %s to %s", async (typed, expected) => {
    const props = makeStepProps({
      neurons: [withMaturity],
      selectedNeuronId: "5",
      transaction: { type: "stake_maturity", percentageToStake: "" },
    });
    render(<StepStakeMaturity {...props} />);

    fireEvent.change(screen.getByTestId("icp-stake-maturity-input"), { target: { value: typed } });

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {});
    expect(patched.percentageToStake).toBe(expected);
  });

  it("survives a pasted number too large for a double", () => {
    const props = makeStepProps({
      neurons: [withMaturity],
      selectedNeuronId: "5",
      transaction: { type: "stake_maturity", percentageToStake: "" },
    });
    render(<StepStakeMaturity {...props} />);

    fireEvent.change(screen.getByTestId("icp-stake-maturity-input"), {
      target: { value: "9".repeat(400) },
    });

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {});
    expect(patched.percentageToStake).toBe("100");
  });

  it("previews nothing rather than throwing on a stored value that is not a whole number", () => {
    const props = makeStepProps({
      neurons: [withMaturity],
      selectedNeuronId: "5",
      transaction: { type: "stake_maturity", percentageToStake: "33.3" },
    });
    const { container } = render(<StepStakeMaturity {...props} />);

    expect(container.textContent?.replace(/\u00a0/g, " ")).toContain("0 ICP");
  });

  // The bridge rejects both, but no ICP error carries a translation, so leaning on the error banner
  // would surface "ICPInvalidPercentage" to the user.
  it.each(["", "0"])("keeps continue disabled for the percentage %p", percentageToStake => {
    const props = makeStepProps({
      neurons: [withMaturity],
      selectedNeuronId: "5",
      transaction: { type: "stake_maturity", percentageToStake },
    });
    render(<StepStakeMaturityFooter {...props} />);

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  it.each(["1", "100"])("allows continue for the percentage %p", percentageToStake => {
    const props = makeStepProps({
      neurons: [withMaturity],
      selectedNeuronId: "5",
      transaction: { type: "stake_maturity", percentageToStake },
    });
    render(<StepStakeMaturityFooter {...props} />);

    expect(screen.getByTestId("icp-continue-button")).toBeEnabled();
  });
});

describe("StepAddHotKey", () => {
  it("stores the entered principal on the transaction verbatim", () => {
    const props = stepProps({ transaction: { type: "add_hot_key", hotKeyToAdd: "" } });
    render(<StepAddHotKey {...props} />);

    fireEvent.change(screen.getByTestId("icp-hot-key-input"), { target: { value: "aaaaa-aa" } });

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {});
    // Unvalidated here on purpose: the bridge rejects a malformed principal.
    expect(patched.hotKeyToAdd).toBe("aaaaa-aa");
  });

  // The step asks for a principal, and this is the only place in the app that shows one — without it
  // the user has no way to recognize the identifier the field wants.
  it("shows the account's own principal for reference", () => {
    render(<StepAddHotKey {...stepProps({ transaction: { type: "add_hot_key" } })} />);

    expect(screen.getByTestId("icp-own-principal")).toHaveTextContent(TEST_PRINCIPAL);
  });

  it("says the hot key has to be a different principal from this one", () => {
    render(<StepAddHotKey {...stepProps({ transaction: { type: "add_hot_key" } })} />);

    expect(screen.getByText(/Enter a different principal/)).toBeInTheDocument();
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

  // The keys of KNOWN_TOPICS are wire identifiers, and all 19 used to reach the screen as written.
  it("names each topic instead of showing its identifier", () => {
    render(<StepFollowTopic {...stepProps()} />);

    expect(screen.getByTestId("icp-follow-topic-IcOsVersionDeployment")).toHaveTextContent(
      "IC OS version deployment",
    );
    expect(screen.getByTestId("icp-follow-topic-Kyc")).toHaveTextContent("KYC");
    expect(screen.queryByText("IcOsVersionDeployment")).not.toBeInTheDocument();
  });

  // The topic lives on the transaction and nowhere else: anything the step held separately could
  // disagree with what the device is handed.
  it("records the chosen topic on the transaction and moves on to its followees", async () => {
    const props = stepProps();
    const { user } = render(<StepFollowTopic {...props} />);

    await user.click(screen.getByTestId("icp-follow-topic-Governance"));

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {});
    expect(patched.followTopic).toBe("Governance");
    expect(props.transitionTo).toHaveBeenCalledWith("selectFollowees");
  });

  // Submitting an untouched list must be a no-op, not a wipe: `follow` replaces the whole list.
  it("seeds the list from the neuron's existing followees for that topic", async () => {
    const neuron = makeHealthyNeuron({
      id: 5n,
      followees: [{ topic: KNOWN_TOPICS.Governance, followeeIds: [9n, 8n] }],
    });
    const props = makeStepProps({ neurons: [neuron], selectedNeuronId: "5" });
    const { user } = render(<StepFollowTopic {...props} />);

    await user.click(screen.getByTestId("icp-follow-topic-Governance"));

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {});
    expect(patched).toMatchObject({ followTopic: "Governance", followeesIds: ["9", "8"] });
  });

  /*
   * The regression this whole arrangement exists for. The topic used to live in flow state while the
   * transaction was seeded once, guarded on the followee list being absent — and an empty list is
   * present. So picking a topic, going back and picking another showed the second topic and signed
   * the first, with the first one's followees.
   */
  it("re-seeds from the newly chosen topic when the topic changes", async () => {
    const neuron = makeHealthyNeuron({
      id: 5n,
      followees: [
        { topic: KNOWN_TOPICS.Governance, followeeIds: [9n] },
        { topic: KNOWN_TOPICS.NodeAdmin, followeeIds: [7n, 6n] },
      ],
    });
    const props = makeStepProps({ neurons: [neuron], selectedNeuronId: "5" });
    const { user } = render(<StepFollowTopic {...props} />);

    await user.click(screen.getByTestId("icp-follow-topic-NodeAdmin"));

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {
      followTopic: "Governance",
      followeesIds: ["9"],
    });
    expect(patched).toMatchObject({ followTopic: "NodeAdmin", followeesIds: ["7", "6"] });
  });

  // Coming back to the same topic is not a reason to throw away a list being edited.
  it("keeps an edit in progress when the same topic is picked again", async () => {
    const props = stepProps();
    const { user } = render(<StepFollowTopic {...props} />);

    await user.click(screen.getByTestId("icp-follow-topic-Governance"));

    const base = { followTopic: "Governance", followeesIds: ["1", "2", "3"] };
    expect(applyUpdate(props.onUpdateTransaction as jest.Mock, base)).toBe(base);
  });

  it("clears a draft left over from a previous visit", async () => {
    const props = stepProps({ followeeDraft: "8" });
    const { user } = render(<StepFollowTopic {...props} />);

    await user.click(screen.getByTestId("icp-follow-topic-Governance"));

    expect(props.setFolloweeDraft).toHaveBeenCalledWith("");
  });

  // NeuronManagement is the one topic the canister reserves for the controller, even though hot
  // keys may set following on every other topic.
  const renderTopicsFor = (controller: string) => {
    const neuron = makeHealthyNeuron({ id: 5n, controller });
    render(<StepFollowTopic {...makeStepProps({ neurons: [neuron], selectedNeuronId: "5" })} />);
  };

  it("locks NeuronManagement for a hot-key holder, leaving other topics open", () => {
    renderTopicsFor("someone-else");

    expect(screen.getByTestId("icp-follow-topic-NeuronManagement")).toBeDisabled();
    expect(screen.getByTestId("icp-follow-topic-Governance")).toBeEnabled();
  });

  it("opens NeuronManagement to the controller", () => {
    renderTopicsFor(TEST_PRINCIPAL);

    expect(screen.getByTestId("icp-follow-topic-NeuronManagement")).toBeEnabled();
  });
});

describe("StepSelectFollowees", () => {
  it("names the topic it is editing rather than interpolating the identifier", () => {
    const props = stepProps({
      transaction: { type: "follow", followTopic: "IcOsVersionDeployment", followeesIds: ["9"] },
    });
    render(<StepSelectFollowees {...props} />);

    expect(screen.getByText(/vote on IC OS version deployment/)).toBeInTheDocument();
  });

  it("renders nothing until a topic has been picked", () => {
    const { container } = render(
      <StepSelectFollowees {...stepProps({ transaction: { type: "follow" } })} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("lists the followees already on the transaction and can drop one", async () => {
    const props = makeStepProps({
      neurons: [NEURON],
      selectedNeuronId: "5",
      transaction: { type: "follow", followTopic: "Governance", followeesIds: ["9", "8"] },
    });
    const { user } = render(<StepSelectFollowees {...props} />);

    await user.click(screen.getAllByText("Remove")[0]);

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {});
    expect(patched.followeesIds).toEqual(["8"]);
  });

  it("reports what is typed without touching the list", () => {
    const props = stepProps({
      transaction: { type: "follow", followTopic: "Governance", followeesIds: ["9"] },
    });
    render(<StepSelectFollowees {...props} />);

    fireEvent.change(screen.getByTestId("icp-followee-input"), { target: { value: "8" } });

    expect(props.setFolloweeDraft).toHaveBeenCalledWith("8");
    expect(props.onUpdateTransaction).not.toHaveBeenCalled();
  });

  it("adds the drafted neuron id as a followee and clears the field", async () => {
    const props = stepProps({
      transaction: { type: "follow", followTopic: "Governance", followeesIds: ["9"] },
      followeeDraft: "8",
    });
    const { user } = render(<StepSelectFollowees {...props} />);

    await user.click(screen.getByTestId("icp-followee-add-button"));

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {});
    expect(patched.followeesIds).toEqual(["9", "8"]);
    expect(props.setFolloweeDraft).toHaveBeenCalledWith("");
  });

  // Leading zeros survived into the list as a distinct entry, which the canister reads as the same
  // neuron: the optimistic snapshot then held two rows for it and one Remove dropped both.
  it("stores the neuron id in the form the canister reads it in", async () => {
    const props = stepProps({
      transaction: { type: "follow", followTopic: "Governance", followeesIds: [] },
      followeeDraft: "008",
    });
    const { user } = render(<StepSelectFollowees {...props} />);

    await user.click(screen.getByTestId("icp-followee-add-button"));

    const patched = applyUpdate(props.onUpdateTransaction as jest.Mock, {});
    expect(patched.followeesIds).toEqual(["8"]);
  });

  it.each([
    ["rrkah-fqaaa-cai", /digits only/],
    ["12a3", /digits only/],
    ["0", /not a valid neuron ID/],
    // A real 20-digit id starts with 1, so mistyping that digit clears the nat64 ceiling.
    ["23194199462915819287", /not a valid neuron ID/],
    ["9", /already a followee/],
    // Same neuron as the "9" the list already holds, so the check has to compare canonically.
    ["009", /already a followee/],
    ["5", /cannot follow itself/],
  ])("refuses the draft %p and says why", (followeeDraft, copy) => {
    const props = stepProps({
      transaction: { type: "follow", followTopic: "Governance", followeesIds: ["9"] },
      followeeDraft,
    });
    render(<StepSelectFollowees {...props} />);

    expect(screen.getByTestId("icp-followee-add-button")).toBeDisabled();
    expect(screen.getByTestId("icp-followee-notice")).toHaveTextContent(copy);
  });

  it("asks for a usable draft to be added rather than refusing it", () => {
    const props = stepProps({
      transaction: { type: "follow", followTopic: "Governance", followeesIds: ["9"] },
      followeeDraft: "8",
    });
    render(<StepSelectFollowees {...props} />);

    expect(screen.getByTestId("icp-followee-add-button")).toBeEnabled();
    expect(screen.getByTestId("icp-followee-notice")).toHaveTextContent(/Select Add/);
  });

  it("stops accepting followees at the cap the canister enforces", () => {
    const followeesIds = Array.from({ length: MAX_FOLLOWEES_PER_TOPIC }, (_, i) => String(i + 10));
    const props = stepProps({
      transaction: { type: "follow", followTopic: "Governance", followeesIds },
      followeeDraft: "8",
    });
    render(<StepSelectFollowees {...props} />);

    expect(screen.getByTestId("icp-followee-add-button")).toBeDisabled();
    expect(screen.getByTestId("icp-followee-notice")).toHaveTextContent(
      `at most ${MAX_FOLLOWEES_PER_TOPIC}`,
    );
  });

  it("offers a copy control on every followee in the list", () => {
    const props = stepProps({
      transaction: { type: "follow", followTopic: "Governance", followeesIds: ["9", "8"] },
    });
    render(<StepSelectFollowees {...props} />);

    expect(screen.getAllByText("Copy")).toHaveLength(2);
  });

  // NEURON follows one neuron on Governance already, so an empty submission would clear it — the
  // canister replaces the whole list per call. The neutral empty-state copy read like a no-op.
  it("warns that submitting an empty list stops existing following", () => {
    const props = makeStepProps({
      neurons: [NEURON],
      selectedNeuronId: "5",
      transaction: { type: "follow", followTopic: "Governance", followeesIds: [] },
    });
    render(<StepSelectFollowees {...props} />);

    expect(screen.getByText(/stops this neuron following anyone/)).toBeInTheDocument();
  });

  it("says the neuron will not vote while there was nothing to clear", () => {
    const props = makeStepProps({
      neurons: [makeHealthyNeuron({ id: 5n, followees: [] })],
      selectedNeuronId: "5",
      transaction: { type: "follow", followTopic: "Governance", followeesIds: [] },
    });
    render(<StepSelectFollowees {...props} />);

    expect(screen.getByText(/No followees yet/)).toBeInTheDocument();
  });

  // Empty over empty is a device confirmation that changes nothing.
  it("keeps continue disabled when there is neither a new list nor one to clear", () => {
    const props = makeStepProps({
      neurons: [makeHealthyNeuron({ id: 5n, followees: [] })],
      selectedNeuronId: "5",
      transaction: { type: "follow", followTopic: "Governance", followeesIds: [] },
    });
    render(<StepSelectFolloweesFooter {...props} />);

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  it("allows continue on an empty list when it would clear existing following", () => {
    const props = makeStepProps({
      neurons: [NEURON],
      selectedNeuronId: "5",
      transaction: { type: "follow", followTopic: "Governance", followeesIds: [] },
    });
    render(<StepSelectFolloweesFooter {...props} />);

    expect(screen.getByTestId("icp-continue-button")).toBeEnabled();
  });

  it("keeps continue disabled while an id sits unadded in the field", () => {
    const props = stepProps({
      transaction: { type: "follow", followTopic: "Governance", followeesIds: ["9"] },
      followeeDraft: "8",
    });
    render(<StepSelectFolloweesFooter {...props} />);

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  it("allows continue once the field is clear again", () => {
    const props = stepProps({
      transaction: { type: "follow", followTopic: "Governance", followeesIds: ["9"] },
    });
    render(<StepSelectFolloweesFooter {...props} />);

    expect(screen.getByTestId("icp-continue-button")).toBeEnabled();
  });

  /*
   * Blocking on any non-empty draft left the user nowhere: Add greyed out because the id is already
   * a followee, Continue greyed out too, and no copy saying to clear the field. Nothing is dropped
   * by continuing here — the id is in the list already.
   */
  it("allows continue when the draft is already a followee", () => {
    const props = stepProps({
      transaction: { type: "follow", followTopic: "Governance", followeesIds: ["9"] },
      followeeDraft: "9",
    });
    render(<StepSelectFolloweesFooter {...props} />);

    expect(screen.getByTestId("icp-continue-button")).toBeEnabled();
  });
});

// A refresh or a disburse drops a neuron from the snapshot while a step may still be mounted on it,
// and every one of these steps addresses exactly one neuron. Rendering nothing left the flow on an
// empty body — the white screen QA hit on the dissolve-delay form.
describe("a step whose neuron has left the snapshot", () => {
  const cases = [
    {
      name: "setDissolveDelay",
      Step: StepSetDissolveDelay,
      transaction: { type: "increase_dissolve_delay", additionalDissolveDelay: "" },
    },
    {
      name: "splitNeuron",
      Step: StepSplitNeuron,
      transaction: { type: "split_neuron", amount: new BigNumber(0) },
    },
    {
      name: "stakeMaturity",
      Step: StepStakeMaturity,
      transaction: { type: "stake_maturity", percentageToStake: "" },
    },
    { name: "followTopic", Step: StepFollowTopic, transaction: { type: "follow" } },
    {
      name: "selectFollowees",
      Step: StepSelectFollowees,
      transaction: { type: "follow", followTopic: "Governance" },
    },
    {
      name: "addHotKey",
      Step: StepAddHotKey,
      transaction: { type: "add_hot_key", hotKeyToAdd: "" },
    },
  ];

  const gone = (transaction: Record<string, unknown>) =>
    makeStepProps({ neurons: [NEURON], selectedNeuronId: "999", transaction });

  it.each(cases)(
    "$name explains itself instead of rendering an empty body",
    ({ Step, transaction }) => {
      render(<Step {...gone(transaction)} />);

      expect(screen.getByText(/no longer in your synced snapshot/)).toBeInTheDocument();
    },
  );

  it.each(cases)(
    "$name clears the stale selection on the way back",
    async ({ Step, transaction }) => {
      const props = gone(transaction);
      const { user } = render(<Step {...props} />);

      await user.click(screen.getByTestId("icp-missing-neuron-back-button"));

      expect(props.setSelectedNeuronId).toHaveBeenCalledWith(null);
      expect(props.transitionTo).toHaveBeenCalledWith("listNeuron");
    },
  );
});

describe("SubmitFooter", () => {
  it("blocks continue while the bridge reports an error", () => {
    const props = stepProps({
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
    render(<SubmitFooter {...stepProps({ bridgePending: true })} />);

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  // The body explains the state, but it is the footer that stops the signature: the transaction
  // still names the neuron and the canister would refuse it.
  it("withholds continue when the selected neuron has left the snapshot", () => {
    render(<SubmitFooter {...makeStepProps({ neurons: [NEURON], selectedNeuronId: "999" })} />);

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  it("moves to the signing step once everything checks out", async () => {
    const props = stepProps();
    const { user } = render(<SubmitFooter {...props} />);

    await user.click(screen.getByTestId("icp-continue-button"));

    expect(props.transitionTo).toHaveBeenCalledWith("manageAction");
  });
});

describe("SubmitFooter error banner", () => {
  const withBridgeError = () =>
    stepProps({
      status: {
        errors: { transaction: new Error("nope") },
        warnings: {},
        amount: new BigNumber(0),
      },
    });

  // The bridge validates an empty required field as invalid, so every input step used to open with a
  // red banner before the user had typed a character.
  it("stays quiet about an untouched field the bridge already calls invalid", () => {
    render(<SubmitFooter {...withBridgeError()} hasInput={false} />);

    expect(screen.queryByText("nope")).not.toBeInTheDocument();
    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  it("explains the error once something has been entered", () => {
    render(<SubmitFooter {...withBridgeError()} hasInput />);

    expect(screen.getByText("nope")).toBeInTheDocument();
  });

  // An entry that is present but out of range is where hasInput and canContinue diverge: Continue
  // stays disabled, and the reason has to be on screen or nothing explains why.
  it("explains an out-of-range entry while still blocking continue", () => {
    render(<SubmitFooter {...withBridgeError()} hasInput canContinue={false} />);

    expect(screen.getByText("nope")).toBeInTheDocument();
    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });
});

describe("input step footers on an untouched field", () => {
  const pristine = (transaction: Record<string, unknown>) =>
    makeStepProps({
      neurons: [NEURON],
      selectedNeuronId: "5",
      transaction,
      status: {
        // Both slots, since the steps do not all report through the same one.
        errors: { transaction: new Error("nope"), amount: new Error("nope") },
        warnings: {},
        amount: new BigNumber(0),
      },
    });

  it("says nothing on the add-hot-key step", () => {
    render(<StepAddHotKeyFooter {...pristine({ type: "add_hot_key", hotKeyToAdd: "" })} />);

    expect(screen.queryByText("nope")).not.toBeInTheDocument();
  });

  it("says nothing on the stake-maturity step", () => {
    render(
      <StepStakeMaturityFooter {...pristine({ type: "stake_maturity", percentageToStake: "" })} />,
    );

    expect(screen.queryByText("nope")).not.toBeInTheDocument();
  });

  it("says nothing on the dissolve-delay step", () => {
    render(
      <StepSetDissolveDelayFooter
        {...pristine({ type: "increase_dissolve_delay", additionalDissolveDelay: "" })}
      />,
    );

    expect(screen.queryByText("nope")).not.toBeInTheDocument();
  });

  it("says nothing on the split step", () => {
    render(
      <StepSplitNeuronFooter {...pristine({ type: "split_neuron", amount: new BigNumber(0) })} />,
    );

    expect(screen.queryByText("nope")).not.toBeInTheDocument();
  });
});
