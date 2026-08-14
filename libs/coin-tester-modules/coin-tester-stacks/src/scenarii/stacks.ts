import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { Transaction } from "@ledgerhq/coin-stacks/types";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import {
  DEPLOYER_ADDRESS,
  DEPLOYER_PRIVATE_KEY,
  RECIPIENT_PRIVATE_KEY,
  STACKS,
  TEST_TOKEN,
  TOKEN_CONTRACT_NAME,
  makeAccount,
  registerTestTokenInMockStore,
} from "../fixtures";
import { getBridges } from "../helpers";
import { initMSW } from "../indexer";
import { buildStacksTestSigner } from "../signer";
import { killDevnet, spawnDevnet, waitForContractDeployment } from "../devnet";

let closeMsw: (() => void) | null = null;
let subAccountId = "";
let recipientAddress = "";

type Tx = ScenarioTransaction<Transaction, Account>;

function makeTransactions(): Tx[] {
  // A fresh devnet has never mined a plain STX transfer or a call to this specific contract, and
  // stacks-node's fee estimator has no historical cost data to estimate from for either payload
  // shape yet — verified live: `/v2/fees/transaction` returns `NoEstimateAvailable` for both, not
  // just for contract-calls. `prepareTransaction.ts`'s fee override (skips the network estimate
  // when a positive `fee` is already set) works around this; the values are generous flat
  // fee-per-byte guesses, not measured, since there's no estimate to measure against on this chain.
  const NATIVE_FEE = new BigNumber(3_000);
  const TOKEN_FEE = new BigNumber(10_000);

  const sendStx: Tx = {
    name: "Send 1 STX",
    network: "devnet",
    amount: new BigNumber(1_000_000), // 1 STX (6 decimals)
    recipient: recipientAddress,
    fee: NATIVE_FEE,
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
    fee: NATIVE_FEE,
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
    fee: TOKEN_FEE,
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
    fee: TOKEN_FEE,
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
    // 15 minutes: at the 10s-per-block cadence (`scripts/bitcoin-miner.js`), reaching the
    // contract's deployment batch (epoch 3.0, ~42 blocks past genesis) needs ~7 minutes in the
    // worst case. Generous margin above that, not a different mechanism.
    await waitForContractDeployment(DEPLOYER_ADDRESS, TOKEN_CONTRACT_NAME, 15 * 60 * 1000);

    const funder = buildStacksTestSigner(DEPLOYER_PRIVATE_KEY);
    const recipient = buildStacksTestSigner(RECIPIENT_PRIVATE_KEY);
    recipientAddress = recipient.address;

    registerTestTokenInMockStore();
    closeMsw = initMSW();

    const { currencyBridge, accountBridge } = getBridges(strategy, funder.signer);
    const account = makeAccount(funder.publicKey, funder.address);
    subAccountId = encodeTokenAccountId(account.id, TEST_TOKEN);

    // retryLimit bumped from 40 to 90 (200s -> 450s headroom): occasionally, a balance/
    // spendableBalance assertion took longer than 300s to catch up through the indexer during
    // verification, intermittently exhausting a smaller limit even on otherwise-successful runs.
    return { currencyBridge, accountBridge, account, retryInterval: 5000, retryLimit: 90 };
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
    // 2 native STX sends + 2 SIP-010 sends, each of which also echoes as a zero-value "parent" OUT
    // operation on the main account (`sip010OpToParentOp`, alongside the sub-account's own
    // operation) — 4 total, not 2.
    expect(account.operations.filter(op => op.type === "OUT")).toHaveLength(4);
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
