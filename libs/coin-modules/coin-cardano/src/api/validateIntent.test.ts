import { createApi } from ".";
import { type CardanoConfig } from "../config";
import type { StringMemo, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };

describe("validateIntent", () => {
  it("delegates to the validateIntent logic (flags a missing recipient)", async () => {
    const api = createApi(config, "cardano");

    const intent = {
      intentType: "transaction",
      type: "send",
      sender: "addr1_sender",
      recipient: "",
      amount: 1_000_000n,
      asset: { type: "native" },
    } as TransactionIntent<StringMemo>;

    const res = await api.validateIntent(intent, [
      { asset: { type: "native" }, value: 10_000_000n },
    ]);

    expect(res.errors.recipient?.name).toBe("RecipientRequired");
  });
});
