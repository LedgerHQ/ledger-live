import { getBalance } from "./getBalance";
import {
  fetchBalances,
  fetchERC20TransactionsWithPages,
  fetchERC20TokenBalance,
} from "../network/api";
import {
  TEST_ADDRESSES,
  createMockBalanceResponse,
  createMockERC20Transfer,
} from "../test/fixtures";

jest.mock("../network/api");

const mockedFetchBalances = fetchBalances as jest.MockedFunction<typeof fetchBalances>;
const mockedFetchERC20TransactionsWithPages =
  fetchERC20TransactionsWithPages as jest.MockedFunction<typeof fetchERC20TransactionsWithPages>;
const mockedFetchERC20TokenBalance = fetchERC20TokenBalance as jest.MockedFunction<
  typeof fetchERC20TokenBalance
>;

describe("getBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return native balance for address with no tokens", async () => {
    mockedFetchBalances.mockResolvedValueOnce(
      createMockBalanceResponse({
        spendable_balance: "1000000000000000000",
      }),
    );
    mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([]);

    const result = await getBalance(TEST_ADDRESSES.F1_ADDRESS);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      value: 1000000000000000000n,
      asset: { type: "native" },
    });
  });

  it("should return native and token balances", async () => {
    const contractAddress = TEST_ADDRESSES.ERC20_CONTRACT.toLowerCase();

    mockedFetchBalances.mockResolvedValueOnce(
      createMockBalanceResponse({
        spendable_balance: "1000000000000000000",
      }),
    );
    mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([
      createMockERC20Transfer({
        contract_address: contractAddress,
      }),
    ]);
    mockedFetchERC20TokenBalance.mockResolvedValueOnce("500000000000000000");

    const result = await getBalance(TEST_ADDRESSES.F4_ADDRESS);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      value: 1000000000000000000n,
      asset: { type: "native" },
    });
    expect(result[1]).toEqual({
      value: 500000000000000000n,
      asset: { type: "erc20", assetReference: contractAddress },
    });
  });

  it("should not include token with zero balance", async () => {
    const contractAddress = TEST_ADDRESSES.ERC20_CONTRACT.toLowerCase();

    mockedFetchBalances.mockResolvedValueOnce(
      createMockBalanceResponse({
        spendable_balance: "1000000000000000000",
      }),
    );
    mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([
      createMockERC20Transfer({
        contract_address: contractAddress,
      }),
    ]);
    mockedFetchERC20TokenBalance.mockResolvedValueOnce("0");

    const result = await getBalance(TEST_ADDRESSES.F4_ADDRESS);

    expect(result).toHaveLength(1);
    expect(result[0].asset.type).toBe("native");
  });

  it("should deduplicate contract addresses from transactions", async () => {
    const contractAddress = TEST_ADDRESSES.ERC20_CONTRACT.toLowerCase();

    mockedFetchBalances.mockResolvedValueOnce(
      createMockBalanceResponse({
        spendable_balance: "1000000000000000000",
      }),
    );
    mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([
      createMockERC20Transfer({
        contract_address: contractAddress,
        id: "1",
      }),
      createMockERC20Transfer({
        contract_address: contractAddress,
        id: "2",
      }),
    ]);
    mockedFetchERC20TokenBalance.mockResolvedValueOnce("500000000000000000");

    const result = await getBalance(TEST_ADDRESSES.F4_ADDRESS);

    // Should only call fetchERC20TokenBalance once for the deduplicated contract
    expect(mockedFetchERC20TokenBalance).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(2);
  });

  describe("error handling", () => {
    it("should continue fetching other token balances when one fails", async () => {
      const contractAddress1 = "0x1111111111111111111111111111111111111111";
      const contractAddress2 = "0x2222222222222222222222222222222222222222";

      mockedFetchBalances.mockResolvedValueOnce(
        createMockBalanceResponse({
          spendable_balance: "1000000000000000000",
        }),
      );
      mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([
        createMockERC20Transfer({
          contract_address: contractAddress1,
          id: "1",
        }),
        createMockERC20Transfer({
          contract_address: contractAddress2,
          id: "2",
        }),
      ]);
      // First token balance fetch fails
      mockedFetchERC20TokenBalance.mockRejectedValueOnce(new Error("API error"));
      // Second token balance fetch succeeds
      mockedFetchERC20TokenBalance.mockResolvedValueOnce("500000000000000000");

      const result = await getBalance(TEST_ADDRESSES.F4_ADDRESS);

      // Should still return native balance + successful token balance
      expect(result).toHaveLength(2);
      expect(result[0].asset.type).toBe("native");
      expect(result[1].asset.type).toBe("erc20");
      expect(result[1].value).toBe(500000000000000000n);
    });

    it("should return only native balance when all token fetches fail", async () => {
      const contractAddress = TEST_ADDRESSES.ERC20_CONTRACT.toLowerCase();

      mockedFetchBalances.mockResolvedValueOnce(
        createMockBalanceResponse({
          spendable_balance: "1000000000000000000",
        }),
      );
      mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([
        createMockERC20Transfer({
          contract_address: contractAddress,
        }),
      ]);
      mockedFetchERC20TokenBalance.mockRejectedValueOnce(new Error("API error"));

      const result = await getBalance(TEST_ADDRESSES.F4_ADDRESS);

      // Should still return native balance even when token fetch fails
      expect(result).toHaveLength(1);
      expect(result[0].asset.type).toBe("native");
    });
  });
});
