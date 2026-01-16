import BigNumber from "bignumber.js";

import { AccountSchema } from "./schema.prod";

declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void) => void;
declare const expect: (value: unknown) => { not: { toThrow: () => void } };

describe("schema.prod AccountSchema", () => {
  it("parses a basic account with sub account and operations", () => {
    const account = {
      type: "Account",
      id: "account:1",
      seedIdentifier: "seed-1",
      derivationMode: "ethM",
      index: 0,
      freshAddress: "0xexampleaddress",
      freshAddressPath: "44'/60'/0'/0/0",
      used: true,
      balance: new BigNumber("1000"),
      spendableBalance: new BigNumber("900"),
      creationDate: new Date("2024-01-01T00:00:00.000Z"),
      blockHeight: 123,
      currency: {
        type: "CryptoCurrency",
        id: "ethereum",
        name: "Ethereum",
        ticker: "ETH",
        units: [
          {
            name: "ether",
            code: "ETH",
            magnitude: 18,
          },
        ],
        managerAppName: "Ethereum",
        coinType: 60,
        scheme: "ethereum",
        color: "#627eea",
        family: "ethereum",
        explorerViews: [],
      },
      operationsCount: 1,
      operations: [
        {
          id: "operation:1",
          hash: "0xhash1",
          type: "IN",
          value: new BigNumber("1000"),
          fee: new BigNumber("10"),
          senders: ["0xsender"],
          recipients: ["0xrecipient"],
          blockHeight: 123,
          blockHash: "0xblockhash",
          accountId: "account:1",
          date: new Date("2024-01-01T00:00:00.000Z"),
          extra: {},
        },
      ],
      pendingOperations: [],
      lastSyncDate: new Date("2024-01-01T00:00:00.000Z"),
      subAccounts: [
        {
          type: "TokenAccount",
          id: "tokenAccount:1",
          parentId: "account:1",
          token: {
            type: "TokenCurrency",
            id: "ethereum/erc20/usdc",
            name: "USD Coin",
            ticker: "USDC",
            units: [
              {
                name: "usd-coin",
                code: "USDC",
                magnitude: 6,
              },
            ],
            contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            parentCurrency: {
              type: "CryptoCurrency",
              id: "ethereum",
              name: "Ethereum",
              ticker: "ETH",
              units: [
                {
                  name: "ether",
                  code: "ETH",
                  magnitude: 18,
                },
              ],
              managerAppName: "Ethereum",
              coinType: 60,
              scheme: "ethereum",
              color: "#627eea",
              family: "ethereum",
              explorerViews: [],
            },
            tokenType: "erc20",
          },
          balance: new BigNumber("2500"),
          spendableBalance: new BigNumber("2500"),
          creationDate: new Date("2024-01-01T00:00:00.000Z"),
          operationsCount: 1,
          operations: [
            {
              id: "operation:token:1",
              hash: "0xhash2",
              type: "OUT",
              value: new BigNumber("500"),
              fee: new BigNumber("5"),
              senders: ["0xsender"],
              recipients: ["0xrecipient"],
              blockHeight: 124,
              blockHash: "0xblockhash2",
              accountId: "tokenAccount:1",
              date: new Date("2024-01-02T00:00:00.000Z"),
              extra: {},
            },
          ],
          pendingOperations: [],
          balanceHistoryCache: {
            HOUR: {
              latestDate: null,
              balances: [],
            },
          },
          swapHistory: [],
        },
      ],
      balanceHistoryCache: {
        HOUR: {
          latestDate: null,
          balances: [],
        },
      },
      swapHistory: [],
    };

    expect(() => AccountSchema.parse(account)).not.toThrow();
  });
});
