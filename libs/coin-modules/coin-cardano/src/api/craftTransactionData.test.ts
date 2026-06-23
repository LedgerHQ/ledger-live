import { createApi } from ".";
import { type CardanoConfig } from "../config";
import type { StringMemo, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };

describe("craftTransactionData", () => {
  it("reports no transaction data — Cardano carries none", () => {
    const api = createApi(config, "cardano");

    expect(api.craftTransactionData({} as TransactionIntent<StringMemo>)).toEqual({ type: "none" });
  });
});
