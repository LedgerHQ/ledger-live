jest.mock("../../api");

import BigNumber from "bignumber.js";
import { fetchTransactionMetadata } from "../../api";
import { Transaction } from "../../types/common";
import { getFees } from "./getFees";

const mockFetchTransactionMetadata = fetchTransactionMetadata as jest.MockedFunction<
  typeof fetchTransactionMetadata
>;

describe("getFees", () => {
  const validAddress = "B62qrPN5Y5yq8kGE3FbVKbGTdTAJNdtNtB5sNVpxyRwWGcDEhpMzc8g";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return default fees when recipient is missing", async () => {
    const txn = {
      amount: new BigNumber(1000),
      recipient: "",
      fees: { fee: new BigNumber(10), accountCreationFee: new BigNumber(0) },
    } as Transaction;

    const result = await getFees(txn, "B62qtest");

    expect(result).toEqual({
      fee: new BigNumber(10),
      accountCreationFee: new BigNumber(0),
    });
    expect(mockFetchTransactionMetadata).not.toHaveBeenCalled();
  });

  it("should return default fees when amount is missing", async () => {
    const txn = {
      recipient: validAddress,
      fees: { fee: new BigNumber(10), accountCreationFee: new BigNumber(0) },
    } as Transaction;

    const result = await getFees(txn, "B62qtest");

    expect(result).toEqual({
      fee: new BigNumber(10),
      accountCreationFee: new BigNumber(0),
    });
  });

  it("should fetch fees from rosetta when transaction is valid", async () => {
    mockFetchTransactionMetadata.mockResolvedValue({
      metadata: { account_creation_fee: "1000000000" },
      suggested_fee: [{ value: "50000000" }],
    } as any);

    const txn = {
      amount: new BigNumber(1000),
      recipient: validAddress,
      fees: { fee: new BigNumber(10), accountCreationFee: new BigNumber(0) },
    } as Transaction;

    const result = await getFees(txn, "B62qtest");

    expect(result.fee).toEqual(new BigNumber("50000000"));
    expect(result.accountCreationFee).toEqual(new BigNumber("1000000000"));
  });

  it("should return zero accountCreationFee when not present in response", async () => {
    mockFetchTransactionMetadata.mockResolvedValue({
      metadata: {},
      suggested_fee: [{ value: "50000000" }],
    } as any);

    const txn = {
      amount: new BigNumber(1000),
      recipient: validAddress,
      fees: { fee: new BigNumber(10), accountCreationFee: new BigNumber(0) },
    } as Transaction;

    const result = await getFees(txn, "B62qtest");

    expect(result.accountCreationFee).toEqual(new BigNumber(0));
  });
});
