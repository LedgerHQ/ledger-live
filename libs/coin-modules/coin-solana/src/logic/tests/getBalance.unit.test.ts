import type { ChainAPI } from "../../network";
import { getBalance } from "../getBalance";

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";

describe("getBalance", () => {
  const mockGetBalance = jest.fn();
  const mockGetMinimumBalanceForRentExemption = jest.fn();
  const mockGetParsedTokenAccountsByOwner = jest.fn();
  const mockGetParsedToken2022AccountsByOwner = jest.fn();

  const api = {
    getBalance: mockGetBalance,
    getMinimumBalanceForRentExemption: mockGetMinimumBalanceForRentExemption,
    getParsedTokenAccountsByOwner: mockGetParsedTokenAccountsByOwner,
    getParsedToken2022AccountsByOwner: mockGetParsedToken2022AccountsByOwner,
  } as unknown as ChainAPI;

  afterEach(() => {
    jest.clearAllMocks();
  });

  function stubEmptyTokenAccounts() {
    mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });
    mockGetParsedToken2022AccountsByOwner.mockResolvedValue({ value: [] });
  }

  it("should return native balance with locked rent exemption", async () => {
    mockGetBalance.mockResolvedValue(1_000_000_000);
    mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
    stubEmptyTokenAccounts();

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
    mockGetParsedToken2022AccountsByOwner.mockResolvedValue({ value: [] });

    const result = await getBalance(api, TEST_ADDRESS);

    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      value: 5_000_000n,
      asset: { type: "spl-token", assetReference: USDC_MINT },
    });
  });

  it("should include Token-2022 balances", async () => {
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

    const result = await getBalance(api, TEST_ADDRESS);

    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      value: 10_000_000n,
      asset: { type: "spl-token-2022", assetReference: PYUSD_MINT },
    });
  });

  it("should propagate errors from getBalance", async () => {
    mockGetBalance.mockRejectedValue(new Error("RPC error"));
    mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
    stubEmptyTokenAccounts();

    await expect(getBalance(api, TEST_ADDRESS)).rejects.toThrow("RPC error");
  });

});
