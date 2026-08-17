import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "../craftTransactionData";

describe("craftTransactionData", () => {
  it("returns a minimal stacks-pox TxData regardless of intent", () => {
    const intent = { intentType: "transaction" } as TransactionIntent;
    expect(craftTransactionData(intent)).toEqual({ type: "stacks-pox" });
  });
});
