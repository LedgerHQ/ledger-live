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

  it("should fetch nonce from rosetta when transaction is valid", async () => {
    mockFetchTransactionMetadata.mockResolvedValue({
      metadata: { nonce: "99" },
      suggested_fee: [{ value: "50000000" }],
    });

    const txn = {
      recipient: validAddress,
      nonce: 42,
      amount: new BigNumber(1000),
      fees: { fee: new BigNumber(10) },
    } as Transaction;

    const result = await getNonce(txn, "B62qtest");

    expect(result).toBe(99);
  });
});
