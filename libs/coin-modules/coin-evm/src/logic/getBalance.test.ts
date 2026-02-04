import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { getExplorerApi } from "../network/explorer";
import { getNodeApi } from "../network/node";
import { getStakes } from "./getStakes";
import { getBalance } from ".";

jest.mock("../network/node", () => ({
  getNodeApi: jest.fn(),
}));

jest.mock("../network/explorer", () => ({
  getExplorerApi: jest.fn(),
}));

jest.mock("./getStakes", () => ({
  getStakes: jest.fn(),
}));

const mockGetNodeApi = getNodeApi as jest.Mock;
const mockGetExplorerApi = getExplorerApi as jest.Mock;
const mockGetStakes = getStakes as jest.Mock;

describe("getBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [
      "native balance only", // test description
      { lastTokenOperations: [], nextPagingToken: "" }, // operation
      {}, // token balances (empty)
      [
        {
          value: BigInt("10000000000000000000000"),
          asset: { type: "native" },
        },
        {
          value: BigInt("10000000000000000000000"),
          asset: { type: "native" },
          stake: {
            uid: "address",
            address: "address",
            state: "active",
            asset: { type: "native" },
            amount: BigInt("10000000000000000000000"),
          },
        },
      ], // expected
    ],
    [
      "native and token balances", // test description
      {
        lastTokenOperations: [{ contract: "0x123" }, { contract: "0x123" }, { contract: "0x456" }],
        nextPagingToken: "",
      }, // operations
      { "0x123": "1000000", "0x456": "2000000" }, // token balances
      [
        {
          value: BigInt("10000000000000000000000"),
          asset: { type: "native" },
        }, // native balance
        {
          value: BigInt("10000000000000000000000"),
          asset: { type: "native" },
          stake: {
            uid: "address",
            address: "address",
            state: "active",
            asset: { type: "native" },
            amount: BigInt("10000000000000000000000"),
          },
        }, // stake
        {
          value: BigInt("1000000"),
          asset: { type: "erc20", assetReference: "0x123", assetOwner: "address" },
        },
        {
          value: BigInt("2000000"),
          asset: { type: "erc20", assetReference: "0x456", assetOwner: "address" },
        },
      ], // expected
    ],
  ])("returns %s", async (_, operations, tokenBalances, expected) => {
    const mockGetTokenBalance = jest
      .fn()
      .mockImplementation((_currency, _address, contractAddress) => {
        return new BigNumber((tokenBalances as any)[contractAddress] || "0");
      });

    mockGetNodeApi.mockReturnValue({
      getCoinBalance: jest.fn().mockResolvedValue(new BigNumber("10000000000000000000000")),
      getTokenBalance: mockGetTokenBalance,
    });

    mockGetExplorerApi.mockReturnValue({
      getOperations: jest.fn().mockResolvedValue(operations),
    });

    // Mock getStakes to return the expected stake data
    mockGetStakes.mockResolvedValue({
      items: [
        {
          uid: "address",
          address: "address",
          state: "active",
          asset: { type: "native" },
          amount: BigInt("10000000000000000000000"),
        },
      ],
    });

    expect(await getBalance({} as CryptoCurrency, "address")).toEqual(expected);
  });

  it("is resilient when failing to fetch token balances", async () => {
    mockGetNodeApi.mockReturnValue({
      getCoinBalance: () => new BigNumber(10),
      getTokenBalance: (_currency: string, _address: string, contract: string) => {
        if (contract === "contract2") {
          throw new Error("Scam token");
        }
        return new BigNumber(2);
      },
    });
    mockGetExplorerApi.mockReturnValue({
      getOperations: () => ({
        lastTokenOperations: [
          { contract: "contract1" },
          { contract: "contract1" },
          { contract: "contract2" },
        ],
      }),
    });
    mockGetStakes.mockResolvedValue({
      items: [],
    });

    const result = await getBalance({} as CryptoCurrency, "address");

    expect(result).toEqual([
      { asset: { type: "native" }, value: 10n },
      {
        asset: {
          type: "erc20",
          assetReference: "contract1",
          assetOwner: "address",
        },
        value: 2n,
      },
    ]);
  });

  it("returns empty stake when balance is zero", async () => {
    mockGetNodeApi.mockReturnValue({
      getCoinBalance: jest.fn().mockResolvedValue(new BigNumber("0")),
    });

    mockGetExplorerApi.mockReturnValue({
      getOperations: jest.fn().mockResolvedValue({ lastTokenOperations: [], nextPagingToken: "" }),
    });

    // Mock getStakes to return empty stakes
    mockGetStakes.mockResolvedValue({
      items: [],
    });

    const result = await getBalance({} as CryptoCurrency, "address");
    expect(result[0]).toEqual({
      value: BigInt("0"),
      asset: { type: "native" },
    });
  });
});
