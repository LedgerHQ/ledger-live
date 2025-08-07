import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import * as nodeModule from "../network/node";
import * as explorerModule from "../network/explorer";
import { getBalance } from ".";

describe("getBalance", () => {
  it.each([
    [
      "native balance only", // test description
      { lastTokenOperations: [] }, // operation
      {}, // token balances (empty)
      [{ value: BigInt("10000000000000000000000"), asset: { type: "native" } }], // expected
    ],
    [
      "native and token balances", // test description
      {
        lastTokenOperations: [{ contract: "0x123" }, { contract: "0x123" }, { contract: "0x456" }],
      }, // operations
      { "0x123": "1000000", "0x456": "2000000" }, // token balances
      [
        { value: BigInt("10000000000000000000000"), asset: { type: "native" } }, // native balance
        {
          value: BigInt("1000000"),
          asset: { type: "erc20", assetReference: "0x123" },
        },
        {
          value: BigInt("2000000"),
          asset: { type: "erc20", assetReference: "0x456" },
        },
      ], // expected
    ],
  ])("should return %s", async (_, operations, tokenBalances, expected) => {
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

    expect(await getBalance({} as CryptoCurrency, "")).toEqual(expected);
  });
});
