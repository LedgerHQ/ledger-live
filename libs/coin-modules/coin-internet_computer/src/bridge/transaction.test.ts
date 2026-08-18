import { fromTransactionRaw } from "./transaction";
import type { TransactionRaw } from "../types";

describe("fromTransactionRaw", () => {
  const baseRaw = {
    family: "internet_computer",
    recipient: "e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37",
    fees: "10000",
    amount: "1000",
  };

  it("defaults a missing type to 'send' for TransactionRaw persisted before neuron staking", () => {
    // Pre-`type` raw: without the default it would deserialize to `type: undefined` and mis-route.
    const tx = fromTransactionRaw(baseRaw as unknown as TransactionRaw);
    expect(tx.type).toBe("send");
  });

  it("preserves an explicit governance type", () => {
    const tx = fromTransactionRaw({
      ...baseRaw,
      type: "start_dissolving",
    } as unknown as TransactionRaw);
    expect(tx.type).toBe("start_dissolving");
  });
});
