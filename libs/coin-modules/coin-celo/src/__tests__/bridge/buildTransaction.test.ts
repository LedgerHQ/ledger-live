import BigNumber from "bignumber.js";
import buildTransaction from "../../bridge/buildTransaction";
import {
  accountFixture,
  accountWithTokenAccountFixture,
  transactionFixture,
} from "../../bridge/fixtures";

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
        web3: { eth: { getBlock: jest.fn().mockResolvedValue({ baseFeePerGas: 10 }) } },
        getMaxPriorityFeePerGas: jest.fn().mockResolvedValue(1),
      },
    })),
  };
});

describe("buildTransaction", () => {
  it("should build a lock transaction", async () => {
    const transaction = await buildTransaction(
      { ...accountFixture, spendableBalance: BigNumber(123) },
      {
        ...transactionFixture,
        mode: "lock",
      },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: "address",
      value: "0xa",
      data: { data: "lock_data" },
      gas: "12",
    });

    expect(chainIdMock).toHaveBeenCalledTimes(1);
    expect(nonceMock).toHaveBeenCalledWith(accountFixture.freshAddress);
  });

  it("should build a lock transaction with useAllAmount", async () => {
    const transaction = await buildTransaction(
      { ...accountFixture, spendableBalance: BigNumber(123) },
      {
        ...transactionFixture,
        mode: "lock",
        useAllAmount: true,
        fees: BigNumber(2),
      },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: "address",
      value: "0x79",
      data: { data: "lock_data" },
      gas: "12",
    });
  });

  it("should build an unlock transaction", async () => {
    const transaction = await buildTransaction(
      {
        ...accountFixture,
        spendableBalance: BigNumber(123),
        celoResources: {
          registrationStatus: false,
          lockedBalance: BigNumber(0),
          nonvotingLockedBalance: BigNumber(40),
          pendingWithdrawals: null,
          votes: null,
          electionAddress: null,
          lockedGoldAddress: null,
          maxNumGroupsVotedFor: BigNumber(0),
        },
      },
      {
        ...transactionFixture,
        mode: "unlock",
      },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: "address",
      data: { data: "unlock_data" },
      gas: "12",
    });
  });

  it("should build an unlock transaction with useAllAmount", async () => {
    const transaction = await buildTransaction(
      {
        ...accountFixture,
        spendableBalance: BigNumber(123),
        celoResources: {
          registrationStatus: false,
          lockedBalance: BigNumber(0),
          nonvotingLockedBalance: BigNumber(40),
          pendingWithdrawals: null,
          votes: null,
          electionAddress: null,
          lockedGoldAddress: null,
          maxNumGroupsVotedFor: BigNumber(0),
        },
      },
      {
        ...transactionFixture,
        useAllAmount: true,
        mode: "unlock",
      },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: "address",
      data: { data: "unlock_data" },
      gas: "12",
    });
  });

  it("should build a withdraw transaction", async () => {
    const transaction = await buildTransaction(
      {
        ...accountFixture,
        spendableBalance: BigNumber(123),
        celoResources: {
          registrationStatus: false,
          lockedBalance: BigNumber(0),
          nonvotingLockedBalance: BigNumber(40),
          pendingWithdrawals: null,
          votes: null,
          electionAddress: null,
          lockedGoldAddress: null,
          maxNumGroupsVotedFor: BigNumber(0),
        },
      },
      {
        ...transactionFixture,
        mode: "withdraw",
      },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: "address",
      data: { data: "withdraw_data" },
      gas: "12",
    });
  });

  it("should build a vote transaction", async () => {
    const transaction = await buildTransaction(
      {
        ...accountFixture,
        spendableBalance: BigNumber(123),
        celoResources: {
          registrationStatus: false,
          lockedBalance: BigNumber(0),
          nonvotingLockedBalance: BigNumber(40),
          pendingWithdrawals: null,
          votes: null,
          electionAddress: null,
          lockedGoldAddress: null,
          maxNumGroupsVotedFor: BigNumber(0),
        },
      },
      {
        ...transactionFixture,
        mode: "vote",
      },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: "vote_address",
      data: { data: "vote_data" },
      gas: "12",
    });

    expect(voteMock).toHaveBeenCalledTimes(1);
    expect(voteMock).toHaveBeenCalledWith(transactionFixture.recipient, new BigNumber(10));
  });

  it("should build a revoke transaction but fail without revokes", async () => {
    revokeMock.mockClear();

    revokeMock.mockReturnValue({
      find: jest.fn(() => false),
    });

    expect(
      async () =>
        await buildTransaction(
          {
            ...accountFixture,
            spendableBalance: BigNumber(123),
            celoResources: {
              registrationStatus: false,
              lockedBalance: BigNumber(0),
              nonvotingLockedBalance: BigNumber(40),
              pendingWithdrawals: null,
              votes: null,
              electionAddress: null,
              lockedGoldAddress: null,
              maxNumGroupsVotedFor: BigNumber(0),
            },
          },
          {
            ...transactionFixture,
            mode: "revoke",
          },
        ),
    ).rejects.toThrow("No votes to revoke");
  });

  it("should build a revoke transaction", async () => {
    revokeMock.mockClear();

    voteSignerToAccountMock.mockReturnValue("signer_account");
    revokeMock.mockReturnValue({
      find: jest.fn(() => ({
        txo: {
          encodeABI: jest.fn(() => ({ data: "revoke_data" })),
          estimateGas: jest.fn(async () => 2),
        },
      })),
    });

    const transaction = await buildTransaction(
      {
        ...accountFixture,
        spendableBalance: BigNumber(123),
        celoResources: {
          registrationStatus: false,
          lockedBalance: BigNumber(0),
          nonvotingLockedBalance: BigNumber(40),
          pendingWithdrawals: null,
          votes: null,
          electionAddress: null,
          lockedGoldAddress: null,
          maxNumGroupsVotedFor: BigNumber(0),
        },
      },
      {
        ...transactionFixture,
        mode: "revoke",
      },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: "vote_address",
      data: { data: "revoke_data" },
      gas: "12",
    });

    expect(revokeMock).toHaveBeenCalledTimes(1);
    expect(revokeMock).toHaveBeenCalledWith(
      "signer_account",
      transactionFixture.recipient,
      new BigNumber(10),
    );
    expect(voteSignerToAccountMock).toHaveBeenCalledWith(accountFixture.freshAddress);
  });

  it("should build a revoke transaction with useAllAmount", async () => {
    revokeMock.mockClear();

    voteSignerToAccountMock.mockReturnValue("signer_account");
    revokeMock.mockReturnValue({
      find: jest.fn(() => ({
        txo: {
          encodeABI: jest.fn(() => ({ data: "revoke_data" })),
          estimateGas: jest.fn(async () => 2),
        },
      })),
    });

    const transaction = await buildTransaction(
      {
        ...accountFixture,
        spendableBalance: BigNumber(123),
        celoResources: {
          registrationStatus: false,
          lockedBalance: BigNumber(0),
          nonvotingLockedBalance: BigNumber(40),
          pendingWithdrawals: null,
          votes: null,
          electionAddress: null,
          lockedGoldAddress: null,
          maxNumGroupsVotedFor: BigNumber(0),
        },
      },
      {
        ...transactionFixture,
        useAllAmount: true,
        mode: "revoke",
      },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: "vote_address",
      data: { data: "revoke_data" },
      gas: "12",
    });

    expect(revokeMock).toHaveBeenCalledTimes(1);
    expect(revokeMock).toHaveBeenCalledWith(
      "signer_account",
      transactionFixture.recipient,
      new BigNumber(10),
    );
    expect(voteSignerToAccountMock).toHaveBeenCalledWith(accountFixture.freshAddress);
  });

  it("should build an activate transaction", async () => {
    const transaction = await buildTransaction(
      { ...accountFixture, spendableBalance: BigNumber(123) },
      {
        ...transactionFixture,
        mode: "activate",
      },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: "vote_address",
      data: { data: "vote_data" },
      gas: "12",
    });
  });

  it("should build a register transaction", async () => {
    const transaction = await buildTransaction(
      { ...accountFixture, spendableBalance: BigNumber(123) },
      {
        ...transactionFixture,
        mode: "register",
      },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: "register_address",
      data: { data: "register_data" },
      gas: "12",
    });
  });

  it("should build a send transaction", async () => {
    const transaction = await buildTransaction(
      { ...accountFixture, spendableBalance: BigNumber(123) },
      {
        ...transactionFixture,
        mode: "send",
      },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: transactionFixture.recipient,
      value: "0xa",
      gas: "12",
    });
  });

  it("should build a send transaction when amount is less than 1 CELO but greater than gas fee", async () => {
    const oneCelo = new BigNumber(10).pow(18);
    const pointOneCelo = new BigNumber(10).pow(17);

    const transaction = await buildTransaction(
      { ...accountFixture, spendableBalance: oneCelo },
      {
        ...transactionFixture,
        mode: "send",
        amount: pointOneCelo,
      },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: transactionFixture.recipient,
      value: "0x16345785d8a0000",
      gas: "12",
    });
  });

  it("should build a send transaction when amount is less than gas fee", async () => {
    const twoCelo = new BigNumber(10).pow(18).times(2);
    const amountLessThanFee = new BigNumber(10);

    const transaction = await buildTransaction(
      { ...accountFixture, spendableBalance: twoCelo },
      {
        ...transactionFixture,
        mode: "send",
        amount: amountLessThanFee,
      },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: transactionFixture.recipient,
      value: "0xa",
      gas: "12",
    });
  });

  it("should build a token transaction", async () => {
    const transaction = await buildTransaction(
      {
        ...accountWithTokenAccountFixture,
        spendableBalance: BigNumber(123),
      },
      {
        ...transactionFixture,
        subAccountId: accountWithTokenAccountFixture.subAccounts[0].id,
        mode: "send",
      },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: "recipient",
      value: "0xa",
      gas: "12",
    });
  });

  it("should build a stable token transaction", async () => {
    const transaction = await buildTransaction(
      {
        ...accountWithTokenAccountFixture,
        spendableBalance: BigNumber(123),
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
        ...transactionFixture,
        subAccountId: accountWithTokenAccountFixture.subAccounts[0].id,
        mode: "send",
      },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: "recipient",
      value: "0xa",
      gas: "12",
    });
  });
});
