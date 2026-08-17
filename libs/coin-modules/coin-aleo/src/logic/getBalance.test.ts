import { apiClient } from "../network/api";
import { sdkClient } from "../network/sdk";
import { fetchAccountTransactionsFromHeight, fetchAllOwnedRecords } from "../network/utils";
import { PROGRAM_ID } from "../constants";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import {
  getMockedDecryptedRecord,
  getMockedGetTokensResponse,
  getMockedRecord,
  getMockedRecordScannerStatus,
  getMockedTokenDetails,
  getMockedTransaction,
} from "../__tests__/fixtures/api.fixture";
import type { AleoContext } from "../types";
import { getBalance } from "./getBalance";

jest.mock("../network/api");
jest.mock("../network/sdk");
jest.mock("../network/utils", () => ({
  ...jest.requireActual("../network/utils"),
  fetchAccountTransactionsFromHeight: jest.fn(),
  fetchAllOwnedRecords: jest.fn(),
}));

const mockGetAccountBalance = jest.mocked(apiClient.getAccountBalance);
const mockGetTokenBalance = jest.mocked(apiClient.getTokenBalance);
const mockGetTokens = jest.mocked(apiClient.getTokens);
const mockGetRecordScannerStatus = jest.mocked(apiClient.getRecordScannerStatus);
const mockDecryptRecord = jest.mocked(sdkClient.decryptRecord);
const mockFetchAccountTransactionsFromHeight = jest.mocked(fetchAccountTransactionsFromHeight);
const mockFetchAllOwnedRecords = jest.mocked(fetchAllOwnedRecords);

describe("getBalance", () => {
  const mockConfig = getMockedConfig("mainnet");
  const address = getMockedAccount().freshAddress;
  const provableId = "provable-id-1";
  const viewKey = "AViewKey1mock";
  const context: AleoContext = {
    config: async () => mockConfig,
    logger: () => {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccountBalance.mockResolvedValue("5000000u64");
    mockGetTokenBalance.mockResolvedValue(null);
    mockGetTokens.mockResolvedValue(
      getMockedGetTokensResponse({
        data: [
          getMockedTokenDetails({ program_name: "token_b.aleo" }),
          getMockedTokenDetails({ program_name: "token_pub.aleo" }),
          getMockedTokenDetails({ program_name: "token_priv.aleo" }),
        ],
        pagination: { limit: 100, offset: 0, total_count: 3, has_next: false, has_previous: false },
      }),
    );
    mockFetchAccountTransactionsFromHeight.mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });
    mockFetchAllOwnedRecords.mockResolvedValue([]);
  });

  it("no provableId/viewKey — throws before any network call", async () => {
    await expect(getBalance(context, address)).rejects.toThrow("aleo: provableId is missing");

    expect(mockGetAccountBalance).not.toHaveBeenCalled();
    expect(mockGetRecordScannerStatus).not.toHaveBeenCalled();
    expect(mockFetchAllOwnedRecords).not.toHaveBeenCalled();
    expect(mockDecryptRecord).not.toHaveBeenCalled();
  });

  it("address never indexed, no private funds or tokens — still returns a zero native entry", async () => {
    mockGetAccountBalance.mockResolvedValue(null);
    mockGetRecordScannerStatus.mockResolvedValue(getMockedRecordScannerStatus());

    const result = await getBalance({ ...context, provableId, viewKey }, address);

    expect(result).toEqual([{ value: 0n, asset: { type: "native" } }]);
  });

  it("both present — native = public + sum of decrypted unspent credits.aleo records (<= synced_up_to)", async () => {
    mockGetRecordScannerStatus.mockResolvedValue(
      getMockedRecordScannerStatus({ synced_up_to: 100 }),
    );
    mockFetchAllOwnedRecords.mockResolvedValue([
      getMockedRecord({ program_name: PROGRAM_ID.CREDITS, block_height: 50, spent: false }),
    ]);
    mockDecryptRecord.mockResolvedValue(
      getMockedDecryptedRecord({ data: { microcredits: "300000u64.private" } }),
    );

    const result = await getBalance({ ...context, provableId, viewKey }, address);

    expect(result[0]).toEqual({ value: BigInt(5300000), asset: { type: "native" } });
    expect(mockFetchAllOwnedRecords).toHaveBeenCalledWith({
      config: mockConfig,
      uuid: provableId,
      unspent: true,
      programs: [],
      functions: [],
    });
    expect(mockDecryptRecord).toHaveBeenCalledWith({
      config: mockConfig,
      viewKey,
      ciphertext: getMockedRecord().record_ciphertext,
    });
  });

  it("one entry per token, public getTokenBalance + summed unspent token records (<= synced_up_to)", async () => {
    mockFetchAccountTransactionsFromHeight.mockResolvedValue({
      transactions: [getMockedTransaction({ program_id: "token_b.aleo" })],
      nextCursor: null,
    });
    mockGetTokenBalance.mockResolvedValue("500u128");
    mockGetRecordScannerStatus.mockResolvedValue(
      getMockedRecordScannerStatus({ synced_up_to: 100 }),
    );
    mockFetchAllOwnedRecords.mockResolvedValue([
      getMockedRecord({
        program_name: "token_b.aleo",
        record_name: "Token",
        block_height: 50,
        spent: false,
      }),
    ]);
    mockDecryptRecord.mockResolvedValue(
      getMockedDecryptedRecord({ data: { amount: "250u128.private" } }),
    );

    const result = await getBalance({ ...context, provableId, viewKey }, address);

    expect(result).toContainEqual({
      value: BigInt(750),
      asset: { type: "unknown", assetReference: "token_b.aleo" },
    });
    expect(mockGetTokenBalance).toHaveBeenCalledWith(mockConfig, "token_b.aleo", address);
  });

  it("classifies token balances by asset type: arc20 (token_standard), arc21 (token_registry.aleo), arc22 (fallback)", async () => {
    mockGetTokens.mockResolvedValue(
      getMockedGetTokensResponse({
        data: [
          getMockedTokenDetails({ program_name: "arc20_program.aleo", token_standard: "ARC-20" }),
          getMockedTokenDetails({ program_name: PROGRAM_ID.TOKEN_REGISTRY }),
          getMockedTokenDetails({ program_name: "usdcx_stablecoin.aleo" }),
        ],
        pagination: { limit: 100, offset: 0, total_count: 3, has_next: false, has_previous: false },
      }),
    );
    mockFetchAccountTransactionsFromHeight.mockResolvedValue({
      transactions: [
        getMockedTransaction({ program_id: "arc20_program.aleo" }),
        getMockedTransaction({ program_id: PROGRAM_ID.TOKEN_REGISTRY }),
        getMockedTransaction({ program_id: "usdcx_stablecoin.aleo" }),
      ],
      nextCursor: null,
    });
    mockGetTokenBalance.mockResolvedValue(null);
    mockGetRecordScannerStatus.mockResolvedValue(
      getMockedRecordScannerStatus({ synced_up_to: 100 }),
    );

    const result = await getBalance({ ...context, provableId, viewKey }, address);

    const tokenBalances = result.filter(balance => balance.asset.type !== "native");
    expect(tokenBalances).toContainEqual({
      value: 0n,
      asset: { type: "arc20", assetReference: "arc20_program.aleo" },
    });
    expect(tokenBalances).toContainEqual({
      value: 0n,
      asset: { type: "arc21", assetReference: PROGRAM_ID.TOKEN_REGISTRY },
    });
    expect(tokenBalances).toContainEqual({
      value: 0n,
      asset: { type: "arc22", assetReference: "usdcx_stablecoin.aleo" },
    });
  });

  it("token discovery = union of public + private programs, minus credits.aleo", async () => {
    mockFetchAccountTransactionsFromHeight.mockResolvedValue({
      transactions: [getMockedTransaction({ program_id: "token_pub.aleo" })],
      nextCursor: null,
    });
    mockGetTokenBalance.mockResolvedValue(null);
    mockGetRecordScannerStatus.mockResolvedValue(
      getMockedRecordScannerStatus({ synced_up_to: 100 }),
    );
    mockFetchAllOwnedRecords.mockResolvedValue([
      getMockedRecord({ program_name: PROGRAM_ID.CREDITS, block_height: 50, spent: false }),
      getMockedRecord({
        program_name: "token_priv.aleo",
        record_name: "Token",
        block_height: 50,
        spent: false,
        commitment: "priv-commitment",
      }),
    ]);
    mockDecryptRecord.mockResolvedValue(
      getMockedDecryptedRecord({ data: { microcredits: "0u64.private" } }),
    );

    const result = await getBalance({ ...context, provableId, viewKey }, address);

    const tokenAssetReferences = result
      .filter(balance => balance.asset.type !== "native")
      .map(balance => (balance.asset as { assetReference: string }).assetReference);

    expect(tokenAssetReferences.sort()).toEqual(["token_priv.aleo", "token_pub.aleo"]);
    expect(tokenAssetReferences).not.toContain(PROGRAM_ID.CREDITS);
  });

  it("a non-credits program_id absent from the token registry is not treated as a token", async () => {
    mockFetchAccountTransactionsFromHeight.mockResolvedValue({
      transactions: [getMockedTransaction({ program_id: "not_a_token.aleo" })],
      nextCursor: null,
    });
    mockGetRecordScannerStatus.mockResolvedValue(
      getMockedRecordScannerStatus({ synced_up_to: 100 }),
    );

    const result = await getBalance({ ...context, provableId, viewKey }, address);

    expect(result.filter(balance => balance.asset.type !== "native")).toEqual([]);
    expect(mockGetTokenBalance).not.toHaveBeenCalled();
  });

  it("a record above synced_up_to is excluded from both native and token sums", async () => {
    mockGetRecordScannerStatus.mockResolvedValue(
      getMockedRecordScannerStatus({ synced_up_to: 100 }),
    );
    mockFetchAllOwnedRecords.mockResolvedValue([
      getMockedRecord({
        program_name: PROGRAM_ID.CREDITS,
        block_height: 100,
        spent: false,
        commitment: "eligible",
      }),
      getMockedRecord({
        program_name: PROGRAM_ID.CREDITS,
        block_height: 101,
        spent: false,
        commitment: "over-height",
      }),
    ]);
    mockDecryptRecord.mockResolvedValue(
      getMockedDecryptedRecord({ data: { microcredits: "100u64.private" } }),
    );

    const result = await getBalance({ ...context, provableId, viewKey }, address);

    expect(result[0]).toEqual({ value: BigInt(5000100), asset: { type: "native" } });
    expect(mockDecryptRecord).toHaveBeenCalledTimes(1);
  });

  it("synced_up_to: null — sums every unspent record with no height ceiling", async () => {
    mockGetRecordScannerStatus.mockResolvedValue(
      getMockedRecordScannerStatus({ synced_up_to: null }),
    );
    mockFetchAllOwnedRecords.mockResolvedValue([
      getMockedRecord({
        program_name: PROGRAM_ID.CREDITS,
        block_height: 1_000_000,
        spent: false,
      }),
    ]);
    mockDecryptRecord.mockResolvedValue(
      getMockedDecryptedRecord({ data: { microcredits: "100u64.private" } }),
    );

    const result = await getBalance({ ...context, provableId, viewKey }, address);

    expect(result[0]).toEqual({ value: BigInt(5000100), asset: { type: "native" } });
    expect(mockDecryptRecord).toHaveBeenCalledTimes(1);
  });

  it("synced:false still returns computed partial sums, no thrown error, no public-only fallback", async () => {
    mockGetRecordScannerStatus.mockResolvedValue(
      getMockedRecordScannerStatus({ synced: false, percentage: 40, synced_up_to: 90 }),
    );
    mockFetchAllOwnedRecords.mockResolvedValue([
      getMockedRecord({ program_name: PROGRAM_ID.CREDITS, block_height: 90, spent: false }),
    ]);
    mockDecryptRecord.mockResolvedValue(
      getMockedDecryptedRecord({ data: { microcredits: "42u64.private" } }),
    );

    const result = await getBalance({ ...context, provableId, viewKey }, address);

    expect(result[0]).toEqual({ value: BigInt(5000042), asset: { type: "native" } });
  });

  it("provableId without viewKey throws before any scanner call", async () => {
    await expect(getBalance({ ...context, provableId }, address)).rejects.toThrow(
      "aleo: viewKey is missing",
    );
    expect(mockGetRecordScannerStatus).not.toHaveBeenCalled();
  });

  it("viewKey without provableId throws before any scanner call", async () => {
    await expect(getBalance({ ...context, viewKey }, address)).rejects.toThrow(
      "aleo: provableId is missing",
    );
    expect(mockGetRecordScannerStatus).not.toHaveBeenCalled();
  });

  it("AleoRecordScannerStatusResponse's new fields (sync_start_height/synced_up_to) drive the height filter", async () => {
    const scannerStatus = getMockedRecordScannerStatus();
    expect(scannerStatus.sync_start_height).toBe(0);
    expect(scannerStatus.synced_up_to).toBe(20985061);
    const syncedUpTo = scannerStatus.synced_up_to as number;

    mockGetRecordScannerStatus.mockResolvedValue(scannerStatus);
    mockFetchAllOwnedRecords.mockResolvedValue([
      getMockedRecord({
        program_name: PROGRAM_ID.CREDITS,
        block_height: syncedUpTo,
        spent: false,
      }),
      getMockedRecord({
        program_name: PROGRAM_ID.CREDITS,
        block_height: syncedUpTo + 1,
        spent: false,
        commitment: "past-synced-up-to",
      }),
    ]);
    mockDecryptRecord.mockResolvedValue(
      getMockedDecryptedRecord({ data: { microcredits: "1u64.private" } }),
    );

    await getBalance({ ...context, provableId, viewKey }, address);

    expect(mockDecryptRecord).toHaveBeenCalledTimes(1);
  });

  it("the incomplete-privacy-context error never carries provableId or viewKey", async () => {
    const secretProvableId = "secret-provable-id";
    const secretViewKey = "secret-view-key";

    let thrown: unknown;
    try {
      await getBalance({ ...context, provableId: secretProvableId }, address);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).not.toContain(secretProvableId);
    expect(Object.keys(thrown as Error)).not.toContain("provableId");

    let thrownForViewKey: unknown;
    try {
      await getBalance({ ...context, viewKey: secretViewKey }, address);
    } catch (error) {
      thrownForViewKey = error;
    }

    expect(thrownForViewKey).toBeInstanceOf(Error);
    expect((thrownForViewKey as Error).message).not.toContain(secretViewKey);
    expect(Object.keys(thrownForViewKey as Error)).not.toContain("viewKey");
  });
});
