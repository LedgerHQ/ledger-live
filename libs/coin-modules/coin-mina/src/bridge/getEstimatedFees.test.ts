jest.mock("../logic/transaction/getFees");

import BigNumber from "bignumber.js";
import { getFees } from "../logic/transaction/getFees";
import { Transaction } from "../types/common";
import getEstimatedFees from "./getEstimatedFees";

const mockGetFees = getFees as jest.MockedFunction<typeof getFees>;

describe("getEstimatedFees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return fee and accountCreationFee from api", async () => {
    mockGetFees.mockResolvedValue({
      fee: new BigNumber(50000),
      accountCreationFee: new BigNumber(1000000000),
    });

    const txn = {
      family: "mina",
      amount: new BigNumber(1000),
      recipient: "B62qtest",
      fees: { fee: new BigNumber(10), accountCreationFee: new BigNumber(0) },
    } as Transaction;

    const result = await getEstimatedFees(txn, "B62qaddress");

    expect(result).toEqual({
      fee: new BigNumber(50000),
      accountCreationFee: new BigNumber(1000000000),
    });
    expect(mockGetFees).toHaveBeenCalledWith(txn, "B62qaddress");
  });

  it("should return zero accountCreationFee when not present", async () => {
    mockGetFees.mockResolvedValue({
      fee: new BigNumber(50000),
      accountCreationFee: new BigNumber(0),
    });

    const txn = {
      family: "mina",
      amount: new BigNumber(1000),
    } as Transaction;

    const result = await getEstimatedFees(txn, "B62qaddress");

    expect(result.accountCreationFee).toEqual(new BigNumber(0));
  });
});
