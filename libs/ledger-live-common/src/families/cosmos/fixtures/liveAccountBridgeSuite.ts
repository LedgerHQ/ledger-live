import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { firstValueFrom, reduce } from "rxjs";
import { fromAccountRaw, toAccountRaw } from "../../../account";
import { getAccountBridge } from "../../../bridge";
import { DEVICE_CHAINS, type DeviceChainFixture } from "./deviceApdus";
import { balancesAreCoherent, withSentinelBalances } from "./balanceCoherence";
import { CHAINS_WITH_PARSED_HISTORY, HUB_KNOWN_OPERATION_HASH } from "./knownHistory";
import { scanRecordedDevicePrefix } from "./recordedDeviceScan";

type CosmosAccountBridge = Awaited<ReturnType<typeof getAccountBridge>>;

const syncConfig = { paginationConfig: {}, blacklistedTokenIds: [] };

// Gas limit `prepareTransaction` falls back to when the node simulation fails: the chain default
// gas (100000) times the gas amplifier (1.3). A simulated gas limit never lands on this value.
const FALLBACK_GAS_LIMIT = "130000";

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
      [scanned] = await scanRecordedDevicePrefix(chain);
      bridge = await getAccountBridge(scanned);
      synced = await syncAccount(bridge, withSentinelBalances(scanned));
    });

    it("serializes the synced account to its raw form and back", async () => {
      const restored = await fromAccountRaw(await toAccountRaw(synced));

      expect({
        id: restored.id,
        balance: restored.balance,
        spendableBalance: restored.spendableBalance,
      }).toEqual({
        id: synced.id,
        balance: synced.balance,
        spendableBalance: synced.spendableBalance,
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

    it("reports a balance that is a number", () => {
      expect(synced.balance.isNaN()).toBe(false);
    });

    it("keeps the balance non-negative and the spendable balance within it", () => {
      expect([
        synced.balance.isGreaterThanOrEqualTo(0),
        synced.spendableBalance.isGreaterThanOrEqualTo(0),
        synced.spendableBalance.isLessThanOrEqualTo(synced.balance),
      ]).toEqual([true, true, true]);
    });

    it("syncs a balance equal to its spendable, delegated and unbonding balances", () => {
      expect(balancesAreCoherent(synced)).toEqual([true, true, true, true]);
    });

    it("prepares a valid send with the gas simulated by the node, not the default gas", async () => {
      const prepared = await bridge.prepareTransaction(synced, {
        ...bridge.createTransaction(synced),
        amount: new BigNumber(1),
        recipient: chain.accounts[1].address,
      });
      const status = await bridge.getTransactionStatus(synced, prepared);

      expect({
        simulatedGas: prepared.gasLimit?.isEqualTo(FALLBACK_GAS_LIMIT) === false,
        positiveFees: prepared.fees?.isGreaterThan(0),
        errors: status.errors,
      }).toEqual({ simulatedGas: true, positiveFees: true, errors: {} });
    });
  });
};

export const describeCosmosHubAccountBridgeHistory = (): void => {
  describe("cosmos generic account bridge history on the Cosmos Hub on the live chain", () => {
    const hub = DEVICE_CHAINS.find(({ currencyId }) => CHAINS_WITH_PARSED_HISTORY.has(currencyId));
    invariant(hub, "a chain with a parsed history is expected");
    let bridge: CosmosAccountBridge;
    let synced: Account;

    beforeAll(async () => {
      const [scanned] = await scanRecordedDevicePrefix(hub);
      bridge = await getAccountBridge(scanned);
      synced = await syncAccount(bridge, withSentinelBalances(scanned));
    });

    it("returns a known historical operation of the Cosmos Hub account", () => {
      expect(synced.operations.map(op => op.hash)).toContain(HUB_KNOWN_OPERATION_HASH);
    });

    it("serializes the synced operations to the raw form and back", async () => {
      const restored = await fromAccountRaw(await toAccountRaw(synced));

      expect({
        known: synced.operations.some(op => op.hash === HUB_KNOWN_OPERATION_HASH),
        operationIds: restored.operations.map(op => op.id),
      }).toEqual({ known: true, operationIds: synced.operations.map(op => op.id) });
    });

    it("reports no NaN operation value or fee", () => {
      expect({
        known: synced.operations.some(op => op.hash === HUB_KNOWN_OPERATION_HASH),
        values: synced.operations.map(op => op.value.isNaN()),
        fees: synced.operations.map(op => op.fee.isNaN()),
      }).toEqual({
        known: true,
        values: synced.operations.map(() => false),
        fees: synced.operations.map(() => false),
      });
    });

    it("lists no operation twice", () => {
      const ids = synced.operations.map(op => op.id);

      expect({
        known: synced.operations.some(op => op.hash === HUB_KNOWN_OPERATION_HASH),
        unique: new Set(ids).size === ids.length,
      }).toEqual({ known: true, unique: true });
    });

    it("rebuilds the oldest operations when the block height is unknown, only adding operations", async () => {
      const half = Math.max(1, Math.floor(synced.operations.length / 2));

      const resynced = await syncAccount(bridge, {
        ...synced,
        operations: synced.operations.slice(0, -half),
        blockHeight: 0,
      });

      const resyncedIds = resynced.operations.map(op => op.id);
      expect({
        rebuiltKnownOperation: resyncedIds.some(id => id.includes(HUB_KNOWN_OPERATION_HASH)),
        unique: new Set(resyncedIds).size === resyncedIds.length,
        keepsEveryOperation: synced.operations.every(op => resyncedIds.includes(op.id)),
      }).toEqual({ rebuiltKnownOperation: true, unique: true, keepsEveryOperation: true });
    });
  });
};
