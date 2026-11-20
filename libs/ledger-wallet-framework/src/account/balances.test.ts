import BigNumber from "bignumber.js";
import type { Account, AccountBalance, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { UnsupportedMaxSpendableFilter } from "../errors";
import {
  clampLocked,
  defaultAccountBalances,
  fromAccountBalancesRaw,
  isValidAccountBalances,
  restoreAccountBalances,
  selectMaxSpendableRows,
  spendableOfRows,
  toAccountBalancesRaw,
  withAccountBalances,
} from "./balances";

const bn = (n: number | string) => new BigNumber(n);

const tokenAccount = (id: string, balance: number, spendable = balance): TokenAccount =>
  ({
    type: "TokenAccount",
    id,
    balance: bn(balance),
    spendableBalance: bn(spendable),
  }) as TokenAccount;

const account = (balance: number, spendable = balance, subAccounts?: TokenAccount[]): Account =>
  ({
    type: "Account",
    id: "acc",
    balance: bn(balance),
    spendableBalance: bn(spendable),
    subAccounts,
  }) as Account;

describe("clampLocked", () => {
  it("keeps the locked part inside [0, value]", () => {
    expect(clampLocked(bn(10), bn(-1))).toEqual(bn(0));
    expect(clampLocked(bn(10), bn(4))).toEqual(bn(4));
    expect(clampLocked(bn(10), bn(12))).toEqual(bn(10));
  });
});

describe("defaultAccountBalances", () => {
  it("holds the whole balance in one row with the non-spendable part locked", () => {
    expect(defaultAccountBalances(account(100, 70))).toEqual([{ value: bn(100), locked: bn(30) }]);
  });

  it("has no locked key when everything is spendable", () => {
    const [row] = defaultAccountBalances(account(100));
    expect(row).toEqual({ value: bn(100) });
    expect("locked" in row).toBe(false);
  });

  it("never locks more than the balance", () => {
    expect(defaultAccountBalances(account(10, -5))).toEqual([{ value: bn(10), locked: bn(10) }]);
  });
});

describe("isValidAccountBalances", () => {
  const rows: AccountBalance[] = [
    { value: bn(60), locked: bn(10), pool: "a" },
    { value: bn(40), pool: "b", private: true },
  ];

  it("accepts rows that partition the balance", () => {
    expect(isValidAccountBalances(bn(100), rows)).toBe(true);
  });

  it("rejects an empty list", () => {
    expect(isValidAccountBalances(bn(0), [])).toBe(false);
  });

  it("rejects a wrong sum", () => {
    expect(isValidAccountBalances(bn(99), rows)).toBe(false);
  });

  it("rejects a negative or excessive locked part", () => {
    expect(isValidAccountBalances(bn(10), [{ value: bn(10), locked: bn(-1) }])).toBe(false);
    expect(isValidAccountBalances(bn(10), [{ value: bn(10), locked: bn(11) }])).toBe(false);
  });

  it("rejects a negative value", () => {
    expect(isValidAccountBalances(bn(10), [{ value: bn(-1) }, { value: bn(11) }])).toBe(false);
  });

  it("rejects two rows with the same pool and privacy", () => {
    expect(
      isValidAccountBalances(bn(10), [
        { value: bn(5), pool: "a" },
        { value: bn(5), pool: "a" },
      ]),
    ).toBe(false);
  });

  it("tells a private row from a public one of the same pool", () => {
    expect(
      isValidAccountBalances(bn(10), [
        { value: bn(5), pool: "a" },
        { value: bn(5), pool: "a", private: true },
      ]),
    ).toBe(true);
  });
});

describe("withAccountBalances", () => {
  it("keeps valid produced rows", () => {
    const produced = [{ value: bn(100), locked: bn(5), pool: "x" }];
    const res = withAccountBalances(account(100), { account: produced });
    expect(res.balances).toBe(produced);
  });

  it("uses the default row when the produced rows are invalid", () => {
    const res = withAccountBalances(account(100, 90), { account: [{ value: bn(1), pool: "x" }] });
    expect(res.balances).toEqual([{ value: bn(100), locked: bn(10) }]);
  });

  it("uses the default row when nothing is produced and drops inherited rows", () => {
    const stale = { ...account(100), balances: [{ value: bn(7), pool: "old" }] };
    expect(withAccountBalances(stale).balances).toEqual([{ value: bn(100) }]);
  });

  it("gives token accounts without produced rows the default row", () => {
    const res = withAccountBalances(account(1, 1, [tokenAccount("t1", 50, 40)]));
    expect(res.subAccounts?.[0].balances).toEqual([{ value: bn(50), locked: bn(10) }]);
  });

  it("applies the produced token rows by token account id", () => {
    const tokenRows = [
      { value: bn(30), pool: "p" },
      { value: bn(20), pool: "q", private: true },
    ];
    const res = withAccountBalances(
      account(1, 1, [tokenAccount("t1", 50), tokenAccount("t2", 5)]),
      {
        tokens: { t1: tokenRows },
      },
    );
    expect(res.subAccounts?.[0].balances).toBe(tokenRows);
    expect(res.subAccounts?.[1].balances).toEqual([{ value: bn(5) }]);
  });

  it("leaves a sub-account without a balance untouched", () => {
    const partial = { type: "TokenAccount", id: "t" } as TokenAccount;
    const res = withAccountBalances(account(1, 1, [partial]));
    expect(res.subAccounts?.[0]).toBe(partial);
  });

  it("leaves an account without a balance untouched", () => {
    const partial = { type: "Account", id: "acc" } as Account;
    expect(withAccountBalances(partial)).toBe(partial);
  });

  it("does not mutate the input account", () => {
    const input = account(100);
    withAccountBalances(input);
    expect(input.balances).toBeUndefined();
  });
});

describe("balances serialization", () => {
  it("round-trips every field", () => {
    const rows: AccountBalance[] = [
      { value: bn("123456789012345678901234567890"), locked: bn(1), pool: "a", private: false },
      { value: bn(2), private: true },
    ];
    const raw = toAccountBalancesRaw(rows);
    expect(raw).toEqual([
      { value: "123456789012345678901234567890", locked: "1", pool: "a", private: false },
      { value: "2", private: true },
    ]);
    expect(fromAccountBalancesRaw(raw)).toEqual(rows);
  });

  it("restores persisted rows as they were stored", () => {
    expect(restoreAccountBalances([{ value: "7", pool: "a" }], account(10, 4))).toEqual([
      { value: bn(7), pool: "a" },
    ]);
  });

  it("restores the default row for an account persisted without rows", () => {
    expect(restoreAccountBalances(undefined, account(10, 4))).toEqual([
      { value: bn(10), locked: bn(6) },
    ]);
  });
});

const filterRow = (value: number, pool?: string, isPrivate?: boolean): AccountBalance => ({
  value: new BigNumber(value),
  ...(pool !== undefined && { pool }),
  ...(isPrivate !== undefined && { private: isPrivate }),
});

const withRows = (balances?: AccountBalance[]) =>
  ({ type: "Account", balances }) as unknown as AccountLike;

const zcashLike = withRows([filterRow(10, "transparent"), filterRow(20, "ironwood", true)]);

describe("selectMaxSpendableRows", () => {
  it("selects the row of a pool", () => {
    expect(selectMaxSpendableRows(zcashLike, { pools: ["ironwood"] })).toEqual([
      filterRow(20, "ironwood", true),
    ]);
  });

  it("selects the rows by their private flag", () => {
    expect(selectMaxSpendableRows(zcashLike, { private: true })).toEqual([
      filterRow(20, "ironwood", true),
    ]);
    expect(selectMaxSpendableRows(zcashLike, { private: false })).toEqual([
      filterRow(10, "transparent"),
    ]);
  });

  it("selects the row that matches the pool and the private flag together", () => {
    expect(selectMaxSpendableRows(zcashLike, { pools: ["ironwood"], private: true })).toEqual([
      filterRow(20, "ironwood", true),
    ]);
  });

  it("selects the single default row of a family without pools with private: false", () => {
    const account = withRows([filterRow(30)]);

    expect(selectMaxSpendableRows(account, { private: false })).toEqual([filterRow(30)]);
  });

  it("selects every row of one pool, whatever their private flag", () => {
    const account = withRows([
      filterRow(1, "p", false),
      filterRow(2, "p", true),
      filterRow(3, "q"),
    ]);

    expect(selectMaxSpendableRows(account, { pools: ["p"] })).toEqual([
      filterRow(1, "p", false),
      filterRow(2, "p", true),
    ]);
  });

  it.each([
    ["several pools", zcashLike, { pools: ["transparent", "ironwood"] }],
    ["no pool", zcashLike, { pools: [] }],
    ["an unknown pool", zcashLike, { pools: ["sapling"] }],
    [
      "a pool and a private flag that select no row",
      zcashLike,
      { pools: ["transparent"], private: true },
    ],
    ["pools on rows that carry no pool", withRows([filterRow(30)]), { pools: ["transparent"] }],
    ["private: true on public rows only", withRows([filterRow(30)]), { private: true }],
    ["an account with no balances", withRows(undefined), { private: false }],
    ["an account with an empty breakdown", withRows([]), { private: false }],
  ])("throws UnsupportedMaxSpendableFilter for %s", (_label, account, filters) => {
    expect(() => selectMaxSpendableRows(account, filters)).toThrow(UnsupportedMaxSpendableFilter);
  });

  it("names the filters it could not honour", () => {
    expect(() => selectMaxSpendableRows(zcashLike, { pools: ["sapling"] })).toThrow(
      /"pools":\["sapling"\]/,
    );
  });
});

describe("spendableOfRows", () => {
  it("sums the value of the rows minus what they lock", () => {
    expect(spendableOfRows([{ value: bn(10), locked: bn(4) }, { value: bn(5) }]).toString()).toBe(
      "11",
    );
  });
});
