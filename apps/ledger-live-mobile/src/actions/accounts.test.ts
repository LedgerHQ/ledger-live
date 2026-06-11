import type { Account, AccountRaw, AccountUserData } from "@ledgerhq/types-live";
import { checkAccountSupported } from "@ledgerhq/live-common/account/index";
import accountModel from "../logic/accountModel";
import { importStore } from "./accounts";

jest.mock("@ledgerhq/ledger-wallet-framework/account/support", () => ({
  __esModule: true,
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

    const action = await importStore({
      active: [
        { data: { id: "btc-1" } as AccountRaw },
        { data: { id: "eth-1" } as AccountRaw },
        { data: { id: "btc-2" } as AccountRaw },
      ],
    });

    expect(action.type).toBe("INIT_ACCOUNTS");
    expect(action.payload.accounts.map((a: Account) => a.id)).toEqual(["btc-1", "btc-2"]);
    expect(action.payload.accountsUserData.map((u: AccountUserData) => u.id)).toEqual([
      "btc-1",
      "btc-2",
    ]);
  });

  it("keeps all accounts when every currency is supported", async () => {
    mockCheckAccountSupported.mockReturnValue(null);
    mockDecode
      .mockResolvedValueOnce(fakeTuple("btc-1", "bitcoin"))
      .mockResolvedValueOnce(fakeTuple("eth-1", "ethereum"));

    const action = await importStore({
      active: [{ data: { id: "btc-1" } as AccountRaw }, { data: { id: "eth-1" } as AccountRaw }],
    });

    expect(action.payload.accounts.map((a: Account) => a.id)).toEqual(["btc-1", "eth-1"]);
  });

  it("drops accounts on any non-currency error (e.g. unsupported derivation mode)", async () => {
    mockCheckAccountSupported.mockImplementation((a: { id: string }) =>
      a.id === "btc-segwit" ? null : new Error("derivation mode not supported"),
    );
    mockDecode
      .mockResolvedValueOnce(fakeTuple("btc-segwit", "bitcoin"))
      .mockResolvedValueOnce(fakeTuple("btc-legacy", "bitcoin"));

    const action = await importStore({
      active: [
        { data: { id: "btc-segwit" } as AccountRaw },
        { data: { id: "btc-legacy" } as AccountRaw },
      ],
    });

    expect(action.payload.accounts.map((a: Account) => a.id)).toEqual(["btc-segwit"]);
  });
});
