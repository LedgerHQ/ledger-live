import type { Scenario } from "@ledgerhq/coin-tester/main";
import type { Transaction, HederaAccount } from "@ledgerhq/coin-hedera/types";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/coin-hedera/constants";
import BigNumber from "bignumber.js";
import { RECIPIENT, makeHederaAccount } from "../fixtures";
import { type HederaScenarioTransaction, setupHederaScenario } from "../helpers";
import { getHgraphObserver } from "../indexer";

const ONE_HBAR_IN_TINYBAR = 100_000_000;

let closeMswHandlers: (() => void) | undefined;

function makeTransactions(): HederaScenarioTransaction[] {
  // Note for send max: getTransactionStatus checks `balance < totalSpent`, and totalSpent works out
  // to exactly `(balance − fee) + fee === balance`. It passes on equality with zero margin — any
  // rounding that pushes totalSpent up becomes a NotEnoughBalance the runner will not retry.
  const sendOneHbar: HederaScenarioTransaction = {
    name: "Send 1 HBAR to an existing recipient",
    family: "hedera",
    mode: HEDERA_TRANSACTION_MODES.Send,
    amount: new BigNumber(ONE_HBAR_IN_TINYBAR),
    recipient: RECIPIENT,
    expect: (previous, current) => {
      // Assert (not destructure) so an empty list from mirror-node lag is a retryable
      // Jest failure, not a hard TypeError.
      expect(current.operations.length).toBeGreaterThan(0);
      const [latest] = current.operations;
      expect(latest.type).toBe("OUT");
      expect(latest.recipients).toContain(RECIPIENT);
      // `value` already includes the fee (mirror node reports the fee-inclusive net change);
      // subtracting `fee` too would double-count it.
      expect(current.balance).toStrictEqual(previous.balance.minus(latest.value));
    },
  };

  const sendMaxHbar: HederaScenarioTransaction = {
    name: "Send max HBAR (drains the account)",
    family: "hedera",
    mode: HEDERA_TRANSACTION_MODES.Send,
    useAllAmount: true,
    recipient: RECIPIENT,
    expect: (previous, current) => {
      expect(current.operations.length).toBeGreaterThan(previous.operations.length);
      const [latest] = current.operations;
      expect(latest.type).toBe("OUT");
      expect(latest.recipients).toContain(RECIPIENT);
      // `value` is fee-inclusive, as sendOneHbar already relies on.
      expect(current.balance).toStrictEqual(previous.balance.minus(latest.value));
      // Send max leaves behind the fee *estimate* minus the fee actually charged — not zero.
      // estimateMaxSpendable subtracts an estimate; Solo charges the real schedule. The bound is
      // the fee the mirror node reports (charged_tx_fee, listOperations.v2.ts:41), never the
      // stubbed USD rate: that keeps the assertion independent of the mock while still catching
      // both an ignored useAllAmount (residue ≈ the whole balance) and a wildly-off estimate.
      expect(current.balance.toNumber()).toBeLessThanOrEqual(
        latest.fee.multipliedBy(10).toNumber(),
      );
      // A mirror-node balance is never negative, so isGreaterThanOrEqualTo(0) can't fail — it was
      // vacuous. What actually catches an ignored `useAllAmount` (which would leave most of the
      // balance behind) is the residual being a tiny fraction of what was there before the send.
      expect(current.balance.toNumber()).toBeLessThan(previous.balance.toNumber() * 0.01);
    },
  };

  return [sendOneHbar, sendMaxHbar];
}

export const scenarioHedera: Scenario<Transaction, HederaAccount> = {
  name: "Ledger Live Hedera — native HBAR sends",

  setup: async () => {
    const { currencyBridge, accountBridge, publicKey, accountId, close } =
      await setupHederaScenario([]);
    closeMswHandlers = close;

    return {
      currencyBridge,
      accountBridge,
      account: makeHederaAccount(accountId, publicKey),
      // Absorbs the mirror node's lag behind consensus — for `expect` only, nothing earlier.
      retryInterval: 2000,
      retryLimit: 20,
    };
  },

  getTransactions: () => makeTransactions(),

  afterAll: () => {
    const observer = getHgraphObserver();
    console.warn(
      `hgraph observer: ${observer.callCount} call(s) — ${observer.queries.join(" | ")}`,
    );
  },

  // Cluster teardown lives in scenarii.test.ts's afterAll — no scenario may tear it down.
  teardown: () => {
    closeMswHandlers?.();
  },
};
