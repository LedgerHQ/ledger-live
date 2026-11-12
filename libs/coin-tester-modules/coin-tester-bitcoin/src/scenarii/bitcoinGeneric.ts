import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { Account, AccountBridge } from "@ledgerhq/types-live";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { BigNumber } from "bignumber.js";
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

const EXCLUDING = "Send 1 BTC, excluding the oldest UTXO";
const SELECTING = "Send 1 BTC, spending only the selected UTXO";

type Step = ScenarioTransaction<BitcoinGenericTransaction, Account>;

let bridge: AccountBridge<BitcoinGenericTransaction>;
// The step running, and what the account held before it: the steps that spend a precise output
// are given its id once `listHoldings` has it.
let steps: Step[] = [];
let stepIndex = -1;
let holdingsBefore: HoldingSummary[] = [];

const idOfValue = (holdings: HoldingSummary[], btc: number): string => {
  const holding = holdings.find(h => h.value === sats(btc));
  if (!holding) throw new Error(`no ${btc} BTC UTXO in ${JSON.stringify(holdings)}`);
  return holding.id;
};

// Checks the send of one step: the account's own history and balance, then what it spent on the
// node, then its holdings, all by equality. `spends` tells what the step is expected to spend.
const expectOutgoing =
  (amount?: BigNumber, spends?: (spent: string[]) => void) =>
  async (previousAccount: Account, currentAccount: Account) => {
    const [latestOperation] = currentAccount.operations;

    expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
    expect(latestOperation.type).toBe("OUT");
    if (amount) {
      // The operation value includes the fees (the generic framework re-adds them).
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.plus(amount).toFixed());
    }
    expect(currentAccount.balance.toFixed()).toBe(
      previousAccount.balance.minus(latestOperation.value).toFixed(),
    );

    const tx = await getNodeTransaction(latestOperation.hash);
    const spent = spentOutpoints(tx);
    spends?.(spent);
    const holdings = await listAllHoldings(currentAccount.freshAddress);
    expect(holdings).toEqual(holdingsAfter(holdingsBefore, spent, tx, currentAccount.freshAddress));
  };

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

const makeScenarioTransactions = (): Step[] => [
  {
    name: EXCLUDING,
    amount: new BigNumber(1e8),
    recipient: RECIPIENT,
    // `utxoStrategy` is filled in `beforeEach`, from the holdings.
    expect: expectOutgoing(new BigNumber(1e8), spent => {
      expect(spent).not.toContain(idOfValue(holdingsBefore, FUNDING[0]));
    }),
  },
  {
    name: SELECTING,
    amount: new BigNumber(1e8),
    recipient: RECIPIENT,
    expect: expectOutgoing(new BigNumber(1e8), spent => {
      expect(spent).toEqual([idOfValue(holdingsBefore, FUNDING[3])]);
    }),
  },
  {
    name: "Send 1 BTC",
    amount: new BigNumber(1e8),
    recipient: RECIPIENT,
    expect: expectOutgoing(new BigNumber(1e8)),
  },
  {
    name: "Send with the fast fees strategy",
    feesStrategy: "fast",
    amount: new BigNumber(1e6),
    recipient: RECIPIENT,
    expect: expectOutgoing(new BigNumber(1e6)),
  },
  {
    name: "Send with the slow fees strategy",
    feesStrategy: "slow",
    amount: new BigNumber(1e6),
    recipient: RECIPIENT,
    expect: expectOutgoing(new BigNumber(1e6)),
  },
  {
    name: "Send max",
    useAllAmount: true,
    recipient: RECIPIENT,
    expect: async (previousAccount, currentAccount) => {
      await expectOutgoing()(previousAccount, currentAccount);
      expect(currentAccount.balance.toFixed()).toBe("0");
    },
  },
];

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
    if (step.name === EXCLUDING) {
      step.utxoStrategy = { excludedUtxos: [idOfValue(holdingsBefore, FUNDING[0])] };
    }
    if (step.name === SELECTING) {
      step.utxoStrategy = { selectedUtxos: [idOfValue(holdingsBefore, FUNDING[3])] };
    }
  },
  afterEach: async account => {
    await waitForExplorerSync();
    if (steps[stepIndex].name === SELECTING) await expectSmallSelectionRefused(account);
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
