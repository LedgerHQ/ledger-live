import { Transaction, CasperNetwork, KeyAlgorithm, PrivateKey } from "casper-js-sdk";
import type {
  CoinModuleApi,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { withDefaults } from "@ledgerhq/coin-module-framework/api/index";
import { createApi } from "./index";
import { createMockContext } from "../__tests__/fixtures/config.fixture";
import {
  BUSY_MAINNET_PUBLIC_KEY,
  FUNDED_MAINNET_PUBLIC_KEY,
  UNFUNDED_MAINNET_PUBLIC_KEY,
  TEST_ADDRESSES,
} from "../__tests__/fixtures/addresses.fixture";
import {
  CASPER_DEFAULT_TTL,
  CASPER_FEES_MOTES,
  CASPER_NETWORK,
  CASPER_DUMMY_ADDRESS,
} from "../constants";
import { getCasperNodeRpcClient } from "../network/api";
import type { CasperConfig, CasperContext, CasperMemo } from "../types";
import { LANE_KEYS, LANE_LIMIT_TUPLE_INDEX } from "../constants";
import { fetchChainspecToml } from "../network/api";

const context: CasperContext = createMockContext();
const getConfig = async (): Promise<CasperConfig> => context.config();

const nativeTransferIntent: TransactionIntent<MemoNotSupported> = {
  intentType: "transaction",
  type: "send",
  sender: TEST_ADDRESSES.SECP256K1,
  recipient: CASPER_DUMMY_ADDRESS,
  amount: 3_000_000_000n,
  asset: { type: "native" },
};

describe("Casper Api (mainnet)", () => {
  let api: CoinModuleApi<CasperConfig, CasperMemo>;

  beforeAll(() => {
    api = withDefaults(createApi());
  });

  describe("broadcast", () => {
    it("throws on insufficient funds", async () => {
      const sender = PrivateKey.generate(KeyAlgorithm.SECP256K1);
      const senderHex = sender.publicKey.toHex();

      const casperNetwork = await CasperNetwork.create(getCasperNodeRpcClient(await getConfig()));
      const deploy = casperNetwork.createTransferTransaction(
        sender.publicKey,
        sender.publicKey,
        CASPER_NETWORK,
        "1",
        CASPER_FEES_MOTES,
        CASPER_DEFAULT_TTL,
        0,
      );

      // matches TransactionV1.sign()/validate(): the signed message is the transaction hash, not the serialized transaction bytes
      const taggedSignature = Buffer.from(
        sender.signAndAddAlgorithmBytes(new Uint8Array(deploy.hash.toBytes())),
      ).toString("hex");

      const combined = await api.combine(
        context,
        JSON.stringify(deploy.toJSON()),
        [taggedSignature],
        {
          pubkey: senderHex,
        },
      );

      await expect(api.broadcast(context, combined)).rejects.toThrow(
        /Code: -32016, err: Invalid transaction/,
      );
    });
  });

  describe("combine", () => {
    const craftUnsignedTransfer = async (sender: PrivateKey, recipient: PrivateKey) => {
      const casperNetwork = await CasperNetwork.create(getCasperNodeRpcClient(await getConfig()));
      return casperNetwork.createTransferTransaction(
        sender.publicKey,
        recipient.publicKey,
        CASPER_NETWORK,
        "2500000000",
        CASPER_FEES_MOTES,
        CASPER_DEFAULT_TTL,
        0,
      );
    };

    it("attaches a signature to a real network-crafted transaction and produces a payload Transaction.fromJSON verifies", async () => {
      const sender = PrivateKey.generate(KeyAlgorithm.SECP256K1);
      const recipient = PrivateKey.generate(KeyAlgorithm.SECP256K1);

      const unsignedTx = await craftUnsignedTransfer(sender, recipient);
      const unsignedTxJson = JSON.stringify(unsignedTx.toJSON());

      // Matches TransactionV1.sign()/validate(): the signed message is the transaction hash,
      // not the serialized transaction bytes.
      const taggedSignature = Buffer.from(
        sender.signAndAddAlgorithmBytes(new Uint8Array(unsignedTx.hash.toBytes())),
      ).toString("hex");

      const combined = await api.combine(context, unsignedTxJson, [taggedSignature], {
        pubkey: sender.publicKey.toHex(),
      });

      expect(() => Transaction.fromJSON(combined)).not.toThrow();
    });

    it("throws when pubkey is missing", async () => {
      const sender = PrivateKey.generate(KeyAlgorithm.SECP256K1);
      const recipient = PrivateKey.generate(KeyAlgorithm.SECP256K1);

      const unsignedTx = await craftUnsignedTransfer(sender, recipient);
      const unsignedTxJson = JSON.stringify(unsignedTx.toJSON());

      const taggedSignature = Buffer.from(
        sender.signAndAddAlgorithmBytes(new Uint8Array(unsignedTx.hash.toBytes())),
      ).toString("hex");

      expect(() => api.combine(context, unsignedTxJson, [taggedSignature])).toThrow(
        "casper: combine requires the signer public key",
      );
    });
  });

  describe("craftTransaction", () => {
    it("crafts a native transfer with a transfer id that Transaction.fromJSON verifies", async () => {
      const sender = PrivateKey.generate(KeyAlgorithm.SECP256K1);
      const recipient = PrivateKey.generate(KeyAlgorithm.SECP256K1);

      const { transaction } = await api.craftTransaction(context, {
        intentType: "transaction",
        type: "send",
        sender: sender.publicKey.toHex(),
        recipient: recipient.publicKey.toHex(),
        amount: 2_500_000_000n,
        asset: { type: "native" },
        memo: { type: "string", kind: "transferId", value: "123456" },
      });

      expect(() => Transaction.fromJSON(transaction)).not.toThrow();
    });

    it("produces a transaction that combine can sign end to end", async () => {
      const sender = PrivateKey.generate(KeyAlgorithm.SECP256K1);
      const recipient = PrivateKey.generate(KeyAlgorithm.SECP256K1);

      const { transaction } = await api.craftTransaction(context, {
        intentType: "transaction",
        type: "send",
        sender: sender.publicKey.toHex(),
        recipient: recipient.publicKey.toHex(),
        amount: 2_500_000_000n,
        asset: { type: "native" },
      });

      const unsignedTx = Transaction.fromJSON(transaction);
      const taggedSignature = Buffer.from(
        sender.signAndAddAlgorithmBytes(new Uint8Array(unsignedTx.hash.toBytes())),
      ).toString("hex");

      const combined = await api.combine(context, transaction, [taggedSignature], {
        pubkey: sender.publicKey.toHex(),
      });

      expect(() => Transaction.fromJSON(combined)).not.toThrow();
    });
  });

  describe("lastBlock", () => {
    it("returns the latest block with valid height, hash and time", async () => {
      const block = await api.lastBlock(context);

      expect(block.height).toBeGreaterThan(0);
      expect(typeof block.hash).toBe("string");
      expect((block.hash as string).length).toBeGreaterThan(0);

      const oneDayMs = 24 * 60 * 60 * 1000;
      expect(block.time).toBeInstanceOf(Date);
      expect(block.time?.getTime()).toBeGreaterThan(Date.now() - oneDayMs);
      expect(block.time?.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("listOperations", () => {
    it("returns plausible native operations for a funded account", async () => {
      const { items } = await api.listOperations(context, FUNDED_MAINNET_PUBLIC_KEY, {
        minHeight: 0,
      });

      expect(items.length).toBeGreaterThan(0);

      for (const op of items) {
        expect(["OUT", "IN"]).toContain(op.type);
        expect(op.asset).toEqual({ type: "native" });
        expect(op.tx.fees).toBeGreaterThanOrEqual(0n);
        expect(op.senders.length).toBeGreaterThan(0);
        expect(op.recipients.length).toBeGreaterThan(0);
        expect(Number.isNaN(op.tx.date.getTime())).toBe(false);
      }
    });

    it("returns operations newest first with unique ids", async () => {
      const { items } = await api.listOperations(context, FUNDED_MAINNET_PUBLIC_KEY, {
        minHeight: 0,
        order: "desc",
      });

      // By deploy timestamp: the indexer orders on that, and block heights only follow it loosely.
      const dates = items.map(op => op.tx.date.getTime());
      expect([...dates].sort((a, b) => b - a)).toEqual(dates);

      const ids = items.map(op => op.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("honours minHeight", async () => {
      const { items: all } = await api.listOperations(context, FUNDED_MAINNET_PUBLIC_KEY, {
        minHeight: 0,
      });
      const cutoff = all[all.length - 1].tx.block.height + 1;

      const { items } = await api.listOperations(context, FUNDED_MAINNET_PUBLIC_KEY, {
        minHeight: cutoff,
      });

      expect(items.length).toBeLessThan(all.length);
      for (const op of items) {
        expect(op.tx.block.height).toBeGreaterThanOrEqual(cutoff);
      }
    });

    it("returns an empty page for a never-funded account", async () => {
      const result = await api.listOperations(context, UNFUNDED_MAINNET_PUBLIC_KEY, {
        minHeight: 0,
      });

      expect(result.items).toEqual([]);
      expect(result.next).toBeUndefined();
    });

    it("walks every indexer page of a multi-page history", async () => {
      const { items, next } = await api.listOperations(context, BUSY_MAINNET_PUBLIC_KEY, {
        minHeight: 0,
      });

      expect(items.length).toBeGreaterThan(10);
      expect(next).toBeUndefined();
      expect(new Set(items.map(op => op.id)).size).toBe(items.length);
    });

    it.each([
      ["order", { order: "asc" as const }],
      ["cursor", { cursor: "0".repeat(64) }],
      ["limit", { limit: 10 }],
    ])("rejects an unsupported %s", async (_option, override) => {
      await expect(
        api.listOperations(context, FUNDED_MAINNET_PUBLIC_KEY, { minHeight: 0, ...override }),
      ).rejects.toThrow(/not supported/);
    });
  });

  describe("getBalance", () => {
    it("returns the native CSPR balance of a funded account", async () => {
      const balances = await api.getBalance(context, FUNDED_MAINNET_PUBLIC_KEY);

      expect(balances).toEqual([expect.objectContaining({ asset: { type: "native" } })]);
      expect(balances[0].value).toBeGreaterThan(0n);
    });

    it("returns a zero native balance for an account that was never funded", async () => {
      const balances = await api.getBalance(context, UNFUNDED_MAINNET_PUBLIC_KEY);

      expect(balances).toEqual([{ value: 0n, asset: { type: "native" } }]);
    });
  });

  describe("estimateFees", () => {
    it("estimates a native transfer at the live native mint lane limit", async () => {
      // Parsed independently: a hardcoded limit goes stale on the next protocol upgrade, and
      // reusing the implementation's regex would hide a bug in it.
      const toml = await fetchChainspecToml(await getConfig());
      const laneLine = toml
        .split("\n")
        .map(line => line.trim())
        .find(line => line.startsWith(LANE_KEYS.nativeMint));
      if (!laneLine) throw new Error(`live chainspec has no ${LANE_KEYS.nativeMint} entry`);

      const tuple = laneLine.slice(laneLine.indexOf("[") + 1, laneLine.indexOf("]")).split(",");
      const expected = BigInt(tuple[LANE_LIMIT_TUPLE_INDEX].replace(/_/g, "").trim());
      expect(expected).toBeGreaterThan(0n);

      await expect(api.estimateFees(context, nativeTransferIntent)).resolves.toEqual({
        value: expected,
        parameters: { source: "chainspec", lane: "native_mint" },
      });
    });
  });
});
