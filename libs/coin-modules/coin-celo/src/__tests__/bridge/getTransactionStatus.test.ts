import { accountFixture, transactionFixture } from "../../bridge/getFixtures";
import getTransactionStatus from "../../bridge/getTransactionStatus";
import BigNumber from "bignumber.js";

jest.mock("../../network/sdk", () => {
  return {
    celoKit: jest.fn(() => ({
      contracts: {
        getLockedGold: jest.fn(async () => ({
          address: "address",
          lock: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => ({ data: "lock_data" })),
              estimateGas: jest.fn(async () => 2),
            },
          })),
          unlock: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => ({ data: "unlock_data" })),
              estimateGas: jest.fn(async () => 3),
            },
          })),
          withdraw: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => ({ data: "withdraw_data" })),
              estimateGas: jest.fn(async () => 3),
            },
          })),
          vote: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => ({ data: "vote_data" })),
              estimateGas: jest.fn(async () => 3),
            },
          })),
          getAccountNonvotingLockedGold: jest.fn(() => BigNumber(0)),
        })),
      },
    })),
  };
});

describe("getTransactionStatus", () => {
  it("should return an InvalidAddressBecauseDestinationIsAlsoSource error in case the recipient is also the sender", async () => {
    const transactionStatus = await getTransactionStatus(accountFixture, {
      ...transactionFixture,
      recipient: accountFixture.freshAddress,
    });

    expect(transactionStatus.errors["recipient"].name).toEqual(
      "InvalidAddressBecauseDestinationIsAlsoSource",
    );
    expect(transactionStatus.errors["fees"].name).toEqual("FeeNotLoaded");
    expect(transactionStatus.errors["amount"].name).toEqual("NotEnoughBalance");
    expect(Object.keys(transactionStatus.warnings).length).toEqual(0);
  });

  it("should return an FeeNotLoaded error in case the transaction is missing fees", async () => {
    const transactionStatus = await getTransactionStatus(
      { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      {
        ...transactionFixture,
        fees: BigNumber(2),
      },
    );

    expect(transactionStatus.errors["recipient"].name).toEqual("InvalidAddress");
    expect(transactionStatus.errors).not.toHaveProperty("fees");
    expect(transactionStatus.errors).not.toHaveProperty("amount");
    expect(Object.keys(transactionStatus.warnings).length).toEqual(0);
  });
});
