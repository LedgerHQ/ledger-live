import { withDefaults } from "@ledgerhq/coin-module-framework/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { KaspaCoinConfig } from "../config";
import { publicKeyToAddress } from "../logic/kaspaAddresses";
import { createApi } from "./index";
import { createMockKaspaContext } from "../test/context";

// A freshly-derived address (see logic/getBalance.integ.test.ts) has no on-chain UTXOs, which
// keeps the craftTransaction assertion below deterministic without a funded fixture.
const PRISTINE_SENDER = publicKeyToAddress(Buffer.alloc(32, 0xcc));
const RECIPIENT = "kaspa:qyp8y7hlk9uj5l9vqsyz78x90yt84cujdytg93s8q8malhpdq6c4hpg9dyesk65";
// Dedicated, independently-funded Kaspa account (see logic/getBalance.integ.test.ts) — funded
// once and never spent, so it keeps spendable UTXOs for the craft → combine round trip below.
const FUNDED_SENDER = "kaspa:qz24c4tse54c2f9v02ap2l3957uw5kq3rdg960gvw50wtvvy0nxax5jt8zckp";

const INTENT = {
  intentType: "transaction" as const,
  type: "send",
  sender: PRISTINE_SENDER,
  recipient: RECIPIENT,
  amount: 10_000_000n,
  asset: { type: "native" as const },
};

describe("createApi (integration)", () => {
  let api: CoinModuleApi<KaspaCoinConfig>;
  const context = createMockKaspaContext();

  beforeAll(() => {
    // Through withDefaults, as the consumer resolver does: the module omits the capabilities Kaspa
    // has none of, and the wrapper backfills them.
    api = withDefaults(createApi());
  });

  // These methods throw synchronously (they never return a promise), so they are asserted with a
  // synchronous `expect(() => …).toThrow`, not `.rejects` (mirrors coin-filecoin's api integ test).
  it("getNextSequence throws (not applicable to a UTXO chain)", () => {
    expect(() => api.getNextSequence(context, PRISTINE_SENDER)).toThrow(
      "getNextSequence is not supported",
    );
  });

  it("validateAddress throws (not supported)", () => {
    expect(() => api.validateAddress(context, PRISTINE_SENDER, {})).toThrow(
      "validateAddress is not supported",
    );
  });

  describe("block methods (real network)", () => {
    // A known, already-confirmed block. Seeding from lastBlock() flakes: the virtual-chain tip is
    // not yet indexed by /blocks-from-bluescore (tip lag), so it can return no block at that score.
    const MINTED_BLOCK = 480818084;

    it("getBlockInfo fetches the block at a known blue score", async () => {
      const info = await api.getBlockInfo(context, MINTED_BLOCK);

      expect(info.height).toBe(MINTED_BLOCK);
      expect(info.hash).toHaveLength(64); // Kaspa block hash = 64 hex chars
      expect(info.time).toBeInstanceOf(Date);
      expect(info.time.getTime()).toBeGreaterThan(0);
    });

    it("getBlock fetches the full block (metadata + transactions) at a known blue score", async () => {
      const block = await api.getBlock(context, MINTED_BLOCK);

      expect(block.info.height).toBe(MINTED_BLOCK);
      expect(block.info.hash).toHaveLength(64);
      expect(block.transactions.length).toBeGreaterThan(0); // at least the coinbase
    });
  });

  // Smoke tests through the createApi() surface — deep coverage lives in the logic/*.integ.test.ts;
  // these verify the factory exposes and delegates each method correctly. Depend on FUNDED_SENDER
  // (funded, never spent), same fixture as the craft → combine round trip below.
  describe("account & fee methods (real network)", () => {
    it("getBalance returns the native KAS balance for a funded account", async () => {
      const balances = await api.getBalance(context, FUNDED_SENDER);

      expect(balances).toHaveLength(1);
      expect(balances[0].value).toBeGreaterThan(0n);
      expect(balances[0].asset).toEqual({ type: "native", name: "KAS" });
    });

    it("lastBlock returns the latest confirmed block", async () => {
      const info = await api.lastBlock(context);

      expect(info.height).toBeGreaterThan(0);
      expect(typeof info.hash).toBe("string");
      expect(info.time).toBeInstanceOf(Date);
    });

    it("estimateFees returns a positive mass-based fee for a valid send", async () => {
      const fees = await api.estimateFees(context, {
        intentType: "transaction",
        type: "send",
        sender: FUNDED_SENDER,
        recipient: RECIPIENT,
        amount: 100_000_000n,
        asset: { type: "native" },
      });

      expect(fees.value).toBeGreaterThan(0n);
    });

    it("listOperations returns the funded account's operation history", async () => {
      const page = await api.listOperations(context, FUNDED_SENDER, { minHeight: 0 });

      expect(Array.isArray(page.items)).toBe(true);
      expect(page.items.length).toBeGreaterThan(0);
      for (const op of page.items) {
        expect(["IN", "OUT"]).toContain(op.type);
        expect(typeof op.value).toBe("bigint");
      }
    });
  });

  it("getStakes throws (not supported)", () => {
    expect(() => api.getStakes(context, PRISTINE_SENDER)).toThrow("getStakes is not supported");
  });

  it("getRewards throws (not supported)", () => {
    expect(() => api.getRewards(context, PRISTINE_SENDER)).toThrow("getRewards is not supported");
  });

  it("getValidators throws (not supported)", () => {
    expect(() => api.getValidators(context)).toThrow("getValidators is not supported");
  });

  it("craftRawTransaction throws (not supported)", () => {
    expect(() => api.craftRawTransaction(context, "raw", PRISTINE_SENDER, "pubkey", 0n)).toThrow(
      "craftRawTransaction is not supported",
    );
  });

  it("craftTransaction fails clearly for a sender with no spendable UTXOs", async () => {
    await expect(api.craftTransaction(context, INTENT)).rejects.toThrow("no spendable UTXOs");
  });

  describe("craft -> combine round trip with a funded sender", () => {
    // Craft is real (selects the fixture's UTXOs); the signature is mocked. Kaspa needs one
    // signature per input, but the generic-adapter framework's `combine(tx, signatures)` only
    // supports a single-string return value from the signer — so all per-input signatures are
    // packed into one JSON-encoded string (see combine.ts). A mock hex signature per input,
    // packed the same way, verifies the craft → combine plumbing and signed-tx shape WITHOUT a
    // private key (mirrors coin-filecoin's api/index.integ.test.ts mock-signature round trip).
    // A cryptographically valid signature + broadcast acceptance is out of scope for CI.
    it("produces a valid signed Kaspa transaction shape", async () => {
      const crafted = await api.craftTransaction(context, {
        intentType: "transaction",
        type: "send",
        sender: FUNDED_SENDER,
        recipient: RECIPIENT,
        amount: 100_000_000n, // 1 KAS
        asset: { type: "native" },
      });

      const unsigned = JSON.parse(crafted.transaction);
      const perInputSignatures: string[] = unsigned.inputs.map(() => "b".repeat(128));
      const mockSignatures = [JSON.stringify(perInputSignatures)];
      const signed = await api.combine(context, crafted.transaction, mockSignatures);

      const parsed = JSON.parse(signed);
      expect(parsed.transaction.inputs).toHaveLength(unsigned.inputs.length);
      expect(parsed.transaction.inputs[0].signatureScript).toContain("b".repeat(128));
      expect(parsed.transaction.outputs.length).toBeGreaterThanOrEqual(1);
    });
  });
});
