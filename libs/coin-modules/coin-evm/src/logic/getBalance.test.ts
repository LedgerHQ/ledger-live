import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import * as nodeModule from "../network/node";
import * as explorerModule from "../network/explorer";
import * as getStakesModule from "./getStakes";
import { getBalance } from ".";

describe("getBalance", () => {
  it.each([
    [
      "native balance only", // test description
      { lastTokenOperations: [] }, // operation
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

    jest.spyOn(nodeModule, "getNodeApi").mockReturnValue({
      getCoinBalance: jest.fn().mockResolvedValue(new BigNumber("10000000000000000000000")),
      getTokenBalance: mockGetTokenBalance,
    } as any);

    jest.spyOn(explorerModule, "getExplorerApi").mockReturnValue({
      getLastOperations: jest.fn().mockResolvedValue(operations),
    } as any);

    // Mock getStakes to return the expected stake data
    jest.spyOn(getStakesModule, "getStakes").mockResolvedValue({
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
    jest.spyOn(nodeModule, "getNodeApi").mockReturnValue({
      getCoinBalance: () => new BigNumber(10),
      getTokenBalance: (_currency: string, _address: string, contract: string) => {
        if (contract === "contract2") {
          throw new Error("Scam token");
        }
        return new BigNumber(2);
      },
    } as any);
    jest.spyOn(explorerModule, "getExplorerApi").mockReturnValue({
      getLastOperations: () => ({
        lastTokenOperations: [
          { contract: "contract1" },
          { contract: "contract1" },
          { contract: "contract2" },
        ],
      }),
    } as any);
    jest.spyOn(getStakesModule, "getStakes").mockResolvedValue({
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
    jest.spyOn(nodeModule, "getNodeApi").mockReturnValue({
      getCoinBalance: jest.fn().mockResolvedValue(new BigNumber("0")),
    } as any);

    jest.spyOn(explorerModule, "getExplorerApi").mockReturnValue({
      getLastOperations: jest.fn().mockResolvedValue({ lastTokenOperations: [] }),
    } as any);

    // Mock getStakes to return empty stakes
    jest.spyOn(getStakesModule, "getStakes").mockResolvedValue({
      items: [],
    });

    const result = await getBalance({} as CryptoCurrency, "address");
    expect(result[0]).toEqual({
      value: BigInt("0"),
      asset: { type: "native" },
    });
  });
});
