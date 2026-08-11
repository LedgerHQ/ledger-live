import type { UnknownAction } from "redux";
import type { Account, AccountRaw, AccountUserData, DerivationMode } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getDefaultAccountName } from "@domain/entity-account-name";
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
  const userData = { id, name: `custom-${id}`, starredIds: [] } as unknown as AccountUserData;
  return [account, userData];
}

/** An account the user starred but never renamed: its name is the default one. */
function starredTupleWithDefaultName(
  id: string,
  currencyId: string,
  index = 0,
): [Account, AccountUserData] {
  const account = {
    id,
    type: "Account",
    currency: getCryptoCurrencyById(currencyId),
    derivationMode: "" as DerivationMode,
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

async function starredIdsPayload(rawAccounts: {
  active: { data: AccountRaw }[];
}): Promise<string[]> {
  const dispatched = await runImportStore(rawAccounts);
  const action = dispatched.find(
    a => a.type === "starredAccounts/initStarredFromIds",
  ) as unknown as {
    payload: string[];
  };
  return action.payload;
}

async function runImportStore(rawAccounts: { active: { data: AccountRaw }[] }) {
  const dispatched: UnknownAction[] = [];
  const dispatch = (action: UnknownAction) => {
    dispatched.push(action);
    return action;
  };
  const thunk = await importStore(rawAccounts);
  thunk(dispatch as never);
  return dispatched;
}

async function initAction(rawAccounts: { active: { data: AccountRaw }[] }) {
  const dispatched = await runImportStore(rawAccounts);
  const action = dispatched.find(a => a.type === "INIT_ACCOUNTS");
  return action as unknown as {
    type: string;
    payload: { accounts: Account[]; accountsUserData: AccountUserData[] };
  };
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

    const action = await initAction({
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

    const action = await initAction({
      active: [{ data: { id: "btc-1" } as AccountRaw }, { data: { id: "eth-1" } as AccountRaw }],
    });

    expect(action.payload.accounts.map((a: Account) => a.id)).toEqual(["btc-1", "eth-1"]);
  });

  it("drops accounts with an unsupported derivation mode", async () => {
    mockDecode
      .mockResolvedValueOnce(fakeTuple("btc-segwit", "bitcoin", ""))
      .mockResolvedValueOnce(fakeTuple("btc-legacy", "bitcoin", "unsupported_derivation_mode"));

    const action = await initAction({
      active: [
        { data: { id: "btc-segwit" } as AccountRaw },
        { data: { id: "btc-legacy" } as AccountRaw },
      ],
    });

    expect(action.payload.accounts.map((a: Account) => a.id)).toEqual(["btc-segwit"]);
  });

  it("keeps starred ids of accounts that kept their default name", async () => {
    mockDecode.mockResolvedValueOnce(starredTupleWithDefaultName("btc-default", "bitcoin"));

    await expect(
      starredIdsPayload({ active: [{ data: { id: "btc-default" } as AccountRaw }] }),
    ).resolves.toEqual(["btc-default"]);
  });

  it("collects starred ids from both renamed and default-named accounts", async () => {
    const renamed = fakeTuple("btc-renamed", "bitcoin");
    renamed[1].starredIds = ["btc-renamed"];
    mockDecode
      .mockResolvedValueOnce(renamed)
      .mockResolvedValueOnce(starredTupleWithDefaultName("eth-default", "ethereum"));

    const ids = await starredIdsPayload({
      active: [
        { data: { id: "btc-renamed" } as AccountRaw },
        { data: { id: "eth-default" } as AccountRaw },
      ],
    });
    expect(ids.sort()).toEqual(["btc-renamed", "eth-default"]);
  });

  it("does not leak default names into the account names payload", async () => {
    mockDecode.mockResolvedValueOnce(starredTupleWithDefaultName("btc-default", "bitcoin"));

    const action = await initAction({ active: [{ data: { id: "btc-default" } as AccountRaw }] });
    expect(action.payload.accountsUserData.map((u: AccountUserData) => u.id)).toEqual([]);
  });

  it("also dispatches account name and starred initialization", async () => {
    mockDecode.mockResolvedValueOnce(fakeTuple("btc-1", "bitcoin"));

    const types = (await runImportStore({ active: [{ data: { id: "btc-1" } as AccountRaw }] })).map(
      a => a.type,
    );
    expect(types).toEqual([
      "INIT_ACCOUNTS",
      "accountNames/initFromUserData",
      "starredAccounts/initStarredFromIds",
    ]);
  });
});
