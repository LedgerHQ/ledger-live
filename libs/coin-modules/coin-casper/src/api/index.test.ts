import type { Balance, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { CASPER_FEES_MOTES } from "../constants";
import { TEST_ADDRESSES } from "../__tests__/fixtures/addresses.fixture";
import type { CasperMemo } from "../types";
import { createApi } from "./index";

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
  it("returns an object with all CoinModuleApi methods", () => {
    const api = createApi();
    const methods = [
      "lastBlock",
      "getBlockInfo",
      "getBlock",
      "call",
      "getValidators",
      "getBalance",
      "listOperations",
      "getStakes",
      "getRewards",
      "craftTransaction",
      "craftRawTransaction",
      "estimateFees",
      "combine",
      "broadcast",
      "validateIntent",
      "getNextSequence",
      "validateAddress",
      "craftTransactionData",
    ];
    for (const method of methods) {
      expect(typeof api[method as keyof typeof api]).toBe("function");
    }
  });

  describe("validateIntent", () => {
    it("validates a send intent through the api surface", async () => {
      const api = createApi();

      const result = await api.validateIntent({} as never, sendIntent, balances, {
        customFees: { value: FEES },
      });

      expect(result.errors).toEqual({});
      expect(result.warnings).toEqual({});
      expect(result.estimatedFees).toBe(FEES);
      expect(result.amount).toBe(AMOUNT);
      expect(result.totalSpent).toBe(AMOUNT + FEES);
    });
  });
});
