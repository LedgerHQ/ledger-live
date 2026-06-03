import { createApi } from ".";
import { type CardanoConfig } from "../config";
import type { StringMemo, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };

describe("craftTransaction", () => {
  it("throws an unsupported error", () => {
    const api = createApi(config, "cardano");

    expect(() => api.craftTransaction({} as TransactionIntent<StringMemo>)).toThrow(
      "craftTransaction is not supported",
    );
  });
});
