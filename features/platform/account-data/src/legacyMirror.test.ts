import { configureStore } from "@reduxjs/toolkit";
import { accountBalancesSlice, type AccountBalancesState } from "@domain/entity-account-balance";
import { AccountIdSchema } from "@shared/schema-primitives";
import {
  mirrorLegacyAccountBalances,
  type MirroredAccount,
  type MirroredStore,
} from "./legacyMirror";

type TestAccount = {
  type: string;
  id: string;
  currency: { id: string };
  balance: { toFixed(): string };
  spendableBalance: { toFixed(): string };
  lastSyncDate: Date;
  subAccounts?: unknown[];
};

const SYNCED_AT = new Date("2026-01-31T12:00:00.000Z");

// `AmountLike` is structural, so the mirror needs no BigNumber to be exercised.
const amount = (value: string) => ({ toFixed: () => value });

const ethAccount = (overrides: Partial<TestAccount> = {}): TestAccount => ({
  type: "Account",
  id: "js:2:ethereum:0xabc:",
  currency: { id: "ethereum" },
  balance: amount("100"),
  spendableBalance: amount("90"),
  lastSyncDate: SYNCED_AT,
  ...overrides,
});

const btcAccount = (): TestAccount => ({
  type: "Account",
  id: "js:2:bitcoin:xpubabc:",
  currency: { id: "bitcoin" },
  balance: amount("7"),
  spendableBalance: amount("7"),
  lastSyncDate: SYNCED_AT,
});

const usdcSubAccount = (balance = "42") => ({
  type: "TokenAccount",
  id: "js:2:ethereum:0xabc:+ethereum%2Ferc20%2Fusd__coin",
  parentId: "js:2:ethereum:0xabc:",
  token: { id: "ethereum/erc20/usd__coin" },
  balance: amount(balance),
  spendableBalance: amount(balance),
});

const ETH_ID = AccountIdSchema.parse("js:2:ethereum:0xabc:");
const USDC_ID = AccountIdSchema.parse("js:2:ethereum:0xabc:+ethereum%2Ferc20%2Fusd__coin");

const accountsReducer =
  (initial: TestAccount[]) =>
  (state = initial, action: { type: string; payload?: TestAccount[] }) =>
    action.type === "SET_ACCOUNTS" ? (action.payload ?? []) : state;

const setup = (accounts: TestAccount[]) => {
  const store = configureStore({
    reducer: {
      accounts: accountsReducer(accounts),
      accountBalances: accountBalancesSlice.reducer,
    },
    middleware: getDefault => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  // The mirror only needs `accounts` + `accountBalances`; a real app store is far wider.
  type TestState = { accounts: MirroredAccount[]; accountBalances: AccountBalancesState };
  const stop = mirrorLegacyAccountBalances(
    store as unknown as MirroredStore<TestState>,
    state => state.accounts,
  );
  const table = () => store.getState().accountBalances;
  const setAccounts = (next: TestAccount[]) =>
    store.dispatch({ type: "SET_ACCOUNTS", payload: next });
  return { store, stop, table, setAccounts };
};

describe("mirrorLegacyAccountBalances", () => {
  it("fills the table from the accounts already in the store", () => {
    const { table, stop } = setup([ethAccount()]);
    expect(table()[ETH_ID]).toMatchObject({
      assetId: "ethereum",
      balance: "100",
      spendableBalance: "90",
    });
    stop();
  });

  it("mirrors token accounts as rows parented to the account", () => {
    const { table, stop } = setup([ethAccount({ subAccounts: [usdcSubAccount()] })]);
    expect(table()[USDC_ID]).toMatchObject({
      assetId: "ethereum/erc20/usd__coin",
      balance: "42",
      parentId: "js:2:ethereum:0xabc:",
    });
    stop();
  });

  it("picks up a balance change", () => {
    const { table, setAccounts, stop } = setup([ethAccount()]);
    setAccounts([ethAccount({ balance: amount("250") })]);
    expect(table()[ETH_ID].balance).toBe("250");
    stop();
  });

  it("drops a token account that vanished from the sync", () => {
    const { table, setAccounts, stop } = setup([ethAccount({ subAccounts: [usdcSubAccount()] })]);
    setAccounts([ethAccount({ subAccounts: [] })]);
    expect(table()[USDC_ID]).toBeUndefined();
    expect(table()[ETH_ID]).toBeDefined();
    stop();
  });

  it("removes an account's rows when the account is removed", () => {
    const { table, setAccounts, stop } = setup([ethAccount({ subAccounts: [usdcSubAccount()] })]);
    setAccounts([]);
    expect(table()).toEqual({});
    stop();
  });

  it("does not dispatch when nothing changed", () => {
    const { store, setAccounts, stop } = setup([ethAccount()]);
    const before = store.getState().accountBalances;
    const same = ethAccount();
    setAccounts([same]);
    expect(store.getState().accountBalances).toBe(before);
    stop();
  });

  it("leaves a newer granular row alone when an unrelated account syncs", () => {
    const { store, table, setAccounts, stop } = setup([ethAccount(), btcAccount()]);
    // A granular source read the chain after the last full sync of this account.
    store.dispatch(
      accountBalancesSlice.actions.upsertAccountBalances([
        {
          accountId: ETH_ID,
          assetId: "ethereum",
          balance: "777",
          spendableBalance: "777",
          at: new Date(SYNCED_AT.getTime() + 60_000).toISOString(),
        } as never,
      ]),
    );
    // Any other account finishing a sync replaces the accounts array and re-runs the mirror.
    setAccounts([ethAccount(), { ...btcAccount(), balance: amount("8") }]);
    expect(table()[ETH_ID].balance).toBe("777");
    stop();
  });

  it("still lets a genuinely newer full sync win", () => {
    const { store, table, setAccounts, stop } = setup([ethAccount()]);
    store.dispatch(
      accountBalancesSlice.actions.upsertAccountBalances([
        {
          accountId: ETH_ID,
          assetId: "ethereum",
          balance: "777",
          spendableBalance: "777",
          at: SYNCED_AT.toISOString(),
        } as never,
      ]),
    );
    setAccounts([
      ethAccount({
        balance: amount("250"),
        lastSyncDate: new Date(SYNCED_AT.getTime() + 1),
      }),
    ]);
    expect(table()[ETH_ID].balance).toBe("250");
    stop();
  });

  it("stops mirroring once unsubscribed", () => {
    const { table, setAccounts, stop } = setup([ethAccount()]);
    stop();
    setAccounts([ethAccount({ balance: amount("999") })]);
    expect(table()[ETH_ID].balance).toBe("100");
  });
});

describe("mirrorLegacyAccountBalances — cost", () => {
  it("re-projects nothing when the account objects are unchanged", () => {
    const eth = ethAccount();
    const btc = btcAccount();
    const { store, setAccounts, stop } = setup([eth, btc]);
    const before = store.getState().accountBalances;

    // A sync round replaces the accounts array; only the synced account gets a new object. Every
    // other account must short-circuit on identity rather than be re-projected.
    setAccounts([eth, btc]);
    expect(store.getState().accountBalances).toBe(before);
    stop();
  });
});
