import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE } from "@ledgerhq/live-common/families/internet_computer/consts";
import {
  NeuronsData,
  NeuronState,
  type ICPAccount,
  type ICPNeuron,
  type Transaction,
  type TransactionStatus,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import BigNumber from "bignumber.js";
import type { StepProps } from "../neuronFlow/types";

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
  lastUpdatedMSecs = Date.now(),
}: {
  neurons?: ICPNeuron[];
  spendableBalance?: BigNumber;
  seed?: string;
  /** How long ago the neuron snapshot was signed for, which drives the syncNeurons banner. */
  lastUpdatedMSecs?: number;
} = {}): ICPAccount =>
  ({
    ...genAccount(seed, { currency: icpCurrency }),
    spendableBalance,
    neurons: new NeuronsData(neurons, lastUpdatedMSecs),
  }) as unknown as ICPAccount;

/** A neuron that is voting-eligible, following someone, and freshly confirmed — i.e. banner-quiet. */
export const makeHealthyNeuron = (overrides: Partial<ICPNeuron> = {}): ICPNeuron =>
  makeNeuron({
    dissolveDelaySeconds: BigInt(NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE),
    dissolveState: { DissolveDelaySeconds: BigInt(NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE) },
    followees: [{ topic: 4, followeeIds: [99n] }],
    votingPowerRefreshedTimestampSeconds: BigInt(Math.floor(Date.now() / 1000)),
    ...overrides,
  });

/**
 * Step components are rendered directly rather than through the Stepper, so every collaborator is a
 * spy the test can assert on. Only the fields a given step reads need overriding — including within
 * the transaction and status, which a step only ever reads a few keys of.
 */
export const makeStepProps = (
  overrides: Partial<Omit<StepProps, "transaction" | "status">> & {
    transaction?: Partial<Transaction>;
    status?: Partial<TransactionStatus>;
  } = {},
): StepProps =>
  ({
    transitionTo: jest.fn(),
    device: null,
    account: makeICPAccount(),
    parentAccount: null,
    transaction: null,
    status: { errors: {}, warnings: {}, amount: new BigNumber(0) },
    bridgePending: false,
    error: null,
    optimisticOperation: null,
    signed: false,
    onClose: jest.fn(),
    openModal: jest.fn(),
    onChangeTransaction: jest.fn(),
    onUpdateTransaction: jest.fn(),
    onTransactionError: jest.fn(),
    onOperationBroadcasted: jest.fn(),
    resetAttempt: jest.fn(),
    setSigned: jest.fn(),
    neurons: [],
    lastUpdatedMSecs: 0,
    selectedNeuronId: null,
    setSelectedNeuronId: jest.fn(),
    lastAction: null,
    setLastAction: jest.fn(),
    followTopic: null,
    setFollowTopic: jest.fn(),
    ...overrides,
  }) as unknown as StepProps;
