import { lastValueFrom, toArray, type Observable } from "rxjs";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { Account } from "@ledgerhq/types-live";
import { discoverAccounts } from "@features/platform-account-discovery";
import { getCoinFrameworkCurrencyBridge } from "../../bridge/generic-coin-framework/currencyBridge";
import { deriveOnTransport } from "../../account-data/discovery/deriveOnSession";
import { legacyScanRules } from "../../account-data/discovery/legacyScanRules";
import { placeholderAccount } from "../../account-data/full-sync/placeholderAccount";
import { syncDetached } from "../../account-data/full-sync/syncDetached";
import { toAccountStatus } from "../../account-data/full-sync/accountStatus";
import { hederaConfig } from "./config";
import { createSigner, hederaGetAddress } from "./signer";

const scanEnv = { KEYCHAIN_OBSERVABLE_RANGE: 0, SHOW_LEGACY_NEW_ACCOUNT: false };
jest.mock("@ledgerhq/ledger-wallet-framework/scanRules", () => ({
  getKeychainObservableRange: () => scanEnv.KEYCHAIN_OBSERVABLE_RANGE,
  showsLegacyNewAccount: () => scanEnv.SHOW_LEGACY_NEW_ACCOUNT,
}));

const getPublicKey = jest.fn(async (_path: string) => "302a300506032b6570032100aa");
jest.mock("@ledgerhq/hw-app-hedera", () => jest.fn().mockImplementation(() => ({ getPublicKey })));

/** The mirror node: the accounts of the seed key, in its order, and their balances. */
const chain: { accounts: string[]; balances: Record<string, bigint> } = {
  accounts: [],
  balances: {},
};
jest.mock("@ledgerhq/coin-hedera/network/api", () => {
  const { apiClient } = jest.requireActual("@ledgerhq/coin-hedera/network/api");
  return {
    apiClient: {
      ...apiClient,
      getAccountsForPublicKey: async () => chain.accounts.map(account => ({ account })),
    },
  };
});
jest.mock("../../bridge/generic-coin-framework/api", () => ({
  ...jest.requireActual("../../bridge/generic-coin-framework/api"),
  getCoinModuleApi: async () => ({
    getBalance: async (_context: unknown, address: string) => [
      { asset: { type: "native" }, value: chain.balances[address] ?? 0n },
    ],
    lastBlock: async () => ({ height: 1, hash: "h", time: new Date(0) }),
    listOperations: async () => ({ items: [], next: undefined }),
    getValidators: async () => ({ items: [], next: undefined }),
    getStakes: async () => ({ items: [], next: undefined }),
    getRewards: async () => ({ items: [], next: undefined }),
  }),
}));

LiveConfig.setConfig(hederaConfig);
const hedera = getCryptoCurrencyById("hedera");
type Found = { index: number; id: string; used: boolean };

const context = <T>(_deviceId: string, fn: (signer: ReturnType<typeof createSigner>) => T) =>
  fn(createSigner({} as never));
/** A `runOnTransport` of its own is a scan of its own: Hedera caches its key lookup per scan. */
const newScan =
  () =>
  <T>(job: (transport: never) => Observable<T>) =>
    job({} as never);

/** The scan the app ships for Hedera: the generic bridge, with its address lookup. */
async function legacyScan(): Promise<Found[]> {
  const { scanAccounts } = await getCoinFrameworkCurrencyBridge("hedera", "local", {
    context,
    getAddress: hederaGetAddress(context),
  });
  const events = await lastValueFrom(
    scanAccounts({
      currency: hedera,
      deviceId: "",
      syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
    }).pipe(toArray()),
  );
  return events.map(({ account }: { account: Account }) => ({
    index: account.index,
    id: account.id,
    used: account.used,
  }));
}

async function discovery(): Promise<Found[]> {
  const syncedIds = new Map<string, string>();
  const discovered = await lastValueFrom(
    discoverAccounts(
      {
        derive: deriveOnTransport(newScan()),
        readStatus: async (descriptor, signal) => {
          const synced = await syncDetached(
            descriptor,
            { prepareCurrency: async () => undefined, blacklistedTokenIds: [] },
            signal,
          );
          syncedIds.set(descriptor.key, synced.id);
          return toAccountStatus(synced);
        },
      },
      { currencyId: "hedera", ...legacyScanRules() },
    ).pipe(toArray()),
  );
  return Promise.all(
    discovered.map(async ({ candidate, descriptor, status }) => {
      const { id } = await placeholderAccount(descriptor);
      expect(syncedIds.get(descriptor.key)).toBe(id);
      return { index: candidate.index, id, used: status.used };
    }),
  );
}

const found = (index: number, account: string, used: boolean): Found => ({
  index,
  id: `js:2:hedera:${account}:hederaBip44`,
  used,
});

afterEach(() => {
  scanEnv.KEYCHAIN_OBSERVABLE_RANGE = 0;
});

describe("hedera discovery against the scanAccounts the app ships", () => {
  const four = ["0.0.1", "0.0.2", "0.0.3", "0.0.4"];
  it.each([
    { name: "no account on the key", accounts: [], used: [], gap: 0, expected: [] },
    {
      name: "every account used",
      accounts: ["0.0.1", "0.0.2"],
      used: ["0.0.1", "0.0.2"],
      gap: 0,
      expected: [found(0, "0.0.1", true), found(1, "0.0.2", true)],
    },
    {
      name: "two empty accounts then a used one",
      accounts: ["0.0.1", "0.0.2", "0.0.3"],
      used: ["0.0.3"],
      gap: 0,
      expected: [found(0, "0.0.1", false), found(2, "0.0.3", true)],
    },
    {
      name: "two empty accounts in the middle, gap limit 1",
      accounts: four,
      used: ["0.0.1", "0.0.4"],
      gap: 1,
      expected: [found(0, "0.0.1", true), found(1, "0.0.2", false), found(3, "0.0.4", true)],
    },
    {
      name: "empty accounts last",
      accounts: four,
      used: ["0.0.1"],
      gap: 0,
      expected: [found(0, "0.0.1", true), found(1, "0.0.2", false)],
    },
  ])(
    "finds the same accounts, with the same ids: $name",
    async ({ accounts, used, gap, expected }) => {
      scanEnv.KEYCHAIN_OBSERVABLE_RANGE = gap;
      chain.accounts = accounts;
      chain.balances = Object.fromEntries(used.map(account => [account, 100n]));
      await expect(legacyScan()).resolves.toEqual(expected);
      await expect(discovery()).resolves.toEqual(expected);
    },
  );

  it("derives the key at the same path, once per scan", async () => {
    chain.accounts = ["0.0.1", "0.0.2"];
    chain.balances = { "0.0.1": 100n, "0.0.2": 100n };
    getPublicKey.mockClear();
    await discovery();
    expect(getPublicKey.mock.calls).toEqual([["44/3030"]]);
    getPublicKey.mockClear();
    await legacyScan();
    expect(getPublicKey.mock.calls).toEqual([["44/3030"]]);
  });
});
