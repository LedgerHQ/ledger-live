jest.mock("../../api");

import { DeepPartial, DeepPartialReturn } from "@ledgerhq/coin-framework/test/utils";
import BigNumber from "bignumber.js";
import { fetchTransactionMetadata } from "../../api";
import { Transaction } from "../../types/common";
import { getNonce } from "./getNonce";

const mockFetchTransactionMetadata = fetchTransactionMetadata as jest.MockedFunction<
  DeepPartialReturn<typeof fetchTransactionMetadata>
>;

describe("getNonce", () => {
  const validAddress = "B62qrPN5Y5yq8kGE3FbVKbGTdTAJNdtNtB5sNVpxyRwWGcDEhpMzc8g";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return transaction nonce when recipient is invalid", async () => {
    const txn = {
      recipient: "invalid",
      nonce: 42,
      amount: new BigNumber(1000),
      fees: { fee: new BigNumber(10) },
    } as Transaction;

    const result = await getNonce(txn, "B62qtest");

    expect(result).toBe(42);
  });

  it("should return transaction nonce when amount is missing", async () => {
    const txn = {
      recipient: validAddress,
      nonce: 42,
      fees: { fee: new BigNumber(10) },
    } as Transaction;

    const result = await getNonce(txn, "B62qtest");

    expect(result).toBe(42);
  });

  it("should return transaction nonce when fees is missing", async () => {
    const txn: DeepPartial<Transaction> = {
      recipient: validAddress,
      nonce: 42,
      amount: new BigNumber(1000),
    };

    const result = await getNonce(txn as Transaction, "B62qtest");

    expect(result).toBe(42);
  });

  it("should fetch nonce from rosetta with transfer txKind for a payment transaction", async () => {
    mockFetchTransactionMetadata.mockResolvedValue({
      metadata: { nonce: "99" },
      suggested_fee: [{ value: "50000000" }],
    });

    const txn = {
      recipient: validAddress,
      nonce: 42,
      amount: new BigNumber(1000),
      fees: { fee: new BigNumber(10) },
      txType: "send",
    } as Transaction;

    const result = await getNonce(txn, "B62qtest");

    expect(result).toBe(99);
    expect(mockFetchTransactionMetadata).toHaveBeenCalledWith(
      "B62qtest",
      validAddress,
      10,
      1000,
      "transfer",
    );
  });

  it.each(["send", "stake", "unstake"] as const)(
    "should fetch nonce from rosetta with delegation txKind for %s transaction",
    async (txType: "send" | "stake" | "unstake") => {
      mockFetchTransactionMetadata.mockResolvedValue({
        metadata: { nonce: "99" },
        suggested_fee: [{ value: "50000000" }],
      });

      const txn = {
        recipient: validAddress,
        nonce: 42,
        amount: new BigNumber(1000),
        fees: { fee: new BigNumber(10) },
        txType,
      } as Transaction;

      const result = await getNonce(txn, "B62qtest");

      expect(result).toBe(99);
      expect(mockFetchTransactionMetadata).toHaveBeenCalledWith(
        "B62qtest",
        validAddress,
        10,
        1000,
        txType === "send" ? "transfer" : "delegation",
      );
    },
  );
});
