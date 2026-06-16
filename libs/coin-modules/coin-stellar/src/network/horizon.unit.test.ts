import { BadResponseError, Horizon, NotFoundError } from "@stellar/stellar-sdk";
import coinConfig, { type StellarCoinConfig } from "../config";
import type { RawOperation } from "../types";
import { NetworkCongestionLevel } from "../types/model";
import * as serialization from "./serialization";
import {
  broadcastTransaction,
  fetchAllLedgerOperations,
  fetchBaseFee,
  fetchLedgerRecord,
  fetchOperations,
  getLastBlock,
} from "./horizon";

jest.mock("./serialization", () => {
  const actual = jest.requireActual<typeof import("./serialization")>("./serialization");
  return {
    ...actual,
    rawOperationsToOperations: jest.fn(),
  };
});

const rawOperationsToOperationsMock =
  serialization.rawOperationsToOperations as jest.MockedFunction<
    typeof serialization.rawOperationsToOperations
  >;

const TEST_HORIZON_URL = "https://horizon-stellar-unit-test.invalid/";

const signedTxFixture =
  "AAAAAgAAAABRUCgFba+DTbei2ifpyYt5w2Hh0VyZ+X9fayjIDne7YAAAAGQCkDOGAAAABQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAQAAAACEIuPfWXgM8WhyqjrpFdIcGV1SUVhMzPUm4YspNHF60QAAAAAAAAAAALkd2QAAAAAAAAABDne7YAAAAEAASzsT/yDIfCfEDstkfnznXjiN7rNd7PkKQEn+rRIFm9EHoirGfHipWoBdYMrc6ixQD/0y0of1piSid8TLiFAB";

function baseCoinConfig(overrides: Partial<StellarCoinConfig> = {}): StellarCoinConfig {
  return {
    status: { type: "active" },
    explorer: { url: TEST_HORIZON_URL, fetchLimit: 100 },
    useStaticFees: true,
    enableNetworkLogs: false,
    ...overrides,
  } as StellarCoinConfig;
}

const HORIZON_SERVER_SPY_METHODS = [
  "ledgers",
  "operations",
  "feeStats",
  "submitTransaction",
] as const;

function restoreHorizonServerPrototypeSpies(): void {
  const proto = Horizon.Server.prototype as unknown as Record<string, unknown>;
  for (const key of HORIZON_SERVER_SPY_METHODS) {
    const fn = proto[key];
    if (jest.isMockFunction(fn)) {
      fn.mockRestore();
    }
  }
}

function opBuilder(partial: Partial<RawOperation> & { paging_token: string }): RawOperation {
  const { paging_token, ...rest } = partial;
  return {
    id: "1",
    paging_token,
    source_account: "GSOURCEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    transaction_successful: true,
    created_at: "2020-01-01T00:00:00Z",
    type: "payment",
    transaction_hash: "txh",
    ...rest,
  } as RawOperation;
}

describe("horizon.ts (unit, spies)", () => {
  let originalGetCoinConfig: () => StellarCoinConfig;

  beforeAll(() => {
    originalGetCoinConfig = coinConfig.getCoinConfig;
    coinConfig.setCoinConfig(() => baseCoinConfig());
  });

  afterAll(() => {
    coinConfig.setCoinConfig(originalGetCoinConfig);
  });

  beforeEach(() => {
    restoreHorizonServerPrototypeSpies();
    rawOperationsToOperationsMock.mockReset();
    rawOperationsToOperationsMock.mockImplementation(
      jest.requireActual<typeof import("./serialization")>("./serialization")
        .rawOperationsToOperations,
    );
  });

  describe("fetchLedgerRecord", () => {
    it("maps NotFoundError to Stellar ledger not found message", async () => {
      jest.spyOn(Horizon.Server.prototype, "ledgers").mockReturnValue({
        ledger: jest.fn().mockReturnValue({
          call: jest.fn().mockRejectedValue(new NotFoundError("not found", {})),
        }),
      } as unknown as ReturnType<Horizon.Server["ledgers"]>);

      await expect(fetchLedgerRecord(999)).rejects.toThrow("Stellar ledger 999 not found");
    });

    it("returns ledger record on success", async () => {
      const ledger = { sequence: 7, hash: "h".repeat(64), closed_at: "2015-07-20T20:27:50Z" };
      jest.spyOn(Horizon.Server.prototype, "ledgers").mockReturnValue({
        ledger: jest.fn().mockReturnValue({
          call: jest.fn().mockResolvedValue(ledger),
        }),
      } as unknown as ReturnType<Horizon.Server["ledgers"]>);

      const rec = await fetchLedgerRecord(7);
      expect(rec.sequence).toBe(7);
      expect(rec.hash).toBe(ledger.hash);
    });
  });

  describe("fetchAllLedgerOperations", () => {
    it("maps NotFoundError to Stellar ledger not found message", async () => {
      jest.spyOn(Horizon.Server.prototype, "operations").mockReturnValue({
        forLedger: jest.fn().mockReturnThis(),
        includeFailed: jest.fn().mockReturnThis(),
        join: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue({
          call: jest.fn().mockRejectedValue(new NotFoundError("missing", {})),
        }),
      } as unknown as ReturnType<Horizon.Server["operations"]>);

      await expect(fetchAllLedgerOperations(4242)).rejects.toThrow("Stellar ledger 4242 not found");
    });

    describe("with fetchLimit=2", () => {
      beforeEach(() => {
        coinConfig.setCoinConfig(() =>
          baseCoinConfig({ explorer: { url: TEST_HORIZON_URL, fetchLimit: 2 } }),
        );
      });

      afterEach(() => {
        coinConfig.setCoinConfig(() => baseCoinConfig());
      });

      it("paginates when first page is full then next page is empty", async () => {
        const op1 = opBuilder({ paging_token: "1", id: "a" });
        const op2 = opBuilder({ paging_token: "2", id: "b" });
        const secondPage = { records: [] as RawOperation[] };
        const firstPage = {
          records: [op1, op2],
          next: jest.fn().mockResolvedValue(secondPage),
        };
        jest.spyOn(Horizon.Server.prototype, "operations").mockReturnValue({
          forLedger: jest.fn().mockReturnThis(),
          includeFailed: jest.fn().mockReturnThis(),
          join: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnValue({
            call: jest.fn().mockResolvedValue(firstPage),
          }),
        } as unknown as ReturnType<Horizon.Server["operations"]>);

        const out = await fetchAllLedgerOperations(10);
        expect(out).toHaveLength(2);
        expect(firstPage.next).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("fetchOperations", () => {
    it("throws LedgerAPI4xx with status 429 when Horizon returns too many requests", async () => {
      jest.spyOn(Horizon.Server.prototype, "operations").mockReturnValue({
        forAccount: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        cursor: jest.fn().mockReturnThis(),
        includeFailed: jest.fn().mockReturnThis(),
        join: jest.fn().mockReturnValue({
          call: jest.fn().mockRejectedValue(new Error("too many requests")),
        }),
      } as unknown as ReturnType<Horizon.Server["operations"]>);

      await expect(
        fetchOperations({
          accountId: "aid",
          addr: "GADDRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          minHeight: 0,
          order: "asc",
          cursor: undefined,
        }),
      ).rejects.toEqual(expect.objectContaining({ name: "LedgerAPI4xx", status: 429 }));
    });

    it("sets next cursor to empty when Horizon returns fewer records than the fetch limit", async () => {
      const rawA = opBuilder({ paging_token: "pt-a", id: "1" });
      const rawB = opBuilder({ paging_token: "pt-b", id: "2" });
      rawOperationsToOperationsMock.mockResolvedValue([{ type: "mock-op" } as never]);

      jest.spyOn(Horizon.Server.prototype, "operations").mockReturnValue({
        forAccount: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        cursor: jest.fn().mockReturnThis(),
        includeFailed: jest.fn().mockReturnThis(),
        join: jest.fn().mockReturnValue({
          call: jest.fn().mockResolvedValue({ records: [rawA, rawB] }),
        }),
      } as unknown as ReturnType<Horizon.Server["operations"]>);

      // fetchLimit defaults to 100, Horizon returned 2 records → incomplete page → no next cursor
      const page = await fetchOperations({
        accountId: "aid",
        addr: "GADDRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        minHeight: 100,
        order: "desc",
        cursor: undefined,
      });
      expect(page.next).toBe("");
      expect(page.items).toHaveLength(1);
    });

    describe("with fetchLimit=2", () => {
      beforeEach(() => {
        coinConfig.setCoinConfig(() =>
          baseCoinConfig({ explorer: { url: TEST_HORIZON_URL, fetchLimit: 2 } }),
        );
      });

      afterEach(() => {
        coinConfig.setCoinConfig(() => baseCoinConfig());
      });

      it("continues pagination when unsupported ops are filtered from a full page", async () => {
        const rawA = opBuilder({ paging_token: "pt-a", id: "1" });
        const rawB = opBuilder({ paging_token: "pt-b", id: "2" });
        // Only 1 op survives filtering (e.g. the other was an unsupported type)
        rawOperationsToOperationsMock.mockResolvedValue([{ type: "mock-op" } as never]);

        jest.spyOn(Horizon.Server.prototype, "operations").mockReturnValue({
          forAccount: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          cursor: jest.fn().mockReturnThis(),
          includeFailed: jest.fn().mockReturnThis(),
          join: jest.fn().mockReturnValue({
            call: jest.fn().mockResolvedValue({ records: [rawA, rawB] }),
          }),
        } as unknown as ReturnType<Horizon.Server["operations"]>);

        const page = await fetchOperations({
          accountId: "aid",
          addr: "GADDRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          minHeight: 0,
          order: "desc",
          cursor: undefined,
        });
        expect(page.next).toBe("pt-b");
        expect(page.items).toHaveLength(1);
      });

      it("stops pagination when Horizon returns fewer records than fetchLimit", async () => {
        const rawA = opBuilder({ paging_token: "pt-a", id: "1" });
        // 1 record < fetchLimit of 2 → last page
        rawOperationsToOperationsMock.mockResolvedValue([{ type: "mock-op" } as never]);

        jest.spyOn(Horizon.Server.prototype, "operations").mockReturnValue({
          forAccount: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          cursor: jest.fn().mockReturnThis(),
          includeFailed: jest.fn().mockReturnThis(),
          join: jest.fn().mockReturnValue({
            call: jest.fn().mockResolvedValue({ records: [rawA] }),
          }),
        } as unknown as ReturnType<Horizon.Server["operations"]>);

        const page = await fetchOperations({
          accountId: "aid",
          addr: "GADDRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          minHeight: 0,
          order: "desc",
          cursor: undefined,
        });
        expect(page.next).toBe("");
        expect(page.items).toHaveLength(1);
      });

      it("skips to next page when all ops on a full page are filtered out", async () => {
        const rawA = opBuilder({ paging_token: "pt-a", id: "1" });
        const rawB = opBuilder({ paging_token: "pt-b", id: "2" });
        const rawC = opBuilder({ paging_token: "pt-c", id: "3" });

        // First call: full page (2 ops), all filtered → recurse
        // Second call: partial page (1 op), 1 survives → return
        rawOperationsToOperationsMock
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([{ type: "mock-op" } as never]);

        const callMock = jest
          .fn()
          .mockResolvedValueOnce({ records: [rawA, rawB] })
          .mockResolvedValueOnce({ records: [rawC] });

        jest.spyOn(Horizon.Server.prototype, "operations").mockReturnValue({
          forAccount: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          cursor: jest.fn().mockReturnThis(),
          includeFailed: jest.fn().mockReturnThis(),
          join: jest.fn().mockReturnValue({ call: callMock }),
        } as unknown as ReturnType<Horizon.Server["operations"]>);

        const page = await fetchOperations({
          accountId: "aid",
          addr: "GADDRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          minHeight: 999999,
          order: "desc",
          cursor: undefined,
        });
        // Skipped the empty first page, returned the second page's result
        expect(page.items).toHaveLength(1);
        expect(page.next).toBe("");
        expect(callMock).toHaveBeenCalledTimes(2);
      });

      it("bails out after MAX_SKIP_PAGES consecutive empty pages", async () => {
        const rawA = opBuilder({ paging_token: "pt-a", id: "1" });
        const rawB = opBuilder({ paging_token: "pt-b", id: "2" });

        // Every page returns zero filtered ops
        rawOperationsToOperationsMock.mockResolvedValue([]);

        const callMock = jest.fn().mockResolvedValue({ records: [rawA, rawB] });

        jest.spyOn(Horizon.Server.prototype, "operations").mockReturnValue({
          forAccount: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          cursor: jest.fn().mockReturnThis(),
          includeFailed: jest.fn().mockReturnThis(),
          join: jest.fn().mockReturnValue({ call: callMock }),
        } as unknown as ReturnType<Horizon.Server["operations"]>);

        const page = await fetchOperations({
          accountId: "aid",
          addr: "GADDRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          minHeight: 999999,
          order: "desc",
          cursor: undefined,
        });
        // Exhausted skip budget: returns empty items with cursor for caller to resume
        expect(page.items).toHaveLength(0);
        expect(page.next).toBe("pt-b");
        // MAX_SKIP_PAGES = 50 iterations
        expect(callMock).toHaveBeenCalledTimes(50);
      });
    });
  });

  describe("fetchBaseFee", () => {
    beforeEach(() => {
      coinConfig.setCoinConfig(() => baseCoinConfig({ useStaticFees: false }));
    });

    afterEach(() => {
      coinConfig.setCoinConfig(() => baseCoinConfig());
    });

    test.each([
      ["0.4", "low usage -> LOW", NetworkCongestionLevel.LOW],
      ["0.6", "medium usage -> MEDIUM", NetworkCongestionLevel.MEDIUM],
      ["0.9", "high usage -> HIGH", NetworkCongestionLevel.HIGH],
    ])("ledger_capacity_usage %s (%s)", async (usage, _label, expectedLevel) => {
      jest.spyOn(Horizon.Server.prototype, "feeStats").mockResolvedValue({
        ledger_capacity_usage: usage,
        fee_charged: { mode: "200" },
      } as Awaited<ReturnType<Horizon.Server["feeStats"]>>);

      const fees = await fetchBaseFee();
      expect(fees.networkCongestionLevel).toBe(expectedLevel);
      expect(fees.recommendedFee).toBe(200);
    });

    it("falls back to defaults when feeStats throws", async () => {
      jest
        .spyOn(Horizon.Server.prototype, "feeStats")
        .mockRejectedValue(new Error("network error"));

      const fees = await fetchBaseFee();
      expect(fees.baseFee).toBeGreaterThan(0);
      expect(fees.networkCongestionLevel).toBe(NetworkCongestionLevel.MEDIUM);
    });
  });

  describe("getLastBlock", () => {
    it("returns height hash and time from latest ledger record", async () => {
      jest.spyOn(Horizon.Server.prototype, "ledgers").mockReturnValue({
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue({
          call: jest.fn().mockResolvedValue({
            records: [{ sequence: 42, hash: "ab".repeat(32), closed_at: "2018-09-15T15:40:05Z" }],
          }),
        }),
      } as unknown as ReturnType<Horizon.Server["ledgers"]>);

      const block = await getLastBlock();
      expect(block.height).toBe(42);
      expect(block.hash).toBe("ab".repeat(32));
      expect(block.time).toEqual(new Date("2018-09-15T15:40:05Z"));
    });
  });

  describe("broadcastTransaction decode / documentation edge cases", () => {
    let submitTransactionSpy: jest.SpiedFunction<Horizon.Server["submitTransaction"]>;

    beforeEach(() => {
      submitTransactionSpy = jest
        .spyOn(Horizon.Server.prototype, "submitTransaction")
        .mockRejectedValue(new Error("mock not configured"));
    });

    it("uses Unknown transaction result code when Horizon code is not in the map", async () => {
      const body = {
        type: "https://stellar.org/horizon-errors/transaction_failed",
        title: "Transaction Failed",
        status: 400,
        detail: "failed",
        extras: {
          result_codes: { transaction: "tx_completely_unknown", operations: [] as string[] },
          result_xdr: "AAAAAAAAAGT////4AAAAAA==",
          envelope_xdr: signedTxFixture,
        },
      };
      submitTransactionSpy.mockRejectedValue(
        new BadResponseError(
          "Transaction submission failed. Server responded: 400 Bad Request",
          body,
        ),
      );

      await expect(broadcastTransaction(signedTxFixture)).rejects.toMatchObject({
        name: "StellarBroadcastFailedError",
        documentationSummary: "Unknown transaction result code.",
      });
    });

    it("marks decodeFailed when result_xdr cannot be decoded", async () => {
      const body = {
        type: "https://stellar.org/horizon-errors/transaction_failed",
        title: "Transaction Failed",
        status: 400,
        detail: "failed",
        extras: {
          result_codes: { transaction: "tx_failed", operations: [] as string[] },
          result_xdr: "not-valid-base64!!!",
          envelope_xdr: signedTxFixture,
        },
      };
      submitTransactionSpy.mockRejectedValue(
        new BadResponseError(
          "Transaction submission failed. Server responded: 400 Bad Request",
          body,
        ),
      );

      await expect(broadcastTransaction(signedTxFixture)).rejects.toMatchObject({
        name: "StellarBroadcastFailedError",
        decodedResultXdr: { decodeFailed: true },
      });
    });
  });
});
