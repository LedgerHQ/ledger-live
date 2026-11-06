import type { ResolvedAccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import * as bridgeModule from "@ledgerhq/live-common/bridge/impl";
import { makeSync } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import BigNumber from "bignumber.js";
import { measureThroughput } from "./huge";
import run from "./run";

jest.mock("./huge");

jest.mock("@ledgerhq/live-common/bridge/impl", () => {
  const actual = jest.requireActual("@ledgerhq/live-common/bridge/impl");
  const mocked: Record<string, unknown> = { __esModule: true };
  for (const key of Object.keys(actual)) {
    let value: unknown;
    let assigned = false;
    Object.defineProperty(mocked, key, {
      configurable: true,
      enumerable: true,
      get: () => (assigned ? value : actual[key]),
      set: v => {
        value = v;
        assigned = true;
      },
    });
  }
  return mocked;
});

describe("Coin Modules Monitoring", () => {
  beforeAll(() => {
    global.console = require("console");
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  describe("run", () => {
    it("produces log entries to be submitted, skipping failures", async () => {
      jest.spyOn(bridgeModule, "getAccountBridgeByFamily").mockResolvedValue({
        sync: makeSync({
          getAccountShape: async info => {
            if (info.address === "3ot74WntJpc7mUQQyxi8zF2c21Hb2qM6K28Mb3epLc9U") {
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
      } as unknown as ResolvedAccountBridge<TransactionCommon>);

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
            opsPerSecond: expect.any(Number),
            callsPerOperation: 0,
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
            opsPerSecond: expect.any(Number),
            callsPerOperation: 0,
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

    it("keeps the scan when only the sync fails", async () => {
      let calls = 0;
      jest.spyOn(bridgeModule, "getAccountBridgeByFamily").mockResolvedValue({
        sync: makeSync({
          getAccountShape: async info => {
            if (++calls > 1) {
              throw new Error("Sync unavailable");
            }
            return {
              id: encodeAccountId({
                type: "js",
                version: "2",
                currencyId: info.currency.id,
                xpubOrAddress: info.address,
                derivationMode: "",
              }),
              balance: new BigNumber(0),
              operationsCount: 500,
            };
          },
        }),
      } as unknown as ResolvedAccountBridge<TransactionCommon>);

      const logs = await run(["solana"], ["average"]);

      expect(logs).toEqual({
        entries: [expect.objectContaining({ operationType: "scan" })],
        failed: true,
      });
    });

    it("reports the throughput of a huge account", async () => {
      jest.mocked(measureThroughput).mockResolvedValueOnce({
        operations: 300,
        pageDurations: [100, 100, 100],
        exhausted: false,
      });

      const logs = await run(["solana"], ["huge"]);

      expect(measureThroughput).toHaveBeenCalledWith(
        "solana",
        "solana",
        "2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S",
      );
      expect(logs).toEqual({
        entries: [
          expect.objectContaining({
            operationType: "throughput",
            accountType: "huge",
            duration: 300,
            transactions: 300,
            opsPerSecond: 1000,
            pages: 3,
            exhausted: false,
          }),
        ],
        failed: false,
      });
    });

    it("does not fail the run when a huge account fails", async () => {
      jest.mocked(measureThroughput).mockRejectedValueOnce(new Error("HTTP 429"));

      const logs = await run(["solana"], ["huge"]);

      expect(logs).toEqual({ entries: [], failed: false });
    });
  });
});
