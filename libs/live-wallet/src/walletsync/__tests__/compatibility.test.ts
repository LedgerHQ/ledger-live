import { dummyContext } from "../__mocks__/environment";
import { emptyState, genModuleState } from "../__mocks__";
import walletsync, { DistantState, LocalState } from "../index";
import { Account } from "@ledgerhq/types-live";

const oneAccountState: LocalState = {
  ...emptyState,
  accounts: genModuleState("accounts", 0),
};

const distantEmptyState = walletsync.diffLocalToDistant(emptyState, null).nextState;

describe("the root WalletSyncDataManager can accept data that misses a new field handled by a new module (here accountNames)", () => {
  const partialEmptyDistantData = { accounts: distantEmptyState.accounts };
  const partialOneAccountDistantData = {
    accounts: oneAccountState.accounts.list.map(convertAccountToDescriptor),
  };

  test("on the schema", () => {
    const validated = walletsync.schema.parse(partialOneAccountDistantData);
    expect(validated).toMatchObject(partialOneAccountDistantData);
  });

  test("on diffLocalToDistant with empty (no changes)", () => {
    const diff = walletsync.diffLocalToDistant(emptyState, partialEmptyDistantData);
    expect(diff).toEqual({
      hasChanges: false,
      nextState: {
        ...distantEmptyState, // verify that we indeed have the new fields in the nextState
        accounts: partialEmptyDistantData.accounts,
      },
    });
  });

  test("on diffLocalToDistant with data (no changes)", () => {
    const diff = walletsync.diffLocalToDistant(oneAccountState, partialOneAccountDistantData);
    expect(diff).toEqual({
      hasChanges: false,
      nextState: {
        ...distantEmptyState, // verify that we indeed have the new fields in the nextState
        accounts: partialOneAccountDistantData.accounts,
      },
    });
  });

  test("on diffLocalToDistant with data (changes)", () => {
    const diff = walletsync.diffLocalToDistant(emptyState, partialOneAccountDistantData);
    expect(diff).toEqual({
      hasChanges: true,
      nextState: {
        ...distantEmptyState, // verify that we indeed have the new fields in the nextState
        accounts: [],
      },
    });
  });

  test("on resolveIncrementalUpdate (accept new accounts)", async () => {
    const diff = await walletsync.resolveIncrementalUpdate(
      dummyContext,
      emptyState,
      null,
      partialOneAccountDistantData,
    );
    if (diff.hasChanges) {
      expect(diff.update.accountNames).toEqual({ hasChanges: false });
      const firstaccount = diff.update.accounts.hasChanges
        ? diff.update.accounts.update.added[0]
        : null;
      expect(diff.update.accounts).toEqual({
        hasChanges: true,
        update: {
          added: [firstaccount],
          removed: [],
          nonImportedAccountInfos: [],
        },
      });
    } else {
      expect(diff).toEqual({ hasChanges: true }); // we expected changes!
    }
  });
});

describe("the general module can accept data that are not yet understood and handled by an existing module", () => {
  const emptyDistantDataWithExtra = {
    ...distantEmptyState,
    fooBAR: true,
  };

  test("on the schema", () => {
    const validated = walletsync.schema.parse(emptyDistantDataWithExtra);
    expect(validated).toMatchObject(distantEmptyState);
  });

  test("on diffLocalToDistant", () => {
    const localData = emptyState;
    const latestState = emptyDistantDataWithExtra;
    const diff = walletsync.diffLocalToDistant(localData, latestState);
    expect(diff).toEqual({
      hasChanges: false,
      nextState: latestState,
    });
  });

  test("on diffLocalToDistant with changes", () => {
    const localData = {
      ...emptyState,
      accountNames: new Map([["foo", "bar"]]),
    };
    const latestState = emptyDistantDataWithExtra;
    const diff = walletsync.diffLocalToDistant(localData, latestState);
    expect(diff).toEqual({
      hasChanges: true,
      nextState: { ...latestState, accountNames: { foo: "bar" } },
    });
  });

  test("on resolveIncrementalUpdate with changes", async () => {
    const localData = {
      ...emptyState,
      accounts: genModuleState("accounts", 0),
    };
    const resolved = await walletsync.resolveIncrementalUpdate(
      dummyContext,
      localData,
      // basically we verify the extra data are just going to be ignored
      {
        ...distantEmptyState,
        accountNames: { foo: "bar" },
        fooBAR: true,
      } as DistantState,
      {
        ...distantEmptyState,
        accountNames: { foo: "baz" },
        fooBAR: false,
        fooBAZ: { a: 42 },
      } as DistantState,
    );
    expect(resolved).toMatchObject({ hasChanges: true });
  });
});

// we make this type static because the module is not supposed to change it over time!
type AccountDescriptor = {
  id: string;
  currencyId: string;
  freshAddress: string;
  seedIdentifier: string;
  derivationMode: string;
  index: number;
};
function convertAccountToDescriptor(account: Account): AccountDescriptor {
  return {
    id: account.id,
    currencyId: account.currency.id,
    freshAddress: account.freshAddress,
    seedIdentifier: account.seedIdentifier,
    derivationMode: account.derivationMode,
    index: account.index,
  };
}
