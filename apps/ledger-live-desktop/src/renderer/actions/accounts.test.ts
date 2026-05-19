import type { Account, AccountUserData } from "@ledgerhq/types-live";
import { checkAccountSupported } from "@ledgerhq/ledger-wallet-framework/account/support";
import { initAccounts } from "./accounts";

jest.mock("@ledgerhq/ledger-wallet-framework/account/support", () => ({
  ...jest.requireActual("@ledgerhq/ledger-wallet-framework/account/support"),
  checkAccountSupported: jest.fn(),
}));

const mockCheckAccountSupported = checkAccountSupported as jest.Mock;

function fakeTuple(id: string, currencyId: string): [Account, AccountUserData] {
  const account = {
    id,
    type: "Account",
    currency: { id: currencyId },
    name: `name-${id}`,
  } as unknown as Account;
  const userData = { id, name: `custom-${id}` } as unknown as AccountUserData;
  return [account, userData];
}

function runThunk(thunk: ReturnType<typeof initAccounts>) {
  const dispatched: { type: string; payload?: unknown }[] = [];
  const dispatch = jest.fn((action: { type: string; payload?: unknown }) => {
    dispatched.push(action);
  });
  // ThunkAction signature: (dispatch, getState, extra) => R
  (thunk as unknown as (d: typeof dispatch, g: unknown, e: unknown) => void)(
    dispatch,
    jest.fn(),
    undefined,
  );
  return dispatched;
}

describe("initAccounts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("drops accounts whose currency is not supported by this build", () => {
    mockCheckAccountSupported.mockImplementation((a: { currency: { id: string } }) =>
      a.currency.id === "bitcoin" ? null : new Error("currency not supported"),
    );

    const dispatched = runThunk(
      initAccounts([
        fakeTuple("btc-1", "bitcoin"),
        fakeTuple("eth-1", "ethereum"),
        fakeTuple("btc-2", "bitcoin"),
      ]),
    );

    const init = dispatched.find(a => a.type === "INIT_ACCOUNTS") as
      | { type: string; payload: { accounts: Account[]; accountsUserData: AccountUserData[] } }
      | undefined;
    expect(init).toBeDefined();
    expect(init!.payload.accounts.map(a => a.id)).toEqual(["btc-1", "btc-2"]);
    expect(init!.payload.accountsUserData.map(u => u.id)).toEqual(["btc-1", "btc-2"]);
  });

  it("keeps all accounts when every currency is supported", () => {
    mockCheckAccountSupported.mockReturnValue(null);

    const dispatched = runThunk(
      initAccounts([fakeTuple("btc-1", "bitcoin"), fakeTuple("eth-1", "ethereum")]),
    );

    const init = dispatched.find(a => a.type === "INIT_ACCOUNTS") as
      | { type: string; payload: { accounts: Account[] } }
      | undefined;
    expect(init!.payload.accounts.map(a => a.id)).toEqual(["btc-1", "eth-1"]);
  });

  it("emits ADD_NON_IMPORTED_ACCOUNTS with dropped descriptors and their error", () => {
    mockCheckAccountSupported.mockImplementation((a: { currency: { id: string } }) => {
      if (a.currency.id === "bitcoin") return null;
      const error = new Error(`currency ${a.currency.id} not supported`);
      error.name = "CurrencyNotSupported";
      return error;
    });

    const dispatched = runThunk(
      initAccounts([
        fakeTuple("btc-1", "bitcoin"),
        fakeTuple("eth-1", "ethereum"),
        fakeTuple("sol-1", "solana"),
      ]),
    );

    const added = dispatched.find(a => a.type === "ADD_NON_IMPORTED_ACCOUNTS") as
      | { type: string; payload: { id: string; error: { name: string; message: string } }[] }
      | undefined;
    expect(added).toBeDefined();
    expect(added!.payload.map(p => p.id)).toEqual(["eth-1", "sol-1"]);
    expect(added!.payload[0].error).toEqual({
      name: "CurrencyNotSupported",
      message: "currency ethereum not supported",
    });
    expect(added!.payload[1].error).toEqual({
      name: "CurrencyNotSupported",
      message: "currency solana not supported",
    });
  });

  it("does not emit ADD_NON_IMPORTED_ACCOUNTS when nothing is dropped", () => {
    mockCheckAccountSupported.mockReturnValue(null);
    const dispatched = runThunk(initAccounts([fakeTuple("btc-1", "bitcoin")]));
    expect(dispatched.some(a => a.type === "ADD_NON_IMPORTED_ACCOUNTS")).toBe(false);
  });
});
