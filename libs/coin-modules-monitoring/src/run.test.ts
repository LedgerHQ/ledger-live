import { AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import * as bridgeModule from "@ledgerhq/live-common/bridge/impl";
import { makeSync } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import BigNumber from "bignumber.js";
import run from "./run";

describe("Coin Modules Monitoring", () => {
  beforeAll(() => {
    global.console = require("console");
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  describe("run", () => {
    it("produces log entries to be submitted, skipping failures", async () => {
      jest.spyOn(bridgeModule, "getAccountBridgeByFamily").mockReturnValue({
        sync: makeSync({
          getAccountShape: async info => {
            if (info.address === "2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S") {
              throw new Error("Unavailable");
            }
            const accountId = encodeAccountId({
              type: "js",
              version: "2",
              currencyId: info.currency.id,
              xpubOrAddress: info.initialAccount?.xpub ?? info.address,
              derivationMode: "",
            });
            const transactionCounts: Record<string, number> = {
              Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp: 500,
              Hbac8tM3SMbua9ZBqPRbEJ2n3FtikRJc7wFmZzpqbtBv: 0,
            };
            return {
              id: accountId,
              balance: new BigNumber(0),
              operationsCount: transactionCounts[info.address],
            };
          },
        }),
      } as AccountBridge<TransactionCommon>);

      const logs = await run(["solana"], ["pristine", "average", "big"]);

      expect(logs).toEqual({
        entries: expect.arrayContaining([
          {
            duration: expect.any(Number),
            currencyName: "solana",
            coinModuleName: "solana",
            operationType: "scan",
            accountType: "average",
            transactions: 500,
            accountAddressOrXpub: "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp",
            cpu: {
              max: expect.any(Number),
              average: expect.any(Number),
              min: expect.any(Number),
              p50: expect.any(Number),
              p90: expect.any(Number),
              p95: expect.any(Number),
              p99: expect.any(Number),
            },
            memory: {
              max: expect.any(Number),
              average: expect.any(Number),
              min: expect.any(Number),
              p50: expect.any(Number),
              p90: expect.any(Number),
              p95: expect.any(Number),
              p99: expect.any(Number),
            },
            totalNetworkCalls: 0, // no network call on unit tests
            networkCallsByDomain: {},
          },
          {
            duration: expect.any(Number),
            currencyName: "solana",
            coinModuleName: "solana",
            operationType: "sync",
            accountType: "average",
            transactions: 500,
            accountAddressOrXpub: "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp",
            cpu: {
              max: expect.any(Number),
              average: expect.any(Number),
              min: expect.any(Number),
              p50: expect.any(Number),
              p90: expect.any(Number),
              p95: expect.any(Number),
              p99: expect.any(Number),
            },
            memory: {
              max: expect.any(Number),
              average: expect.any(Number),
              min: expect.any(Number),
              p50: expect.any(Number),
              p90: expect.any(Number),
              p95: expect.any(Number),
              p99: expect.any(Number),
            },
            totalNetworkCalls: 0, // no network call on unit tests
            networkCallsByDomain: {},
          },
          {
            duration: expect.any(Number),
            currencyName: "solana",
            coinModuleName: "solana",
            operationType: "scan",
            accountType: "pristine",
            transactions: 0,
            accountAddressOrXpub: "Hbac8tM3SMbua9ZBqPRbEJ2n3FtikRJc7wFmZzpqbtBv",
            cpu: {
              max: expect.any(Number),
              average: expect.any(Number),
              min: expect.any(Number),
              p50: expect.any(Number),
              p90: expect.any(Number),
              p95: expect.any(Number),
              p99: expect.any(Number),
            },
            memory: {
              max: expect.any(Number),
              average: expect.any(Number),
              min: expect.any(Number),
              p50: expect.any(Number),
              p90: expect.any(Number),
              p95: expect.any(Number),
              p99: expect.any(Number),
            },
            totalNetworkCalls: 0, // no network call on unit tests
            networkCallsByDomain: {},
          },
          {
            duration: expect.any(Number),
            currencyName: "solana",
            coinModuleName: "solana",
            operationType: "sync",
            accountType: "pristine",
            transactions: 0,
            accountAddressOrXpub: "Hbac8tM3SMbua9ZBqPRbEJ2n3FtikRJc7wFmZzpqbtBv",
            cpu: {
              max: expect.any(Number),
              average: expect.any(Number),
              min: expect.any(Number),
              p50: expect.any(Number),
              p90: expect.any(Number),
              p95: expect.any(Number),
              p99: expect.any(Number),
            },
            memory: {
              max: expect.any(Number),
              average: expect.any(Number),
              min: expect.any(Number),
              p50: expect.any(Number),
              p90: expect.any(Number),
              p95: expect.any(Number),
              p99: expect.any(Number),
            },
            totalNetworkCalls: 0, // no network call on unit tests
            networkCallsByDomain: {},
          },
        ]),
        failed: true,
      });
    });
  });
});
