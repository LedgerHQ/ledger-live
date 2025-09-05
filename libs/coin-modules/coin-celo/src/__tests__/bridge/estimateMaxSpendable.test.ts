import BigNumber from "bignumber.js";
import estimateMaxSpendable from "../../bridge/estimateMaxSpendable";
import {
  accountFixture,
  accountWithTokenAccountFixture,
  tokenTransactionFixture,
  transactionFixture,
} from "../../bridge/fixtures";

jest.mock("../../bridge/getFeesForTransaction", async () => 12);

const voteMock = jest.fn(() => ({
  txo: {
    encodeABI: jest.fn(() => ({ data: "vote_data" })),
    estimateGas: jest.fn(async () => 1),
  },
}));

jest.mock("../../network/sdk", () => {
  return {
    celoKit: jest.fn(() => ({
      contracts: {
        getLockedGold: jest.fn(async () => ({
          address: "address",
          getAccountNonvotingLockedGold: jest.fn(async () => BigNumber(22)),
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
        })),
        getElection: jest.fn(async () => ({
          vote: voteMock,
          revoke: jest.fn(),
          address: "vote_address",
        })),
        getAccounts: jest.fn(async () => ({
          voteSignerToAccount: jest.fn(),
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
        chainId: jest.fn(),
        nonce: jest.fn(),
        estimateGasWithInflationFactor: jest.fn().mockReturnValue(3),
      },
    })),
  };
});

describe("estimateMaxSpendable", () => {
  it("returns the maximum spendable for a celo account", async () => {
    const maximumAmount = await estimateMaxSpendable({
      account: { ...accountFixture, balance: BigNumber(100), spendableBalance: BigNumber(100) },
      transaction: transactionFixture,
    });
    expect(maximumAmount).toEqual(BigNumber(100));
  });

  it("returns the maximum spendable for a celo account", async () => {
    const maximumAmount = await estimateMaxSpendable({
      account: {
        ...accountWithTokenAccountFixture,
        balance: BigNumber(100),
        spendableBalance: BigNumber(100),
      },
      transaction: tokenTransactionFixture,
    });
    expect(maximumAmount).toEqual(BigNumber(212));
  });
});
