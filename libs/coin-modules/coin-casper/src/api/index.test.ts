import type { Balance, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { requiredApiKeys, withDefaults } from "@ledgerhq/coin-module-framework/api/index";
import { CASPER_FEES_MOTES } from "../constants";
import { TEST_ADDRESSES } from "../__tests__/fixtures/addresses.fixture";
import type { CasperContext, CasperMemo } from "../types";
import { createApi } from "./index";

const context = {} as CasperContext;
const api = createApi();
const validEd25519 = "016470ae57b0a3ad5a679d2e0422909bfb9ded445e20cbe6b4c9806f844c94d401";

const FEES = BigInt(CASPER_FEES_MOTES);
const AMOUNT = 3_000_000_000n;
const BALANCE = 100_000_000_000n;

const sendIntent: TransactionIntent<CasperMemo> = {
  intentType: "transaction",
  type: "send",
  sender: TEST_ADDRESSES.SECP256K1,
  recipient: TEST_ADDRESSES.RECIPIENT_SECP256K1,
  amount: AMOUNT,
  asset: { type: "native" },
  useAllAmount: false,
};

const balances: Balance[] = [{ value: BALANCE, asset: { type: "native" }, locked: 0n }];

describe("createApi", () => {
  it("implements every method the contract requires", () => {
    for (const method of requiredApiKeys) {
      expect(typeof api[method]).toBe("function");
    }
  });

  // The capabilities Casper does not expose are omitted now rather than stubbed one by one,
  // and the resolver's `withDefaults` supplies them — which is also what makes them
  // reportable: a consumer can ask, where a throwing placeholder used to be
  // indistinguishable from an implementation.
  it("omits the capabilities Casper does not expose", () => {
    const resolved = withDefaults(api);
    for (const capability of [
      "getBlock",
      "getBlockInfo",
      "call",
      "register",
      "getValidators",
      "getStakes",
      "getRewards",
      "craftRawTransaction",
    ] as const) {
      expect(resolved.supports(capability)).toBe(false);
    }
  });

  describe("validateIntent", () => {
    it("validates a send intent through the api surface", async () => {
      const result = await api.validateIntent(context, sendIntent, balances, {
        customFees: { value: FEES },
      });

      expect(result.errors).toEqual({});
      expect(result.warnings).toEqual({});
      expect(result.estimatedFees).toBe(FEES);
      expect(result.amount).toBe(AMOUNT);
      expect(result.totalSpent).toBe(AMOUNT + FEES);
    });
  });

  describe("validateAddress", () => {
    // Mixed case opts the address into checksum verification, which this one fails.
    const badChecksum = "016470ae57b0a3ad5a679d2e0422909bfb9ded445e20cbe6b4c9806f844c94D401";

    it("returns true for a valid Casper address", async () => {
      await expect(api.validateAddress(context, validEd25519, {})).resolves.toBe(true);
    });

    it("returns false when the address checksum does not match", async () => {
      await expect(api.validateAddress(context, badChecksum, {})).resolves.toBe(false);
    });

    it("returns false for a malformed address", async () => {
      await expect(api.validateAddress(context, "not-an-address", {})).resolves.toBe(false);
    });
  });

  describe("getNextSequence", () => {
    it("resolves to 0n instead of throwing, as Casper has no account nonce", async () => {
      await expect(api.getNextSequence(context, validEd25519)).resolves.toBe(0n);
    });
  });

  describe("craftTransactionData", () => {
    it("reports no transaction data — Casper carries none, the transfer id travels on the intent memo", () => {
      expect(api.craftTransactionData(context, sendIntent)).toEqual({ type: "none" });
    });
  });
});
