import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  accountDataExtra,
  fetchAccountData,
  type AccountDataSource,
} from "@domain/api-account-data";
import {
  AccountIdSchema,
  accountsSlice,
  legacyAccountsSynced,
  type LegacyAccountEntry,
} from "@domain/entity-account";
import { mockAccountEntry } from "@domain/entity-account/schema.mock";
import { AccountDataSourceIdSchema, accountDataSlice } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import {
  accountOperationsSlice,
  selectAccountOperations,
  type AccountOperation,
  type AccountOperationsPage,
} from "@domain/entity-account-operation";
import { mockAccountOperation } from "@domain/entity-account-operation/schema.mock";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import {
  mockCryptoCurrency,
  mockEthereumCurrency,
} from "@domain/entity-currency-crypto/schema.mock";
import { mockFiatCurrency } from "@domain/entity-currency-fiat/schema.mock";
import { exportAccountsOperationsCsv } from "./exportAccountsOperationsCsv";
import { AccountOperationsReadError, UnknownAccountError } from "./errors";

const ETHEREUM = mockEthereumCurrency();
const ENTRY = mockAccountEntry() as LegacyAccountEntry;
const ACCOUNT_ID = AccountIdSchema.parse(ENTRY.legacyId);
const REQUEST = { id: ACCOUNT_ID, name: "Ethereum 1", xpub: "0xdisplayed" };
const findCurrency = (assetId: CryptoOrTokenCurrencyId) =>
  assetId === ETHEREUM.id ? ETHEREUM : undefined;

const page = (operations: AccountOperation[], nextCursor?: string): AccountOperationsPage => ({
  operations,
  nextCursor,
});

function setup(readOperations: NonNullable<AccountDataSource["read"]>["operations"]) {
  const source: AccountDataSource = {
    id: AccountDataSourceIdSchema.parse("test"),
    supports: (_descriptor, kind) => kind === "operations",
    read: { operations: readOperations },
  };
  const store = configureStore({
    reducer: combineReducers({
      accountData: accountDataSlice.reducer,
      accountOperations: accountOperationsSlice.reducer,
      accountEntries: accountsSlice.reducer,
    }),
    middleware: getDefault =>
      getDefault({
        thunk: { extraArgument: accountDataExtra([source]) },
        serializableCheck: false,
      }),
  });
  store.dispatch(legacyAccountsSynced([ENTRY]));
  return store;
}

const hashesOf = (csv: string) =>
  csv
    .split("\r\n")
    .slice(1)
    .map(line => line.split(",")[6]);

describe("exportAccountsOperationsCsv", () => {
  it("reads every page of the account and writes its operations", async () => {
    const readOperations = jest.fn(async (_target, _query) => page([]));
    readOperations
      .mockResolvedValueOnce(page([mockAccountOperation({ id: "a", hash: "0xa" })], "next"))
      .mockResolvedValueOnce(page([mockAccountOperation({ id: "b", hash: "0xb" })]));
    const store = setup(readOperations);

    const csv = await store.dispatch(exportAccountsOperationsCsv([REQUEST], { findCurrency }));

    expect(readOperations).toHaveBeenCalledTimes(2);
    expect(hashesOf(csv)).toEqual(["0xa", "0xb"]);
  });

  it("identifies the account with the xpub of the request, not its descriptor key", async () => {
    const store = setup(async () => page([mockAccountOperation()]));

    const csv = await store.dispatch(
      exportAccountsOperationsCsv([{ ...REQUEST, xpub: "party::1220abc" }], { findCurrency }),
    );

    expect(csv.split("\r\n")[1]).toContain(",Ethereum 1,party::1220abc,");
    expect(csv).not.toContain(ENTRY.descriptor.key);
  });

  it("reads the operations again even when they were just read", async () => {
    const readOperations = jest.fn(async () => page([mockAccountOperation()]));
    const store = setup(readOperations);
    const exportCsv = () =>
      store.dispatch(exportAccountsOperationsCsv([REQUEST], { findCurrency }));

    await exportCsv();
    await exportCsv();

    expect(readOperations).toHaveBeenCalledTimes(2);
  });

  it("asks the operations valued in the fiat countervalue", async () => {
    const readOperations = jest.fn(async () =>
      page([mockAccountOperation({ countervalues: { USD: "1234" } })]),
    );
    const store = setup(readOperations);

    const csv = await store.dispatch(
      exportAccountsOperationsCsv([REQUEST], {
        findCurrency,
        countervalueCurrency: mockFiatCurrency(),
      }),
    );

    expect(readOperations).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ countervalue: "USD", limit: 100 }),
    );
    expect(csv.split("\r\n")[1]).toContain(",USD,12.34,");
  });

  it("does not ask a crypto countervalue to the reads", async () => {
    const readOperations = jest.fn(async (_target, _query) => page([mockAccountOperation()]));
    const store = setup(readOperations);

    await store.dispatch(
      exportAccountsOperationsCsv([REQUEST], {
        findCurrency,
        countervalueCurrency: mockCryptoCurrency(),
      }),
    );

    expect(readOperations).toHaveBeenCalledWith(
      expect.anything(),
      expect.not.objectContaining({ countervalue: expect.anything() }),
    );
  });

  it("looks the currencies up asynchronously and leaves out the operations of an unknown one", async () => {
    const store = setup(async () =>
      page([
        mockAccountOperation({ id: "known", hash: "0xknown" }),
        mockAccountOperation({
          id: "unknown",
          hash: "0xunknown",
          assetId: "ethereum/erc20/unknown",
        }),
      ]),
    );

    const csv = await store.dispatch(
      exportAccountsOperationsCsv([REQUEST], {
        findCurrency: async assetId => (assetId === ETHEREUM.id ? ETHEREUM : undefined),
      }),
    );

    expect(hashesOf(csv)).toEqual(["0xknown"]);
  });

  it("rejects when a currency lookup fails, rather than leaving its operations out", async () => {
    const store = setup(async () => page([mockAccountOperation()]));

    await expect(
      store.dispatch(
        exportAccountsOperationsCsv([REQUEST], {
          findCurrency: async () => {
            throw new Error("tokens unreachable");
          },
        }),
      ),
    ).rejects.toThrow("tokens unreachable");
  });

  it("rejects when a page cursor comes back, rather than paging forever", async () => {
    const readOperations = jest.fn(async (_target, _query) => page([]));
    readOperations
      .mockResolvedValueOnce(page([mockAccountOperation({ id: "a" })], "A"))
      .mockResolvedValueOnce(page([mockAccountOperation({ id: "b" })], "B"))
      .mockResolvedValue(page([mockAccountOperation({ id: "c" })], "A"));
    const store = setup(readOperations);

    await expect(
      store.dispatch(exportAccountsOperationsCsv([REQUEST], { findCurrency })),
    ).rejects.toBeInstanceOf(AccountOperationsReadError);
    expect(readOperations).toHaveBeenCalledTimes(3);
  });

  it("reads its own window and leaves the one a screen shows as it was", async () => {
    const readOperations = jest.fn(async (_target, _query) => page([]));
    readOperations
      .mockResolvedValueOnce(page([mockAccountOperation({ id: "shown" })], "more"))
      .mockResolvedValue(page([mockAccountOperation({ id: "exported" })]));
    const store = setup(readOperations);
    await store.dispatch(fetchAccountData("operations", ENTRY.descriptor));

    await store.dispatch(exportAccountsOperationsCsv([REQUEST], { findCurrency }));

    const shown = selectAccountOperations(store.getState(), computeAccountUUID(ENTRY.descriptor));
    expect(shown?.map(({ id }) => id)).toEqual(["shown"]);
  });

  it("rejects when a read fails, rather than writing a partial history", async () => {
    const store = setup(async () => {
      throw new Error("explorer down");
    });

    await expect(
      store.dispatch(exportAccountsOperationsCsv([REQUEST], { findCurrency })),
    ).rejects.toBeInstanceOf(AccountOperationsReadError);
  });

  it("rejects an account missing from the accounts list", async () => {
    const store = setup(async () => page([]));

    await expect(
      store.dispatch(
        exportAccountsOperationsCsv(
          [{ id: AccountIdSchema.parse("js:2:bitcoin:xpub:"), name: "?", xpub: "" }],
          {
            findCurrency,
          },
        ),
      ),
    ).rejects.toBeInstanceOf(UnknownAccountError);
  });
});
