import type { Account, AccountUserData } from "@ledgerhq/types-live";
import { checkAccountSupported } from "@ledgerhq/live-common/account/index";
import { initAccounts } from "./accounts";

jest.mock("@ledgerhq/live-common/account/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/account/index"),
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

describe("initAccounts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("drops accounts whose currency is not supported by this build", () => {
    mockCheckAccountSupported.mockImplementation((a: { currency: { id: string } }) =>
      a.currency.id === "bitcoin" ? null : new Error("currency not supported"),
    );

    const action = initAccounts([
      fakeTuple("btc-1", "bitcoin"),
      fakeTuple("eth-1", "ethereum"),
      fakeTuple("btc-2", "bitcoin"),
    ]);

    expect(action.type).toBe("INIT_ACCOUNTS");
    expect(action.payload.accounts.map(a => a.id)).toEqual(["btc-1", "btc-2"]);
    expect(action.payload.accountsUserData.map(u => u.id)).toEqual(["btc-1", "btc-2"]);
  });

  it("keeps all accounts when every currency is supported", () => {
    mockCheckAccountSupported.mockReturnValue(null);

    const action = initAccounts([fakeTuple("btc-1", "bitcoin"), fakeTuple("eth-1", "ethereum")]);

    expect(action.payload.accounts.map(a => a.id)).toEqual(["btc-1", "eth-1"]);
  });

  it("drops accounts on any non-currency error (e.g. unsupported derivation mode)", () => {
    mockCheckAccountSupported.mockImplementation((a: { id: string }) =>
      a.id === "btc-segwit" ? null : new Error("derivation mode not supported"),
    );

    const action = initAccounts([
      fakeTuple("btc-segwit", "bitcoin"),
      fakeTuple("btc-legacy", "bitcoin"),
    ]);

    expect(action.payload.accounts.map(a => a.id)).toEqual(["btc-segwit"]);
  });
});
