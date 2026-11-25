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
  const userData = { id, name: `custom-${id}` } as AccountUserData;
  return [account, userData];
}

/** An account the user never renamed: its name is the default one. */
function defaultNamedTuple(id: string, currencyId: string, index = 0): [Account, AccountUserData] {
  const account = {
    id,
    type: "Account",
    currency: getCryptoCurrencyById(currencyId),
    derivationMode: "" as DerivationMode,
    index,
    name: `name-${id}`,
  } as unknown as Account;
  const userData: AccountUserData = { id, name: getDefaultAccountName(account) };
  return [account, userData];
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

  it("does not leak default names into the account names payload", async () => {
    mockDecode.mockResolvedValueOnce(defaultNamedTuple("btc-default", "bitcoin"));

    const action = await initAction({ active: [{ data: { id: "btc-default" } as AccountRaw }] });
    expect(action.payload.accountsUserData.map((u: AccountUserData) => u.id)).toEqual([]);
  });

  it("also dispatches account name initialization", async () => {
    mockDecode.mockResolvedValueOnce(fakeTuple("btc-1", "bitcoin"));

    const types = (await runImportStore({ active: [{ data: { id: "btc-1" } as AccountRaw }] })).map(
      a => a.type,
    );
    expect(types).toEqual(["INIT_ACCOUNTS", "accountNames/initFromUserData"]);
  });

  describe("migration version", () => {
    async function decodedVersion(stored: { data: AccountRaw; version?: number }) {
      mockDecode.mockResolvedValueOnce(fakeTuple("btc-1", "bitcoin"));
      await runImportStore({ active: [stored] });
      return mockDecode.mock.calls[0][0].version;
    }

    it("runs every migration for a legacy value stored with version 1", async () => {
      await expect(
        decodedVersion({ data: { id: "btc-1" } as AccountRaw, version: 1 }),
      ).resolves.toBe(0);
    });

    it("runs every migration for a value stored without a version", async () => {
      await expect(decodedVersion({ data: { id: "btc-1" } as AccountRaw })).resolves.toBe(0);
    });

    it("gives the stored version to the decoder for a value stored with its real version", async () => {
      await expect(
        decodedVersion({ data: { id: "btc-1" } as AccountRaw, version: 2 }),
      ).resolves.toBe(2);
    });
  });
});
