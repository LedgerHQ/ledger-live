import {
  E8S_PER_ICP,
  ICP_FEES,
  MIN_NEURON_STAKE,
  NNS_CLEAR_FOLLOWING_AFTER_SECONDS,
  NNS_MAXIMUM_DISSOLVE_DELAY,
  NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS,
  SECONDS_IN_7_DAYS,
  SECONDS_IN_DAY,
  SECONDS_IN_FOUR_YEARS,
  SECONDS_IN_MONTH,
} from "@ledgerhq/live-common/families/internet_computer/consts";
import { NeuronState } from "@ledgerhq/live-common/families/internet_computer/types";
import BigNumber from "bignumber.js";
import React from "react";
import { render, screen } from "tests/testSetup";
import { makeHealthyNeuron, makeICPAccount, makeStepProps } from "./testUtils";

const CONTROLLER = "test-principal";

const bridgeMock = {
  createTransaction: jest.fn(() => ({ family: "internet_computer", type: "send" })),
  updateTransaction: jest.fn((transaction, patch) => ({ ...transaction, ...patch })),
};

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  __esModule: true,
  useAccountBridge: () => bridgeMock,
}));

jest.mock("@ledgerhq/live-common/families/internet_computer/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/internet_computer/react"),
  // The account's real principal is derived from a device-provided key that genAccount cannot fake.
  useICPPrincipal: () => CONTROLLER,
}));

import StepManage from "../ManageNeuronFlowModal/steps/StepManage";

const controlled = (overrides = {}) =>
  makeHealthyNeuron({ id: 7n, controller: CONTROLLER, ...overrides });

// 1 ICP at both bonuses maxed (3x delay, 1.25x age): potential voting power is exactly 3.75 ICP.
const fullyBonused = (overrides = {}) =>
  controlled({
    cachedNeuronStakeE8s: BigInt(E8S_PER_ICP),
    dissolveDelaySeconds: BigInt(NNS_MAXIMUM_DISSOLVE_DELAY),
    dissolveState: { DissolveDelaySeconds: BigInt(NNS_MAXIMUM_DISSOLVE_DELAY) },
    ageSeconds: BigInt(SECONDS_IN_FOUR_YEARS),
    ...overrides,
  });

// Pinned for the whole suite: the decayed figures below are asserted to the digit, and a second
// elapsing between fixture and render turns 1.875 ICP into 1.87499858.
const FIXED_NOW_MSECS = 1_800_000_000_000;

const refreshedSecondsAgo = (seconds: number) =>
  BigInt(Math.floor(FIXED_NOW_MSECS / 1000) - Math.floor(seconds));

// FormattedVal separates a value from its code with a non-breaking space.
const bodyText = (container: HTMLElement) => container.textContent?.replace(/\u00a0/g, " ") ?? "";

// Funded by default: the top-up action is hidden when the balance cannot cover the transfer fee, so a
// zero-balance fixture would leave the tests around it passing without rendering the action at all.
const renderManage = (
  neuron = controlled(),
  spendableBalance = new BigNumber(MIN_NEURON_STAKE),
) => {
  const props = makeStepProps({
    account: makeICPAccount({ spendableBalance }),
    neurons: [neuron],
    selectedNeuronId: "7",
  });
  return { props, ...render(<StepManage {...props} />) };
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Date, "now").mockReturnValue(FIXED_NOW_MSECS);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("StepManage", () => {
  it("renders nothing when the selected neuron is no longer in the list", () => {
    const props = makeStepProps({ neurons: [controlled()], selectedNeuronId: "999" });
    const { container } = render(<StepManage {...props} />);

    expect(container.firstChild).toBeNull();
  });

  // useNeuronActions runs before the guard above, so it has to tolerate an absent neuron. It used to
  // be handed `neurons[0]`, which is itself undefined once the snapshot comes back empty.
  it("renders nothing rather than throwing when the snapshot has no neurons at all", () => {
    const props = makeStepProps({ neurons: [], selectedNeuronId: "7" });
    const { container } = render(<StepManage {...props} />);

    expect(container.firstChild).toBeNull();
  });

  it("offers the controller the actions that change the neuron", () => {
    renderManage();

    expect(screen.getByTestId("icp-increase-stake-button")).toBeInTheDocument();
    expect(screen.getByText("Add hot key")).toBeInTheDocument();
    expect(screen.queryByText(/You hold a hot key on this neuron/)).not.toBeInTheDocument();
  });

  it("withholds the stake-moving actions from a hot-key holder and says why", () => {
    renderManage(makeHealthyNeuron({ id: 7n, controller: "someone-else" }));

    expect(screen.getByText(/You hold a hot key on this neuron/)).toBeInTheDocument();
    expect(screen.queryByTestId("icp-increase-stake-button")).not.toBeInTheDocument();
    expect(screen.queryByText("Add hot key")).not.toBeInTheDocument();
    expect(screen.queryByText("Split neuron")).not.toBeInTheDocument();
  });

  // The canister authorizes follow and refresh_voting_power for hot keys, not just the controller
  // (governance.rs gates both on is_authorized_to_vote). Locking these would leave a hot-key holder
  // unable to do the only two things a hot key exists for.
  it("still lets a hot-key holder set following and confirm it", () => {
    renderManage(makeHealthyNeuron({ id: 7n, controller: "someone-else" }));

    expect(screen.getByText("Edit following")).toBeInTheDocument();
    expect(screen.getByText("Confirm following")).toBeInTheDocument();
  });

  // The key used to be `common.none`, which no translation file defines, so the row read
  // "common.none". Any neuron under the 14-day voting threshold reaches this branch.
  it("names the absence of voting power instead of printing a translation key", () => {
    renderManage(controlled({ dissolveDelaySeconds: 0n }));

    expect(screen.getByText("None")).toBeInTheDocument();
    expect(screen.queryByText(/common\.none/)).not.toBeInTheDocument();
  });

  // The label used to sit on the age-bonus row, reading as though "Locked" were the bonus value.
  it("shows the neuron state on its own row, separate from the age bonus", () => {
    renderManage(controlled({ state: NeuronState.Locked }));

    expect(screen.getByText("State")).toBeInTheDocument();
    expect(screen.getByText("Age bonus")).toBeInTheDocument();
  });

  it.each([
    [NeuronState.Locked, "Start dissolving"],
    [NeuronState.Dissolving, "Stop dissolving"],
    [NeuronState.Dissolved, "Disburse"],
  ])("offers the lifecycle action allowed in state %s", (state, label) => {
    renderManage(controlled({ state }));

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  // The reference compared dissolveState to the string "Dissolving", which no variant can equal, so
  // it always sent start_dissolving.
  it("sends stop_dissolving for a neuron that is already dissolving", async () => {
    const { props, user } = renderManage(controlled({ state: NeuronState.Dissolving }));

    await user.click(screen.getByText("Stop dissolving"));

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "stop_dissolving", neuronId: "7" }),
    );
    expect(props.setLastAction).toHaveBeenCalledWith("stop_dissolving");
    expect(props.transitionTo).toHaveBeenCalledWith("manageAction");
  });

  it("routes to the dissolve-delay step, seeding the transaction it will patch", async () => {
    const { props, user } = renderManage(controlled({ state: NeuronState.Locked }));

    await user.click(screen.getByText("Increase dissolve delay"));

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "increase_dissolve_delay" }),
    );
    expect(props.transitionTo).toHaveBeenCalledWith("setDissolveDelay");
  });

  it("sets rather than increases the dissolve delay of a dissolved neuron", async () => {
    const { user } = renderManage(
      controlled({
        state: NeuronState.Dissolved,
        dissolveDelaySeconds: 0n,
        dissolveState: undefined,
      }),
    );

    await user.click(screen.getByText("Set dissolve delay"));

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "set_dissolve_delay" }),
    );
  });

  // The bridge rejects any addition that overshoots the two-year cap, so a neuron already there has
  // no legal entry left and the step can only end in an error the user cannot correct.
  it("stops offering more dissolve delay once the neuron sits at the two-year maximum", () => {
    renderManage(
      controlled({
        dissolveState: { DissolveDelaySeconds: BigInt(NNS_MAXIMUM_DISSOLVE_DELAY) },
      }),
    );

    expect(screen.queryByText("Increase dissolve delay")).not.toBeInTheDocument();
  });

  it("still offers more dissolve delay a day short of the maximum", () => {
    renderManage(
      controlled({
        dissolveState: {
          DissolveDelaySeconds: BigInt(NNS_MAXIMUM_DISSOLVE_DELAY - SECONDS_IN_DAY),
        },
      }),
    );

    expect(screen.getByText("Increase dissolve delay")).toBeInTheDocument();
  });

  it("offers a split only once the neuron can leave the minimum stake on both halves", () => {
    const splittable = BigInt(2 * MIN_NEURON_STAKE + ICP_FEES);
    renderManage(controlled({ cachedNeuronStakeE8s: splittable }));

    expect(screen.getByText("Split neuron")).toBeInTheDocument();
  });

  it("hides the split action for a neuron that is too small", () => {
    renderManage(controlled({ cachedNeuronStakeE8s: BigInt(MIN_NEURON_STAKE) }));

    expect(screen.queryByText("Split neuron")).not.toBeInTheDocument();
  });

  it("omits the confirm-following row when the canister reported no refresh timestamp", () => {
    renderManage(controlled({ votingPowerRefreshedTimestampSeconds: undefined }));

    expect(screen.queryByText("Confirm following")).not.toBeInTheDocument();
  });

  // A freshly staked neuron defaults to a 7-day delay, so this is the first-stake path.
  it("hides the whole periodic-confirmation row below the voting threshold", () => {
    const { container } = renderManage(
      controlled({
        dissolveDelaySeconds: BigInt(SECONDS_IN_7_DAYS),
        dissolveState: { DissolveDelaySeconds: BigInt(SECONDS_IN_7_DAYS) },
      }),
    );

    expect(screen.queryByText("Confirm following")).not.toBeInTheDocument();
    expect(bodyText(container)).not.toContain("decaying");
  });

  it("warns that voting power is already lost once the window has fully elapsed", () => {
    const longAgo =
      Math.floor(Date.now() / 1000) - NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS * 4;
    renderManage(controlled({ votingPowerRefreshedTimestampSeconds: BigInt(longAgo) }));

    expect(screen.getByText(/Voting power lost/)).toBeInTheDocument();
  });

  // getSecondsTillVotingPowerExpires counts to the moment power reaches zero, a month after decay
  // begins. Quoting that remainder as the decay countdown overstated the deadline by a whole month.
  it("counts down to the start of decay, not to zero, while power is still full", () => {
    const refreshed = Math.floor(Date.now() / 1000) - 2 * SECONDS_IN_MONTH - 15 * SECONDS_IN_DAY;
    renderManage(controlled({ votingPowerRefreshedTimestampSeconds: BigInt(refreshed) }));

    expect(
      screen.getByText("Voting power starts decaying in 3 months, 15 days"),
    ).toBeInTheDocument();
  });

  it("switches to counting down to zero the moment the decay window opens", () => {
    const windowOpens =
      Math.floor(Date.now() / 1000) - NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS;
    renderManage(controlled({ votingPowerRefreshedTimestampSeconds: BigInt(windowOpens) }));

    expect(screen.getByText(/Voting power is decaying/)).toBeInTheDocument();
    expect(screen.queryByText(/starts decaying/)).not.toBeInTheDocument();
  });

  it("quotes the potential figure while nothing has decayed yet", () => {
    const { container } = renderManage(fullyBonused());

    expect(bodyText(container)).toContain("3.75");
  });

  it("reduces the figure in step with the decay the row beside it announces", () => {
    const { container } = renderManage(
      fullyBonused({
        votingPowerRefreshedTimestampSeconds: refreshedSecondsAgo(
          NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS + NNS_CLEAR_FOLLOWING_AFTER_SECONDS / 2,
        ),
      }),
    );

    // Half the decay window has passed, so the canister counts half of the 3.75 ICP potential.
    expect(screen.getByText(/Voting power is decaying/)).toBeInTheDocument();
    expect(bodyText(container)).toContain("1.875");
    expect(bodyText(container)).not.toContain("3.75");
  });

  it("reads None once the window has fully elapsed, matching its own warning", () => {
    const { container } = renderManage(
      fullyBonused({
        votingPowerRefreshedTimestampSeconds: refreshedSecondsAgo(
          NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS * 4,
        ),
      }),
    );

    expect(screen.getByText(/Voting power lost/)).toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
    expect(bodyText(container)).not.toContain("3.75");
  });

  // increase_stake debits the ledger canister, so it leaves this modal for the regular send flow.
  it("hands a top-up to the send flow and arranges the return trip", async () => {
    const { props, user } = renderManage();

    await user.click(screen.getByTestId("icp-increase-stake-button"));

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "increase_stake", neuronId: "7" }),
    );
    // The neuron list closes so the send modal can take over, and is reopened on success.
    const opened = props.openModal as jest.Mock;
    expect(opened).not.toHaveBeenCalled();
  });

  // A top-up has no minimum, so the only bound is covering the fee. Below that every amount comes
  // back as NotEnoughBalance and the send flow is a dead end rather than a correctable mistake.
  it("hides the top-up action when the balance cannot cover the transfer fee", () => {
    renderManage(controlled(), new BigNumber(ICP_FEES));

    expect(screen.queryByTestId("icp-increase-stake-button")).not.toBeInTheDocument();
  });

  it("routes to the split step, seeding a split_neuron transaction", async () => {
    const splittable = BigInt(4 * MIN_NEURON_STAKE);
    const { props, user } = renderManage(controlled({ cachedNeuronStakeE8s: splittable }));

    await user.click(screen.getByText("Split neuron"));

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "split_neuron" }),
    );
    expect(props.transitionTo).toHaveBeenCalledWith("splitNeuron");
  });

  it("routes to the follow topic step, seeding a follow transaction", async () => {
    const { props, user } = renderManage();

    await user.click(screen.getByText("Edit following"));

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "follow" }),
    );
    expect(props.transitionTo).toHaveBeenCalledWith("followTopic");
  });

  it("removes a hot key straight from the manage screen", async () => {
    const { user } = renderManage(controlled({ hotKeys: ["aaaaa-aa"] }));

    await user.click(screen.getByText("Remove"));

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "remove_hot_key", hotKeyToRemove: "aaaaa-aa" }),
    );
  });

  it("toggles automatic maturity staking to the opposite of its current setting", async () => {
    const { user } = renderManage(controlled({ autoStakeMaturity: false }));

    await user.click(screen.getByText("Enable"));

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "auto_stake_maturity", autoStakeMaturity: true }),
    );
  });

  // The section total is the two maturities added together, but only the available one had a row, so
  // the heading quoted a figure none of its rows accounted for.
  it("breaks the maturity total into the available and staked amounts it is made of", () => {
    renderManage(
      controlled({
        maturityE8sEquivalent: BigInt(1.5 * MIN_NEURON_STAKE),
        stakedMaturityE8sEquivalent: BigInt(2.5 * MIN_NEURON_STAKE),
      }),
    );

    expect(screen.getByText("Available maturity")).toBeInTheDocument();
    expect(screen.getByText("1.5")).toBeInTheDocument();
    expect(screen.getByText("2.5")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  // Staked maturity belongs to two totals — the maturity the neuron holds, and the base its voting
  // power is computed from — so it earns a row under each.
  it("shows staked maturity under both the maturity total and the voting-power base", () => {
    renderManage(controlled({ stakedMaturityE8sEquivalent: BigInt(MIN_NEURON_STAKE) }));

    expect(screen.getAllByText("Staked maturity")).toHaveLength(2);
  });

  // The bonuses multiply (cached stake - fees) + staked maturity. The row showed the raw cached
  // stake, so it matched neither the neuron's own figure nor the base the bonuses were applied to.
  it("quotes the stake net of fees beside the staked maturity the bonuses multiply", () => {
    renderManage(
      controlled({
        cachedNeuronStakeE8s: BigInt(10 * MIN_NEURON_STAKE),
        neuronFeesE8s: BigInt(0.5 * MIN_NEURON_STAKE),
        stakedMaturityE8sEquivalent: BigInt(2 * MIN_NEURON_STAKE),
      }),
    );

    // Once for the neuron's own total, once for the voting-power row that now agrees with it.
    expect(screen.getAllByText("9.5 ICP")).toHaveLength(2);
    expect(screen.getByText("2 ICP")).toBeInTheDocument();
    expect(screen.queryByText("10 ICP")).not.toBeInTheDocument();
  });
});
