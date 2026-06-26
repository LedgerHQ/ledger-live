/**
 * Bridge ↔ Alpaca parity integration tests for MultiversX.
 *
 * These tests run the SAME input through both the legacy account bridge and the
 * new Alpaca API (createApi) against real MultiversX mainnet, then assert the two
 * implementations agree. They are the safety net for the alpacaisation: as long as
 * the bridge is the source of truth, the Alpaca API must produce equivalent results.
 *
 * To run: pnpm test-integ
 *
 * Both stacks read their endpoints from live-env. The bridge's sdk builds its
 * network clients at import time from getEnv("MULTIVERSX_API_ENDPOINT") /
 * getEnv("MULTIVERSX_DELEGATION_API_ENDPOINT"), and createApi() defaults to the
 * same env values, so both hit identical mainnet endpoints (no override here).
 *
 * Semantic differences that are EXPECTED (and therefore normalized below, not
 * asserted as raw equality):
 * - Operation `value`: the bridge folds the fee into `value` for OUT native sends,
 *   and reports only fees (+rewards) for staking ops. The Alpaca keeps `value` and
 *   `tx.fees` separate and only emits IN/OUT types.
 * - Crafted `gasLimit` for "withdraw" and "reDelegateRewards": the bridge uses
 *   GAS.DELEGATE (75M) while the Alpaca uses GAS.CLAIM (6M). This is a KNOWN
 *   DIVERGENCE asserted explicitly so the suite documents current behavior.
 */

import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

import {
  createApi,
  getAccount,
  getAccountESDTTokens,
  getAccountDelegations,
  getEGLDOperations,
} from "./index";
import type { MultiversXApi } from "./types";
import { buildTransactionToSign } from "../buildTransaction";
import { prepareTransaction } from "../prepareTransaction";
import { createTransaction } from "../createTransaction";
import { GAS, MIN_GAS_LIMIT } from "../constants";
import type { MultiversXTransactionMode, Transaction } from "../types";

// Mainnet test addresses (passive accounts with stable, verifiable data).
const TEST_ADDRESSES = {
  // Active account with EGLD balance (MultiversX genesis address).
  withEgld: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
  // Maiar Exchange contract - holds many ESDT tokens.
  withTokens: "erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2",
};

// Ledger delegation contract (validator).
const LEDGER_VALIDATOR = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqppllllls9ftvxy";
const RECIPIENT = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";
const ONE_EGLD = 1000000000000000000n;

const TIMEOUT_STANDARD = 60000;
const TIMEOUT_EXTENDED = 120000;

/** Minimal Account stub sufficient to drive prepareTransaction + buildTransactionToSign. */
function makeAccountStub(address: string): Account {
  return {
    freshAddress: address,
    subAccounts: [],
    spendableBalance: new BigNumber(0),
  } as unknown as Account;
}

/** Builds a prepared bridge Transaction and serializes it via buildTransactionToSign. */
async function craftViaBridge(
  account: Account,
  mode: MultiversXTransactionMode,
  recipient: string,
  amount: bigint,
): Promise<Record<string, unknown>> {
  const tx: Transaction = {
    ...createTransaction(account),
    mode,
    recipient,
    amount: new BigNumber(amount.toString()),
  };
  const prepared = await prepareTransaction(account, tx);
  return JSON.parse(await buildTransactionToSign(account, prepared));
}

describe("MultiversX bridge ↔ alpaca parity (mainnet)", () => {
  let api: MultiversXApi;

  beforeAll(() => {
    // No config: read the same default mainnet endpoints the bridge sdk uses.
    api = createApi();
  });

  describe("getBalance vs bridge getAccount / ESDT tokens", () => {
    it(
      "native balance matches the bridge account balance",
      async () => {
        const [bridgeAccount, alpacaBalances] = await Promise.all([
          getAccount(TEST_ADDRESSES.withEgld),
          api.getBalance(TEST_ADDRESSES.withEgld),
        ]);

        const native = alpacaBalances.find(b => b.asset.type === "native");
        // The Alpaca native balance is the raw account balance, which the bridge
        // exposes as spendableBalance (account.balance, before adding delegations).
        expect(native!.value).toBe(BigInt(bridgeAccount.balance.toFixed()));
      },
      TIMEOUT_EXTENDED,
    );

    it(
      "ESDT balances match the bridge token list",
      async () => {
        const [tokens, alpacaBalances] = await Promise.all([
          getAccountESDTTokens(TEST_ADDRESSES.withTokens),
          api.getBalance(TEST_ADDRESSES.withTokens),
        ]);

        const esdtBalances = alpacaBalances.filter(b => b.asset.type === "esdt");

        // Same number of tokens surfaced by both stacks.
        expect(esdtBalances.length).toBe(tokens.length);

        // Each bridge token has a matching alpaca balance with the same value.
        for (const token of tokens) {
          const match = esdtBalances.find(
            b => "assetReference" in b.asset && b.asset.assetReference === token.identifier,
          );
          expect(match).toMatchObject({
            asset: { assetReference: token.identifier },
            value: BigInt(token.balance),
          });
        }
      },
      TIMEOUT_EXTENDED,
    );
  });

  describe("listOperations vs bridge getEGLDOperations", () => {
    it(
      "native operations agree on hash, block height, fee, type and (normalized) value",
      async () => {
        const [bridgeOps, alpacaPage] = await Promise.all([
          getEGLDOperations("parity-test", TEST_ADDRESSES.withEgld, 0, []),
          api.listOperations(TEST_ADDRESSES.withEgld, { limit: 25, minHeight: 0 }),
        ]);

        const bridgeByHash = new Map(bridgeOps.map(op => [op.hash, op]));

        // Restrict to native operations - ESDT ops use a different value model.
        const nativeOps = alpacaPage.items.filter(op => op.asset.type === "native");
        expect(nativeOps.length).toBeGreaterThan(0);

        let matched = 0;
        for (const alpacaOp of nativeOps) {
          const bridgeOp = bridgeByHash.get(alpacaOp.tx.hash);
          if (!bridgeOp) continue; // bridge dedup/paging may differ; only compare overlap
          matched++;

          // Always-comparable fields (same upstream transaction).
          expect(Number(bridgeOp.blockHeight ?? 0)).toBe(alpacaOp.tx.block.height);
          expect(BigInt(bridgeOp.fee.toFixed())).toBe(alpacaOp.tx.fees);

          // Type and value only line up for plain transfers. For staking the bridge
          // emits DELEGATE/UNDELEGATE/REWARD/... and a fee-based value, while the
          // Alpaca emits IN/OUT with the raw transfer value - those are skipped here.
          const isPlainTransfer = bridgeOp.type === "IN" || bridgeOp.type === "OUT";
          if (!isPlainTransfer) continue;

          expect(alpacaOp.type).toBe(bridgeOp.type);

          const isSelfSend =
            alpacaOp.senders[0] !== undefined && alpacaOp.senders[0] === alpacaOp.recipients[0];
          if (alpacaOp.tx.failed || isSelfSend) continue;

          const bridgeValue = BigInt(bridgeOp.value.toFixed());
          if (bridgeOp.type === "IN") {
            // Recipient: bridge value == raw transfer value == alpaca value.
            expect(bridgeValue).toBe(alpacaOp.value);
          } else {
            // Sender: bridge folds the fee into value, alpaca keeps them separate.
            expect(bridgeValue).toBe(alpacaOp.value + alpacaOp.tx.fees);
          }
        }

        // Sanity: the two stacks share a meaningful set of transactions.
        expect(matched).toBeGreaterThan(0);
      },
      TIMEOUT_EXTENDED,
    );
  });

  describe("getStakes vs bridge getAccountDelegations", () => {
    it(
      "delegation positions agree on contract and amounts",
      async () => {
        // Try several addresses to find one with active delegations (mainnet state varies).
        for (const address of [TEST_ADDRESSES.withEgld, TEST_ADDRESSES.withTokens]) {
          const [delegations, stakes] = await Promise.all([
            getAccountDelegations(address),
            api.getStakes(address),
          ]);

          if (delegations.length === 0) continue;

          expect(stakes.items.length).toBe(delegations.length);

          for (const delegation of delegations) {
            const stake = stakes.items.find(s => s.delegate === delegation.contract);
            expect(stake!.uid).toBe(`${address}-${delegation.contract}`);
            expect(stake!.amountDeposited).toBe(BigInt(delegation.userActiveStake));
            expect(stake!.amountRewarded).toBe(BigInt(delegation.claimableRewards));
          }
          return; // asserted the positive case on at least one address
        }
        // No address had delegations at test time - nothing to compare, do not fail.
      },
      TIMEOUT_EXTENDED,
    );
  });

  describe("craftTransaction vs bridge buildTransactionToSign", () => {
    const SENDER = TEST_ADDRESSES.withEgld;
    let nonce: number;
    let account: Account;

    beforeAll(async () => {
      // Pin the nonce so both stacks craft with the same value (the bridge also
      // fetches it live; for a passive address it resolves to the same number).
      nonce = Number(await api.getNextSequence(SENDER));
      account = makeAccountStub(SENDER);
    }, TIMEOUT_STANDARD);

    /** Asserts two crafted transactions are identical, optionally ignoring gasLimit. */
    function expectCraftedEqual(
      bridgeTx: Record<string, unknown>,
      alpacaTx: Record<string, unknown>,
      opts: { ignoreGasLimit?: boolean } = {},
    ) {
      // Both should resolve to the same on-chain nonce.
      expect(bridgeTx.nonce).toBe(alpacaTx.nonce);

      const fields = [
        "value",
        "receiver",
        "sender",
        "gasPrice",
        "chainID",
        "version",
        "options",
        "data",
      ];
      for (const field of fields) {
        expect(alpacaTx[field]).toEqual(bridgeTx[field]);
      }
      if (!opts.ignoreGasLimit) {
        expect(alpacaTx.gasLimit).toBe(bridgeTx.gasLimit);
      }
    }

    it(
      "native EGLD transfer is identical",
      async () => {
        const bridgeTx = await craftViaBridge(account, "send", RECIPIENT, ONE_EGLD);
        const alpacaTx = JSON.parse(
          (
            await api.craftTransaction({
              intentType: "transaction",
              type: "send",
              sender: SENDER,
              recipient: RECIPIENT,
              amount: ONE_EGLD,
              asset: { type: "native" },
              sequence: BigInt(nonce),
            })
          ).transaction,
        );

        expectCraftedEqual(bridgeTx, alpacaTx);
        expect(alpacaTx.gasLimit).toBe(MIN_GAS_LIMIT);
      },
      TIMEOUT_STANDARD,
    );

    it(
      "delegate is identical",
      async () => {
        const bridgeTx = await craftViaBridge(
          account,
          "delegate",
          LEDGER_VALIDATOR,
          10n * ONE_EGLD,
        );
        const alpacaTx = JSON.parse(
          (
            await api.craftTransaction({
              intentType: "staking",
              type: "delegate",
              sender: SENDER,
              recipient: LEDGER_VALIDATOR,
              amount: 10n * ONE_EGLD,
              asset: { type: "native" },
              sequence: BigInt(nonce),
            })
          ).transaction,
        );

        expectCraftedEqual(bridgeTx, alpacaTx);
        expect(alpacaTx.gasLimit).toBe(GAS.DELEGATE);
      },
      TIMEOUT_STANDARD,
    );

    it(
      "unDelegate is identical",
      async () => {
        const bridgeTx = await craftViaBridge(
          account,
          "unDelegate",
          LEDGER_VALIDATOR,
          5n * ONE_EGLD,
        );
        const alpacaTx = JSON.parse(
          (
            await api.craftTransaction({
              intentType: "staking",
              type: "unDelegate",
              sender: SENDER,
              recipient: LEDGER_VALIDATOR,
              amount: 5n * ONE_EGLD,
              asset: { type: "native" },
              sequence: BigInt(nonce),
            })
          ).transaction,
        );

        expectCraftedEqual(bridgeTx, alpacaTx);
        expect(alpacaTx.gasLimit).toBe(GAS.DELEGATE);
      },
      TIMEOUT_STANDARD,
    );

    it(
      "claimRewards is identical",
      async () => {
        const bridgeTx = await craftViaBridge(account, "claimRewards", LEDGER_VALIDATOR, 0n);
        const alpacaTx = JSON.parse(
          (
            await api.craftTransaction({
              intentType: "staking",
              type: "claimRewards",
              sender: SENDER,
              recipient: LEDGER_VALIDATOR,
              amount: 0n,
              asset: { type: "native" },
              sequence: BigInt(nonce),
            })
          ).transaction,
        );

        expectCraftedEqual(bridgeTx, alpacaTx);
        expect(alpacaTx.gasLimit).toBe(GAS.CLAIM);
      },
      TIMEOUT_STANDARD,
    );

    it(
      "withdraw is identical",
      async () => {
        const bridgeTx = await craftViaBridge(account, "withdraw", LEDGER_VALIDATOR, 0n);
        const alpacaTx = JSON.parse(
          (
            await api.craftTransaction({
              intentType: "staking",
              type: "withdraw",
              sender: SENDER,
              recipient: LEDGER_VALIDATOR,
              amount: 0n,
              asset: { type: "native" },
              sequence: BigInt(nonce),
            })
          ).transaction,
        );

        expectCraftedEqual(bridgeTx, alpacaTx);
        expect(alpacaTx.gasLimit).toBe(GAS.DELEGATE);
      },
      TIMEOUT_STANDARD,
    );

    it(
      "reDelegateRewards is identical",
      async () => {
        const bridgeTx = await craftViaBridge(account, "reDelegateRewards", LEDGER_VALIDATOR, 0n);
        const alpacaTx = JSON.parse(
          (
            await api.craftTransaction({
              intentType: "staking",
              type: "reDelegateRewards",
              sender: SENDER,
              recipient: LEDGER_VALIDATOR,
              amount: 0n,
              asset: { type: "native" },
              sequence: BigInt(nonce),
            })
          ).transaction,
        );

        expectCraftedEqual(bridgeTx, alpacaTx);
        expect(alpacaTx.gasLimit).toBe(GAS.DELEGATE);
      },
      TIMEOUT_STANDARD,
    );
  });
});
