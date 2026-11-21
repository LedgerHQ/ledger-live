import type { Account } from "@ledgerhq/types-live";
import { firstValueFrom, reduce } from "rxjs";
import { fromAccountRaw, toAccountRaw } from "../../../account";
import { getAccountBridge } from "../../../bridge";
import { DEVICE_CHAINS, type DeviceChainFixture } from "./deviceApdus";
import { COSMOS_V1_ACCOUNT_RAW } from "./persistedV1Account";
import { scanRecordedDevice } from "./recordedDeviceScan";

type CosmosAccountBridge = Awaited<ReturnType<typeof getAccountBridge>>;

const syncConfig = { paginationConfig: {}, blacklistedTokenIds: [] };

const syncAccount = (bridge: CosmosAccountBridge, account: Account): Promise<Account> =>
  firstValueFrom(
    bridge.sync(account, syncConfig).pipe(reduce((acc, update) => update(acc), account)),
  );

export const describeLiveAccountBridge = (chains: DeviceChainFixture[]): void => {
  describe.each(chains)("cosmos generic account bridge of $currencyId on the live chain", chain => {
    let scanned: Account;
    let bridge: CosmosAccountBridge;
    let synced: Account;

    beforeAll(async () => {
      [scanned] = await scanRecordedDevice(chain);
      bridge = await getAccountBridge(scanned);
      synced = await syncAccount(bridge, scanned);
    });

    it("serializes the synced account to its raw form and back", async () => {
      const restored = await fromAccountRaw(await toAccountRaw(synced));

      expect({
        id: restored.id,
        balance: restored.balance,
        spendableBalance: restored.spendableBalance,
        operationIds: restored.operations.map(op => op.id),
      }).toEqual({
        id: synced.id,
        balance: synced.balance,
        spendableBalance: synced.spendableBalance,
        operationIds: synced.operations.map(op => op.id),
      });
    });

    it("syncs the account the scan discovered", () => {
      expect(synced).toMatchObject({
        id: scanned.id,
        freshAddress: scanned.freshAddress,
        freshAddressPath: scanned.freshAddressPath,
        xpub: scanned.xpub,
        seedIdentifier: scanned.seedIdentifier,
        derivationMode: scanned.derivationMode,
        index: scanned.index,
      });
    });

    it("reports no NaN balance, operation value or fee", () => {
      expect({
        balance: synced.balance.isNaN(),
        values: synced.operations.map(op => op.value.isNaN()),
        fees: synced.operations.map(op => op.fee.isNaN()),
      }).toEqual({
        balance: false,
        values: synced.operations.map(() => false),
        fees: synced.operations.map(() => false),
      });
    });

    it("keeps the balance non-negative and the spendable balance within it", () => {
      expect([
        synced.balance.isGreaterThanOrEqualTo(0),
        synced.spendableBalance.isGreaterThanOrEqualTo(0),
        synced.spendableBalance.isLessThanOrEqualTo(synced.balance),
      ]).toEqual([true, true, true]);
    });

    it("lists no operation twice", () => {
      const ids = synced.operations.map(op => op.id);

      expect(new Set(ids).size).toBe(ids.length);
    });
  });
};

export const describeCosmosHubAccountBridgeHistory = (): void => {
  describe("cosmos generic account bridge history on the Cosmos Hub on the live chain", () => {
    const [hub] = DEVICE_CHAINS;
    let bridge: CosmosAccountBridge;
    let synced: Account;

    beforeAll(async () => {
      const [scanned] = await scanRecordedDevice(hub);
      bridge = await getAccountBridge(scanned);
      synced = await syncAccount(bridge, scanned);
    });

    it("has a history to rebuild", () => {
      expect(synced.operations.length).toBeGreaterThan(0);
    });

    it("rebuilds the whole history when the block height is unknown, only adding operations", async () => {
      const half = Math.floor(synced.operations.length / 2);

      const resynced = await syncAccount(bridge, {
        ...synced,
        operations: synced.operations.slice(half),
        blockHeight: 0,
      });

      expect(resynced.operations).toEqual(expect.arrayContaining(synced.operations));
    });

    it("restores a persisted v1 account and keeps its identity through the sync", async () => {
      const restored = await fromAccountRaw(COSMOS_V1_ACCOUNT_RAW);
      const v1Bridge = await getAccountBridge(restored);

      const migrated = await syncAccount(v1Bridge, restored);

      expect({
        restoredId: restored.id,
        id: migrated.id,
        freshAddress: migrated.freshAddress,
        xpub: migrated.xpub,
        seedIdentifier: migrated.seedIdentifier,
        funded: migrated.balance.isGreaterThan(0),
      }).toEqual({
        restoredId: COSMOS_V1_ACCOUNT_RAW.id,
        id: `js:2:cosmos:${COSMOS_V1_ACCOUNT_RAW.freshAddress}:`,
        freshAddress: COSMOS_V1_ACCOUNT_RAW.freshAddress,
        xpub: COSMOS_V1_ACCOUNT_RAW.xpub,
        seedIdentifier: COSMOS_V1_ACCOUNT_RAW.seedIdentifier,
        funded: true,
      });
      expect(migrated).toHaveProperty("stakingResources.delegatedBalance");
    });
  });
};
