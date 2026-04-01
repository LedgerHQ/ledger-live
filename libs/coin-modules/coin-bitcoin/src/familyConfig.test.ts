import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { firstValueFrom, Observable, of } from "rxjs";
import BigNumber from "bignumber.js";
import {
  findFamilyConfigById,
  setZainoNodeUrl,
  setZainoGrpcUrl,
  setUseNative,
} from "./familyConfig";
import { createFixtureAccount } from "./fixtures/common.fixtures";
import type { ShieldedSyncResult } from "@ledgerhq/zcash-shielded/types";

// ─── Mock ZCashNative ────────────────────────────────────────────────────────
// familyConfig dynamically imports @ledgerhq/zcash-shielded/ZCashNative.
// We mock that module so no Rust addon or live gRPC endpoint is needed.

const mockSyncShielded = jest.fn<Observable<ShieldedSyncResult>, [unknown]>();

jest.mock("@ledgerhq/zcash-shielded/ZCashNative", () => ({
  ZCashNative: jest.fn().mockImplementation(() => ({
    syncShielded: mockSyncShielded,
  })),
}));

// ─── Mock ZCash (JSON-RPC fallback) ──────────────────────────────────────────

const mockJsonRpcSyncShielded = jest.fn<Observable<ShieldedSyncResult>, [unknown]>();

jest.mock("@ledgerhq/zcash-shielded/ZCash", () => ({
  ZCash: jest.fn().mockImplementation(() => ({
    syncShielded: mockJsonRpcSyncShielded,
  })),
  ZCASH_JSON_RPC_SERVER_MAINNET: "https://default-json-rpc.example.com",
}));

// Re-import after mock so we can inspect constructor calls.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ZCashNative: MockZCashNative } = require("@ledgerhq/zcash-shielded/ZCashNative");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ZCash: MockZCash } = require("@ledgerhq/zcash-shielded/ZCash");

beforeEach(() => {
  jest.clearAllMocks();
  // Reset to default state before each test
  setUseNative(true);
  setZainoGrpcUrl(null);
  setZainoNodeUrl(null);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const currency = getCryptoCurrencyById("zcash");

function makePrivateInfo(overrides: Record<string, unknown> = {}) {
  return {
    ufvk: "uview1realkey",
    saplingBalance: new BigNumber(0),
    orchardBalance: new BigNumber(0),
    syncState: "complete" as const,
    birthday: null,
    lastSyncTimestamp: null,
    lastProcessedBlock: null,
    transactions: [],
    progress: 0,
    estimatedTimeRemaining: { hours: 0, minutes: 0 },
    ...overrides,
  };
}

function makeSyncResult(overrides: Partial<ShieldedSyncResult> = {}): ShieldedSyncResult {
  return {
    processedBlocks: 100,
    remainingBlocks: 0,
    lastProcessedBlock: 99,
    transactions: [],
    ...overrides,
  };
}

const defaultSyncConfig = {
  paginationConfig: { operationsPerAccountId: {}, operations: 0 },
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("findFamilyConfigById", () => {
  describe("when familyConfigId is bitcoin", () => {
    test("returns undefined (no family config for bitcoin)", () => {
      expect(findFamilyConfigById("bitcoin")).toBe(undefined);
    });
  });

  describe("when familyConfigId is zcash (native mode)", () => {
    test("returns a config with a sync function", () => {
      const familyConfig = findFamilyConfigById("zcash");

      expect(familyConfig).toMatchObject({ sync: expect.any(Function) });
    });

    test("sync returns an Observable", () => {
      mockSyncShielded.mockReturnValue(of(makeSyncResult()));
      const familyConfig = findFamilyConfigById("zcash")!;

      const obs = familyConfig.sync!(
        {
          currency,
          address: "",
          index: 0,
          derivationPath: "",
          derivationMode: "",
          initialAccount: { ...createFixtureAccount(), privateInfo: makePrivateInfo() },
        },
        defaultSyncConfig,
      );

      expect(obs).toBeInstanceOf(Observable);
    });

    test("throws an error if ufvk is missing in privateInfo", async () => {
      const familyConfig = findFamilyConfigById("zcash")!;

      const obs = familyConfig.sync!(
        { currency, address: "", index: 0, derivationPath: "", derivationMode: "" },
        defaultSyncConfig,
      );

      await expect(firstValueFrom(obs)).rejects.toThrow(
        "Missing unified full viewing key (ufvk) for ZCash shielded sync",
      );
      expect(MockZCashNative).not.toHaveBeenCalled();
    });

    test("instantiates ZCashNative with the default gRPC URL", async () => {
      mockSyncShielded.mockReturnValue(of(makeSyncResult()));
      const familyConfig = findFamilyConfigById("zcash")!;

      const obs = familyConfig.sync!(
        {
          currency,
          address: "",
          index: 0,
          derivationPath: "",
          derivationMode: "",
          initialAccount: { ...createFixtureAccount(), privateInfo: makePrivateInfo() },
        },
        defaultSyncConfig,
      );

      await firstValueFrom(obs);

      expect(MockZCashNative).toHaveBeenCalledWith(
        expect.objectContaining({ grpcUrl: expect.any(String) }),
      );
    });

    test("passes the viewing key and maxBatchSize to syncShielded", async () => {
      mockSyncShielded.mockReturnValue(of(makeSyncResult()));
      const familyConfig = findFamilyConfigById("zcash")!;

      const obs = familyConfig.sync!(
        {
          currency,
          address: "",
          index: 0,
          derivationPath: "",
          derivationMode: "",
          initialAccount: {
            ...createFixtureAccount(),
            privateInfo: makePrivateInfo({ ufvk: "uview1mykey" }),
          },
        },
        defaultSyncConfig,
      );

      await firstValueFrom(obs);

      expect(mockSyncShielded).toHaveBeenCalledWith(
        expect.objectContaining({
          viewingKey: "uview1mykey",
          maxBatchSize: 5_000,
        }),
      );
    });

    test("starts at block 0 when lastProcessedBlock is null (first sync)", async () => {
      mockSyncShielded.mockReturnValue(of(makeSyncResult()));
      const familyConfig = findFamilyConfigById("zcash")!;

      const obs = familyConfig.sync!(
        {
          currency,
          address: "",
          index: 0,
          derivationPath: "",
          derivationMode: "",
          initialAccount: {
            ...createFixtureAccount(),
            privateInfo: makePrivateInfo({ lastProcessedBlock: null }),
          },
        },
        defaultSyncConfig,
      );

      await firstValueFrom(obs);

      expect(mockSyncShielded).toHaveBeenCalledWith(
        expect.objectContaining({ startBlockHeight: 0 }),
      );
    });

    test("resumes at lastProcessedBlock + 1 for incremental sync", async () => {
      mockSyncShielded.mockReturnValue(of(makeSyncResult({ lastProcessedBlock: 142 })));
      const familyConfig = findFamilyConfigById("zcash")!;

      const obs = familyConfig.sync!(
        {
          currency,
          address: "",
          index: 0,
          derivationPath: "",
          derivationMode: "",
          initialAccount: {
            ...createFixtureAccount(),
            blockHeight: 42,
            privateInfo: makePrivateInfo({ lastProcessedBlock: 42 }),
          },
        },
        defaultSyncConfig,
      );

      const result = await firstValueFrom(obs);

      expect(mockSyncShielded).toHaveBeenCalledWith(
        expect.objectContaining({ startBlockHeight: 43 }),
      );
      expect(result.lastProcessedBlock).toBe(142);
    });

    test("forwards the ShieldedSyncResult from ZCashNative", async () => {
      const expected = makeSyncResult({
        processedBlocks: 500,
        remainingBlocks: 100,
        lastProcessedBlock: 600,
        transactions: [
          {
            id: "txid1",
            hex: "deadbeef",
            blockHeight: 500,
            blockHash: "blockhash1",
            timestamp: 1700000000,
            fee: new BigNumber(10000),
            decryptedData: {
              orchard_outputs: [
                { amount: new BigNumber(5000), memo: "hello", transfer_type: "incoming" },
              ],
              sapling_outputs: [],
            },
          },
        ],
      });
      mockSyncShielded.mockReturnValue(of(expected));
      const familyConfig = findFamilyConfigById("zcash")!;

      const obs = familyConfig.sync!(
        {
          currency,
          address: "",
          index: 0,
          derivationPath: "",
          derivationMode: "",
          initialAccount: { ...createFixtureAccount(), privateInfo: makePrivateInfo() },
        },
        defaultSyncConfig,
      );

      const result = await firstValueFrom(obs);

      expect(result).toEqual(expected);
    });

    test("propagates errors from ZCashNative.syncShielded", async () => {
      mockSyncShielded.mockReturnValue(
        new Observable(subscriber => subscriber.error(new Error("gRPC stream broken"))),
      );
      const familyConfig = findFamilyConfigById("zcash")!;

      const obs = familyConfig.sync!(
        {
          currency,
          address: "",
          index: 0,
          derivationPath: "",
          derivationMode: "",
          initialAccount: { ...createFixtureAccount(), privateInfo: makePrivateInfo() },
        },
        defaultSyncConfig,
      );

      await expect(firstValueFrom(obs)).rejects.toThrow("gRPC stream broken");
    });

    test("uses custom gRPC URL when set via setZainoGrpcUrl", async () => {
      setZainoGrpcUrl("https://custom-grpc.example.com");
      mockSyncShielded.mockReturnValue(of(makeSyncResult()));
      const familyConfig = findFamilyConfigById("zcash")!;

      const obs = familyConfig.sync!(
        {
          currency,
          address: "",
          index: 0,
          derivationPath: "",
          derivationMode: "",
          initialAccount: { ...createFixtureAccount(), privateInfo: makePrivateInfo() },
        },
        defaultSyncConfig,
      );

      await firstValueFrom(obs);

      expect(MockZCashNative).toHaveBeenCalledWith(
        expect.objectContaining({ grpcUrl: "https://custom-grpc.example.com" }),
      );
    });

    test("throws when privateInfo exists but ufvk is null", async () => {
      const familyConfig = findFamilyConfigById("zcash")!;

      const obs = familyConfig.sync!(
        {
          currency,
          address: "",
          index: 0,
          derivationPath: "",
          derivationMode: "",
          initialAccount: {
            ...createFixtureAccount(),
            privateInfo: makePrivateInfo({ ufvk: null }),
          },
        },
        defaultSyncConfig,
      );

      await expect(firstValueFrom(obs)).rejects.toThrow(
        "Missing unified full viewing key (ufvk) for ZCash shielded sync",
      );
    });
  });

  describe("when familyConfigId is zcash (JSON-RPC fallback mode)", () => {
    beforeEach(() => {
      setUseNative(false);
    });

    test("uses ZCash JSON-RPC class instead of ZCashNative", async () => {
      mockJsonRpcSyncShielded.mockReturnValue(of(makeSyncResult()));
      const familyConfig = findFamilyConfigById("zcash")!;

      const obs = familyConfig.sync!(
        {
          currency,
          address: "",
          index: 0,
          derivationPath: "",
          derivationMode: "",
          initialAccount: { ...createFixtureAccount(), privateInfo: makePrivateInfo() },
        },
        defaultSyncConfig,
      );

      await firstValueFrom(obs);

      expect(MockZCash).toHaveBeenCalled();
      expect(MockZCashNative).not.toHaveBeenCalled();
    });

    test("instantiates ZCash with default JSON-RPC URL", async () => {
      mockJsonRpcSyncShielded.mockReturnValue(of(makeSyncResult()));
      const familyConfig = findFamilyConfigById("zcash")!;

      const obs = familyConfig.sync!(
        {
          currency,
          address: "",
          index: 0,
          derivationPath: "",
          derivationMode: "",
          initialAccount: { ...createFixtureAccount(), privateInfo: makePrivateInfo() },
        },
        defaultSyncConfig,
      );

      await firstValueFrom(obs);

      expect(MockZCash).toHaveBeenCalledWith(
        expect.objectContaining({ nodeUrl: "https://default-json-rpc.example.com" }),
      );
    });

    test("uses custom JSON-RPC URL when set via setZainoNodeUrl", async () => {
      setZainoNodeUrl("https://custom-jsonrpc.example.com");
      mockJsonRpcSyncShielded.mockReturnValue(of(makeSyncResult()));
      const familyConfig = findFamilyConfigById("zcash")!;

      const obs = familyConfig.sync!(
        {
          currency,
          address: "",
          index: 0,
          derivationPath: "",
          derivationMode: "",
          initialAccount: { ...createFixtureAccount(), privateInfo: makePrivateInfo() },
        },
        defaultSyncConfig,
      );

      await firstValueFrom(obs);

      expect(MockZCash).toHaveBeenCalledWith(
        expect.objectContaining({ nodeUrl: "https://custom-jsonrpc.example.com" }),
      );
    });

    test("passes viewingKey and ZCASH_MAX_BATCH_SIZE (100) to syncShielded", async () => {
      mockJsonRpcSyncShielded.mockReturnValue(of(makeSyncResult()));
      const familyConfig = findFamilyConfigById("zcash")!;

      const obs = familyConfig.sync!(
        {
          currency,
          address: "",
          index: 0,
          derivationPath: "",
          derivationMode: "",
          initialAccount: {
            ...createFixtureAccount(),
            privateInfo: makePrivateInfo({ ufvk: "uview1jsonrpckey" }),
          },
        },
        defaultSyncConfig,
      );

      await firstValueFrom(obs);

      expect(mockJsonRpcSyncShielded).toHaveBeenCalledWith(
        expect.objectContaining({
          viewingKey: "uview1jsonrpckey",
          maxBatchSize: 100,
        }),
      );
    });

    test("resumes at lastProcessedBlock + 1 for incremental sync", async () => {
      mockJsonRpcSyncShielded.mockReturnValue(of(makeSyncResult()));
      const familyConfig = findFamilyConfigById("zcash")!;

      const obs = familyConfig.sync!(
        {
          currency,
          address: "",
          index: 0,
          derivationPath: "",
          derivationMode: "",
          initialAccount: {
            ...createFixtureAccount(),
            privateInfo: makePrivateInfo({ lastProcessedBlock: 200 }),
          },
        },
        defaultSyncConfig,
      );

      await firstValueFrom(obs);

      expect(mockJsonRpcSyncShielded).toHaveBeenCalledWith(
        expect.objectContaining({ startBlockHeight: 201 }),
      );
    });

    test("propagates errors from ZCash.syncShielded", async () => {
      mockJsonRpcSyncShielded.mockReturnValue(
        new Observable(subscriber => subscriber.error(new Error("JSON-RPC connection failed"))),
      );
      const familyConfig = findFamilyConfigById("zcash")!;

      const obs = familyConfig.sync!(
        {
          currency,
          address: "",
          index: 0,
          derivationPath: "",
          derivationMode: "",
          initialAccount: { ...createFixtureAccount(), privateInfo: makePrivateInfo() },
        },
        defaultSyncConfig,
      );

      await expect(firstValueFrom(obs)).rejects.toThrow("JSON-RPC connection failed");
    });

    test("throws when ufvk is missing", async () => {
      const familyConfig = findFamilyConfigById("zcash")!;

      const obs = familyConfig.sync!(
        { currency, address: "", index: 0, derivationPath: "", derivationMode: "" },
        defaultSyncConfig,
      );

      await expect(firstValueFrom(obs)).rejects.toThrow(
        "Missing unified full viewing key (ufvk) for ZCash shielded sync",
      );
      expect(MockZCash).not.toHaveBeenCalled();
    });
  });

  describe("setUseNative toggle", () => {
    test("switching from native to JSON-RPC and back", async () => {
      // Start in native mode (default)
      mockSyncShielded.mockReturnValue(of(makeSyncResult()));
      const familyConfig = findFamilyConfigById("zcash")!;

      const accInfo = {
        currency,
        address: "",
        index: 0,
        derivationPath: "",
        derivationMode: "",
        initialAccount: { ...createFixtureAccount(), privateInfo: makePrivateInfo() },
      } as const;

      await firstValueFrom(familyConfig.sync!(accInfo, defaultSyncConfig));
      expect(MockZCashNative).toHaveBeenCalledTimes(1);
      expect(MockZCash).not.toHaveBeenCalled();

      jest.clearAllMocks();

      // Switch to JSON-RPC
      setUseNative(false);
      mockJsonRpcSyncShielded.mockReturnValue(of(makeSyncResult()));

      await firstValueFrom(familyConfig.sync!(accInfo, defaultSyncConfig));
      expect(MockZCash).toHaveBeenCalledTimes(1);
      expect(MockZCashNative).not.toHaveBeenCalled();

      jest.clearAllMocks();

      // Switch back to native
      setUseNative(true);
      mockSyncShielded.mockReturnValue(of(makeSyncResult()));

      await firstValueFrom(familyConfig.sync!(accInfo, defaultSyncConfig));
      expect(MockZCashNative).toHaveBeenCalledTimes(1);
      expect(MockZCash).not.toHaveBeenCalled();
    });
  });
});
