import { toAccountRaw } from "@ledgerhq/coin-framework/serialization";
import {
  accountNameSelector,
  accountNameWithDefaultSelector,
  accountRawToAccountUserData,
  accountUserDataExportSelector,
  exportWalletState,
  handlers,
  importWalletState,
  initAccounts,
  initialState,
  isStarredAccountSelector,
  setAccountName,
  setAccountNames,
  setAccountStarred,
  walletStateExportShouldDiffer,
  walletSyncUpdate,
  walletSyncStateSelector,
} from "./store";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

const ETHEREUM_ACCOUNT = "js:2:ethereum:0x23304541225D9b0BA2368B55ERTYF:";
const POLKADOT_ACCOUNT =
  "js:2:polkadot:133vQbgqtsMufsPbhH9uHWLsdfdsfsdfxw2yRjxC56Tcztg6VeLK:polkadotbip44:";

const ETHEREUM_ACCOUNT_NAME = "My name is ethereum";
const POLKADOT_ACCOUNT_NAME = "My name is polkadot";

initialState.accountNames.set(ETHEREUM_ACCOUNT, ETHEREUM_ACCOUNT_NAME);
initialState.accountNames.set(POLKADOT_ACCOUNT, POLKADOT_ACCOUNT_NAME);

initialState.starredAccountIds.add(ETHEREUM_ACCOUNT);

const NEW_POLKADOT_ACCOUNT =
  "js:2:polkadot:133vQbgqtsMufsPbhH9uHWLsdfdsfsdfxw2yRjxC5azeazeazezaVeLK:polkadotbip44:";
const NEW_POLKADOT_ACCOUNT_NAME = "My name is new polkadot";

describe("Wallet store", () => {
  it("should add an account", () => {
    const editedNames = new Map();
    editedNames.set(NEW_POLKADOT_ACCOUNT, NEW_POLKADOT_ACCOUNT_NAME);
    const result = handlers.ADD_ACCOUNTS(initialState, {
      payload: {
        allAccounts: [
          { id: ETHEREUM_ACCOUNT, type: "Account", currency: { name: "Ethereum" } } as Account,
          { id: POLKADOT_ACCOUNT, type: "Account", currency: { name: "Polkadot" } } as Account,
          { id: NEW_POLKADOT_ACCOUNT, type: "Account", currency: { name: "Polkadot" } } as Account,
        ],
        editedNames,
      },
    });
    expect(result.accountNames.get(ETHEREUM_ACCOUNT)).toBe(ETHEREUM_ACCOUNT_NAME);
    expect(result.accountNames.get(POLKADOT_ACCOUNT)).toBe(POLKADOT_ACCOUNT_NAME);
    expect(result.accountNames.get(NEW_POLKADOT_ACCOUNT)).toBe(NEW_POLKADOT_ACCOUNT_NAME);
  });
  it("should not save the default accounts names when adding an account", () => {
    const editedNames = new Map();
    editedNames.set(ETHEREUM_ACCOUNT, "Ethereum 1");
    editedNames.set(POLKADOT_ACCOUNT, "Polkadot 1");
    editedNames.set(NEW_POLKADOT_ACCOUNT, NEW_POLKADOT_ACCOUNT_NAME);
    const result = handlers.ADD_ACCOUNTS(
      {
        ...initialState,
        accountNames: new Map(),
      },
      {
        payload: {
          allAccounts: [
            {
              id: ETHEREUM_ACCOUNT,
              type: "Account",
              currency: { name: "Ethereum" },
              index: 0,
            } as Account,
            {
              id: POLKADOT_ACCOUNT,
              type: "Account",
              currency: { name: "Polkadot" },
              index: 0,
            } as Account,
            {
              id: NEW_POLKADOT_ACCOUNT,
              type: "Account",
              currency: { name: "Polkadot" },
              index: 1,
            } as Account,
          ],
          editedNames,
        },
      },
    );
    expect(result.accountNames.get(ETHEREUM_ACCOUNT)).toBe(undefined);
    expect(result.accountNames.get(POLKADOT_ACCOUNT)).toBe(undefined);
    expect(result.accountNames.get(NEW_POLKADOT_ACCOUNT)).toBe(NEW_POLKADOT_ACCOUNT_NAME);
  });

  it("can decompose an account raw", () => {
    const account = genAccount("foo", {
      currency: getCryptoCurrencyById("ethereum"),
      subAccountsCount: 3,
      operationsSize: 1,
    });
    const raw = toAccountRaw(account);
    raw.starred = true;
    raw.name = "foo";
    raw.subAccounts![0].starred = true;
    raw.subAccounts![1].starred = true;
    const userData = accountRawToAccountUserData(raw);
    expect(userData).toEqual({
      id: "mock:1:ethereum:foo:",
      name: "foo",
      starredIds: ["mock:1:ethereum:foo:", "mock:1:ethereum:foo:|0", "mock:1:ethereum:foo:|1"],
    });
  });

  it("can export account user data", () => {
    const ethAcc = genAccount("eth", {
      currency: getCryptoCurrencyById("ethereum"),
      subAccountsCount: 3,
      operationsSize: 1,
    });
    const btcAcc = genAccount("btc", {
      currency: getCryptoCurrencyById("bitcoin"),
    });

    const state = handlers.INIT_ACCOUNTS(
      initialState,
      initAccounts(
        [ethAcc, btcAcc],
        [
          {
            id: "mock:1:ethereum:eth:",
            name: "foo",
            starredIds: [
              "mock:1:ethereum:eth:",
              "mock:1:ethereum:eth:|0",
              "mock:1:ethereum:eth:|1",
            ],
          },
          {
            id: "mock:1:bitcoin:btc:",
            name: "",
            starredIds: [],
          },
        ],
      ),
    );

    const userData = accountUserDataExportSelector(state, { account: ethAcc });
    expect(userData).toEqual({
      id: "mock:1:ethereum:eth:",
      name: "foo",
      starredIds: ["mock:1:ethereum:eth:", "mock:1:ethereum:eth:|0", "mock:1:ethereum:eth:|1"],
    });

    const userData2 = accountUserDataExportSelector(state, { account: btcAcc });
    expect(userData2).toEqual({
      id: "mock:1:bitcoin:btc:",
      name: "Bitcoin 2",
      starredIds: [],
    });
  });

  it("defaults to getDefaultAccountName", () => {
    const account = genAccount("foo", {
      currency: getCryptoCurrencyById("bitcoin"),
      operationsSize: 1,
    });
    expect(accountNameWithDefaultSelector(initialState, account)).toBe("Bitcoin 2");
  });

  it("can rename an account", () => {
    const result = handlers.SET_ACCOUNT_NAME(
      initialState,
      setAccountName(ETHEREUM_ACCOUNT, "New name"),
    );
    expect(result.accountNames.get(ETHEREUM_ACCOUNT)).toBe("New name");
  });

  it("can remove an account name", () => {
    const result = handlers.SET_ACCOUNT_NAME(initialState, setAccountName(ETHEREUM_ACCOUNT, ""));
    expect(result.accountNames.has(ETHEREUM_ACCOUNT)).toBe(false);
  });

  it("can bulk set account names", () => {
    const result = handlers.BULK_SET_ACCOUNT_NAMES(
      initialState,
      setAccountNames(
        new Map([
          [ETHEREUM_ACCOUNT, "New name"],
          [POLKADOT_ACCOUNT, "New name"],
        ]),
      ),
    );
    expect(accountNameSelector(result, { accountId: ETHEREUM_ACCOUNT })).toBe("New name");
    expect(result.accountNames.get(POLKADOT_ACCOUNT)).toBe("New name");
  });

  it("can star an account", () => {
    const result = handlers.SET_ACCOUNT_STARRED(
      initialState,
      setAccountStarred(POLKADOT_ACCOUNT, true),
    );
    expect(isStarredAccountSelector(result, { accountId: POLKADOT_ACCOUNT })).toBe(true);
  });

  it("can unstar an account", () => {
    const result = handlers.SET_ACCOUNT_STARRED(
      initialState,
      setAccountStarred(ETHEREUM_ACCOUNT, false),
    );
    expect(isStarredAccountSelector(result, { accountId: ETHEREUM_ACCOUNT })).toBe(false);
  });

  it("can update the wallet sync state", () => {
    const result = handlers.WALLET_SYNC_UPDATE(initialState, walletSyncUpdate({}, 42));
    expect(result.walletSyncState).toEqual({
      data: {},
      version: 42,
    });
  });

  const exportedState = {
    walletSyncState: { data: {}, version: 42 },
    nonImportedAccountInfos: [],
  };

  it("allows partial wallet state", () => {
    const result = handlers.IMPORT_WALLET_SYNC(
      initialState,
      importWalletState({
        walletSyncState: { version: 42, data: {} },
      }),
    );
    expect(result.nonImportedAccountInfos).toEqual([]);
  });

  it("can import the wallet state", () => {
    const result = handlers.IMPORT_WALLET_SYNC(initialState, importWalletState(exportedState));
    expect(walletSyncStateSelector(result)).toEqual({ data: {}, version: 42 });
  });

  it("can export the wallet state", () => {
    const result = handlers.IMPORT_WALLET_SYNC(initialState, importWalletState(exportedState));
    expect(exportWalletState(result)).toEqual(exportedState);
  });

  it("walletStateExportShouldDiffer", () => {
    const result = handlers.IMPORT_WALLET_SYNC(initialState, importWalletState(exportedState));
    expect(exportWalletState(result)).toEqual(exportedState);
    expect(walletStateExportShouldDiffer(initialState, result)).toBe(true);
    expect(walletStateExportShouldDiffer(initialState, initialState)).toBe(false);
    expect(walletStateExportShouldDiffer(result, result)).toBe(false);
  });
});
