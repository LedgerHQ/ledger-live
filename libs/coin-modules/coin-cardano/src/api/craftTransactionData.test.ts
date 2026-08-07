import type { StringMemo, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { createApi } from ".";
import { type CardanoCoinConfig, type CardanoConfig } from "../config";

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };
const mockCtx: Context<CardanoCoinConfig> = {
  config: async () => ({ ...config, status: { type: "active" } }),
  logger: () => {},
};

describe("craftTransactionData", () => {
  it("reports no transaction data — Cardano carries none", () => {
    const api = createApi("cardano");

    expect(api.craftTransactionData(mockCtx, {} as TransactionIntent<StringMemo>)).toEqual({
      type: "none",
    });
  });
});
