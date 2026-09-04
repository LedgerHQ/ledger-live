import { NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE } from "@ledgerhq/live-common/families/internet_computer/consts";
import {
  NeuronState,
  type ICPAccount,
  type ICPNeuron,
} from "@ledgerhq/live-common/families/internet_computer/types";
import BigNumber from "bignumber.js";

export const makeNeuron = (overrides: Partial<ICPNeuron> = {}): ICPNeuron => ({
  id: 1n,
  accountIdentifier: "neuron-account-identifier",
  state: NeuronState.Locked,
  dissolveDelaySeconds: 0n,
  ageSeconds: 0n,
  cachedNeuronStakeE8s: 0n,
  neuronFeesE8s: 0n,
  maturityE8sEquivalent: 0n,
  stakedMaturityE8sEquivalent: 0n,
  createdTimestampSeconds: 0n,
  hotKeys: [],
  followees: [],
  autoStakeMaturity: false,
  ...overrides,
});

/** A neuron that is voting-eligible, following someone, and freshly confirmed. */
export const makeHealthyNeuron = (overrides: Partial<ICPNeuron> = {}): ICPNeuron =>
  makeNeuron({
    dissolveDelaySeconds: BigInt(NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE),
    dissolveState: { DissolveDelaySeconds: BigInt(NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE) },
    followees: [{ topic: 4, followeeIds: [99n] }],
    votingPowerRefreshedTimestampSeconds: BigInt(Math.floor(Date.now() / 1000)),
    ...overrides,
  });

/**
 * A minimal ICP account. Screens are rendered with their live-common hooks mocked, so only the
 * fields they read directly need to be real.
 */
export const makeICPAccount = ({
  neurons = [],
  spendableBalance = new BigNumber(0),
  lastUpdatedMSecs = Date.now(),
}: {
  neurons?: ICPNeuron[];
  spendableBalance?: BigNumber;
  lastUpdatedMSecs?: number;
} = {}): ICPAccount =>
  ({
    type: "Account",
    id: "js:2:internet_computer:xpub:",
    xpub: "xpub",
    currency: { id: "internet_computer", units: [{ code: "ICP", magnitude: 8, name: "ICP" }] },
    spendableBalance,
    balance: spendableBalance,
    operations: [],
    pendingOperations: [],
    neurons: { fullNeurons: neurons, lastUpdatedMSecs },
  }) as unknown as ICPAccount;

export const ICP_UNIT = { code: "ICP", magnitude: 8, name: "ICP" };
