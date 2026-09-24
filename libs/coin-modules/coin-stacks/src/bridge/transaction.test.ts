import { AnchorMode } from "@stacks/transactions";
import transactionSerializer, { fromTransactionRaw } from "./transaction";
import type { TransactionRaw } from "../types";

const { toTransactionRaw } = transactionSerializer;

const baseRaw = (): TransactionRaw => ({
  family: "stacks",
  amount: "1000",
  recipient: "",
  useAllAmount: false,
  network: "mainnet",
  anchorMode: AnchorMode.Any,
});

describe("transaction serialization", () => {
  it("round-trips mode, valAddress and familySpecificData for a staking-shaped transaction", () => {
    const raw: TransactionRaw = {
      ...baseRaw(),
      mode: "delegate",
      valAddress: "SP000000000000000000002Q6VF78.native-pool-signer-manager",
      familySpecificData: { numCycles: 1, startBurnHt: 12345 },
    };

    const transaction = fromTransactionRaw(raw);
    expect(transaction.mode).toBe("delegate");
    expect(transaction.valAddress).toBe("SP000000000000000000002Q6VF78.native-pool-signer-manager");
    expect(transaction.familySpecificData).toEqual({ numCycles: 1, startBurnHt: 12345 });

    expect(toTransactionRaw(transaction)).toEqual(raw);
  });

  it("still round-trips a plain transfer with no mode/valAddress (regression guard)", () => {
    const raw: TransactionRaw = { ...baseRaw(), recipient: "SP1abc" };

    const transaction = fromTransactionRaw(raw);
    expect(transaction.mode).toBeUndefined();
    expect(transaction.valAddress).toBeUndefined();
    expect(transaction.familySpecificData).toBeUndefined();

    expect(toTransactionRaw(transaction)).toEqual(raw);
  });
});
