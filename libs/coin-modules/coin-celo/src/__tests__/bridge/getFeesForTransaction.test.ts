import BigNumber from "bignumber.js";
import getFeesForTransaction from "../../bridge/getFeesForTransaction";
import { accountFixture, transactionFixture } from "../../bridge/fixtures";

const chainIdMock = jest.fn();
const nonceMock = jest.fn();
const voteMock = jest.fn(() => ({
  txo: {
    encodeABI: jest.fn(() => ({ data: "vote_data" })),
    estimateGas: jest.fn(async () => 1),
  },
}));
const revokeMock = jest.fn();
const voteSignerToAccountMock = jest.fn();

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
        getElection: jest.fn(async () => ({
          vote: voteMock,
          revoke: revokeMock,
          activate: jest.fn(() => ({
            find: jest.fn(() => ({
              txo: {
                encodeABI: jest.fn(() => ({ data: "vote_data" })),
                estimateGas: jest.fn(async () => 3),
              },
            })),
          })),
          address: "vote_address",
        })),
        getAccounts: jest.fn(async () => ({
          voteSignerToAccount: voteSignerToAccountMock,
          createAccount: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => ({ data: "register_data" })),
              estimateGas: jest.fn(async () => 3),
            },
          })),
          address: "register_address",
        })),
        getStableToken: jest.fn(async () => ({
          address: "stable_token_address",
          transfer: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => ({ data: "send_token_data" })),
            },
          })),
        })),
        getErc20: jest.fn(async () => ({
          address: "erc20_token_address",
          transfer: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => ({ data: "send_token_data" })),
            },
          })),
        })),
      },
      connection: {
        chainId: chainIdMock,
        nonce: nonceMock,
        estimateGasWithInflationFactor: jest.fn().mockReturnValue(3),
        gasPrice: jest.fn(async () => BigNumber(2)),
        getMaxPriorityFeePerGas: jest.fn().mockResolvedValue(1),
      },
    })),
  };
});

describe("getFeesForTransaction", () => {
  it("should return the correct fees for a send transaction", async () => {
    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: transactionFixture,
    });

    expect(fees).toEqual(BigNumber(24));
  });

  it("should return the correct fees for a revoke transaction without revoked transactions", async () => {
    revokeMock.mockClear();

    revokeMock.mockReturnValue({
      find: jest.fn(() => false),
    });

    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "revoke" },
    });

    expect(fees).toEqual(BigNumber(0));
  });

  it("should return the correct fees for a revoke transaction with revoked transactions", async () => {
    revokeMock.mockClear();

    revokeMock.mockReturnValue({
      find: jest.fn(() => ({
        txo: {
          encodeABI: jest.fn(() => ({ data: "revoke_data" })),
          estimateGas: jest.fn(async () => 2),
        },
      })),
    });

    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "revoke" },
    });

    expect(fees).toEqual(BigNumber(4));
  });

  it("should return the correct fees for a revoke transaction with revoked transactions and useAllAmount set to true", async () => {
    revokeMock.mockClear();

    revokeMock.mockReturnValue({
      find: jest.fn(() => ({
        txo: {
          encodeABI: jest.fn(() => ({ data: "revoke_data" })),
          estimateGas: jest.fn(async () => 2),
        },
      })),
    });

    const fees = await getFeesForTransaction({
      account: {
        ...accountFixture,
        balance: BigNumber(123),
        spendableBalance: BigNumber(123),
        celoResources: {
          ...accountFixture.celoResources,
          votes: [
            {
              activatable: true,
              amount: BigNumber(10),
              index: 0,
              revokable: true,
              type: "active",
              validatorGroup: transactionFixture.recipient,
            },
          ],
        },
      },
      transaction: { ...transactionFixture, mode: "revoke", useAllAmount: true },
    });

    expect(fees).toEqual(BigNumber(4));
  });

  it("should return the correct fees for a withdraw transaction", async () => {
    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "withdraw" },
    });

    expect(fees).toEqual(BigNumber(6));
  });

  it("should return the correct fees for a vote transaction", async () => {
    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "vote" },
    });

    expect(fees).toEqual(BigNumber(2));
  });

  it("should return the correct fees for a lock transaction", async () => {
    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "lock" },
    });

    expect(fees).toEqual(BigNumber(4));
  });

  it("should return fees for lock when amount is NaN (valueToHex returns 0x0)", async () => {
    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "lock", amount: new BigNumber(NaN) },
    });

    expect(fees).toEqual(BigNumber(4));
  });

  it("should return the correct fees for a unlock transaction", async () => {
    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "unlock" },
    });

    expect(fees).toEqual(BigNumber(6));
  });

  it("should return the correct fees for an activate transaction", async () => {
    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "activate" },
    });

    expect(fees).toEqual(BigNumber(6));
  });

  it("should return the correct fees for a register transaction", async () => {
    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "register" },
    });

    expect(fees).toEqual(BigNumber(6));
  });

  it("should return fees for send when amount is less than 1 CELO but greater than gas fee", async () => {
    const oneCelo = new BigNumber(10).pow(18);
    const pointOneCelo = new BigNumber(10).pow(17);

    const fees = await getFeesForTransaction({
      account: {
        ...accountFixture,
        balance: oneCelo,
        spendableBalance: oneCelo,
      },
      transaction: {
        ...transactionFixture,
        mode: "send",
        amount: pointOneCelo,
      },
    });

    expect(fees).toBeInstanceOf(BigNumber);
    expect(fees.gt(0)).toBe(true);
    expect(fees.lt(pointOneCelo)).toBe(true);
  });
});
