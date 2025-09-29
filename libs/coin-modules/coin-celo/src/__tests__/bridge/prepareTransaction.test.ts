import BigNumber from "bignumber.js";
import {
  accountFixture,
  accountWithTokenAccountFixture,
  tokenTransactionFixture,
  transactionFixture,
} from "../../bridge/fixtures";
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
              encodeABI: jest.fn(() => "0x6C6F636B5F64617461"), // lock_data
              estimateGas: jest.fn(async () => 2),
            },
          })),
          unlock: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => "0x756E6C6F636B5F64617461"), // unlock_data
              estimateGas: jest.fn(async () => 3),
            },
          })),
          withdraw: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => "0x77697468647261775F64617461"), // withdraw_data
              estimateGas: jest.fn(async () => 3),
            },
          })),
          vote: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => "0x766F74655F64617461"), // vote_data
              estimateGas: jest.fn(async () => 3),
            },
          })),
          getAccountNonvotingLockedGold: jest.fn(() => BigNumber(0)),
        })),
        getGoldToken: jest.fn(async () => ({
          address: "gold_token_address",
          transfer: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => "0x73656E645F64617461"), // send_data
            },
          })),
        })),
        getStableToken: jest.fn(async () => ({
          address: "stable_token_address",
          transfer: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => "0x73656E645F746F6B656E5F64617461"), // stable_token_data
            },
          })),
        })),
        getErc20: jest.fn(async () => ({
          address: "erc20_token_address",
          transfer: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => "0x73656E645F65726332305F746F6B656E5F64617461"), // send_erc20_token_data
            },
          })),
        })),
      },
      connection: {
        chainId: chainIdMock,
        nonce: nonceMock,
        estimateGasWithInflationFactor: jest.fn().mockReturnValue(3),
        gasPrice: jest.fn(async () => BigNumber(2)),
        web3: { eth: { getBlock: jest.fn().mockResolvedValue({ baseFeePerGas: 10 }) } },
        getMaxPriorityFeePerGas: jest.fn().mockReturnValue(1),
      },
    })),
  };
});

describe("prepareTransaction", () => {
  it("should return the transaction if the address is invalid", async () => {
    const transaction = await prepareTransaction(accountFixture, transactionFixture);
    expect(transaction).toMatchObject({
      amount: BigNumber(10),
      recipient: "recipient",
      useAllAmount: false,
      family: "celo",
      mode: "send",
      index: 0,
      fees: null,
    });
  });

  it("should return the transaction if it doesn't have a recipient", async () => {
    const transaction = await prepareTransaction(accountFixture, {
      ...transactionFixture,
      recipient: "",
    });
    expect(transaction).toMatchObject({
      amount: BigNumber(10),
      recipient: "",
      useAllAmount: false,
      family: "celo",
      mode: "send",
      index: 0,
      fees: null,
    });
  });

  it("should return the vote transaction if it doesn't have a recipient", async () => {
    const transaction = await prepareTransaction(accountFixture, {
      ...transactionFixture,
      recipient: "",
      mode: "vote",
    });
    expect(transaction).toMatchObject({
      amount: BigNumber(10),
      recipient: "",
      useAllAmount: false,
      family: "celo",
      mode: "vote",
      index: 0,
      fees: null,
    });
  });

  it("should return the vote transaction if the amount is less than or equal to zero", async () => {
    const transaction = await prepareTransaction(accountFixture, {
      ...transactionFixture,
      recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
      mode: "vote",
      amount: BigNumber(0),
    });
    expect(transaction).toMatchObject({
      amount: BigNumber(0),
      recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
      useAllAmount: false,
      family: "celo",
      mode: "vote",
      index: 0,
      fees: null,
    });
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
      amount: BigNumber(22),
      recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
      useAllAmount: false,
      family: "celo",
      mode: "send",
      index: 0,
      fees: BigNumber(24),
    });
  });

  it("should return the prepared stable token transaction", async () => {
    const transaction = await prepareTransaction(
      {
        ...accountWithTokenAccountFixture,
        balance: BigNumber(222222),
        spendableBalance: BigNumber(222222),
        subAccounts: [
          {
            ...accountWithTokenAccountFixture.subAccounts[0],
            token: {
              ...accountWithTokenAccountFixture.subAccounts[0].token,
              id: "cEUR",
            },
          },
        ],
      },
      {
        ...tokenTransactionFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        amount: BigNumber(22),
      },
    );
    expect(transaction).toMatchObject({
      amount: BigNumber(22),
      recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
      useAllAmount: false,
      family: "celo",
      mode: "send",
      index: 0,
      fees: BigNumber(24),
      subAccountId: "subAccountId",
      data: Buffer.from("0x73656E645F746F6B656E5F64617461"),
    });
  });

  it("should return the prepared token transaction", async () => {
    const transaction = await prepareTransaction(
      {
        ...accountWithTokenAccountFixture,
        balance: BigNumber(222222),
        spendableBalance: BigNumber(222222),
      },
      {
        ...tokenTransactionFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        amount: BigNumber(22),
      },
    );
    expect(transaction).toMatchObject({
      amount: BigNumber(22),
      recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
      useAllAmount: false,
      family: "celo",
      mode: "send",
      index: 0,
      fees: BigNumber(24),
      subAccountId: "subAccountId",
      data: Buffer.from("0x73656E645F65726332305F746F6B656E5F64617461"),
    });
  });

  it("should return the prepared token transaction with useAllAmount", async () => {
    const transaction = await prepareTransaction(
      {
        ...accountWithTokenAccountFixture,
        balance: BigNumber(222222),
        spendableBalance: BigNumber(222222),
      },
      {
        ...tokenTransactionFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        amount: BigNumber(22),
        useAllAmount: true,
      },
    );

    expect(transaction).toMatchObject({
      amount: BigNumber(212),
      recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
      useAllAmount: true,
      family: "celo",
      mode: "send",
      index: 0,
      fees: BigNumber(24),
      subAccountId: "subAccountId",
      data: Buffer.from("0x73656E645F65726332305F746F6B656E5F64617461"),
    });
  });
});
