import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { Account } from "@ledgerhq/types-live";
import { createApi } from "@ledgerhq/coin-bitcoin/api/index";
import type { BitcoinPendingTransactionDetails } from "@ledgerhq/coin-bitcoin/api/index";
import type { BitcoinContext } from "@ledgerhq/coin-bitcoin/config";
import { buildContext } from "@ledgerhq/live-common/bridge/generic-coin-framework/api/context";
import BigNumber from "bignumber.js";
import {
  getMempoolFee,
  getMinedTxids,
  getNodeTransaction,
  getRawMempool,
  keepOutOfBlocks,
  mineToWalletAddress,
  spentOutpoints,
} from "../helpers";
import { holdingsAfter, listAllHoldings } from "../holdings";
import type { HoldingSummary } from "../holdings";
import { killSandbox } from "../sandbox";
import { setupGenericAccount } from "../genericSetup";
import { sleep, waitForExplorerSync } from "../utils";
import type { BitcoinGenericTransaction } from "../genericBridges";

// Native SegWit address of another wallet (regtest): the send destination.
const RECIPIENT = "bcrt1qajglhjtctn88f5l6rajzz52fy78fhxspjajjwz";

type Step = ScenarioTransaction<BitcoinGenericTransaction, Account>;

let steps: Step[] = [];
let stepIndex = -1;
let address = "";
// Whether `beforeSync` mines: off while a send must stay in the mempool.
let mineOnSync = true;

// The send a step replaces: its txid is read from the node's mempool when the original is
// broadcast, and its inputs, fee and size come from `getPendingTransaction`. Its inputs are kept to
// check what the replacement spends.
let original = { txid: "", inputs: [] as string[] };
// What the account held before the original was sent: the original, then its replacement, are
// checked against it.
let holdingsBeforeOriginal: HoldingSummary[] = [];
// The original `keepOutOfBlocks` was applied to: if a block holds it anyway, the miner does not
// select by the node's modified fee.
let keptOutOfBlocks = "";

// Fails at once, without the coin tester's retries, when the original was mined although its
// modified fee kept it out of blocks: the scenario cannot replace a confirmed transaction.
async function expectOriginalUnmined(): Promise<void> {
  if ((await getMinedTxids()).has(keptOutOfBlocks)) {
    throw new Error(
      `${keptOutOfBlocks} was mined although keepOutOfBlocks gave it a negative modified fee: the sandbox's miner does not select by the node's modified fee`,
    );
  }
}
// The fee the replacement pays, chosen from the original's.
let replacementFee = 0n;

// Atlas and the node mine and index on their own: the wait only matters while blocks are mined.
const syncExplorer = async () => {
  if (mineOnSync) await waitForExplorerSync();
};

const api = createApi("bitcoin_regtest");
type PendingTransaction = NonNullable<Awaited<ReturnType<typeof api.getPendingTransaction>>>;
const regtestContext = () => buildContext("bitcoin_regtest") as unknown as BitcoinContext;

// The explorer's pending views lag behind the node (ADR-017): reads again every second, up to 30
// seconds, until the value read is settled, and returns the last one read.
async function waitForExplorer<T>(
  read: () => Promise<T>,
  settled: (value: T) => boolean,
): Promise<T> {
  let value = await read();
  for (let attempt = 1; attempt < 30 && !settled(value); attempt++) {
    await sleep(1_000);
    value = await read();
  }
  return value;
}

// Until `getPendingTransaction` no longer sees the transaction as pending.
const waitUntilNotPending = (txid: string) =>
  waitForExplorer(
    () => api.getPendingTransaction(regtestContext(), txid),
    pending => pending === undefined,
  );

// Until `getPendingTransaction` sees the transaction as pending: a send just broadcast.
const waitUntilPending = (txid: string) =>
  waitForExplorer(
    () => api.getPendingTransaction(regtestContext(), txid),
    pending => pending !== undefined,
  );

// Until `listPendingOperations` lists the transaction: a send just broadcast.
const waitUntilListedPending = (txid: string) =>
  waitForExplorer(
    async () =>
      (await api.listPendingOperations(regtestContext(), address)).find(
        operation => operation.tx.hash === txid,
      ),
    operation => operation !== undefined,
  );

// The replacement's fee must beat the original's by the relay increment over the replacement's
// size (BIP 125, rule 4) and be at a higher rate (rule 6).
async function replacementFeeOf(
  account: Account,
  pending: PendingTransaction,
  inputs: string[],
  amount: bigint | undefined,
  recipient: string,
): Promise<bigint> {
  const estimation = await api.estimateFees(regtestContext(), {
    intentType: "transaction",
    type: "send",
    sender: account.freshAddress,
    recipient,
    amount: amount ?? 0n,
    useAllAmount: amount === undefined,
    asset: { type: "native" },
    data: { type: "unknown", utxoStrategy: { selectedUtxos: inputs } },
  });
  const vsize = BigInt(String(estimation.parameters?.vsize));
  const incremental = BigInt(String(estimation.parameters?.incrementalRelayFeePerByte));
  const originalFee = pending.fees;
  const originalVsize = BigInt((pending.details as BitcoinPendingTransactionDetails).vsize);
  const byIncrement = originalFee + incremental * vsize;
  const byRate = (originalFee * vsize) / originalVsize + 1n;
  return byIncrement > byRate ? byIncrement : byRate;
}

// Fills the step with a replacement of the original, built from what `getPendingTransaction`
// reports: the original's inputs and a custom fee.
async function prepareReplacement(account: Account, step: Step, cancel: boolean) {
  const pending = await waitUntilPending(original.txid);
  if (!pending) throw new Error(`the original ${original.txid} is not pending`);
  const { inputs: spent } = pending.details as BitcoinPendingTransactionDetails;
  const inputs = spent.map(input => input.id);
  const inputValue = spent.reduce((sum, input) => sum + input.value, 0n);

  const recipient = cancel ? account.freshAddress : RECIPIENT;
  replacementFee = await replacementFeeOf(
    account,
    pending,
    inputs,
    cancel ? undefined : 1_0000_0000n,
    recipient,
  );
  step.recipient = recipient;
  // A cancel sends everything back to the account, so the amount is what the fee leaves.
  step.amount = cancel ? new BigNumber((inputValue - replacementFee).toString()) : step.amount;
  step.utxoStrategy = { selectedUtxos: inputs };
  step.customFees = { parameters: { fees: new BigNumber(replacementFee.toString()) } };
}

const makeScenarioTransactions = (): Step[] => {
  const send: Step = {
    name: "Send 1 BTC, left unmined",
    amount: new BigNumber(1e8),
    recipient: RECIPIENT,
    feesStrategy: "slow",
    // Broadcast and not mined: the confirmed history and balance have not moved, and the node holds
    // the send in its mempool.
    expect: async (previousAccount, currentAccount) => {
      await expectOriginalUnmined();
      expect(currentAccount.operations.length).toBe(previousAccount.operations.length);
      expect(currentAccount.balance.toFixed()).toBe(previousAccount.balance.toFixed());
      const mempool = await getRawMempool();
      expect(mempool).toHaveLength(1);
      const originalTx = await getNodeTransaction(mempool[0]);
      original = { txid: mempool[0], inputs: spentOutpoints(originalTx) };
      // The explorer lists the send as pending, once it has caught up, with the fee the node holds
      // for it. Its pending view can still list transactions mined since (ADR-017), such as the
      // funding: only the send is looked up.
      const pendingSend = await waitUntilListedPending(original.txid);
      expect(pendingSend?.tx.fees).toBe((await getMempoolFee(original.txid)).fee);
      // The account no longer holds what the original spends, and holds its unconfirmed change.
      expect(await listAllHoldings(address)).toEqual(
        holdingsAfter(holdingsBeforeOriginal, original.inputs, originalTx, address),
      );
    },
  };

  const speedUp: Step = {
    name: "Speed up the send",
    amount: new BigNumber(1e8),
    // The replacement is mined, the original is in no block, and the account paid the amount and
    // the replacement's fee.
    expect: async (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.hash).not.toBe(original.txid);
      expect(latestOperation.fee.toFixed()).toBe(replacementFee.toString());
      const mined = await getMinedTxids();
      expect(mined.has(latestOperation.hash)).toBe(true);
      expect(mined.has(original.txid)).toBe(false);
      expect(await getRawMempool()).toEqual([]);
      // It spends the original's inputs, and the account holds what it pays back instead of the
      // original's change.
      const replacementTx = await getNodeTransaction(latestOperation.hash);
      const spent = spentOutpoints(replacementTx);
      expect([...spent].sort()).toEqual([...original.inputs].sort());
      expect(await listAllHoldings(address)).toEqual(
        holdingsAfter(holdingsBeforeOriginal, spent, replacementTx, address),
      );
      // The original is no longer pending, once the explorer has caught up.
      await waitUntilNotPending(original.txid);
      const pendingOperations = await api.listPendingOperations(regtestContext(), address);
      expect(pendingOperations.map(operation => operation.tx.hash)).not.toContain(original.txid);
      expect(await api.getPendingTransaction(regtestContext(), original.txid)).toBeUndefined();
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus((1_0000_0000n + replacementFee).toString()).toFixed(),
      );
    },
  };

  const sendAgain: Step = {
    name: "Send 1 BTC again, left unmined",
    amount: new BigNumber(1e8),
    recipient: RECIPIENT,
    feesStrategy: "slow",
    // Broadcast and not mined: the confirmed history and balance have not moved, and the node holds
    // the send in its mempool.
    expect: async (previousAccount, currentAccount) => {
      await expectOriginalUnmined();
      expect(currentAccount.operations.length).toBe(previousAccount.operations.length);
      expect(currentAccount.balance.toFixed()).toBe(previousAccount.balance.toFixed());
      const mempool = await getRawMempool();
      expect(mempool).toHaveLength(1);
      const originalTx = await getNodeTransaction(mempool[0]);
      original = { txid: mempool[0], inputs: spentOutpoints(originalTx) };
      // The explorer lists the send as pending, once it has caught up, with the fee the node holds
      // for it. Its pending view can still list transactions mined since (ADR-017), such as the
      // funding: only the send is looked up.
      const pendingSend = await waitUntilListedPending(original.txid);
      expect(pendingSend?.tx.fees).toBe((await getMempoolFee(original.txid)).fee);
      // The account no longer holds what the original spends, and holds its unconfirmed change.
      expect(await listAllHoldings(address)).toEqual(
        holdingsAfter(holdingsBeforeOriginal, original.inputs, originalTx, address),
      );
    },
  };

  const cancel: Step = {
    name: "Cancel the send",
    // The replacement is mined, the original is in no block, and the account paid the replacement's
    // fee only: the rest came back.
    expect: async (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.hash).not.toBe(original.txid);
      expect(latestOperation.fee.toFixed()).toBe(replacementFee.toString());
      const mined = await getMinedTxids();
      expect(mined.has(latestOperation.hash)).toBe(true);
      expect(mined.has(original.txid)).toBe(false);
      expect(await getRawMempool()).toEqual([]);
      // It spends the original's inputs, and the account holds what it pays back instead of the
      // original's change.
      const replacementTx = await getNodeTransaction(latestOperation.hash);
      const spent = spentOutpoints(replacementTx);
      expect([...spent].sort()).toEqual([...original.inputs].sort());
      expect(await listAllHoldings(address)).toEqual(
        holdingsAfter(holdingsBeforeOriginal, spent, replacementTx, address),
      );
      // The original is no longer pending, once the explorer has caught up.
      await waitUntilNotPending(original.txid);
      const pendingOperations = await api.listPendingOperations(regtestContext(), address);
      expect(pendingOperations.map(operation => operation.tx.hash)).not.toContain(original.txid);
      expect(await api.getPendingTransaction(regtestContext(), original.txid)).toBeUndefined();
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(replacementFee.toString()).toFixed(),
      );
    },
  };

  return [send, speedUp, sendAgain, cancel];
};

export const scenarioBitcoinGenericRbf: Scenario<BitcoinGenericTransaction, Account> = {
  name: "Ledger Live Bitcoin — generic adapter, replace by fee (single address)",
  setup: async () => {
    const setup = await setupGenericAccount();
    address = setup.address;
    mineOnSync = true;

    // Two UTXOs: each original spends one, and a replacement spends the same one.
    await setup.sandbox.airdrop(address, 3);
    await setup.sandbox.airdrop(address, 4);

    return {
      accountBridge: setup.accountBridge,
      currencyBridge: setup.currencyBridge,
      account: setup.account,
      retryLimit: 15,
      retryInterval: 1_000,
    };
  },
  getTransactions: () => {
    steps = makeScenarioTransactions();
    stepIndex = -1;
    return steps;
  },
  // The coin-tester syncs after each broadcast, and coin-bitcoin reports confirmed history only:
  // a send is mined by the sync that follows it, except the originals, which must stay unmined
  // until their replacement is broadcast.
  beforeSync: async () => {
    if (!mineOnSync) return;
    await mineToWalletAddress("1");
    await waitForExplorerSync();
  },
  beforeEach: async account => {
    await syncExplorer();
    stepIndex++;
    const step = steps[stepIndex];
    if (
      step.name === "Send 1 BTC, left unmined" ||
      step.name === "Send 1 BTC again, left unmined"
    ) {
      holdingsBeforeOriginal = await listAllHoldings(address);
    }
    if (step.name === "Speed up the send") await prepareReplacement(account, step, false);
    if (step.name === "Cancel the send") await prepareReplacement(account, step, true);
  },
  // Right after the broadcast: from here on the sync mines, except after an original. The sandbox
  // also mines a block every few seconds on its own, so the original is kept out of every block
  // until its replacement is broadcast.
  mockIndexer: async (_account, optimistic) => {
    mineOnSync = !["Send 1 BTC, left unmined", "Send 1 BTC again, left unmined"].includes(
      steps[stepIndex].name,
    );
    if (!mineOnSync) {
      await keepOutOfBlocks(optimistic.hash);
      keptOutOfBlocks = optimistic.hash;
    }
  },
  afterEach: async () => {
    await syncExplorer();
  },
  afterAll: async account => {
    mineOnSync = true;
    await waitForExplorerSync();
    // Two funding payments in, the two replacements out; the originals were never mined.
    expect(account.operations.length).toBe(2 + 2);
    expect(await getRawMempool()).toEqual([]);
  },
  teardown: async () => {
    await killSandbox();
  },
};
