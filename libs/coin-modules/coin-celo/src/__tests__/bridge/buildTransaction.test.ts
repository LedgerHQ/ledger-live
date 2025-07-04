import BigNumber from "bignumber.js";
import buildTransaction from "../../bridge/buildTransaction";
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
        })),
        getElection: jest.fn(async () => ({
          vote: voteMock,
          revoke: revokeMock,
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
      },
      connection: {
        chainId: chainIdMock,
        nonce: nonceMock,
        estimateGasWithInflationFactor: jest.fn().mockReturnValue(3),
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
      value: "10",
      data: { data: "lock_data" },
      gas: 2,
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
      value: "121",
      data: { data: "lock_data" },
      gas: 2,
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
      gas: 3,
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
      gas: 3,
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
      gas: 1,
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
      gas: 2,
    });

    expect(revokeMock).toHaveBeenCalledTimes(1);
    expect(revokeMock).toHaveBeenCalledWith(
      "signer_account",
      transactionFixture.recipient,
      new BigNumber(10),
    );
    expect(voteSignerToAccountMock).toHaveBeenCalledWith(accountFixture.freshAddress);
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
      gas: 3,
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
      value: "10",
      gas: 3,
    });
  });

  // it("should build a token transaction", async () => {
  //   const transaction = await buildTransaction(
  //     { ...accountFixture, spendableBalance: BigNumber(123) },
  //     {
  //       ...transactionFixture,
  //       mode: "send",
  //     },
  //   );

  //   expect(transaction).toMatchObject({
  //     from: accountFixture.freshAddress,
  //     to: transactionFixture.recipient,
  //     value: "10",
  //     gas: 3,
  //   });
  // });
});
