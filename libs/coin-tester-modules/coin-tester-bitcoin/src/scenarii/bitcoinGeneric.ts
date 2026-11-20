import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { Account, AccountBridge } from "@ledgerhq/types-live";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { bitcoinPickingStrategy } from "@ledgerhq/coin-bitcoin/types";
import BigNumber from "bignumber.js";
import { getNodeTransaction, getRawMempool, mineToWalletAddress, spentOutpoints } from "../helpers";
import { holdingsAfter, listAllHoldings } from "../holdings";
import type { HoldingSummary } from "../holdings";
import { killSandbox } from "../sandbox";
import { setupGenericAccount } from "../genericSetup";
import { waitForExplorerSync } from "../utils";
import type { BitcoinGenericTransaction } from "../genericBridges";

// Native SegWit address of another wallet (regtest): the send destination.
const RECIPIENT = "bcrt1qajglhjtctn88f5l6rajzz52fy78fhxspjajjwz";

// Values (BTC) of the UTXOs the account is funded with, one airdrop each.
const FUNDING = [2, 3, 4, 5, 6];
const sats = (btc: number) => (btc * 1e8).toString();

type Step = ScenarioTransaction<BitcoinGenericTransaction, Account>;

let bridge: AccountBridge<BitcoinGenericTransaction>;
// The step running, and what the account held before it: the steps that spend a precise output
// are given its id once `listHoldings` has it.
let steps: Step[] = [];
let stepIndex = -1;
let holdingsBefore: HoldingSummary[] = [];
// The step's transaction as the bridge prepares it before signing: the fee and the inputs the user
// is shown.
let prepared: BitcoinGenericTransaction;
// What the step must spend, or keep, when `beforeEach` works it out from the holdings.
let expectedSpent: string[] = [];
let kept: HoldingSummary;

// The data the OP_RETURN step carries, and the output script it must produce: OP_RETURN, the push.
const OP_RETURN_DATA = Buffer.from("ledger coin tester");
const OP_RETURN_SCRIPT = Buffer.concat([
  Buffer.from([0x6a, OP_RETURN_DATA.length]),
  OP_RETURN_DATA,
]).toString("hex");

const idOfValue = (holdings: HoldingSummary[], btc: number): string => {
  const holding = holdings.find(h => h.value === sats(btc));
  if (!holding) throw new Error(`no ${btc} BTC UTXO in ${JSON.stringify(holdings)}`);
  return holding.id;
};

const compareValues = (a: HoldingSummary, b: HoldingSummary): number => {
  const difference = BigInt(a.value) - BigInt(b.value);
  if (difference === 0n) return 0;
  return difference < 0n ? -1 : 1;
};

/** The holdings, smallest value first. */
const byValue = (holdings: HoldingSummary[]): HoldingSummary[] => [...holdings].sort(compareValues);

// A selection that cannot pay the amount is refused in the transaction status, which the coin
// tester treats as a failed step: so it is checked here, on its own, and nothing is broadcast.
const expectSmallSelectionRefused = async (account: Account) => {
  const holdings = await listAllHoldings(account.freshAddress);
  const smallest = holdings.reduce((a, b) => (BigInt(b.value) < BigInt(a.value) ? b : a));
  const transaction = await bridge.prepareTransaction(account, {
    ...bridge.createTransaction(account),
    recipient: RECIPIENT,
    amount: new BigNumber(smallest.value).plus(1e8),
    utxoStrategy: { selectedUtxos: [smallest.id] },
  });
  const status = await bridge.getTransactionStatus(account, transaction);
  expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
  expect(await getRawMempool()).toEqual([]);
};

const makeScenarioTransactions = (): Step[] => {
  const excludingOldest: Step = {
    name: "Send 1 BTC, excluding the oldest UTXO",
    amount: new BigNumber(1e8),
    recipient: RECIPIENT,
    // `utxoStrategy` is filled in `beforeEach`, from the holdings.
    expect: async (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.plus(1e8).toFixed());
      expect(latestOperation.fee.toFixed()).toBe(prepared.fees?.toFixed());
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
      const tx = await getNodeTransaction(latestOperation.hash);
      const spent = spentOutpoints(tx);
      expect(spent).toHaveLength(Number(prepared.feeParameters?.inputCount));
      expect(spent).not.toContain(idOfValue(holdingsBefore, FUNDING[0]));
      expect(await listAllHoldings(currentAccount.freshAddress)).toEqual(
        holdingsAfter(holdingsBefore, spent, tx, currentAccount.freshAddress),
      );
    },
  };

  const excludingOldestLegacy: Step = {
    name: "Send 1 BTC, excluding the oldest UTXO with the legacy coin control",
    amount: new BigNumber(1e8),
    recipient: RECIPIENT,
    // `utxoStrategy` is filled in `beforeEach`, in the shape Ledger Live's coin control screen
    // builds.
    expect: async (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.plus(1e8).toFixed());
      expect(latestOperation.fee.toFixed()).toBe(prepared.fees?.toFixed());
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
      const tx = await getNodeTransaction(latestOperation.hash);
      const spent = spentOutpoints(tx);
      expect(spent).toHaveLength(Number(prepared.feeParameters?.inputCount));
      expect(spent).not.toContain(idOfValue(holdingsBefore, FUNDING[0]));
      expect(await listAllHoldings(currentAccount.freshAddress)).toEqual(
        holdingsAfter(holdingsBefore, spent, tx, currentAccount.freshAddress),
      );
    },
  };

  const selecting: Step = {
    name: "Send 1 BTC, spending only the selected UTXO",
    amount: new BigNumber(1e8),
    recipient: RECIPIENT,
    // `utxoStrategy` is filled in `beforeEach`, from the holdings.
    expect: async (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.plus(1e8).toFixed());
      expect(latestOperation.fee.toFixed()).toBe(prepared.fees?.toFixed());
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
      const tx = await getNodeTransaction(latestOperation.hash);
      const spent = spentOutpoints(tx);
      expect(spent).toHaveLength(Number(prepared.feeParameters?.inputCount));
      expect(spent).toEqual([idOfValue(holdingsBefore, FUNDING[3])]);
      expect(await listAllHoldings(currentAccount.freshAddress)).toEqual(
        holdingsAfter(holdingsBefore, spent, tx, currentAccount.freshAddress),
      );
    },
  };

  const send: Step = {
    name: "Send 1 BTC",
    amount: new BigNumber(1e8),
    recipient: RECIPIENT,
    expect: async (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.plus(1e8).toFixed());
      expect(latestOperation.fee.toFixed()).toBe(prepared.fees?.toFixed());
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
      const tx = await getNodeTransaction(latestOperation.hash);
      const spent = spentOutpoints(tx);
      expect(spent).toHaveLength(Number(prepared.feeParameters?.inputCount));
      expect(await listAllHoldings(currentAccount.freshAddress)).toEqual(
        holdingsAfter(holdingsBefore, spent, tx, currentAccount.freshAddress),
      );
    },
  };

  const sendFast: Step = {
    name: "Send with the fast fees strategy",
    feesStrategy: "fast",
    amount: new BigNumber(1e6),
    recipient: RECIPIENT,
    expect: async (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.plus(1e6).toFixed());
      expect(latestOperation.fee.toFixed()).toBe(prepared.fees?.toFixed());
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
      const tx = await getNodeTransaction(latestOperation.hash);
      const spent = spentOutpoints(tx);
      expect(spent).toHaveLength(Number(prepared.feeParameters?.inputCount));
      expect(await listAllHoldings(currentAccount.freshAddress)).toEqual(
        holdingsAfter(holdingsBefore, spent, tx, currentAccount.freshAddress),
      );
    },
  };

  const sendSlow: Step = {
    name: "Send with the slow fees strategy",
    feesStrategy: "slow",
    amount: new BigNumber(1e6),
    recipient: RECIPIENT,
    expect: async (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.plus(1e6).toFixed());
      expect(latestOperation.fee.toFixed()).toBe(prepared.fees?.toFixed());
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
      const tx = await getNodeTransaction(latestOperation.hash);
      const spent = spentOutpoints(tx);
      expect(spent).toHaveLength(Number(prepared.feeParameters?.inputCount));
      expect(await listAllHoldings(currentAccount.freshAddress)).toEqual(
        holdingsAfter(holdingsBefore, spent, tx, currentAccount.freshAddress),
      );
    },
  };

  const sendOpReturn: Step = {
    name: "Send with OP_RETURN data",
    amount: new BigNumber(1e6),
    recipient: RECIPIENT,
    opReturnData: OP_RETURN_DATA,
    expect: async (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.plus(1e6).toFixed());
      expect(latestOperation.fee.toFixed()).toBe(prepared.fees?.toFixed());
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
      const tx = await getNodeTransaction(latestOperation.hash);
      const spent = spentOutpoints(tx);
      expect(spent).toHaveLength(Number(prepared.feeParameters?.inputCount));
      const data = tx.vout.filter(output => output.scriptPubKey.type === "nulldata");
      expect(data).toHaveLength(1);
      expect(data[0].value).toBe(0);
      expect(data[0].scriptPubKey.hex).toBe(OP_RETURN_SCRIPT);
      expect(await listAllHoldings(currentAccount.freshAddress)).toEqual(
        holdingsAfter(holdingsBefore, spent, tx, currentAccount.freshAddress),
      );
    },
  };

  const optimizeSize: Step = {
    name: "Send with the optimize-size strategy",
    recipient: RECIPIENT,
    utxoStrategy: { strategy: "optimize-size" },
    // `amount` is set in `beforeEach`: only the largest UTXO covers it alone, where deepest first
    // would add older ones.
    expect: async (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.fee.toFixed()).toBe(prepared.fees?.toFixed());
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
      const tx = await getNodeTransaction(latestOperation.hash);
      const spent = spentOutpoints(tx);
      expect(spent).toHaveLength(Number(prepared.feeParameters?.inputCount));
      expect(spent).toEqual(expectedSpent);
      expect(await listAllHoldings(currentAccount.freshAddress)).toEqual(
        holdingsAfter(holdingsBefore, spent, tx, currentAccount.freshAddress),
      );
    },
  };

  const mergeOutputs: Step = {
    name: "Send with the merge-outputs strategy",
    recipient: RECIPIENT,
    utxoStrategy: { strategy: "merge-outputs" },
    // `amount` is set in `beforeEach`, just above the smallest UTXO: the smallest ones are merged.
    expect: async (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.fee.toFixed()).toBe(prepared.fees?.toFixed());
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
      const tx = await getNodeTransaction(latestOperation.hash);
      const spent = spentOutpoints(tx);
      expect(spent).toHaveLength(Number(prepared.feeParameters?.inputCount));
      const smallestFirst = byValue(holdingsBefore).map(holding => holding.id);
      expect(spent.length).toBeGreaterThanOrEqual(2);
      expect([...spent].sort()).toEqual(smallestFirst.slice(0, spent.length).sort());
      expect(await listAllHoldings(currentAccount.freshAddress)).toEqual(
        holdingsAfter(holdingsBefore, spent, tx, currentAccount.freshAddress),
      );
    },
  };

  const sendMaxExcluding: Step = {
    name: "Send max, excluding one UTXO",
    useAllAmount: true,
    recipient: RECIPIENT,
    // `utxoStrategy` is filled in `beforeEach`: every UTXO is swept but the largest, which stays.
    expect: async (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.fee.toFixed()).toBe(prepared.fees?.toFixed());
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
      const tx = await getNodeTransaction(latestOperation.hash);
      const spent = spentOutpoints(tx);
      expect(spent).toHaveLength(Number(prepared.feeParameters?.inputCount));
      expect(spent).not.toContain(kept.id);
      expect(await listAllHoldings(currentAccount.freshAddress)).toEqual([kept]);
      expect(currentAccount.balance.toFixed()).toBe(kept.value);
    },
  };

  const sendMax: Step = {
    name: "Send max",
    useAllAmount: true,
    recipient: RECIPIENT,
    expect: async (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.fee.toFixed()).toBe(prepared.fees?.toFixed());
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
      const tx = await getNodeTransaction(latestOperation.hash);
      const spent = spentOutpoints(tx);
      expect(spent).toHaveLength(Number(prepared.feeParameters?.inputCount));
      expect(await listAllHoldings(currentAccount.freshAddress)).toEqual([]);
      expect(currentAccount.balance.toFixed()).toBe("0");
    },
  };

  return [
    excludingOldest,
    excludingOldestLegacy,
    selecting,
    send,
    sendFast,
    sendSlow,
    sendOpReturn,
    optimizeSize,
    mergeOutputs,
    sendMaxExcluding,
    sendMax,
  ];
};

export const scenarioBitcoinGeneric: Scenario<BitcoinGenericTransaction, Account> = {
  name: "Ledger Live Bitcoin — generic adapter (single address)",
  setup: async () => {
    const { sandbox, address, account, accountBridge, currencyBridge } =
      await setupGenericAccount();
    bridge = accountBridge;

    // Fund the address with distinct UTXOs, for the steps to choose among. Each airdrop mines its
    // block, so the funding is confirmed before the first sync (history and balance are
    // confirmed-only).
    for (const btc of FUNDING) await sandbox.airdrop(address, btc);

    return { accountBridge, currencyBridge, account, retryLimit: 15, retryInterval: 1_000 };
  },
  getTransactions: () => {
    steps = makeScenarioTransactions();
    stepIndex = -1;
    return steps;
  },
  // The coin-tester checks a send's expectations right after broadcasting it, before `afterEach`.
  // coin-bitcoin's Alpaca API reports confirmed history and balance only, so the send must be
  // mined before that sync: `beforeSync` runs before every sync, including the post-broadcast ones.
  beforeSync: async () => {
    await mineToWalletAddress("1");
    await waitForExplorerSync();
  },
  beforeEach: async account => {
    await waitForExplorerSync();
    stepIndex++;
    holdingsBefore = await listAllHoldings(account.freshAddress);
    // The coin tester spreads the step into the transaction after this hook.
    const step = steps[stepIndex];
    if (step.name === "Send 1 BTC, excluding the oldest UTXO") {
      step.utxoStrategy = { excludedUtxos: [idOfValue(holdingsBefore, FUNDING[0])] };
    }
    if (step.name === "Send 1 BTC, excluding the oldest UTXO with the legacy coin control") {
      const [hash, outputIndex] = idOfValue(holdingsBefore, FUNDING[0]).split(":");
      step.utxoStrategy = {
        strategy: bitcoinPickingStrategy.CUSTOM,
        excludeUTXOs: [{ hash, outputIndex: Number(outputIndex) }],
      };
    }
    if (step.name === "Send 1 BTC, spending only the selected UTXO") {
      step.utxoStrategy = { selectedUtxos: [idOfValue(holdingsBefore, FUNDING[3])] };
    }
    if (step.name === "Send with the optimize-size strategy") {
      const [secondLargest, largest] = byValue(holdingsBefore).slice(-2);
      step.amount = new BigNumber(secondLargest.value).plus(1e7);
      // It must cover the amount and the fee alone, with room: 0.2 BTC above the second largest.
      if (BigInt(largest.value) - BigInt(secondLargest.value) < 20_000_000n) {
        throw new Error(
          `the largest UTXO must exceed the others: ${JSON.stringify(holdingsBefore)}`,
        );
      }
      expectedSpent = [largest.id];
    }
    if (step.name === "Send with the merge-outputs strategy") {
      const [smallest] = byValue(holdingsBefore);
      step.amount = new BigNumber(smallest.value).plus(1e6);
    }
    if (step.name === "Send max, excluding one UTXO") {
      kept = byValue(holdingsBefore).at(-1) as HoldingSummary;
      step.utxoStrategy = { excludedUtxos: [kept.id] };
    }
    // The transaction the coin tester signs next, prepared the same way: what the user is shown.
    prepared = await bridge.prepareTransaction(account, {
      ...bridge.createTransaction(account),
      ...step,
    });
  },
  afterEach: async account => {
    await waitForExplorerSync();
    if (steps[stepIndex].name === "Send 1 BTC, spending only the selected UTXO")
      await expectSmallSelectionRefused(account);
  },
  afterAll: async account => {
    await waitForExplorerSync();
    // The funding payments in, the sends out: the refused selection left no operation.
    expect(account.operations.length).toBe(FUNDING.length + steps.length);
  },
  teardown: async () => {
    await killSandbox();
  },
};
