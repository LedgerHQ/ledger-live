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
import {
  NeuronState,
  type ICPNeuron,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { render, screen } from "@tests/test-renderer";
import BigNumber from "bignumber.js";
import React from "react";
import NeuronDetails from "../NeuronManageFlow/NeuronDetails";
import { ICP_UNIT, makeHealthyNeuron, makeICPAccount } from "./testUtils";

const CONTROLLER = "controller-principal";
const STRANGER = "someone-else";

let neuron = makeHealthyNeuron();
let principal = CONTROLLER;
// Funded by default: the top-up action is hidden when the balance cannot cover the transfer fee, so a
// zero-balance fixture would leave the tests around it passing without rendering the action at all.
let spendableBalance = new BigNumber(MIN_NEURON_STAKE);
// Topping up reuses the stake nonce of the transfer that created the neuron, which only this
// account's own history holds. True by default so the tests around the action render it at all.
let canTopUp = true;

const mockNavigate = jest.fn();

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({
    account: makeICPAccount({ neurons: [neuron], spendableBalance }),
    parentAccount: null,
  }),
}));
jest.mock("LLM/hooks/useAccountUnit", () => ({ useAccountUnit: () => ICP_UNIT }));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    createTransaction: () => ({ family: "internet_computer" }),
    updateTransaction: (t: object, patch: object) => ({ ...t, ...patch }),
  }),
}));
jest.mock("@ledgerhq/live-common/families/internet_computer/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/internet_computer/react"),
  useICPPrincipal: () => principal,
  useICPNeuronById: () => neuron,
  useCanTopUpNeuron: () => canTopUp,
}));

// 1 ICP at both bonuses maxed (3x delay, 1.25x age): potential voting power is exactly 3.75 ICP.
const fullyBonused = (overrides: Partial<ICPNeuron> = {}) =>
  makeHealthyNeuron({
    controller: CONTROLLER,
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

const renderDetails = () =>
  render(
    <NeuronDetails
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation={{ navigate: mockNavigate } as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      route={{ params: { accountId: "icp-1", neuronId: "1" } } as any}
    />,
  );

describe("NeuronDetails", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(FIXED_NOW_MSECS);
    neuron = makeHealthyNeuron({ controller: CONTROLLER });
    principal = CONTROLLER;
    spendableBalance = new BigNumber(MIN_NEURON_STAKE);
    canTopUp = true;
    mockNavigate.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("offers the controller-only actions when the account controls the neuron", () => {
    renderDetails();

    expect(screen.getByText("Increase stake")).toBeVisible();
    expect(screen.getByText("Add hot key")).toBeVisible();
  });

  it("hides every controller-only action from a hot-key holder, and says why", () => {
    neuron = makeHealthyNeuron({ controller: STRANGER, hotKeys: [CONTROLLER] });

    renderDetails();

    expect(screen.getByText(/You hold a hot key on this neuron/, { exact: false })).toBeVisible();
    expect(screen.queryByText("Increase stake")).toBeNull();
    expect(screen.queryByText("Add hot key")).toBeNull();
    expect(screen.queryByText("Split neuron")).toBeNull();
  });

  it("still lets a hot-key holder follow and confirm following, the two things a hot key is for", () => {
    neuron = makeHealthyNeuron({ controller: STRANGER, hotKeys: [CONTROLLER] });

    renderDetails();

    expect(screen.getByText("Edit following")).toBeVisible();
    expect(screen.getByText("Confirm following")).toBeVisible();
  });

  it("hides Stop dissolving from a hot-key holder even though the neuron's state allows it", () => {
    neuron = makeHealthyNeuron({
      controller: STRANGER,
      hotKeys: [CONTROLLER],
      state: NeuronState.Dissolving,
    });

    renderDetails();

    expect(screen.queryByText("Stop dissolving")).toBeNull();
  });

  it("offers Stop dissolving to the controller of a dissolving neuron, and not Start", () => {
    neuron = makeHealthyNeuron({ controller: CONTROLLER, state: NeuronState.Dissolving });

    renderDetails();

    expect(screen.getByText("Stop dissolving")).toBeVisible();
    expect(screen.queryByText("Start dissolving")).toBeNull();
  });

  it("labels the dissolve delay action Set for a dissolved neuron and Increase otherwise", () => {
    neuron = makeHealthyNeuron({ controller: CONTROLLER, state: NeuronState.Dissolved });
    const dissolved = renderDetails();
    expect(screen.getByText("Set dissolve delay")).toBeVisible();
    dissolved.unmount();

    neuron = makeHealthyNeuron({ controller: CONTROLLER, state: NeuronState.Locked });
    renderDetails();
    expect(screen.getByText("Increase dissolve delay")).toBeVisible();
  });

  it("keeps Spawn hidden until the maturity clears the worst-case modulation floor", () => {
    neuron = makeHealthyNeuron({ controller: CONTROLLER, maturityE8sEquivalent: 50_000_000n });

    renderDetails();

    expect(screen.getByText("Stake maturity")).toBeVisible();
    expect(screen.queryByText("Spawn neuron")).toBeNull();
  });

  // A top-up is a ledger transfer with no minimum, so the only bound is covering the fee. Below that
  // every amount comes back as NotEnoughBalance and the send flow is a dead end.
  it("hides the top-up action when the balance cannot cover the transfer fee", () => {
    spendableBalance = new BigNumber(ICP_FEES);

    renderDetails();

    expect(screen.queryByText("Increase stake")).toBeNull();
  });

  // The bridge rejects any addition that overshoots the two-year cap, so a neuron already there has
  // no legal entry left and the step can only end in an error the user cannot correct.
  it("stops offering more dissolve delay once the neuron sits at the two-year maximum", () => {
    neuron = makeHealthyNeuron({
      controller: CONTROLLER,
      dissolveState: { DissolveDelaySeconds: BigInt(NNS_MAXIMUM_DISSOLVE_DELAY) },
    });

    renderDetails();

    expect(screen.queryByText("Increase dissolve delay")).toBeNull();
  });

  it("still offers more dissolve delay a day short of the maximum", () => {
    neuron = makeHealthyNeuron({
      controller: CONTROLLER,
      dissolveState: { DissolveDelaySeconds: BigInt(NNS_MAXIMUM_DISSOLVE_DELAY - SECONDS_IN_DAY) },
    });

    renderDetails();

    expect(screen.getByText("Increase dissolve delay")).toBeVisible();
  });

  /*
   * The cap is 730.5 days, so a neuron at 730 has twelve hours of headroom. That passed a comparison
   * in seconds while the screen enters whole days and floors the room left to zero — every entry
   * clamped to "0", which the footer refuses. The action was offered and could not be completed.
   */
  it("stops offering more dissolve delay with under a day of room left", () => {
    const almostMaximum = BigInt(
      Math.floor(NNS_MAXIMUM_DISSOLVE_DELAY / SECONDS_IN_DAY) * SECONDS_IN_DAY,
    );
    neuron = makeHealthyNeuron({
      controller: CONTROLLER,
      dissolveState: { DissolveDelaySeconds: almostMaximum },
    });

    renderDetails();

    expect(almostMaximum).toBeLessThan(BigInt(NNS_MAXIMUM_DISSOLVE_DELAY));
    expect(screen.queryByText("Increase dissolve delay")).toBeNull();
  });

  // getSecondsTillVotingPowerExpires counts to the moment power reaches zero, a month after decay
  // begins. Quoting that remainder as the decay countdown overstated the deadline by a whole month.
  it("counts down to the start of decay, not to zero, while power is still full", () => {
    const refreshed = Math.floor(Date.now() / 1000) - 2 * SECONDS_IN_MONTH - 15 * SECONDS_IN_DAY;
    neuron = makeHealthyNeuron({
      controller: CONTROLLER,
      votingPowerRefreshedTimestampSeconds: BigInt(refreshed),
    });

    renderDetails();

    expect(screen.getByText("Voting power starts decaying in 3 months, 15 days")).toBeVisible();
  });

  it("switches to counting down to zero the moment the decay window opens", () => {
    const windowOpens =
      Math.floor(Date.now() / 1000) - NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS;
    neuron = makeHealthyNeuron({
      controller: CONTROLLER,
      votingPowerRefreshedTimestampSeconds: BigInt(windowOpens),
    });

    renderDetails();

    expect(screen.getByText(/Voting power is decaying/)).toBeVisible();
    expect(screen.queryByText(/starts decaying/)).toBeNull();
  });

  // A freshly staked neuron defaults to a 7-day delay, so this is the first-stake path.
  it("hides the whole periodic-confirmation row below the voting threshold", () => {
    neuron = makeHealthyNeuron({
      controller: CONTROLLER,
      dissolveDelaySeconds: BigInt(SECONDS_IN_7_DAYS),
      dissolveState: { DissolveDelaySeconds: BigInt(SECONDS_IN_7_DAYS) },
    });

    renderDetails();

    expect(screen.queryByText("Confirm following")).toBeNull();
    expect(screen.queryByText(/decaying/)).toBeNull();
  });

  it("quotes the potential figure while nothing has decayed yet", () => {
    neuron = fullyBonused();

    renderDetails();

    expect(screen.getByText("3.75 ICP")).toBeVisible();
  });

  it("reduces the figure in step with the decay the row beside it announces", () => {
    neuron = fullyBonused({
      votingPowerRefreshedTimestampSeconds: refreshedSecondsAgo(
        NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS + NNS_CLEAR_FOLLOWING_AFTER_SECONDS / 2,
      ),
    });

    renderDetails();

    // Half the decay window has passed, so the canister counts half of the 3.75 ICP potential.
    expect(screen.getByText(/Voting power is decaying/)).toBeVisible();
    expect(screen.getByText("1.875 ICP")).toBeVisible();
    expect(screen.queryByText("3.75 ICP")).toBeNull();
  });

  it("reads None once the window has fully elapsed, matching its own warning", () => {
    neuron = fullyBonused({
      votingPowerRefreshedTimestampSeconds: refreshedSecondsAgo(
        NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS * 4,
      ),
    });

    renderDetails();

    expect(screen.getByText(/Voting power lost/)).toBeVisible();
    expect(screen.getByText("None")).toBeVisible();
    expect(screen.queryByText("3.75 ICP")).toBeNull();
  });

  // Staked maturity belongs to two totals — the maturity the neuron holds, and the base its voting
  // power is computed from — so it earns a row under each.
  it("shows staked maturity under both the maturity total and the voting-power base", () => {
    neuron = makeHealthyNeuron({
      controller: CONTROLLER,
      stakedMaturityE8sEquivalent: BigInt(MIN_NEURON_STAKE),
    });

    renderDetails();

    expect(screen.getAllByText("Staked maturity")).toHaveLength(2);
  });

  // The bonuses multiply (cached stake - fees) + staked maturity. The row showed the raw cached
  // stake, so it matched neither the neuron's own figure nor the base the bonuses were applied to.
  it("quotes the stake net of fees beside the staked maturity the bonuses multiply", () => {
    neuron = makeHealthyNeuron({
      controller: CONTROLLER,
      cachedNeuronStakeE8s: BigInt(10 * MIN_NEURON_STAKE),
      neuronFeesE8s: BigInt(0.5 * MIN_NEURON_STAKE),
      stakedMaturityE8sEquivalent: BigInt(2 * MIN_NEURON_STAKE),
    });

    renderDetails();

    // Once for the neuron's own total, once for the voting-power row that now agrees with it.
    expect(screen.getAllByText("9.5 ICP")).toHaveLength(2);
    expect(screen.queryByText("10 ICP")).toBeNull();
  });

  it("drops the rows whose only content was an action the hot-key holder cannot take", () => {
    neuron = makeHealthyNeuron({ controller: STRANGER, hotKeys: [CONTROLLER] });

    renderDetails();

    expect(screen.queryByText("Split this neuron into two")).toBeNull();
    expect(screen.queryByText("Grant hot-key access to another principal")).toBeNull();
  });

  it("still lists the hot keys themselves when there is no Remove to offer", () => {
    neuron = makeHealthyNeuron({ controller: STRANGER, hotKeys: [CONTROLLER] });

    renderDetails();

    expect(screen.getByText(CONTROLLER)).toBeVisible();
    expect(screen.queryByText("Remove")).toBeNull();
  });

  // The section carries one action and no data, so the heading alone reads as a section that failed
  // to load.
  it("drops the Advanced heading along with the split action it was introducing", () => {
    neuron = makeHealthyNeuron({
      controller: CONTROLLER,
      cachedNeuronStakeE8s: BigInt(2 * MIN_NEURON_STAKE),
    });

    renderDetails();

    expect(screen.queryByText("Split neuron")).toBeNull();
    expect(screen.queryByText("Advanced")).toBeNull();
  });

  it("keeps the Advanced section for a neuron with stake enough to split", () => {
    neuron = makeHealthyNeuron({
      controller: CONTROLLER,
      cachedNeuronStakeE8s: BigInt(2 * MIN_NEURON_STAKE + ICP_FEES),
    });

    renderDetails();

    expect(screen.getByText("Advanced")).toBeVisible();
    expect(screen.getByText("Split neuron")).toBeVisible();
  });

  it("keeps a row that carries a value when it has no action, even at zero", () => {
    neuron = makeHealthyNeuron({
      controller: STRANGER,
      hotKeys: [CONTROLLER],
      stakedMaturityE8sEquivalent: 0n,
    });

    renderDetails();

    expect(screen.getAllByText("Staked maturity")).toHaveLength(2);
  });

  // Disburse and a refresh both drop a neuron from the snapshot while this screen may still name it.
  // Rendering nothing left the user on a blank screen with no way to read what had happened.
  it("says so when the neuron has gone missing between screens, and offers the list", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    neuron = undefined as any;

    renderDetails();

    expect(screen.getByText(/no longer in your synced snapshot/)).toBeVisible();
    expect(screen.getByTestId("icp-missing-neuron-back-button")).toBeVisible();
  });

  /*
   * A top-up transfer has to reuse the stake nonce of the transfer that created the neuron, and only
   * this account's own history holds it. Without one the bridge refuses every amount, so offering the
   * action is a dead end rather than a correctable mistake.
   */
  it("withholds the top-up when the stake nonce cannot be recovered", () => {
    canTopUp = false;

    renderDetails();

    expect(screen.queryByText("Increase stake")).toBeNull();
  });

  it("offers the top-up when it can be recovered and the balance covers the fee", () => {
    renderDetails();

    expect(screen.getByText("Increase stake")).toBeVisible();
  });
});
