import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { Transaction } from "@ledgerhq/coin-stacks/types";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import {
  DEPLOYER_PRIVATE_KEY,
  RECIPIENT_PRIVATE_KEY,
  STACKS,
  TEST_TOKEN,
  makeAccount,
  registerTestTokenInMockStore,
} from "../fixtures";
import { getBridges } from "../helpers";
import { initMSW } from "../indexer";
import { buildStacksTestSigner } from "../signer";
import { killDevnet, spawnDevnet } from "../devnet";

let closeMsw: (() => void) | null = null;
let subAccountId = "";
let recipientAddress = "";

type Tx = ScenarioTransaction<Transaction, Account>;

function makeTransactions(): Tx[] {
  const sendStx: Tx = {
    name: "Send 1 STX",
    network: "devnet",
    amount: new BigNumber(1_000_000), // 1 STX (6 decimals)
    recipient: recipientAddress,
    expect: (prev, curr) => {
      expect(curr.operations.length).toBeGreaterThan(prev.operations.length);
      const [latestOp] = curr.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients).toContain(recipientAddress);
      expect(curr.balance).toStrictEqual(
        prev.balance.minus(new BigNumber(1_000_000)).minus(latestOp.fee),
      );
    },
  };

  const sendMaxStx: Tx = {
    name: "Send max STX",
    network: "devnet",
    amount: new BigNumber(0),
    useAllAmount: true,
    recipient: recipientAddress,
    expect: (prev, curr) => {
      expect(curr.operations.length).toBeGreaterThan(prev.operations.length);
      const [latestOp] = curr.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients).toContain(recipientAddress);
      expect(curr.spendableBalance.isZero()).toBe(true);
      expect(curr.balance.lt(prev.balance)).toBe(true);
    },
  };

  const sendToken: Tx = {
    name: "Send 10 CTT",
    network: "devnet",
    amount: new BigNumber(10_000_000), // 10 CTT (6 decimals)
    recipient: recipientAddress,
    subAccountId,
    expect: (prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === subAccountId);
      const prevSub = prev.subAccounts?.find(s => s.id === subAccountId);
      expect(sub).toBeDefined();
      expect(sub!.balance).toStrictEqual(
        (prevSub?.balance ?? new BigNumber(0)).minus(new BigNumber(10_000_000)),
      );
      expect(sub!.operations.length).toBeGreaterThan(prevSub?.operations.length ?? 0);
      const [latestOp] = sub!.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients).toContain(recipientAddress);
    },
  };

  const sendMaxToken: Tx = {
    name: "Send max CTT",
    network: "devnet",
    amount: new BigNumber(0),
    useAllAmount: true,
    recipient: recipientAddress,
    subAccountId,
    expect: (_prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === subAccountId);
      expect(sub).toBeDefined();
      // Token sweeps don't subtract the fee (fees are paid in STX, not in the SIP-010 token) —
      // matches `resolveAmount`-equivalent comment in `coin-stacks/bridge/prepareTransaction.ts`.
      expect(sub!.spendableBalance.isZero()).toBe(true);
      const [latestOp] = sub!.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients).toContain(recipientAddress);
    },
  };

  // Native sends drain most of the STX balance (send-max leaves only enough to cover future
  // fees), so the token sends run first while there's still a comfortable STX balance to pay their
  // fees from; native max runs last since nothing here depends on the STX balance afterwards.
  return [sendToken, sendMaxToken, sendStx, sendMaxStx];
}

export const scenarioStacks: Scenario<Transaction, Account> = {
  name: "Ledger Live Stacks (STX + SIP-010 token)",

  setup: async strategy => {
    await spawnDevnet();

    const funder = buildStacksTestSigner(DEPLOYER_PRIVATE_KEY);
    const recipient = buildStacksTestSigner(RECIPIENT_PRIVATE_KEY);
    recipientAddress = recipient.address;

    registerTestTokenInMockStore();
    closeMsw = initMSW();

    const { currencyBridge, accountBridge } = getBridges(strategy, funder.signer);
    const account = makeAccount(funder.publicKey, funder.address);
    subAccountId = encodeTokenAccountId(account.id, TEST_TOKEN);

    return { currencyBridge, accountBridge, account, retryInterval: 5000, retryLimit: 40 };
  },

  getTransactions: () => makeTransactions(),

  beforeAll: account => {
    expect(account.currency.id).toBe(STACKS.id);
    expect(account.balance.gt(0)).toBe(true);
    const token = account.subAccounts?.find(s => s.id === subAccountId);
    expect(token).toBeDefined();
    expect(token!.balance.gt(0)).toBe(true);
  },

  afterAll: account => {
    expect(account.operations.filter(op => op.type === "OUT")).toHaveLength(2);
    const token = account.subAccounts?.find(s => s.id === subAccountId);
    expect(token).toBeDefined();
    expect(token!.operations.filter(op => op.type === "OUT")).toHaveLength(2);
  },

  teardown: async () => {
    closeMsw?.();
    closeMsw = null;
    await killDevnet();
  },
};
