import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { Account } from "@ledgerhq/types-live";
import { createApi } from "@ledgerhq/coin-bitcoin/api/index";
import type { BitcoinContext } from "@ledgerhq/coin-bitcoin/config";
import { buildContext } from "@ledgerhq/live-common/bridge/generic-coin-framework/api/context";
import { BigNumber } from "bignumber.js";
import {
  getMempoolFee,
  getMinedTxids,
  getNodeTransaction,
  getRawMempool,
  keepOutOfBlocks,
  mineToWalletAddress,
  spentOutpoints,
  toSatoshis,
} from "../helpers";
import { killSandbox } from "../sandbox";
import { setupGenericAccount } from "../genericSetup";
import { waitForExplorerSync } from "../utils";
import type { BitcoinGenericTransaction } from "../genericBridges";

// Native SegWit address of another wallet (regtest): the send destination.
const RECIPIENT = "bcrt1qajglhjtctn88f5l6rajzz52fy78fhxspjajjwz";

const SEND = "Send 1 BTC, left unmined";
const SPEED_UP = "Speed up the send";
const SEND_AGAIN = "Send 1 BTC again, left unmined";
const CANCEL = "Cancel the send";
const UNMINED = [SEND, SEND_AGAIN];

type Step = ScenarioTransaction<BitcoinGenericTransaction, Account>;

let steps: Step[] = [];
let stepIndex = -1;
let address = "";
// Whether `beforeSync` mines: off while a send must stay in the mempool.
let mineOnSync = true;

// The send a step replaces, as the caller records it (Ledger Live holds its inputs and fee): read
// from the node when the original is broadcast.
let original = { txid: "", fee: 0n };
// The fee the replacement pays, chosen from the original's.
let replacementFee = 0n;

// Atlas and the node mine and index on their own: the wait only matters while blocks are mined.
const syncExplorer = async () => {
  if (mineOnSync) await waitForExplorerSync();
};

// The replacement's fee must beat the original's by the relay increment over the replacement's
// size (BIP 125, rule 4) and be at a higher rate (rule 6).
async function replacementFeeOf(
  account: Account,
  inputs: string[],
  amount: bigint | undefined,
  recipient: string,
): Promise<bigint> {
  const context = buildContext("bitcoin_regtest") as unknown as BitcoinContext;
  const estimation = await createApi("bitcoin_regtest").estimateFees(context, {
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
  const originalFee = original.fee;
  const originalVsize = BigInt((await getMempoolFee(original.txid)).vsize);
  const byIncrement = originalFee + incremental * vsize;
  const byRate = (originalFee * vsize) / originalVsize + 1n;
  return byIncrement > byRate ? byIncrement : byRate;
}

// Fills the step with a replacement of the original: the original's inputs and a custom fee.
async function prepareReplacement(account: Account, step: Step, cancel: boolean) {
  const originalTx = await getNodeTransaction(original.txid);
  const inputs = spentOutpoints(originalTx);
  let inputValue = 0n;
  for (const input of originalTx.vin) {
    const funding = await getNodeTransaction(input.txid);
    inputValue += toSatoshis(funding.vout[input.vout].value);
  }

  const recipient = cancel ? account.freshAddress : RECIPIENT;
  replacementFee = await replacementFeeOf(
    account,
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

// The send was broadcast and is not mined: the confirmed history and balance have not moved, and
// the node holds it in its mempool.
const expectPending = async (previousAccount: Account, currentAccount: Account) => {
  expect(currentAccount.operations.length).toBe(previousAccount.operations.length);
  expect(currentAccount.balance.toFixed()).toBe(previousAccount.balance.toFixed());
  const mempool = await getRawMempool();
  expect(mempool).toHaveLength(1);
  original = { txid: mempool[0], fee: (await getMempoolFee(mempool[0])).fee };
};

// The replacement is mined, the original is in no block, and the account paid what the
// replacement paid.
const expectReplaced =
  (spent: (amount: bigint) => bigint) => async (previous: Account, current: Account) => {
    expect(current.operations.length - previous.operations.length).toBe(1);
    const [latest] = current.operations;
    expect(latest.hash).not.toBe(original.txid);
    expect(latest.fee.toFixed()).toBe(replacementFee.toString());
    const mined = await getMinedTxids();
    expect(mined.has(latest.hash)).toBe(true);
    expect(mined.has(original.txid)).toBe(false);
    expect(await getRawMempool()).toEqual([]);
    expect(current.balance.toFixed()).toBe(
      previous.balance.minus(spent(replacementFee).toString()).toFixed(),
    );
  };

const makeScenarioTransactions = (): Step[] => [
  {
    name: SEND,
    amount: new BigNumber(1e8),
    recipient: RECIPIENT,
    feesStrategy: "slow",
    expect: expectPending,
  },
  {
    name: SPEED_UP,
    amount: new BigNumber(1e8),
    expect: expectReplaced(fee => 1_0000_0000n + fee),
  },
  {
    name: SEND_AGAIN,
    amount: new BigNumber(1e8),
    recipient: RECIPIENT,
    feesStrategy: "slow",
    expect: expectPending,
  },
  {
    name: CANCEL,
    expect: expectReplaced(fee => fee),
  },
];

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
    if (step.name === SPEED_UP) await prepareReplacement(account, step, false);
    if (step.name === CANCEL) await prepareReplacement(account, step, true);
  },
  // Right after the broadcast: from here on the sync mines, except after an original. The sandbox
  // also mines a block every few seconds on its own, so the original is kept out of every block
  // until its replacement is broadcast.
  mockIndexer: async (_account, optimistic) => {
    mineOnSync = !UNMINED.includes(steps[stepIndex].name);
    if (!mineOnSync) await keepOutOfBlocks(optimistic.hash);
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
