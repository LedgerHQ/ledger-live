import type { Account, AccountRaw, AccountUserData, DerivationMode } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import accountModel from "../logic/accountModel";
import { importStore } from "./accounts";

jest.mock("../logic/accountModel", () => ({
  __esModule: true,
  default: { decode: jest.fn() },
}));

const mockDecode = accountModel.decode as jest.Mock;

function fakeTuple(
  id: string,
  currencyId: string,
  derivationMode = "",
): [Account, AccountUserData] {
  const account = {
    id,
    type: "Account",
    currency: getCryptoCurrencyById(currencyId),
    derivationMode: derivationMode as DerivationMode,
    name: `name-${id}`,
  } as unknown as Account;
  const userData = { id, name: `custom-${id}` } as unknown as AccountUserData;
  return [account, userData];
}

describe("importStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("drops accounts whose currency has no coin module", async () => {
    mockDecode
      .mockResolvedValueOnce(fakeTuple("btc-1", "bitcoin"))
      .mockResolvedValueOnce(fakeTuple("eos-1", "eos")) // no coin-module loader → unsupported
      .mockResolvedValueOnce(fakeTuple("btc-2", "bitcoin"));

    const action = await importStore({
      active: [
        { data: { id: "btc-1" } as AccountRaw },
        { data: { id: "eos-1" } as AccountRaw },
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
    mockDecode
      .mockResolvedValueOnce(fakeTuple("btc-1", "bitcoin"))
      .mockResolvedValueOnce(fakeTuple("eth-1", "ethereum"));

    const action = await importStore({
      active: [{ data: { id: "btc-1" } as AccountRaw }, { data: { id: "eth-1" } as AccountRaw }],
    });

    expect(action.payload.accounts.map((a: Account) => a.id)).toEqual(["btc-1", "eth-1"]);
  });

  it("drops accounts with an unsupported derivation mode", async () => {
    mockDecode
      .mockResolvedValueOnce(fakeTuple("btc-segwit", "bitcoin", ""))
      .mockResolvedValueOnce(fakeTuple("btc-legacy", "bitcoin", "unsupported_derivation_mode"));

    const action = await importStore({
      active: [
        { data: { id: "btc-segwit" } as AccountRaw },
        { data: { id: "btc-legacy" } as AccountRaw },
      ],
    });

    expect(action.payload.accounts.map((a: Account) => a.id)).toEqual(["btc-segwit"]);
  });
});
