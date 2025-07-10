import BigNumber from "bignumber.js";
import { accountFixture, transactionFixture } from "../../bridge/getFixtures";
import prepareTransaction from "../../bridge/prepareTransaction";

const chainIdMock = jest.fn();
const nonceMock = jest.fn();

jest.mock("../../network/sdk", () => {
  return {
    celoKit: jest.fn(() => ({
      contracts: {
        getLockedGold: jest.fn(async () => ({
          address: "address",
          lock: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => ["lock_data"]),
              estimateGas: jest.fn(async () => 2),
            },
          })),
          unlock: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => ["unlock_data"]),
              estimateGas: jest.fn(async () => 3),
            },
          })),
          withdraw: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => ["withdraw_data"]),
              estimateGas: jest.fn(async () => 3),
            },
          })),
          vote: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => ["vote_data"]),
              estimateGas: jest.fn(async () => 3),
            },
          })),
          getAccountNonvotingLockedGold: jest.fn(() => BigNumber(0)),
        })),
        getGoldToken: jest.fn(async () => ({
          address: "gold_token_address",
          transfer: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => ["send_data"]),
            },
          })),
        })),
        getStableToken: jest.fn(async () => ({
          address: "stable_token_address",
          transfer: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => ["send_stable_token_data"]),
            },
          })),
        })),
        getErc20: jest.fn(async () => ({
          address: "erc20_token_address",
          transfer: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => ["send_erc20_token_data"]),
            },
          })),
        })),
      },
      connection: {
        chainId: chainIdMock,
        nonce: nonceMock,
        estimateGasWithInflationFactor: jest.fn().mockReturnValue(3),
        gasPrice: jest.fn(async () => BigNumber(2)),
      },
    })),
  };
});

describe("prepareTransaction", () => {
  it("should return the transaction if the address is invalid", async () => {
    const transaction = await prepareTransaction(accountFixture, transactionFixture);
    expect(transaction).toMatchObject(transaction);
  });

  it("should return the transaction if it doesn't have a recipient", async () => {
    const transaction = await prepareTransaction(accountFixture, {
      ...transactionFixture,
      recipient: "",
    });
    expect(transaction).toMatchObject(transaction);
  });

  it("should return the vote transaction if it doesn't have a recipient", async () => {
    const transaction = await prepareTransaction(accountFixture, {
      ...transactionFixture,
      recipient: "",
      mode: "vote",
    });
    expect(transaction).toMatchObject(transaction);
  });

  it("should return the vote transaction if the amount is less than or equal to zero", async () => {
    const transaction = await prepareTransaction(accountFixture, {
      ...transactionFixture,
      recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
      mode: "vote",
      amount: BigNumber(0),
    });
    expect(transaction).toMatchObject(transaction);
  });

  it("should return the prepared transaction", async () => {
    const transaction = await prepareTransaction(
      { ...accountFixture, balance: BigNumber(222222), spendableBalance: BigNumber(222222) },
      {
        ...transactionFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        amount: BigNumber(22),
      },
    );
    expect(transaction).toMatchObject({
      ...transaction,
      data: Buffer.from("send_data".slice(2), "hex"),
      fees: BigNumber(6),
    });
  });
});
