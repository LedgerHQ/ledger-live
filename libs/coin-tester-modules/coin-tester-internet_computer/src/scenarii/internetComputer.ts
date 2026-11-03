import BigNumber from "bignumber.js";
import { TRANSFER_FEE } from "@ledgerhq/coin-internet_computer/consts";
import { derivePrincipalFromPubkey } from "@ledgerhq/coin-internet_computer/logic/crypto";
import { queryBalance } from "@ledgerhq/coin-internet_computer/network/api";
import type {
  ICPAccount,
  InternetComputerOperation,
  Transaction,
} from "@ledgerhq/coin-internet_computer/types/index";
import { forbidRemoteRequests } from "@ledgerhq/coin-tester/localOnly";
import type { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { getLegacyBridges } from "../bridges";
import { ACCOUNT_INDICES, E8S_PER_ICP, makeAccount, pathAt } from "../fixtures";
import { NODE_URL } from "../localIcp";
import { fund, listNeuronsOf, neuronIdOf, waitForIndexSynced } from "../network";
import { addressAt } from "../signer";

const FUNDING = 10n * E8S_PER_ICP;
const SENT = E8S_PER_ICP;
const STAKE = 2n * E8S_PER_ICP;
const TOP_UP = E8S_PER_ICP;

const SENDER_PATH = pathAt(ACCOUNT_INDICES.legacy.sender);
const RECIPIENT = addressAt(pathAt(ACCOUNT_INDICES.legacy.recipient));

const bn = (value: bigint) => new BigNumber(value.toString());

// Set by `setup`, read by the transactions and their expectations.
let lastBroadcast: () => InternetComputerOperation | undefined = () => undefined;
let closeGuard: (() => void) | undefined;
let neuronId: string | undefined;

function broadcastOperation(): InternetComputerOperation {
  const operation = lastBroadcast();
  if (!operation) throw new Error("Nothing was broadcast");
  return operation;
}

/** The broadcast transfer, once sync has read it from the index. */
function expectTransferSynced(
  previousAccount: ICPAccount,
  currentAccount: ICPAccount,
  amount: bigint,
): InternetComputerOperation {
  const { hash } = broadcastOperation();
  const operation = (currentAccount.operations as InternetComputerOperation[]).find(
    op => op.hash === hash,
  );
  expect(operation).toBeDefined();
  expect(operation!.blockHeight).not.toBeNull();
  expect(operation!.value.toFixed()).toBe(bn(amount + TRANSFER_FEE).toFixed());
  expect(currentAccount.balance.toFixed()).toBe(
    previousAccount.balance.minus(bn(amount + TRANSFER_FEE)).toFixed(),
  );
  return operation!;
}

async function governanceNeuron() {
  expect(neuronId).toBeDefined();
  const neurons = await listNeuronsOf(SENDER_PATH);
  const neuron = neurons.find(n => neuronIdOf(n) === neuronId);
  expect(neuron).toBeDefined();
  return neuron!;
}

function expectSnapshotStake(account: ICPAccount, stake: bigint) {
  const neuron = account.neurons.fullNeurons.find(n => n.id?.toString() === neuronId);
  expect(neuron).toBeDefined();
  expect(neuron!.cachedNeuronStakeE8s.toString()).toBe(stake.toString());
  expect(neuron!.controller).toBe(derivePrincipalFromPubkey(account.xpub!).toText());
}

const transactions: ScenarioTransaction<Transaction, ICPAccount>[] = [
  {
    name: "Send 1 ICP",
    type: "send",
    recipient: RECIPIENT,
    amount: bn(SENT),
    expect: async (previousAccount, currentAccount) => {
      const operation = expectTransferSynced(previousAccount, currentAccount, SENT);
      expect(operation.type).toBe("OUT");
      expect(operation.recipients).toEqual([RECIPIENT]);
      expect(await queryBalance(NODE_URL, RECIPIENT)).toBe(SENT);
    },
  },
  {
    name: "Create a neuron staking 2 ICP",
    type: "create_neuron",
    amount: bn(STAKE),
    expect: async (previousAccount, currentAccount) => {
      const created = broadcastOperation().extra.createdNeuronId;
      expect(created).toMatch(/^\d+$/);
      neuronId = created;
      const operation = expectTransferSynced(previousAccount, currentAccount, STAKE);
      expect(operation.type).toBe("STAKE_NEURON");

      const neuron = await governanceNeuron();
      expect(neuron.cached_neuron_stake_e8s).toBe(STAKE);
      expect(neuron.controller[0]?.toText()).toBe(
        derivePrincipalFromPubkey(currentAccount.xpub!).toText(),
      );
    },
  },
  {
    name: "Read the neurons with a signed list_neurons",
    type: "list_neurons",
    expect: (_previousAccount, currentAccount) => {
      expect(broadcastOperation().extra.neurons?.map(n => n.id?.toString())).toContain(neuronId);
      expectSnapshotStake(currentAccount, STAKE);
    },
  },
  {
    name: "Increase the neuron's stake by 1 ICP",
    type: "increase_stake",
    amount: bn(TOP_UP),
    // Read when the runner builds the transaction, after the neuron exists.
    get neuronId() {
      return neuronId;
    },
    expect: async (previousAccount, currentAccount) => {
      const operation = expectTransferSynced(previousAccount, currentAccount, TOP_UP);
      expect(operation.type).toBe("TOP_UP_NEURON");
      const neuron = await governanceNeuron();
      expect(neuron.cached_neuron_stake_e8s).toBe(STAKE + TOP_UP);
    },
  },
  {
    name: "Read the increased stake with a signed list_neurons",
    type: "list_neurons",
    expect: (_previousAccount, currentAccount) => {
      expectSnapshotStake(currentAccount, STAKE + TOP_UP);
    },
  },
];

export const scenarioInternetComputer: Scenario<Transaction, ICPAccount> = {
  name: "Internet Computer local network",

  setup: async () => {
    closeGuard = forbidRemoteRequests();
    neuronId = undefined;
    const bridges = getLegacyBridges();
    lastBroadcast = bridges.lastBroadcast;

    const account = makeAccount(ACCOUNT_INDICES.legacy.sender);
    await fund(account.freshAddress, FUNDING);

    return {
      currencyBridge: bridges.currencyBridge,
      accountBridge: bridges.accountBridge,
      account,
      retryLimit: 20,
      retryInterval: 1_500,
    };
  },

  getTransactions: () => transactions,

  beforeSync: waitForIndexSynced,

  beforeAll: account => {
    expect(account.operations).toHaveLength(1);
    const [funding] = account.operations;
    expect(funding.type).toBe("IN");
    expect(funding.value.toFixed()).toBe(bn(FUNDING).toFixed());
    expect(account.balance.toFixed()).toBe(bn(FUNDING).toFixed());
  },

  teardown: () => {
    closeGuard?.();
  },
};
