import type { Account, AccountRaw, AccountUserData } from "@ledgerhq/types-live";
import { checkAccountSupported } from "@ledgerhq/ledger-wallet-framework/account/support";
import accountModel from "../logic/accountModel";
import { importStore } from "./accounts";

jest.mock("@ledgerhq/ledger-wallet-framework/account/support", () => ({
  ...jest.requireActual("@ledgerhq/ledger-wallet-framework/account/support"),
  checkAccountSupported: jest.fn(),
}));

jest.mock("../logic/accountModel", () => ({
  __esModule: true,
  default: { decode: jest.fn() },
}));

const mockCheckAccountSupported = checkAccountSupported as jest.Mock;
const mockDecode = accountModel.decode as jest.Mock;

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

async function dispatchedFrom(rawAccounts: { active: { data: AccountRaw }[] }) {
  return (await importStore(rawAccounts)) as { type: string; payload?: unknown }[];
}

describe("importStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("drops accounts whose currency is not supported by this build", async () => {
    mockCheckAccountSupported.mockImplementation((a: { currency: { id: string } }) =>
      a.currency.id === "bitcoin" ? null : new Error("currency not supported"),
    );
    mockDecode
      .mockResolvedValueOnce(fakeTuple("btc-1", "bitcoin"))
      .mockResolvedValueOnce(fakeTuple("eth-1", "ethereum"))
      .mockResolvedValueOnce(fakeTuple("btc-2", "bitcoin"));

    const dispatched = await dispatchedFrom({
      active: [
        { data: { id: "btc-1" } as AccountRaw },
        { data: { id: "eth-1" } as AccountRaw },
        { data: { id: "btc-2" } as AccountRaw },
      ],
    });

    const init = dispatched.find(a => a.type === "INIT_ACCOUNTS") as
      | { type: string; payload: { accounts: Account[]; accountsUserData: AccountUserData[] } }
      | undefined;
    expect(init).toBeDefined();
    expect(init!.payload.accounts.map((a: Account) => a.id)).toEqual(["btc-1", "btc-2"]);
    expect(init!.payload.accountsUserData.map((u: AccountUserData) => u.id)).toEqual([
      "btc-1",
      "btc-2",
    ]);
  });

  it("keeps all accounts when every currency is supported", async () => {
    mockCheckAccountSupported.mockReturnValue(null);
    mockDecode
      .mockResolvedValueOnce(fakeTuple("btc-1", "bitcoin"))
      .mockResolvedValueOnce(fakeTuple("eth-1", "ethereum"));

    const dispatched = await dispatchedFrom({
      active: [{ data: { id: "btc-1" } as AccountRaw }, { data: { id: "eth-1" } as AccountRaw }],
    });

    const init = dispatched.find(a => a.type === "INIT_ACCOUNTS") as
      | { type: string; payload: { accounts: Account[] } }
      | undefined;
    expect(init!.payload.accounts.map((a: Account) => a.id)).toEqual(["btc-1", "eth-1"]);
  });

  it("emits ADD_NON_IMPORTED_ACCOUNTS with dropped descriptors and their error", async () => {
    mockCheckAccountSupported.mockImplementation((a: { currency: { id: string } }) => {
      if (a.currency.id === "bitcoin") return null;
      const error = new Error(`currency ${a.currency.id} not supported`);
      error.name = "CurrencyNotSupported";
      return error;
    });
    mockDecode
      .mockResolvedValueOnce(fakeTuple("btc-1", "bitcoin"))
      .mockResolvedValueOnce(fakeTuple("eth-1", "ethereum"))
      .mockResolvedValueOnce(fakeTuple("sol-1", "solana"));

    const dispatched = await dispatchedFrom({
      active: [
        { data: { id: "btc-1" } as AccountRaw },
        { data: { id: "eth-1" } as AccountRaw },
        { data: { id: "sol-1" } as AccountRaw },
      ],
    });

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

  it("does not emit ADD_NON_IMPORTED_ACCOUNTS when nothing is dropped", async () => {
    mockCheckAccountSupported.mockReturnValue(null);
    mockDecode.mockResolvedValueOnce(fakeTuple("btc-1", "bitcoin"));

    const dispatched = await dispatchedFrom({
      active: [{ data: { id: "btc-1" } as AccountRaw }],
    });

    expect(dispatched.some(a => a.type === "ADD_NON_IMPORTED_ACCOUNTS")).toBe(false);
  });
});
