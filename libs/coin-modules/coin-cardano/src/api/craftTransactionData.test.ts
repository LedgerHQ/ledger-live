import type { StringMemo, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { createApi } from ".";
import type { CardanoCoinConfig } from "../config";
import { cardanoCoinConfig } from "../fixtures/config";

const config = cardanoCoinConfig;
const mockCtx: Context<CardanoCoinConfig> = {
  config: async () => config,
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
