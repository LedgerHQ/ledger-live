import type {
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import * as nearAPI from "near-api-js";
import { combine } from "../logic/transaction/combine";
import { getActionCosts } from "../network/protocolConfig";
import { createApi } from "./index";

/**
 * Read-path and crafting checks against NEAR mainnet through the Ledger proxy.
 *
 * Nothing here broadcasts: `craftTransaction` and `combine` are exercised against real chain state
 * (a real access-key nonce and block hash) but the signed payload is thrown away, and the signature
 * is a dummy, so it could not be accepted anyway.
 */
const NODE = "https://near.coin.ledger.com/node";
const INDEXER = "https://near-indexer.coin.ledger.com";

const config = () => ({
  status: { type: "active" as const },
  infra: {
    API_NEAR_PRIVATE_NODE: NODE,
    API_NEAR_PUBLIC_NODE: "https://rpc.mainnet.near.org",
    API_NEAR_INDEXER: "https://near.coin.ledger.com/indexer",
    API_NEARBLOCKS_INDEXER: INDEXER,
  },
});

const ACCOUNT_WITH_HISTORY = "nearkat.near";
const DELEGATOR = "81afe80a9d91c82f66122c35ef400da709bde01eada5aae8d7a63bbf68f42040";
const IMPLICIT_RECIPIENT = "4e7de0a21d8a20f970c86b6edf407906d7ba9e205979c3268270eef80a286e2d";
const NAMED_RECIPIENT = "recipient.near";
const DUMMY_SIGNATURE = "ab".repeat(64);
const VALID_STAKE_STATES = ["active", "deactivating", "withdrawable"];

const rpc = async (method: string, params: unknown): Promise<any> => {
  const response = await fetch(NODE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "id", method, params }),
  });

  return response.json();
};

/** Resolved from chain so the test does not go stale when keys rotate. */
const firstFullAccessKey = async (
  accountId: string,
): Promise<{ publicKey: string; nonce: number }> => {
  const { result } = await rpc("query", {
    request_type: "view_access_key_list",
    finality: "final",
    account_id: accountId,
  });

  const key = (result?.keys ?? []).find((k: any) => k.access_key?.permission === "FullAccess");
  if (!key) {
    throw new Error(`no full-access key on ${accountId}`);
  }

  return { publicKey: key.public_key, nonce: key.access_key.nonce };
};

const sendIntent = (overrides: Partial<TransactionIntent> = {}): TransactionIntent =>
  ({
    intentType: "transaction",
    type: "send",
    sender: ACCOUNT_WITH_HISTORY,
    recipient: NAMED_RECIPIENT,
    amount: 1_000_000_000_000_000_000_000n,
    asset: { type: "native" },
    ...overrides,
  }) as TransactionIntent;

describe("CoinModuleApi (integration)", () => {
  const api = createApi(config, "near");

  beforeEach(() => getActionCosts.reset());

  describe("blocks", () => {
    it("reads the latest final block", async () => {
      const block = await api.lastBlock();

      expect(block.height).toBeGreaterThan(100_000_000);
      expect(block.hash).toMatch(/\S/);
      expect(block.time.getTime()).toBeGreaterThan(Date.now() - 10 * 60_000);
      expect(block.time.getTime()).toBeLessThan(Date.now() + 60_000);
    });

    it("reads a past block by height and agrees with the head it came from", async () => {
      const head = await api.lastBlock();

      const same = await api.getBlockInfo(head.height);
      expect(same).toEqual(head);

      const past = await api.getBlockInfo(head.height - 100);
      expect(past.height).toBe(head.height - 100);
      expect(past.hash).not.toBe(head.hash);
      expect(past.time.getTime()).toBeLessThan(head.time.getTime());
    });

    it("rejects a height the chain cannot have", async () => {
      // The node answers with an UNKNOWN_BLOCK error rather than a header.
      await expect(api.getBlockInfo(999_999_999_999)).rejects.toThrow("Server error");
    });
  });

  describe("balances", () => {
    it("reports the native balance first, with the storage deposit locked", async () => {
      const balances = await api.getBalance(ACCOUNT_WITH_HISTORY);

      const [native] = balances;
      expect(native.asset).toEqual({ type: "native" });
      expect(native.stake).toBeUndefined();
      expect(native.value).toBeGreaterThan(0n);
      expect(native.locked ?? 0n).toBeGreaterThan(0n);
      expect(native.value - (native.locked ?? 0n)).toBeGreaterThanOrEqual(0n);
    });

    it("surfaces staking positions of a delegating account as extra balances", async () => {
      const balances = await api.getBalance(DELEGATOR);
      const stakes = balances.filter(balance => balance.stake !== undefined);

      expect(stakes.length).toBeGreaterThan(0);
      stakes.forEach(balance => {
        expect(balance.value).toBe(balance.stake!.amount);
        expect(VALID_STAKE_STATES).toContain(balance.stake!.state);
        expect(balance.stake!.delegate).toMatch(/\S/);
      });
    });

    it("reports zero for an account that does not exist on chain", async () => {
      // The node answers UNKNOWN_ACCOUNT with a 200 and no result, which must not turn into a
      // phantom balance made of the storage reserve.
      const balances = await api.getBalance("this-account-does-not-exist-421337.near");

      expect(balances).toHaveLength(1);
      expect(balances[0].value).toBe(0n);
      expect(balances[0].locked).toBe(0n);
    });

    it("rejects balance options it does not implement", async () => {
      await expect(
        api.getBalance(ACCOUNT_WITH_HISTORY, { includeAssets: async () => true }),
      ).rejects.toThrow("getBalance does not support the options parameter");
    });
  });

  describe("operations", () => {
    it("maps a real history without inflating outgoing values by the fee", async () => {
      const limit = 25;
      const page = await api.listOperations(ACCOUNT_WITH_HISTORY, { minHeight: 0, limit });

      expect(page.items.length).toBeGreaterThan(0);

      // Ground truth straight from the indexer, fetched at the same page size: an operation value
      // must be the deposit alone. The bridge adds the fee on top for outgoing transfers, and the
      // generic framework adds it again, so a fee folded in here would be charged twice.
      const raw = await (
        await fetch(`${INDEXER}/v3/accounts/${ACCOUNT_WITH_HISTORY}/txns?limit=${limit}`)
      ).json();
      const deposits = new Map<string, { deposit: string; fee: string }>(
        (raw.data ?? []).map((tx: any) => [
          tx.transaction_hash,
          { deposit: tx.actions_agg?.deposit ?? "0", fee: tx.outcomes_agg?.transaction_fee ?? "0" },
        ]),
      );

      page.items.forEach(operation => {
        expect(operation.tx.hash).toMatch(/\S/);
        expect(operation.value).toBeGreaterThanOrEqual(0n);
        expect(operation.tx.fees).toBeGreaterThanOrEqual(0n);
        expect(operation.tx.block.height).toBeGreaterThan(0);
        expect(operation.tx.date.getTime()).toBeGreaterThan(new Date("2020-01-01").getTime());
        expect(operation.asset).toEqual({ type: "native" });
      });

      // Both requests hit a moving history, so compare only the overlap, and require one.
      const compared = page.items.filter(operation => deposits.has(operation.tx.hash));
      expect(compared.length).toBeGreaterThan(0);

      compared.forEach(operation => {
        const { deposit, fee } = deposits.get(operation.tx.hash)!;
        expect(operation.value).toBe(BigInt(deposit));
        expect(operation.tx.fees).toBe(BigInt(fee));
      });

      // Explicitly: no outgoing operation carries deposit + fee as its value.
      const feeInflated = compared.filter(operation => {
        const { deposit, fee } = deposits.get(operation.tx.hash)!;
        return (
          operation.type === "OUT" &&
          fee !== "0" &&
          operation.value === BigInt(deposit) + BigInt(fee)
        );
      });
      expect(feeInflated).toEqual([]);
    }, 120_000);

    it("pages forward with the indexer cursor without repeating operations", async () => {
      const first = await api.listOperations(ACCOUNT_WITH_HISTORY, { minHeight: 0, limit: 10 });

      expect(first.items).toHaveLength(10);
      expect(first.next).toMatch(/\S/);

      const second = await api.listOperations(ACCOUNT_WITH_HISTORY, {
        minHeight: 0,
        limit: 10,
        cursor: first.next,
      });

      const firstIds = new Set(first.items.map(operation => operation.id));
      second.items.forEach(operation => expect(firstIds.has(operation.id)).toBe(false));
    }, 120_000);

    it("filters out everything below minHeight", async () => {
      const head = await api.lastBlock();

      const page = await api.listOperations(ACCOUNT_WITH_HISTORY, { minHeight: head.height });

      expect(page.items).toEqual([]);
      expect(page.next).toBeUndefined();
    }, 120_000);

    it("refuses ascending order", async () => {
      await expect(
        api.listOperations(ACCOUNT_WITH_HISTORY, { minHeight: 0, order: "asc" }),
      ).rejects.toThrow("ascending order is not supported");
    });
  });

  describe("fees", () => {
    it("prices a transfer from the live gas price and protocol config", async () => {
      const { value, parameters } = await api.estimateFees(sendIntent());

      expect(value).toBeGreaterThan(0n);
      expect(String(parameters?.gasPrice)).toMatch(/^\d+$/);
    });

    it("charges more for an implicit recipient it has to create", async () => {
      const named = await api.estimateFees(sendIntent());
      const implicit = await api.estimateFees(sendIntent({ recipient: IMPLICIT_RECIPIENT }));

      expect(implicit.value).toBeGreaterThan(named.value);
    });

    it("prices a delegation differently from a transfer", async () => {
      const staking = await api.estimateFees({
        ...sendIntent(),
        intentType: "staking",
        type: "delegate",
        mode: "delegate",
        valAddress: "astro-stakers.poolv1.near",
      } as StakingTransactionIntent);

      expect(staking.value).toBeGreaterThan(0n);
      expect(staking.value).not.toBe((await api.estimateFees(sendIntent())).value);
    });
  });

  describe("crafting", () => {
    it("crafts a transfer on top of the account's live access key and block", async () => {
      const { publicKey, nonce } = await firstFullAccessKey(ACCOUNT_WITH_HISTORY);

      const { transaction } = await api.craftTransaction(
        sendIntent({ senderPublicKey: publicKey }),
      );

      const decoded = nearAPI.transactions.Transaction.decode(Buffer.from(transaction, "base64"));
      expect(decoded.signerId).toBe(ACCOUNT_WITH_HISTORY);
      expect(decoded.receiverId).toBe(NAMED_RECIPIENT);
      expect(Number(decoded.nonce.toString())).toBeGreaterThan(nonce);
      expect(decoded.blockHash.length).toBe(32);
    });

    it("crafts a delegation addressed to the staking pool", async () => {
      const { publicKey } = await firstFullAccessKey(DELEGATOR);
      const pool = "astro-stakers.poolv1.near";

      const { transaction, details } = await api.craftTransaction({
        ...sendIntent({ sender: DELEGATOR, senderPublicKey: publicKey }),
        intentType: "staking",
        type: "delegate",
        mode: "delegate",
        valAddress: pool,
      } as StakingTransactionIntent);

      const decoded = nearAPI.transactions.Transaction.decode(Buffer.from(transaction, "base64"));
      expect(decoded.receiverId).toBe(pool);
      expect(details).toMatchObject({ mode: "stake", receiverId: pool });
    });

    it("combines a live-crafted transaction into a signed payload", async () => {
      const { publicKey } = await firstFullAccessKey(ACCOUNT_WITH_HISTORY);
      const { transaction } = await api.craftTransaction(
        sendIntent({ senderPublicKey: publicKey }),
      );

      // Signed with a dummy signature and deliberately never broadcast.
      const signed = combine(transaction, DUMMY_SIGNATURE);
      const decoded = nearAPI.transactions.SignedTransaction.decode(Buffer.from(signed, "base64"));

      expect(decoded.transaction.signerId).toBe(ACCOUNT_WITH_HISTORY);
      expect(Buffer.from(decoded.signature.data).toString("hex")).toBe(DUMMY_SIGNATURE);
    });

    it("fails clearly when the public key has no access key on the account", async () => {
      const { publicKey } = await firstFullAccessKey(DELEGATOR);

      await expect(
        api.craftTransaction(sendIntent({ senderPublicKey: publicKey })),
      ).rejects.toThrow(`no access key found for ${ACCOUNT_WITH_HISTORY}`);
    });
  });

  describe("validation", () => {
    it("accepts a funded transfer against live balances", async () => {
      const balances = await api.getBalance(ACCOUNT_WITH_HISTORY);
      const fees = await api.estimateFees(sendIntent());

      const result = await api.validateIntent(sendIntent(), balances, fees);

      expect(result.estimatedFees).toBe(fees.value);
      expect(result.amount).toBe(1_000_000_000_000_000_000_000n);
      expect(result.totalSpent).toBe(result.amount + fees.value);
    });

    it("rejects a transfer to a named account that does not exist", async () => {
      const balances = await api.getBalance(ACCOUNT_WITH_HISTORY);

      const result = await api.validateIntent(
        sendIntent({ recipient: "this-account-does-not-exist-421337.near" }),
        balances,
        { value: 0n },
      );

      expect(result.errors.recipient?.name).toBe("NearNewNamedAccountError");
    });

    it("validates address formats", async () => {
      await expect(api.validateAddress(ACCOUNT_WITH_HISTORY, {})).resolves.toBe(true);
      await expect(api.validateAddress("NOT VALID", {})).resolves.toBe(false);
    });
  });

  describe("staking", () => {
    it("reads the positions of a delegating account", async () => {
      const page = await api.getStakes(DELEGATOR);

      expect(page.items.length).toBeGreaterThan(0);
      page.items.forEach(stake => {
        expect(stake.address).toBe(DELEGATOR);
        expect(stake.delegate).toMatch(/\S/);
        expect(VALID_STAKE_STATES).toContain(stake.state);
        expect(stake.amount).toBeGreaterThan(0n);
        expect(stake.uid).toContain(DELEGATOR);
      });
    }, 120_000);

    it("reads the validator set", async () => {
      const page = await api.getValidators();

      expect(page.items).toHaveLength(200);
      expect(new Set(page.items.map(validator => validator.address)).size).toBe(200);
      page.items.forEach(validator => {
        expect(validator.address).toMatch(/\S/);
        expect(validator.balance).toBeGreaterThanOrEqual(0n);
        expect(Number(validator.commissionRate)).toBeGreaterThanOrEqual(0);
        expect(Number(validator.commissionRate)).toBeLessThanOrEqual(100);
      });
    }, 120_000);
  });
});
