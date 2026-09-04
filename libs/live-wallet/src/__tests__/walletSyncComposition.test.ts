import { of } from "rxjs";
import { contact, contactsInitialState } from "@domain/entity-contact";
import type { Account } from "@ledgerhq/types-live";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { parseAnyAccountId } from "@shared/schema-primitives";
import {
  createWalletsync,
  type WalletSyncDocument,
  type WalletSyncLocalState,
} from "../walletSyncComposition";
import type { CloudSyncDataManagerResolutionContext } from "../accounts";

const account1 = genAccount("composition-1");
const account2 = genAccount("composition-2");

const ctx = {
  getAccountBridge: () => ({ sync: (initial: Account) => of(() => initial) }),
  bridgeCache: {
    hydrateCurrency: () => Promise.resolve(null),
    prepareCurrency: () => Promise.resolve(null),
  },
} as unknown as CloudSyncDataManagerResolutionContext;

function makeLocalState(overrides: Partial<WalletSyncLocalState> = {}): WalletSyncLocalState {
  return {
    accounts: { list: [account1], nonImportedAccountInfos: [] },
    accountNames: new Map([[account1.id, "Local name"]]),
    contacts: [...contactsInitialState.contacts],
    recentAddresses: { bitcoin: [{ address: "bc1local", lastUsed: 1000 }] },
    ...overrides,
  } as WalletSyncLocalState;
}

const emptyLocalState = {
  accounts: { list: [], nonImportedAccountInfos: [] },
  accountNames: new Map(),
  contacts: [...contactsInitialState.contacts],
  recentAddresses: {},
} as unknown as WalletSyncLocalState;

const validAccountsSlice = [
  {
    id: account2.id,
    currencyId: account2.currency.id,
    freshAddress: account2.freshAddress,
    seedIdentifier: account2.seedIdentifier,
    derivationMode: account2.derivationMode,
    index: account2.index,
  },
];

describe("walletsync composition", () => {
  let onModuleError: jest.Mock;
  let walletsync: ReturnType<typeof createWalletsync>;

  beforeEach(() => {
    onModuleError = jest.fn();
    walletsync = createWalletsync(ctx, { onModuleError });
  });

  describe("one module's distant slice is corrupted", () => {
    // shape recentAddresses cannot parse: entries are not a list
    const corrupted = {
      accounts: validAccountsSlice,
      accountNames: { [account2.id]: "Distant name" },
      recentAddresses: { bitcoin: "this is not a list of addresses" },
    };

    it("keeps syncing the healthy modules", async () => {
      const resolved = await walletsync.resolveIncrementalUpdate(makeLocalState(), null, corrupted);
      expect(resolved.hasChanges).toBe(true);
      if (!resolved.hasChanges) return;
      expect(resolved.update.accounts.hasChanges).toBe(true);
      expect(resolved.update.accountNames.hasChanges).toBe(true);
      expect(resolved.update.recentAddresses).toEqual({ hasChanges: false });

      const local = walletsync.applyUpdate(makeLocalState(), resolved.update);
      expect(local.accountNames.get(parseAnyAccountId(account2.id))).toBe("Distant name");
      expect(local.accounts.list.map(a => a.id)).toContain(account2.id);
    });

    it("leaves the corrupted slice untouched instead of overwriting it with local data", () => {
      const { nextState } = walletsync.diffLocalToDistant(makeLocalState(), corrupted);
      expect(nextState.recentAddresses).toEqual({ bitcoin: "this is not a list of addresses" });
    });

    it("reports the quarantined module", () => {
      walletsync.diffLocalToDistant(makeLocalState(), corrupted);
      expect(onModuleError).toHaveBeenCalledWith("recentAddresses", expect.anything());
      expect(onModuleError.mock.calls.map(c => c[0])).toEqual(["recentAddresses"]);
    });

    it("still pushes the healthy modules' changes", () => {
      const { hasChanges, nextState } = walletsync.diffLocalToDistant(makeLocalState(), corrupted);
      expect(hasChanges).toBe(true);
      expect(nextState.accountNames).toEqual({ [account1.id]: "Local name" });
      // account2 is distant-only and was not imported locally, so it is dropped
      const pushedAccounts = nextState.accounts as { id: string }[];
      expect(pushedAccounts.map(a => a.id)).toEqual([account1.id]);
    });
  });

  it("preserves a slice written by a module this version does not know", () => {
    const distant = {
      accounts: validAccountsSlice,
      futureModule: { some: ["unknown", "data"] },
    };
    const { nextState } = walletsync.diffLocalToDistant(makeLocalState(), distant);
    expect(nextState.futureModule).toEqual({
      some: ["unknown", "data"],
    });
    expect(onModuleError).not.toHaveBeenCalled();
  });

  it("does not freeze the whole sync when every module's slice is garbage", async () => {
    const garbage = { accounts: "nope", accountNames: 42, recentAddresses: [] };
    expect(() => walletsync.diffLocalToDistant(makeLocalState(), garbage)).not.toThrow();
    await expect(
      walletsync.resolveIncrementalUpdate(makeLocalState(), null, garbage),
    ).resolves.toBeDefined();
  });

  // regression: a rejected slice used to null the whole document and erase the healthy ones
  describe("data loss regression (one slice rejected by its schema)", () => {
    const distant = {
      accountNames: { [account2.id]: "Name from another instance" },
      recentAddresses: { bitcoin: "corrupted by some other app version" },
      futureModule: { written: "by a newer app version" },
    };

    it("does not erase the key of a module this version does not know", () => {
      const { nextState } = walletsync.diffLocalToDistant(makeLocalState(), distant);
      expect(nextState.futureModule).toEqual({
        written: "by a newer app version",
      });
    });

    it("does not overwrite another instance's healthy slice with local data", async () => {
      const resolved = await walletsync.resolveIncrementalUpdate(makeLocalState(), null, distant);
      expect(resolved.hasChanges).toBe(true);
      if (!resolved.hasChanges) return;
      const local = walletsync.applyUpdate(makeLocalState(), resolved.update);
      expect(local.accountNames.get(parseAnyAccountId(account2.id))).toBe(
        "Name from another instance",
      );
    });

    it("keeps the rejected slice verbatim rather than replacing it with local state", () => {
      const { nextState } = walletsync.diffLocalToDistant(makeLocalState(), distant);
      expect(nextState.recentAddresses).toEqual({
        bitcoin: "corrupted by some other app version",
      });
    });
  });

  describe("Contacts Wallet Sync registration", () => {
    const contacts = [
      ...contactsInitialState.contacts,
      contact({ id: "contact-ada", isMe: false, name: "Ada", addresses: [] }),
    ];

    it("serializes and resolves Contacts through the wallet-sync aggregate", async () => {
      const distant = walletsync.diffLocalToDistant(
        { ...emptyLocalState, contacts },
        null,
      ).nextState;

      expect(distant.contacts).toMatchObject({
        me: { name: "Me" },
        contactGroups: [{ id: "contact-ada", name: "Ada" }],
      });

      await expect(
        walletsync.resolveIncrementalUpdate(emptyLocalState, null, distant),
      ).resolves.toMatchObject({
        hasChanges: true,
        update: { contacts: { hasChanges: true, update: contacts } },
      });
    });

    it("quarantines a corrupted Contacts slice without blocking healthy modules", async () => {
      const distant = {
        accountNames: { [account2.id]: "Distant name" },
        contacts: { me: { name: "Me" }, contactGroups: "invalid" },
      };
      const resolved = await walletsync.resolveIncrementalUpdate(makeLocalState(), null, distant);

      expect(resolved).toMatchObject({
        hasChanges: true,
        update: {
          accountNames: { hasChanges: true },
          contacts: { hasChanges: false },
        },
      });
      expect(onModuleError).toHaveBeenCalledWith("contacts", expect.anything());
    });
  });

  // a distant document is read as-is: no aggregate parse ever runs, on any path
  describe("distant document", () => {
    const unknownField = { fooBAR: { nested: [1, 2, 3] } };
    const withUnknownField = () => ({
      ...walletsync.diffLocalToDistant(emptyLocalState, null).nextState,
      ...unknownField,
    });

    it("is read without validating the modules", () => {
      const raw = { accounts: "garbage", futureModule: true };
      expect(() => walletsync.diffLocalToDistant(makeLocalState(), raw)).not.toThrow();
    });

    it("is treated as absent when it is not an object", () => {
      // the casts are the point: a storage slot violating its declared type is why this narrows
      for (const raw of [null, undefined, 42, "string", true, []] as WalletSyncDocument[]) {
        expect(walletsync.diffLocalToDistant(emptyLocalState, raw)).toEqual(
          walletsync.diffLocalToDistant(emptyLocalState, null),
        );
      }
    });

    it("keeps fields written by a newer version that the aggregate schema strips", () => {
      const distant = withUnknownField();
      expect(walletsync.schema.parse(distant)).not.toHaveProperty("fooBAR");
      expect(walletsync.diffLocalToDistant(emptyLocalState, distant).nextState).toHaveProperty(
        "fooBAR",
      );
    });

    it("is accepted when a module's field is missing", () => {
      expect(() => walletsync.diffLocalToDistant(makeLocalState(), { accounts: [] })).not.toThrow();
    });

    it("keeps unknown fields through a read then re-upload round trip", () => {
      const latest = { ...withUnknownField(), accountNames: { foo: "bar" } };
      const localData = {
        ...emptyLocalState,
        accountNames: new Map([[parseAnyAccountId("foo"), "baz"]]),
      };
      const diff = walletsync.diffLocalToDistant(localData, latest);
      expect(diff.hasChanges).toBe(true);
      expect(diff.nextState).toMatchObject({
        accountNames: { foo: "baz" },
        fooBAR: { nested: [1, 2, 3] },
      });
    });
  });
});
