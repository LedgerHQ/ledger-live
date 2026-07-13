import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { KaspaCoinConfig } from "../config";
import { publicKeyToAddress } from "../logic/kaspaAddresses";
import { createApi } from "./index";

const config: KaspaCoinConfig = { status: { type: "active" } };

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
  let api: CoinModuleApi;

  beforeAll(() => {
    api = createApi(config, "kaspa");
  });

  // These methods throw synchronously (they never return a promise), so they are asserted with a
  // synchronous `expect(() => …).toThrow`, not `.rejects` (mirrors coin-filecoin's api integ test).
  it("getNextSequence throws (not applicable to a UTXO chain)", () => {
    expect(() => api.getNextSequence(PRISTINE_SENDER)).toThrow(
      "getNextSequence is not applicable for Kaspa",
    );
  });

  it("validateAddress throws (not supported)", () => {
    expect(() => api.validateAddress(PRISTINE_SENDER, {})).toThrow(
      "validateAddress is not supported",
    );
  });

  it("getBlock throws (not supported)", () => {
    expect(() => api.getBlock(1)).toThrow("getBlock is not supported");
  });

  describe("getBlockInfo (real network)", () => {
    it("fetches the block at the latest virtual-chain blue score", async () => {
      // lastBlock().height is a real, current virtual-chain blue score -> guaranteed to exist,
      // and cross-checks getBlockInfo against lastBlock for free. No hardcoded magic number.
      const latest = await api.lastBlock();
      console.log("[getBlockInfo] seed blueScore:", latest.height);

      const info = await api.getBlockInfo(latest.height);
      console.log("[getBlockInfo] result:", JSON.stringify(info, null, 2));

      expect(info.height).toBe(latest.height);
      expect(typeof info.hash).toBe("string");
      expect(info.hash).toHaveLength(64); // Kaspa block hash = 64 hex chars
      expect(info.time).toBeInstanceOf(Date);
      expect(info.time.getTime()).toBeGreaterThan(0); // proves timestamp parsing worked
    });
  });

  it("getStakes throws (not supported)", () => {
    expect(() => api.getStakes(PRISTINE_SENDER)).toThrow("getStakes is not supported");
  });

  it("getRewards throws (not supported)", () => {
    expect(() => api.getRewards(PRISTINE_SENDER)).toThrow("getRewards is not supported");
  });

  it("getValidators throws (not supported)", () => {
    expect(() => api.getValidators()).toThrow("getValidators is not supported");
  });

  it("craftRawTransaction throws (not supported)", () => {
    expect(() => api.craftRawTransaction("raw", PRISTINE_SENDER, "pubkey", 0n)).toThrow(
      "craftRawTransaction is not supported",
    );
  });

  it("craftTransaction fails clearly for a sender with no spendable UTXOs", async () => {
    await expect(api.craftTransaction(INTENT)).rejects.toThrow("no spendable UTXOs");
  });

  describe("craft -> combine round trip with a funded sender", () => {
    // Craft is real (selects the fixture's UTXOs); the signature is mocked. Kaspa needs one
    // signature per input and `combine` only attaches the provided strings, so a mock hex
    // signature per input verifies the craft → combine plumbing and signed-tx shape WITHOUT a
    // private key (mirrors coin-filecoin's api/index.integ.test.ts mock-signature round trip).
    // A cryptographically valid signature + broadcast acceptance is out of scope for CI.
    it("produces a valid signed Kaspa transaction shape", async () => {
      const crafted = await api.craftTransaction({
        intentType: "transaction",
        type: "send",
        sender: FUNDED_SENDER,
        recipient: RECIPIENT,
        amount: 100_000_000n, // 1 KAS
        asset: { type: "native" },
      });

      const unsigned = JSON.parse(crafted.transaction);
      const mockSignatures = JSON.stringify(unsigned.inputs.map(() => "b".repeat(128)));
      const signed = await api.combine(crafted.transaction, mockSignatures);

      const parsed = JSON.parse(signed);
      expect(parsed.transaction.inputs).toHaveLength(unsigned.inputs.length);
      expect(parsed.transaction.inputs[0].signatureScript).toContain("b".repeat(128));
      expect(parsed.transaction.outputs.length).toBeGreaterThanOrEqual(1);
    });
  });
});
