import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  NeuronsData,
  NeuronState,
  type ICPAccount,
  type ICPNeuron,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import BigNumber from "bignumber.js";

export const icpCurrency = getCryptoCurrencyById("internet_computer");

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

export const makeICPAccount = ({
  neurons = [],
  spendableBalance = new BigNumber(0),
  seed = "icp-test",
}: {
  neurons?: ICPNeuron[];
  spendableBalance?: BigNumber;
  seed?: string;
} = {}): ICPAccount =>
  ({
    ...genAccount(seed, { currency: icpCurrency }),
    spendableBalance,
    neurons: new NeuronsData(neurons, Date.now()),
  }) as unknown as ICPAccount;
