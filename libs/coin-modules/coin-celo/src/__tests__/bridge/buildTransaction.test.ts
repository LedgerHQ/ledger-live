import BigNumber from "bignumber.js";
import { electionABI } from "@celo/abis";
import { encodeFunctionData } from "viem";
import buildTransaction from "../../bridge/buildTransaction";
import {
  accountFixture,
  accountWithTokenAccountFixture,
  transactionFixture,
  transactionWithUsdcFeeFixture,
  tokenTransactionWithUsdcFeeFixture,
} from "../../bridge/fixtures";
import { ZERO_ADDRESS } from "../../constants";

const LOCKED_GOLD_ADDRESS = "0x0000000000000000000000000000000000001d00";
const ELECTION_ADDRESS = "0x000000000000000000000000000000000000ce10";
const ACCOUNTS_ADDRESS = "0x000000000000000000000000000000000000aa10";
const STABLE_TOKEN_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
const VALID_RECIPIENT = "0x79D5A290D7ba4b99322d91b577589e8d0BF87072";

const estimateGasMock = jest.fn(async () => BigInt(3));
const getChainIdMock = jest.fn(async () => 42220);
const getTransactionCountMock = jest.fn(async () => 1);
const readContractMock = jest.fn<Promise<unknown>, [{ functionName: string }]>(
  async ({ functionName }) => {
    if (functionName === "canReceiveVotes") return true;
    if (functionName === "getTotalVotesForEligibleValidatorGroups") return [[], []];
    return ZERO_ADDRESS;
  },
);

jest.mock("../../network/client", () => ({
  getCeloClient: jest.fn(() => ({
    estimateGas: estimateGasMock,
    getChainId: getChainIdMock,
    getTransactionCount: getTransactionCountMock,
    readContract: readContractMock,
  })),
}));

jest.mock("../../network/registry", () => ({
  getRegistryAddressFor: jest.fn(async (name: string) => {
    if (name === "LockedGold") return LOCKED_GOLD_ADDRESS;
    if (name === "Election") return ELECTION_ADDRESS;
    if (name === "Accounts") return ACCOUNTS_ADDRESS;
    if (name === "StableTokenEUR") return STABLE_TOKEN_ADDRESS;
    if (name === "StableToken") return STABLE_TOKEN_ADDRESS;
    return ZERO_ADDRESS;
  }),
}));

jest.mock("../../network/sdk", () => ({
  voteSignerAccount: jest.fn(async () => "signer_account"),
}));

describe("buildTransaction", () => {
  beforeEach(() => {
    estimateGasMock.mockClear();
    getChainIdMock.mockClear();
    getTransactionCountMock.mockClear();
    readContractMock.mockReset();
    readContractMock.mockImplementation(async ({ functionName }) => {
      if (functionName === "canReceiveVotes") return true;
      if (functionName === "getTotalVotesForEligibleValidatorGroups") return [[], []];
      return ZERO_ADDRESS;
    });
  });

  it("should build a lock transaction", async () => {
    const transaction = await buildTransaction(
      { ...accountFixture, spendableBalance: BigNumber(123) },
      { ...transactionFixture, mode: "lock" },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: LOCKED_GOLD_ADDRESS,
      value: "0xa",
    });
    expect(getChainIdMock).toHaveBeenCalledTimes(1);
    expect(getTransactionCountMock).toHaveBeenCalledWith({
      address: accountFixture.freshAddress,
    });
  });

  it("should build a lock transaction with useAllAmount", async () => {
    const transaction = await buildTransaction(
      { ...accountFixture, spendableBalance: BigNumber(123) },
      { ...transactionFixture, mode: "lock", useAllAmount: true, fees: BigNumber(2) },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: LOCKED_GOLD_ADDRESS,
      value: "0x79",
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
      { ...transactionFixture, mode: "unlock" },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: LOCKED_GOLD_ADDRESS,
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
      { ...transactionFixture, useAllAmount: true, mode: "unlock" },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: LOCKED_GOLD_ADDRESS,
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
      { ...transactionFixture, mode: "withdraw" },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: LOCKED_GOLD_ADDRESS,
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
      { ...transactionFixture, mode: "vote", recipient: VALID_RECIPIENT },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: ELECTION_ADDRESS,
    });
  });

  it("should use lesser and greater neighbors when building a vote transaction", async () => {
    const groupA = "0x00000000000000000000000000000000000000a1" as `0x${string}`;
    const groupB = "0x00000000000000000000000000000000000000b2" as `0x${string}`;
    readContractMock.mockImplementation(async ({ functionName }: { functionName: string }) => {
      if (functionName === "canReceiveVotes") return true;
      if (functionName === "getTotalVotesForEligibleValidatorGroups") {
        return [
          [groupA, groupB],
          [BigInt(10), BigInt(30)],
        ];
      }
      return ZERO_ADDRESS;
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
      { ...transactionFixture, mode: "vote", recipient: VALID_RECIPIENT },
    );

    const expectedData = encodeFunctionData({
      abi: electionABI,
      functionName: "vote",
      args: [VALID_RECIPIENT as `0x${string}`, BigInt(10), groupA, groupB],
    });

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: ELECTION_ADDRESS,
      data: expectedData,
    });
  });

  it("should throw when validator group cannot receive more votes", async () => {
    readContractMock.mockImplementationOnce(async ({ functionName }: { functionName: string }) => {
      if (functionName === "canReceiveVotes") return false;
      return [[], []];
    });

    await expect(
      buildTransaction(
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
        { ...transactionFixture, mode: "vote", recipient: VALID_RECIPIENT },
      ),
    ).rejects.toThrow("vote cap exceeded");
  });

  it("should build vote transaction when eligible groups call fails", async () => {
    readContractMock.mockImplementation(async ({ functionName }: { functionName: string }) => {
      if (functionName === "canReceiveVotes") return true;
      if (functionName === "getTotalVotesForEligibleValidatorGroups") {
        throw new Error("revert");
      }
      return ZERO_ADDRESS;
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
      { ...transactionFixture, mode: "vote", recipient: VALID_RECIPIENT },
    );

    const expectedData = encodeFunctionData({
      abi: electionABI,
      functionName: "vote",
      args: [
        VALID_RECIPIENT as `0x${string}`,
        BigInt(transactionFixture.amount.toFixed()),
        ZERO_ADDRESS,
        ZERO_ADDRESS,
      ],
    });

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: ELECTION_ADDRESS,
      data: expectedData,
    });
  });

  it("should build a revoke transaction", async () => {
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
      { ...transactionFixture, mode: "revoke", recipient: VALID_RECIPIENT },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: ELECTION_ADDRESS,
    });
  });

  it("should build a revoke transaction with useAllAmount", async () => {
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
      { ...transactionFixture, useAllAmount: true, mode: "revoke", recipient: VALID_RECIPIENT },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: ELECTION_ADDRESS,
    });
  });

  it("should build revoke active transaction when index is not zero", async () => {
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
      { ...transactionFixture, mode: "revoke", index: 1, recipient: VALID_RECIPIENT },
    );

    const expectedData = encodeFunctionData({
      abi: electionABI,
      functionName: "revokeActive",
      args: [
        VALID_RECIPIENT as `0x${string}`,
        BigInt(transactionFixture.amount.toFixed()),
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        BigInt(0),
      ],
    });

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: ELECTION_ADDRESS,
      data: expectedData,
    });
  });

  it("should build an activate transaction", async () => {
    const transaction = await buildTransaction(
      { ...accountFixture, spendableBalance: BigNumber(123) },
      { ...transactionFixture, mode: "activate", recipient: VALID_RECIPIENT },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: ELECTION_ADDRESS,
    });
  });

  it("should build a register transaction", async () => {
    const transaction = await buildTransaction(
      { ...accountFixture, spendableBalance: BigNumber(123) },
      { ...transactionFixture, mode: "register" },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: ACCOUNTS_ADDRESS,
    });
  });

  it("should build a send transaction", async () => {
    const transaction = await buildTransaction(
      { ...accountFixture, spendableBalance: BigNumber(123) },
      { ...transactionFixture, mode: "send" },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: transactionFixture.recipient,
      value: "0xa",
    });
  });

  it("should build a send transaction when amount is less than 1 CELO but greater than gas fee", async () => {
    const oneCelo = new BigNumber(10).pow(18);
    const pointOneCelo = new BigNumber(10).pow(17);

    const transaction = await buildTransaction(
      { ...accountFixture, spendableBalance: oneCelo },
      { ...transactionFixture, mode: "send", amount: pointOneCelo },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: transactionFixture.recipient,
      value: "0x16345785d8a0000",
    });
  });

  it("should build a send transaction when amount is less than gas fee", async () => {
    const twoCelo = new BigNumber(10).pow(18).times(2);
    const amountLessThanFee = new BigNumber(10);

    const transaction = await buildTransaction(
      { ...accountFixture, spendableBalance: twoCelo },
      { ...transactionFixture, mode: "send", amount: amountLessThanFee },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: transactionFixture.recipient,
      value: "0xa",
    });
  });

  it("should build a token transaction", async () => {
    const transaction = await buildTransaction(
      { ...accountWithTokenAccountFixture, spendableBalance: BigNumber(123) },
      {
        ...transactionFixture,
        recipient: VALID_RECIPIENT,
        subAccountId: accountWithTokenAccountFixture.subAccounts[0].id,
        mode: "send",
      },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
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
        recipient: VALID_RECIPIENT,
        subAccountId: accountWithTokenAccountFixture.subAccounts[0].id,
        mode: "send",
      },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
    });
  });

  it("should build a send transaction with USDC fee currency", async () => {
    const transaction = await buildTransaction(
      { ...accountFixture, spendableBalance: BigNumber(123) },
      {
        ...transactionWithUsdcFeeFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        amount: BigNumber(10),
      },
    );

    expect(transaction).toMatchObject({
      from: accountFixture.freshAddress,
      to: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
      value: "0xa",
    });
    expect(transaction.feeCurrency).toEqual(transactionWithUsdcFeeFixture.feeCurrency);
  });

  it("should build a token transaction with USDC fee currency", async () => {
    const transaction = await buildTransaction(
      { ...accountWithTokenAccountFixture, spendableBalance: BigNumber(123) },
      {
        ...tokenTransactionWithUsdcFeeFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        mode: "send",
      },
    );

    expect(transaction).toMatchObject({ from: accountFixture.freshAddress });
    expect(transaction.feeCurrency).toEqual(tokenTransactionWithUsdcFeeFixture.feeCurrency);
  });

  it("should build transaction with feeCurrency when using useAllAmount", async () => {
    const transaction = await buildTransaction(
      { ...accountFixture, spendableBalance: BigNumber(123) },
      {
        ...transactionWithUsdcFeeFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        amount: BigNumber(100),
        useAllAmount: true,
        fees: BigNumber(2),
      },
    );

    expect(transaction.feeCurrency).toEqual(transactionWithUsdcFeeFixture.feeCurrency);
  });
});
