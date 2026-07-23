import type { Scenario } from "@ledgerhq/coin-tester/main";
import type { Transaction, HederaAccount } from "@ledgerhq/coin-hedera/types";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/coin-hedera/constants";
import BigNumber from "bignumber.js";
import { makeHederaAccount } from "../fixtures";
import { type HederaScenarioTransaction, setupHederaScenario } from "../helpers";
import { getFirstNodeId } from "../genesis";

let closeMswHandlers: (() => void) | undefined;
let accountId: string;
let stakingNodeId: number;

function makeTransactions(): HederaScenarioTransaction[] {
  const delegate: HederaScenarioTransaction = {
    name: `Delegate to node ${stakingNodeId}`,
    family: "hedera",
    mode: HEDERA_TRANSACTION_MODES.Delegate,
    properties: { stakingNodeId },
    amount: new BigNumber(0),
    recipient: accountId,
    expect: (previous, current) => {
      expect(current.operations.length).toBeGreaterThan(previous.operations.length);
      const [latest] = current.operations;
      expect(latest.type).toBe("DELEGATE");
      expect(current.hederaResources?.delegation?.nodeId).toBe(stakingNodeId);
    },
  };

  const undelegate: HederaScenarioTransaction = {
    name: "Undelegate",
    family: "hedera",
    mode: HEDERA_TRANSACTION_MODES.Undelegate,
    properties: { stakingNodeId: null },
    amount: new BigNumber(0),
    recipient: accountId,
    expect: (previous, current) => {
      expect(current.operations.length).toBeGreaterThan(previous.operations.length);
      const [latest] = current.operations;
      expect(latest.type).toBe("UNDELEGATE");
      // `null`, not a delegation object with nodeId === -1. getStakes.ts:22-27 documents -1 as the
      // mirror node's "no longer delegated" marker, and synchronisation.ts:108-115 would map that
      // number onto a delegation object — but Solo's mirror node does not send it (measured on
      // 0.68.0, still holds on 0.83: this assertion passes on the current pin). Probed against a
      // live 0.68.0 cluster: the account reads back as staked (nodeId 0) for ~3 s after the
      // transaction; `staked_node_id` goes non-numeric from ~3 s onward — 242 samples over 4.3 min.
      // So this is the settled state, not mirror-node lag. This assertion is only non-vacuous because
      // `delegate` runs immediately before it in this same scenario: against a fresh, never-staked
      // account, `toBeNull()` would pass trivially, and an undelegate that silently did nothing
      // would still fail here by leaving nodeId === 0.
      expect(current.hederaResources?.delegation).toBeNull();
    },
  };

  return [delegate, undelegate];
}

export const scenarioHederaStaking: Scenario<Transaction, HederaAccount> = {
  name: "Ledger Live Hedera — delegate and undelegate",

  setup: async () => {
    const {
      currencyBridge,
      accountBridge,
      publicKey,
      accountId: newAccountId,
      close,
    } = await setupHederaScenario([]);
    closeMswHandlers = close;
    accountId = newAccountId;
    stakingNodeId = await getFirstNodeId();

    return {
      currencyBridge,
      accountBridge,
      account: makeHederaAccount(accountId, publicKey),
      retryInterval: 2000,
      retryLimit: 20,
    };
  },

  getTransactions: () => makeTransactions(),

  teardown: () => {
    closeMswHandlers?.();
  },
};
