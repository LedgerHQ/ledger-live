import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { getExplorerApi } from "../network/explorer";
import { getNodeApi } from "../network/node";
import { mockNodeApi } from "../network/node/node.fixtures";
import { getStakes } from "./getStakes";
import { getBalance } from ".";

jest.mock("../network/node", () => ({
  ...jest.requireActual("../network/node"),
  getNodeApi: jest.fn(),
}));

jest.mock("../network/explorer", () => ({
  getExplorerApi: jest.fn(),
}));

jest.mock("./getStakes", () => ({
  getStakes: jest.fn(),
}));

const mockGetNodeApi = jest.mocked(getNodeApi);
const mockGetExplorerApi = jest.mocked(getExplorerApi);
const mockGetStakes = jest.mocked(getStakes);

describe("getBalance", () => {
  const nodeApiMock = mockNodeApi();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodeApi.mockReturnValue(nodeApiMock);
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
    nodeApiMock.getCoinBalance.mockResolvedValue(new BigNumber("10000000000000000000000"));
    nodeApiMock.getTokenBalance.mockImplementation(
      (_currency: unknown, _address: string, contractAddress: string) =>
        Promise.resolve(
          new BigNumber((tokenBalances as Record<string, string>)[contractAddress] || "0"),
        ),
    );

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
    nodeApiMock.getCoinBalance.mockResolvedValue(new BigNumber(10));
    nodeApiMock.getTokenBalance.mockImplementation(
      (_currency: unknown, _address: string, contract: string) => {
        if (contract === "contract2") {
          return Promise.reject(new Error("Scam token"));
        }
        return Promise.resolve(new BigNumber(2));
      },
    );
    mockGetExplorerApi.mockReturnValue({
      getOperations: () =>
        Promise.resolve({
          lastTokenOperations: [
            { contract: "contract1" },
            { contract: "contract1" },
            { contract: "contract2" },
          ],
        } as any),
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
    nodeApiMock.getCoinBalance.mockResolvedValue(new BigNumber(0));

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
