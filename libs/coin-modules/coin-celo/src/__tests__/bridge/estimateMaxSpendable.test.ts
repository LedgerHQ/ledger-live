import BigNumber from "bignumber.js";
import estimateMaxSpendable from "../../bridge/estimateMaxSpendable";
import {
  accountFixture,
  accountWithTokenAccountFixture,
  tokenTransactionFixture,
  transactionFixture,
  transactionWithUsdcFeeFixture,
  tokenTransactionWithUsdcFeeFixture,
  usdcTransactionWithSameTokenFeeFixture,
  usdcTokenAccount,
} from "../../bridge/fixtures";

jest.mock("../../bridge/getFeesForTransaction", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(new BigNumber(12)),
}));

jest.mock("../../network/client", () => ({
  celoGasPrice: jest.fn(async () => BigInt(2)),
  getCeloClient: jest.fn(() => ({
    estimateGas: jest.fn(async () => BigInt(3)),
    estimateMaxPriorityFeePerGas: jest.fn(async () => BigInt(1)),
    getBlock: jest.fn(async () => ({ baseFeePerGas: BigInt(10) })),
    getChainId: jest.fn(async () => 42220),
    getTransactionCount: jest.fn(async () => 1),
    readContract: jest.fn(async ({ functionName }: { functionName: string }) => {
      if (functionName === "getAccountNonvotingLockedGold") return BigInt(22);
      if (functionName === "getTotalVotesForEligibleValidatorGroups") return [[], []];
      return BigInt(0);
    }),
  })),
}));

jest.mock("../../network/registry", () => ({
  getRegistryAddressFor: jest.fn(async () => "0x0000000000000000000000000000000000001d00"),
}));

jest.mock("../../network/sdk", () => ({
  voteSignerAccount: jest.fn(async () => "signer_account"),
}));

describe("estimateMaxSpendable", () => {
  it("returns the maximum spendable for a celo account", async () => {
    const maximumAmount = await estimateMaxSpendable({
      account: { ...accountFixture, balance: BigNumber(100), spendableBalance: BigNumber(100) },
      transaction: transactionFixture,
    });
    expect(maximumAmount).toEqual(BigNumber(100));
  });

  it("returns the maximum spendable for a token account", async () => {
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

  it("returns the full balance when paying fees in different currency (USDC)", async () => {
    const maximumAmount = await estimateMaxSpendable({
      account: { ...accountFixture, balance: BigNumber(100), spendableBalance: BigNumber(100) },
      transaction: transactionWithUsdcFeeFixture,
    });
    // When paying fees in USDC, can spend full CELO balance
    expect(maximumAmount).toEqual(BigNumber(100));
  });

  it("returns the full token balance when paying fees in different token", async () => {
    const maximumAmount = await estimateMaxSpendable({
      account: {
        ...accountWithTokenAccountFixture,
        balance: BigNumber(100),
        spendableBalance: BigNumber(100),
      },
      transaction: tokenTransactionWithUsdcFeeFixture,
    });
    // When paying fees in USDC for token transfer, can spend full token balance
    expect(maximumAmount).toEqual(BigNumber(212));
  });

  it("subtracts fees when paying in native CELO", async () => {
    // A valid Celo address is required so prepareTransaction doesn't early-return
    // before calling getFeesForTransaction (which is mocked to return BigNumber(12)).
    const validRecipient = "0x0000000000000000000000000000000000000001";
    const maximumAmount = await estimateMaxSpendable({
      account: { ...accountFixture, balance: BigNumber(100), spendableBalance: BigNumber(100) },
      transaction: { ...transactionFixture, recipient: validRecipient },
    });
    // Fees are mocked to BigNumber(12), so max spendable = 100 - 12 = 88
    expect(maximumAmount).toEqual(BigNumber(88));
  });

  it("subtracts fees when sending token and paying fees in the same token", async () => {
    const accountWithUsdcSubAccount = {
      ...accountFixture,
      balance: BigNumber(100),
      spendableBalance: BigNumber(100),
      subAccounts: [
        {
          ...usdcTokenAccount,
          balance: BigNumber(1000000000), // 1000 USDC in raw units (6 decimals)
          spendableBalance: BigNumber(1000000000),
        },
      ],
    };

    const maximumAmount = await estimateMaxSpendable({
      account: accountWithUsdcSubAccount,
      transaction: {
        ...usdcTransactionWithSameTokenFeeFixture,
        fees: BigNumber(50000000000000), // 0.00005 USDC: 50_000_000_000_000 in 18-decimal units = 50 in 6-decimal units
      },
    });

    // Balance: 1_000_000_000 (1000 USDC, 6 decimals)
    // Fee:    50_000_000_000_000 (18-decimal representation) → 50 base units (6-decimal)
    // Result: 1_000_000_000 - 50 = 999_999_950
    expect(maximumAmount).toEqual(BigNumber(999999950));
  });
});
