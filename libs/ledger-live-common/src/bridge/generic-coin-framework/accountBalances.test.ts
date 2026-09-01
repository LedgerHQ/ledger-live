import { getAccountBalanceRows } from "./accountBalances";

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
    expect(row).toEqual({ accountId: ACCOUNT_ID, assetId: "ethereum", value: "1000" });
  });

  it("reports the locked part without subtracting it from the total", async () => {
    getBalance.mockResolvedValue([native(1000n, 250n)]);
    const [row] = await read();
    expect(row.value).toBe("1000");
    expect(row.locked).toBe("250");
  });

  it("derives a token account id and parents it to the account", async () => {
    getBalance.mockResolvedValue([native(0n), erc20(42n)]);
    const [, token] = await read();
    expect(token.assetId).toBe("ethereum/erc20/usd__coin");
    expect(token.value).toBe("42");
    expect(token.parentId).toBe(ACCOUNT_ID);
    expect(token.accountId.startsWith(ACCOUNT_ID)).toBe(true);
    expect(token.accountId).not.toBe(ACCOUNT_ID);
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
