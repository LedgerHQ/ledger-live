import { accountRefOf, getAccountBalanceRows } from "./accountBalances";

const getBalance = jest.fn();
const getTokenFromAsset = jest.fn();
const balanceOptions = { includeAssets: jest.fn() };

jest.mock("./api/index", () => ({
  getCoinModuleApi: jest.fn(async () => ({
    getBalance: (...args: unknown[]) => getBalance(...args),
  })),
}));
jest.mock("./bridge", () => ({
  getBridgeApi: jest.fn(async () => ({
    balanceOptions,
    getTokenFromAsset: (...args: unknown[]) => getTokenFromAsset(...args),
  })),
}));

const ACCOUNT_ID = "js:2:ethereum:0xabc:";
const read = () =>
  getAccountBalanceRows({ accountId: ACCOUNT_ID, currencyId: "ethereum", address: "0xabc" });

const native = (value: bigint, locked?: bigint) => ({
  asset: { type: "native" },
  value,
  ...(locked === undefined ? {} : { locked }),
});
const erc20 = (value: bigint) => ({
  asset: { type: "erc20", assetReference: "0xdead" },
  value,
});

beforeEach(() => {
  jest.clearAllMocks();
  getTokenFromAsset.mockResolvedValue({ id: "ethereum/erc20/usd__coin" });
});

describe("getAccountBalanceRows", () => {
  it("reads every asset in a single getBalance call", async () => {
    getBalance.mockResolvedValue([native(1000n), erc20(42n), erc20(7n)]);
    const rows = await read();
    expect(getBalance).toHaveBeenCalledTimes(1);
    expect(rows).toHaveLength(3);
  });

  it("passes the family's balanceOptions through", async () => {
    getBalance.mockResolvedValue([native(1n)]);
    await read();
    expect(getBalance).toHaveBeenCalledWith(expect.anything(), "0xabc", balanceOptions);
  });

  it("keys the native balance on the account itself, with no parent", async () => {
    getBalance.mockResolvedValue([native(1000n)]);
    const [row] = await read();
    expect(row).toMatchObject({
      accountId: ACCOUNT_ID,
      assetId: "ethereum",
      balance: "1000",
      spendableBalance: "1000",
    });
    expect(row.parentId).toBeUndefined();
    expect(Date.parse(row.at)).not.toBeNaN();
  });

  it("subtracts the locked part from the spendable balance, not from the total", async () => {
    getBalance.mockResolvedValue([native(1000n, 250n)]);
    const [row] = await read();
    expect(row.balance).toBe("1000");
    expect(row.spendableBalance).toBe("750");
  });

  it("clamps the spendable balance at zero when a module over-reports what is locked", async () => {
    getBalance.mockResolvedValue([native(100n, 250n)]);
    const [row] = await read();
    expect(row.balance).toBe("100");
    expect(row.spendableBalance).toBe("0");
  });

  it("derives a token account id and parents it to the account", async () => {
    getBalance.mockResolvedValue([native(0n), erc20(42n)]);
    const [, token] = await read();
    expect(token.assetId).toBe("ethereum/erc20/usd__coin");
    expect(token.balance).toBe("42");
    expect(token.parentId).toBe(ACCOUNT_ID);
    expect(token.accountId.startsWith(ACCOUNT_ID)).toBe(true);
    expect(token.accountId).not.toBe(ACCOUNT_ID);
  });

  it("stamps every row of one read with the same instant", async () => {
    getBalance.mockResolvedValue([native(1000n), erc20(42n)]);
    const [main, token] = await read();
    expect(token.at).toBe(main.at);
  });

  it("drops a token asset the family cannot name", async () => {
    getBalance.mockResolvedValue([native(0n), erc20(42n)]);
    getTokenFromAsset.mockResolvedValue(undefined);
    expect(await read()).toHaveLength(1);
  });

  it("drops token assets entirely when the family resolves none", async () => {
    getBalance.mockResolvedValue([erc20(42n)]);
    getTokenFromAsset.mockResolvedValue(undefined);
    expect(await read()).toEqual([]);
  });

  it("returns an empty list for an address holding nothing", async () => {
    getBalance.mockResolvedValue([]);
    expect(await read()).toEqual([]);
  });

  it("propagates a chain failure rather than reporting a zero balance", async () => {
    getBalance.mockRejectedValue(new Error("rpc down"));
    await expect(read()).rejects.toThrow("rpc down");
  });
});

describe("accountRefOf", () => {
  const account = {
    type: "Account",
    id: ACCOUNT_ID,
    freshAddress: "0xABC",
    derivationMode: "",
    currency: { id: "ethereum" },
  };

  it("carries the id, currency and fresh address", () => {
    expect(accountRefOf(account)).toEqual({
      accountId: ACCOUNT_ID,
      currencyId: "ethereum",
      address: "0xABC",
      derivationMode: "",
    });
  });

  it("falls back to the xpub encoded in the id when no fresh address is known", () => {
    expect(accountRefOf({ ...account, freshAddress: "" }).address).toBe("0xabc");
  });

  it("leaves parentId unset on a main account", () => {
    expect(accountRefOf(account).parentId).toBeUndefined();
  });

  it("resolves a token account against its parent's address and currency", () => {
    const token = {
      type: "TokenAccount",
      id: `${ACCOUNT_ID}+ethereum%2Ferc20%2Fusd__coin`,
      token: { parentCurrencyId: "ethereum" },
    };
    expect(accountRefOf(token, account)).toEqual({
      accountId: token.id,
      currencyId: "ethereum",
      address: "0xABC",
      derivationMode: "",
      parentId: ACCOUNT_ID,
    });
  });
});

describe("accountRefOf — token accounts", () => {
  const token = {
    type: "TokenAccount",
    id: `${ACCOUNT_ID}+ethereum%2Ferc20%2Fusd__coin`,
    parentId: ACCOUNT_ID,
    token: { parentCurrencyId: "ethereum" },
  };

  it("marks a token ref even when no parent is passed", () => {
    // Without parentId the ref would look like a main-account ref, and the sources gate on it — so
    // an account-wide balance replacement would be keyed under a token id.
    expect(accountRefOf(token).parentId).toBe(ACCOUNT_ID);
  });
});
