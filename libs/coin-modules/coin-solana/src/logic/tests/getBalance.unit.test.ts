/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { DeepPartialReturn } from "@ledgerhq/coin-module-framework/test/utils";
import type { ChainAPI } from "../../network";
import type { StakeAccount } from "../../network/chain/stake-activation/rpc";
import { getBalance } from "../getBalance";
import { getStakeAccounts, computeUnstakeReserve } from "../getStakes";

jest.mock("../getStakes", () => ({
  getStakeAccounts: jest.fn().mockResolvedValue([]),
  computeUnstakeReserve: jest.fn().mockResolvedValue(0),
}));

const mockGetStakeAccounts = jest.mocked(getStakeAccounts);
const mockComputeUnstakeReserve = jest.mocked(computeUnstakeReserve);

function makeStakeAccountStub(lamports: number) {
  return { account: { onChainAcc: { account: { lamports } } } };
}

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";

describe("getBalance", () => {
  const mockGetBalance = jest.fn() as jest.MockedFunction<ChainAPI["getBalance"]>;
  const mockGetMinimumBalanceForRentExemption = jest.fn() as jest.MockedFunction<
    ChainAPI["getMinimumBalanceForRentExemption"]
  >;
  const mockGetParsedTokenAccountsByOwner = jest.fn() as jest.MockedFunction<
    DeepPartialReturn<ChainAPI["getParsedTokenAccountsByOwner"]>
  >;
  const mockGetParsedToken2022AccountsByOwner = jest.fn() as jest.MockedFunction<
    DeepPartialReturn<ChainAPI["getParsedTokenAccountsByOwner"]>
  >;

  const api = {
    getBalance: mockGetBalance,
    getMinimumBalanceForRentExemption: mockGetMinimumBalanceForRentExemption,
    getParsedTokenAccountsByOwner: mockGetParsedTokenAccountsByOwner,
    getParsedToken2022AccountsByOwner: mockGetParsedToken2022AccountsByOwner,
  } as unknown as ChainAPI;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return native balance with locked rent exemption", async () => {
    mockGetBalance.mockResolvedValue(1_000_000_000);
    mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
    mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });

    const result = await getBalance(api, TEST_ADDRESS);

    expect(result).toEqual([
      {
        value: BigInt(1_000_000_000),
        asset: { type: "native" },
        locked: BigInt(890880),
      },
    ]);
    expect(mockGetBalance).toHaveBeenCalledWith(TEST_ADDRESS);
    expect(mockGetMinimumBalanceForRentExemption).toHaveBeenCalledWith(0);
    expect(mockGetParsedToken2022AccountsByOwner).not.toHaveBeenCalled();
  });

  it("should include SPL Token balances", async () => {
    mockGetBalance.mockResolvedValue(1_000_000_000);
    mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    mockGetParsedTokenAccountsByOwner.mockResolvedValue({
      value: [
        {
          account: {
            data: {
              parsed: {
                info: {
                  mint: USDC_MINT,
                  tokenAmount: { amount: "5000000" },
                },
              },
            },
          },
        },
      ],
    });

    const result = await getBalance(api, TEST_ADDRESS);

    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      value: 5_000_000n,
      asset: { type: "spl-token", assetReference: USDC_MINT, assetOwner: TEST_ADDRESS },
    });
    expect(mockGetParsedToken2022AccountsByOwner).not.toHaveBeenCalled();
  });

  it("should include Token-2022 balances when enabled", async () => {
    mockGetBalance.mockResolvedValue(1_000_000_000);
    mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
    const PYUSD_MINT = "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo";
    mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });
    mockGetParsedToken2022AccountsByOwner.mockResolvedValue({
      value: [
        {
          account: {
            data: {
              parsed: {
                info: {
                  mint: PYUSD_MINT,
                  tokenAmount: { amount: "10000000" },
                },
              },
            },
          },
        },
      ],
    });

    const result = await getBalance(api, TEST_ADDRESS, { token2022Enabled: true });

    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      value: 10_000_000n,
      asset: { type: "spl-token-2022", assetReference: PYUSD_MINT, assetOwner: TEST_ADDRESS },
    });
    expect(mockGetParsedToken2022AccountsByOwner).toHaveBeenCalledWith(TEST_ADDRESS);
  });

  it("should aggregate multiple token accounts for the same mint", async () => {
    mockGetBalance.mockResolvedValue(1_000_000_000);
    mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    mockGetParsedTokenAccountsByOwner.mockResolvedValue({
      value: [
        {
          account: {
            data: { parsed: { info: { mint: USDC_MINT, tokenAmount: { amount: "3000000" } } } },
          },
        },
        {
          account: {
            data: { parsed: { info: { mint: USDC_MINT, tokenAmount: { amount: "7000000" } } } },
          },
        },
      ],
    });

    const result = await getBalance(api, TEST_ADDRESS);

    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      value: 10_000_000n,
      asset: { type: "spl-token", assetReference: USDC_MINT, assetOwner: TEST_ADDRESS },
    });
  });

  it("should propagate errors from getBalance", async () => {
    mockGetBalance.mockRejectedValue(new Error("RPC error"));
    mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
    mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });

    await expect(getBalance(api, TEST_ADDRESS)).rejects.toThrow("RPC error");
  });

  describe("stakeAccounts", () => {
    it("should include staked lamports in totalBalance", async () => {
      mockGetBalance.mockResolvedValue(1_000_000_000);
      mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
      mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });
      mockGetStakeAccounts.mockResolvedValue([
        makeStakeAccountStub(2_000_000_000),
      ] as StakeAccount[]);
      mockComputeUnstakeReserve.mockResolvedValue(0);

      const result = await getBalance(api, TEST_ADDRESS);

      expect(result[0]).toEqual({
        value: 3_000_000_000n,
        asset: { type: "native" },
        locked: 890880n + 2_000_000_000n,
      });
    });

    it("should include unstakeReserve in locked", async () => {
      mockGetBalance.mockResolvedValue(1_000_000_000);
      mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
      mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });
      mockGetStakeAccounts.mockResolvedValue([
        makeStakeAccountStub(2_000_000_000),
      ] as StakeAccount[]);
      mockComputeUnstakeReserve.mockResolvedValue(11000);

      const result = await getBalance(api, TEST_ADDRESS);

      // locked = rentExemptMin + stakedLamports + unstakeReserve
      expect(result[0]).toEqual({
        value: 3_000_000_000n,
        asset: { type: "native" },
        locked: 890880n + 2_000_000_000n + 11000n,
      });
    });

    it("should clamp locked to totalBalance when rawLocked exceeds it", async () => {
      mockGetBalance.mockResolvedValue(100);
      mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
      mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });
      mockGetStakeAccounts.mockResolvedValue([makeStakeAccountStub(1000)] as StakeAccount[]);
      mockComputeUnstakeReserve.mockResolvedValue(999_999);

      const result = await getBalance(api, TEST_ADDRESS);

      // totalBalance = 100 + 1000 = 1100
      // rawLocked = 100 (balance < rentExemptMin) + 1000 + 999_999 = 1_001_099 > 1100
      expect(result[0]).toEqual({
        value: 1100n,
        asset: { type: "native" },
        locked: 1100n,
      });
    });

    it("should sum lamports across multiple stake accounts", async () => {
      mockGetBalance.mockResolvedValue(500_000_000);
      mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
      mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });
      mockGetStakeAccounts.mockResolvedValue([
        makeStakeAccountStub(1_000_000_000),
        makeStakeAccountStub(3_000_000_000),
      ] as StakeAccount[]);
      mockComputeUnstakeReserve.mockResolvedValue(0);

      const result = await getBalance(api, TEST_ADDRESS);

      expect(result[0]).toEqual({
        value: 4_500_000_000n,
        asset: { type: "native" },
        locked: 890880n + 4_000_000_000n,
      });
    });
  });
});
