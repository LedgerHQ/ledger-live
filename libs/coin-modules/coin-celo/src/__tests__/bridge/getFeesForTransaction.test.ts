import BigNumber from "bignumber.js";
import getFeesForTransaction from "../../bridge/getFeesForTransaction";
import { accountFixture, transactionFixture } from "../../bridge/getFixtures";

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

    expect(fees).toEqual(BigNumber(6));
  });

  it("should return the correct fees for an unlock transaction", async () => {
    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "unlock" },
    });

    expect(fees).toEqual(BigNumber(6));
  });
});
