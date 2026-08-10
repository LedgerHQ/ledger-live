import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import hederaCoinConfig from "../config";
import { HARDCODED_BLOCK_HEIGHT } from "../constants";
import { rpcClient } from "../network/rpc";
import { MAINNET_TEST_ACCOUNTS } from "../test/fixtures/account.fixture";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";
import { buildIterateResult, getAccountShape } from "./synchronisation";

type ShapeInfo = Parameters<typeof getAccountShape>[0];

describe("synchronisation", () => {
  const currency = getMockedCurrency();
  const derivationMode = "hederaBip44";
  const syncOptions = { blacklistedTokenIds: [], paginationConfig: {} };

  const makeInfo = (address: string, initialAccount?: ShapeInfo["initialAccount"]): ShapeInfo =>
    ({
      currency,
      derivationMode,
      address,
      index: 0,
      derivationPath: "44'/3030'/0'",
      initialAccount,
    }) as ShapeInfo;

  beforeAll(() => {
    hederaCoinConfig.setCoinConfig(() => getMockedConfig());

    // The production CAL API requires auth unavailable in dev/CI without credentials.
    // A stub store is sufficient: the sync-hash becomes a stable constant so the
    // full-vs-incremental decision still works, and token-mapping tests are skipped.
    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "stub-sync-hash",
    });
  });

  afterAll(async () => {
    await rpcClient._resetInstance();
  });

  describe("getAccountShape", () => {
    it("returns the correct base shape for a pristine account", async () => {
      const result = await getAccountShape(
        makeInfo(MAINNET_TEST_ACCOUNTS.pristine.accountId),
        syncOptions,
      );

      expect(result.freshAddress).toBe(MAINNET_TEST_ACCOUNTS.pristine.accountId);
      expect(result.id).toMatch(/^js:2:hedera:/);
      expect(result.balance).toBeInstanceOf(BigNumber);
      expect(result.blockHeight).toBe(HARDCODED_BLOCK_HEIGHT);
      expect(result.subAccounts).toEqual(expect.any(Array));
      expect(result.hederaResources?.delegation).toBeNull();
      expect(result.lastSyncDate).toBeInstanceOf(Date);
    });

    it("returns a delegation object for an actively staking account", async () => {
      const result = await getAccountShape(
        makeInfo(MAINNET_TEST_ACCOUNTS.activeStaking.accountId),
        syncOptions,
      );

      expect(result.hederaResources?.delegation).not.toBeNull();
      expect(result.hederaResources?.delegation?.nodeId).toBeGreaterThanOrEqual(0);
      expect(result.hederaResources?.delegation?.delegated).toBeInstanceOf(BigNumber);
      expect(result.hederaResources?.delegation?.pendingReward).toBeInstanceOf(BigNumber);
    });

    it("exercises the incremental sync path (useEncodedHash: true, fetchAllPages: true)", async () => {
      // withoutTokens has few operations, so two full syncs fit in one test timeout
      const address = MAINNET_TEST_ACCOUNTS.withoutTokens.accountId;

      const fullResult = await getAccountShape(makeInfo(address), syncOptions);
      invariant(fullResult.id, "full sync should produce an account id");
      const fullOperations = fullResult.operations ?? [];

      const incrementalResult = await getAccountShape(
        makeInfo(address, {
          ...fullResult,
          id: fullResult.id,
          operations: fullOperations,
          pendingOperations: [],
          syncHash: fullResult.syncHash,
        } as ShapeInfo["initialAccount"]),
        syncOptions,
      );
      invariant(incrementalResult.operations, "incremental sync should return operations");

      expect(incrementalResult.freshAddress).toBe(address);
      expect(incrementalResult.operations.length).toBeGreaterThanOrEqual(fullOperations.length);
    });
  });

  describe("buildIterateResult", () => {
    const iterateAtIndex = async (index: number) => {
      const iteratorFn = await buildIterateResult({
        result: { publicKey: MAINNET_TEST_ACCOUNTS.withoutTokens.publicKey },
      } as never);

      return iteratorFn({ currency, derivationMode, index } as never);
    };

    it("returns the account address at index 0 for a known public key", async () => {
      const result = await iterateAtIndex(0);

      expect(result).not.toBeNull();
      expect(result?.address).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it("returns null when index exceeds the number of accounts for a public key", async () => {
      const result = await iterateAtIndex(999);

      expect(result).toBeNull();
    });
  });
});
