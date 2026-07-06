import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { KaspaCoinConfig } from "../config";
import { publicKeyToAddress } from "../logic/kaspaAddresses";
import { createApi } from "./index";

const config: KaspaCoinConfig = { status: { type: "active" } };

// A freshly-derived address (see logic/getBalance.integ.test.ts) has no on-chain UTXOs, which
// keeps the craftTransaction assertion below deterministic without a funded fixture.
const PRISTINE_SENDER = publicKeyToAddress(Buffer.alloc(32, 0xcc));
const RECIPIENT = "kaspa:qyp8y7hlk9uj5l9vqsyz78x90yt84cujdytg93s8q8malhpdq6c4hpg9dyesk65";

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

  it("getNextSequence throws (not applicable to a UTXO chain)", async () => {
    await expect(api.getNextSequence(PRISTINE_SENDER)).rejects.toThrow(
      "getNextSequence is not applicable for Kaspa",
    );
  });

  it("validateAddress throws (not supported)", async () => {
    await expect(api.validateAddress(PRISTINE_SENDER, {})).rejects.toThrow(
      "validateAddress is not supported",
    );
  });

  it("getBlock throws (not supported)", async () => {
    await expect(api.getBlock(1)).rejects.toThrow("getBlock is not supported");
  });

  it("getBlockInfo throws (not supported)", async () => {
    await expect(api.getBlockInfo(1)).rejects.toThrow("getBlockInfo is not supported");
  });

  it("getStakes throws (not supported)", async () => {
    await expect(api.getStakes(PRISTINE_SENDER)).rejects.toThrow("getStakes is not supported");
  });

  it("getRewards throws (not supported)", async () => {
    await expect(api.getRewards(PRISTINE_SENDER)).rejects.toThrow("getRewards is not supported");
  });

  it("getValidators throws (not supported)", async () => {
    await expect(api.getValidators()).rejects.toThrow("getValidators is not supported");
  });

  it("craftRawTransaction throws (not supported)", async () => {
    await expect(
      api.craftRawTransaction("raw", PRISTINE_SENDER, "pubkey", 0n),
    ).rejects.toThrow("craftRawTransaction is not supported");
  });

  it("craftTransaction fails clearly for a sender with no spendable UTXOs", async () => {
    await expect(api.craftTransaction(INTENT)).rejects.toThrow("no spendable UTXOs");
  });

  // FIXME: a full craft -> combine round trip needs a funded sender fixture (see
  // craftTransaction.integ.test.ts). No such fixture could be verified from this environment
  // (no network access to the Kaspa endpoint) — enable once one is confirmed.
  describe.skip("craft -> combine round trip with a funded sender", () => {
    it("produces a valid signed Kaspa transaction shape", () => {
      throw new Error("FIXME: supply a verified funded kaspa: sender fixture");
    });
  });
});
