import type { Account, AccountUserData } from "@ledgerhq/types-live";
import type { UnknownAction } from "redux";
import { PasswordIncorrectError } from "@ledgerhq/live-common/errors";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getDefaultAccountName } from "@domain/entity-account-name";
import { contactsInitialState } from "@domain/entity-contact";
import { getKey } from "~/renderer/storage";
import accountsReducer, { type AccountsState } from "~/renderer/reducers/accounts";
import {
  accountNameSelector,
  accountUserDataExportSelector,
  isStarredAccountSelector,
} from "~/renderer/reducers/wallet";
import {
  exportWalletState,
  initialState as walletInitialState,
  walletReducer,
  type ExportedWalletState,
  type WalletState,
} from "~/renderer/reducers/wallet.core";
import { fetchAccounts, initAccounts } from "./accounts";

jest.mock("~/renderer/storage", () => ({
  getKey: jest.fn(),
}));

function fakeTuple(
  id: string,
  currencyId: string,
  derivationMode = "",
): [Account, AccountUserData] {
  const account = {
    id,
    type: "Account",
    currency: getCryptoCurrencyById(currencyId),
    derivationMode,
    name: `name-${id}`,
  } as unknown as Account;
  const userData = { id, name: `custom-${id}`, starredIds: [] } as unknown as AccountUserData;
  return [account, userData];
}

/** An account the user starred but never renamed: its name is the default one. */
function starredTupleWithDefaultName(
  id: string,
  currencyId: string,
  index = 0,
): [Account, AccountUserData] {
  const currency = getCryptoCurrencyById(currencyId);
  const account = {
    id,
    type: "Account",
    currency,
    derivationMode: "",
    index,
    name: `name-${id}`,
  } as unknown as Account;
  const userData = {
    id,
    name: getDefaultAccountName(account),
    starredIds: [id],
  } as unknown as AccountUserData;
  return [account, userData];
}

function starredIdsPayload(tuples: [Account, AccountUserData][]): string[] {
  const action = runInitAccounts(tuples).find(
    a => a.type === "starredAccounts/initStarredFromIds",
  ) as unknown as { payload: string[] };
  return action.payload;
}

function runInitAccounts(tuples: [Account, AccountUserData][]): UnknownAction[] {
  const dispatched: UnknownAction[] = [];
  const dispatch = (action: UnknownAction) => {
    dispatched.push(action);
    return action;
  };
  const thunk = initAccounts(tuples);
  thunk(dispatch as Parameters<typeof thunk>[0], (() => ({})) as never, undefined);
  return dispatched;
}

function initAction(tuples: [Account, AccountUserData][]) {
  const action = runInitAccounts(tuples).find(a => a.type === "INIT_ACCOUNTS");
  return action as unknown as {
    type: string;
    payload: { accounts: Account[]; accountsUserData: AccountUserData[] };
  };
}

describe("initAccounts", () => {
  it("drops accounts whose currency has no coin module", () => {
    const action = initAction([
      fakeTuple("btc-1", "bitcoin"),
      fakeTuple("eos-1", "eos"), // no coin-module loader → unsupported
      fakeTuple("btc-2", "bitcoin"),
    ]);

    expect(action.type).toBe("INIT_ACCOUNTS");
    expect(action.payload.accounts.map(a => a.id)).toEqual(["btc-1", "btc-2"]);
    expect(action.payload.accountsUserData.map(u => u.id)).toEqual(["btc-1", "btc-2"]);
  });

  it("keeps all accounts when every currency is supported", () => {
    const action = initAction([fakeTuple("btc-1", "bitcoin"), fakeTuple("eth-1", "ethereum")]);

    expect(action.payload.accounts.map(a => a.id)).toEqual(["btc-1", "eth-1"]);
  });

  it("drops accounts on any non-currency error (e.g. unsupported derivation mode)", () => {
    const action = initAction([
      fakeTuple("btc-segwit", "bitcoin", ""),
      fakeTuple("btc-legacy", "bitcoin", "unsupported_derivation_mode"),
    ]);

    expect(action.payload.accounts.map(a => a.id)).toEqual(["btc-segwit"]);
  });

  it("keeps starred ids of accounts that kept their default name", () => {
    expect(starredIdsPayload([starredTupleWithDefaultName("btc-default", "bitcoin")])).toEqual([
      "btc-default",
    ]);
  });

  it("collects starred ids from both renamed and default-named accounts", () => {
    const renamed = fakeTuple("btc-renamed", "bitcoin");
    renamed[1].starredIds = ["btc-renamed"];

    expect(
      starredIdsPayload([renamed, starredTupleWithDefaultName("eth-default", "ethereum")]).sort(),
    ).toEqual(["btc-renamed", "eth-default"]);
  });

  it("does not leak default names into the account names payload", () => {
    const action = initAction([starredTupleWithDefaultName("btc-default", "bitcoin")]);
    expect(action.payload.accountsUserData.map(u => u.id)).toEqual([]);
  });

  it("initializes account names and stars before INIT_ACCOUNTS", () => {
    const types = runInitAccounts([fakeTuple("btc-1", "bitcoin")]).map(a => a.type);
    expect(types).toEqual([
      "accountNames/initFromUserData",
      "starredAccounts/initStarredFromIds",
      "INIT_ACCOUNTS",
    ]);
  });
});

describe("initAccounts with the persisted wallet state (LIVE-41517)", () => {
  const renamedName = "Bitcoin money";

  /** app.accounts holds the default name; app.wallet holds the name the user chose. */
  function staleAccountsAndWallet() {
    const [account] = starredTupleWithDefaultName("btc-1", "bitcoin");
    const staleUserData = {
      id: account.id,
      name: getDefaultAccountName(account),
      starredIds: [],
    } as unknown as AccountUserData;
    const walletState: ExportedWalletState = {
      ...exportWalletState({ wallet: walletInitialState, contacts: contactsInitialState }),
      accountsData: { accountNames: [[account.id, renamedName]], starredAccountIds: [account.id] },
    };
    return {
      account,
      data: [[account, staleUserData]] as [Account, AccountUserData][],
      walletState,
    };
  }

  type TestState = { wallet: WalletState; accounts: AccountsState };

  /** Runs the thunk on the real wallet and accounts reducers, recording what INIT_ACCOUNTS persists. */
  function runOnReducers(thunk: ReturnType<typeof initAccounts>) {
    let state: TestState = { wallet: walletInitialState, accounts: [] };
    const persistedOnInit: AccountUserData[][] = [];
    const reduce = (action: UnknownAction) => {
      state = {
        wallet: walletReducer(state.wallet, action),
        accounts: accountsReducer(state.accounts, action as Parameters<typeof accountsReducer>[1]),
      };
      if (action.type === "INIT_ACCOUNTS") {
        const { wallet, accounts } = state;
        persistedOnInit.push(
          accounts.map(account => accountUserDataExportSelector(wallet, { account })),
        );
      }
    };
    const dispatch = (action: unknown): void => {
      if (typeof action === "function") action(dispatch, () => state, undefined);
      else reduce(action as UnknownAction);
    };
    thunk(dispatch as Parameters<typeof thunk>[0], (() => state) as never, undefined);
    return { wallet: state.wallet, persistedOnInit };
  }

  it("keeps the wallet name over the stale one saved with the account", () => {
    const { account, data, walletState } = staleAccountsAndWallet();

    const { wallet } = runOnReducers(initAccounts(data, walletState));

    expect(accountNameSelector(wallet, { accountId: account.id })).toBe(renamedName);
    expect(isStarredAccountSelector(wallet, { accountId: account.id })).toBe(true);
    expect(
      exportWalletState({ wallet, contacts: contactsInitialState }).accountsData.accountNames,
    ).toEqual([[account.id, renamedName]]);
  });

  it("saves the accounts with the wallet name when INIT_ACCOUNTS persists them", () => {
    const { data, walletState } = staleAccountsAndWallet();

    const { persistedOnInit } = runOnReducers(initAccounts(data, walletState));

    expect(persistedOnInit).toEqual([[expect.objectContaining({ name: renamedName })]]);
  });

  it("falls back to the names saved with the accounts without a wallet state", () => {
    const { wallet } = runOnReducers(initAccounts([fakeTuple("btc-1", "bitcoin")]));

    expect(accountNameSelector(wallet, { accountId: "btc-1" })).toBe("custom-btc-1");
  });

  it("ignores a wallet state that is still encrypted", () => {
    const encrypted = "encrypted-payload" as unknown as ExportedWalletState;

    const { wallet } = runOnReducers(initAccounts([fakeTuple("btc-1", "bitcoin")], encrypted));

    expect(accountNameSelector(wallet, { accountId: "btc-1" })).toBe("custom-btc-1");
  });
});

describe("fetchAccounts", () => {
  const mockedGetKey = jest.mocked(getKey);

  afterEach(() => mockedGetKey.mockReset());

  it("reads the wallet state together with the accounts", async () => {
    const renamed = fakeTuple("btc-1", "bitcoin");
    const walletState: ExportedWalletState = {
      ...exportWalletState({ wallet: walletInitialState, contacts: contactsInitialState }),
      accountsData: { accountNames: [["btc-1", "From wallet"]], starredAccountIds: [] },
    };
    mockedGetKey.mockImplementation(async (_ns, keyPath) =>
      keyPath === "wallet" ? walletState : [renamed],
    );
    const dispatched: unknown[] = [];
    const dispatch = (action: unknown): unknown => {
      dispatched.push(action);
      return typeof action === "function" ? action(dispatch, () => ({}), undefined) : action;
    };

    const thunk = fetchAccounts();
    await thunk(dispatch as Parameters<typeof thunk>[0], (() => ({})) as never, undefined);

    expect(mockedGetKey).toHaveBeenCalledWith("app", "wallet");
    const namesInits = dispatched.filter(
      (a): a is { type: string; payload: { id: string; name: string }[] } =>
        typeof a === "object" && (a as UnknownAction).type === "accountNames/initFromUserData",
    );
    expect(namesInits.at(-1)?.payload).toEqual([{ id: "btc-1", name: "From wallet" }]);
  });

  it("throws while the accounts are still encrypted", async () => {
    mockedGetKey.mockResolvedValue(null);
    const thunk = fetchAccounts();

    await expect(
      thunk(
        ((action: unknown) => action) as Parameters<typeof thunk>[0],
        (() => ({})) as never,
        undefined,
      ),
    ).rejects.toThrow(PasswordIncorrectError);
  });
});
