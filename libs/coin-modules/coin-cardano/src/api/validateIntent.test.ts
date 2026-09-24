import type { StringMemo, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { createApi } from ".";
import { type CardanoCoinConfig, type CardanoConfig } from "../config";
import { infraByCurrency } from "../test/coinConfig";

const config: CardanoConfig = {
  maxFeesWarning: 0,
  maxFeesError: 0,
  infra: infraByCurrency.cardano,
};
const mockCtx: Context<CardanoCoinConfig> = {
  config: async () => ({ ...config, status: { type: "active" } }),
  logger: () => {},
};

describe("validateIntent", () => {
  it("delegates to the validateIntent logic (flags a missing recipient)", async () => {
    const api = createApi("cardano");

    const intent = {
      intentType: "transaction",
      type: "send",
      sender: "addr1_sender",
      recipient: "",
      amount: 1_000_000n,
      asset: { type: "native" },
    } as TransactionIntent<StringMemo>;

    const res = await api.validateIntent(mockCtx, intent, [
      { asset: { type: "native" }, value: 10_000_000n },
    ]);

    expect(res.errors.recipient?.name).toBe("RecipientRequired");
  });
});
