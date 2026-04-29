import BigNumber from "bignumber.js";
import { Account, AccountLike, DailyOperationsSection, Operation } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { buildOperationsSections } from "../useOperationsSections";
import type { CurrencySettings } from "~/reducers/types";

// --- helpers ---

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");

function makeAccount(id: string, blockHeight = 100, currency = bitcoin): Account {
  return {
    type: "Account",
    id,
    blockHeight,
    currency,
    freshAddress: `addr-${id}`,
  } as unknown as Account;
}

function makeOp(accountId: string, overrides: Partial<Operation> = {}): Operation {
  return {
    id: `op-${Math.random()}`,
    hash: "hash",
    type: "OUT",
    value: new BigNumber(1000),
    fee: new BigNumber(100),
    senders: [],
    recipients: [],
    blockHash: null,
    blockHeight: 95,
    accountId,
    date: new Date("2024-01-01"),
    extra: {},
    ...overrides,
  };
}

function makeSection(data: Operation[], day = new Date("2024-01-01")): DailyOperationsSection {
  return { day, data };
}

function makeMaps(accounts: Account[]) {
  const flattenedAccountsById = new Map<string, AccountLike>(accounts.map(a => [a.id, a]));
  const mainAccountById = new Map<string, Account>(accounts.map(a => [a.id, a]));
  return { flattenedAccountsById, mainAccountById };
}

const noSettings: Record<string, CurrencySettings> = {};
// BTC: 6 confirmations required; account.blockHeight = 100
// confirmed: op.blockHeight <= 95  (100 - 95 + 1 = 6 >= 6)
// pending:   op.blockHeight >= 96  (100 - 96 + 1 = 5 < 6)
const btcSettings: Record<string, CurrencySettings> = {
  BTC: { confirmationsNb: 6 } as CurrencySettings,
};

// --- tests ---

describe("buildOperationsSections", () => {
  it("returns empty array when rawSections is empty", () => {
    const result = buildOperationsSections([], new Map(), new Map(), noSettings);
    expect(result).toEqual([]);
  });

  it("returns regular sections with no pending section when all ops are confirmed", () => {
    const account = makeAccount("acc1");
    const { flattenedAccountsById, mainAccountById } = makeMaps([account]);
    // blockHeight 95 → 100-95+1 = 6 confirmations → confirmed with confirmationsNb=6
    const op = makeOp("acc1", { blockHeight: 95 });
    const sections = [makeSection([op])];

    const result = buildOperationsSections(
      sections,
      flattenedAccountsById,
      mainAccountById,
      btcSettings,
    );

    expect(result).toHaveLength(1);
    expect(result[0].isPending).toBeUndefined();
    expect(result[0].data).toContain(op);
  });

  it("puts op in pending when blockHeight is null (not yet on chain)", () => {
    const account = makeAccount("acc1");
    const { flattenedAccountsById, mainAccountById } = makeMaps([account]);
    const pendingOp = makeOp("acc1", { blockHeight: null });
    const sections = [makeSection([pendingOp])];

    const result = buildOperationsSections(
      sections,
      flattenedAccountsById,
      mainAccountById,
      btcSettings,
    );

    expect(result[0].isPending).toBe(true);
    expect(result[0].data).toContain(pendingOp);
  });

  it("puts op in pending when blockHeight is set but confirmation count is insufficient", () => {
    const account = makeAccount("acc1");
    const { flattenedAccountsById, mainAccountById } = makeMaps([account]);
    // blockHeight 96 → 100-96+1 = 5 confirmations < 6 → pending
    const op = makeOp("acc1", { blockHeight: 96 });
    const sections = [makeSection([op])];

    const result = buildOperationsSections(
      sections,
      flattenedAccountsById,
      mainAccountById,
      btcSettings,
    );

    expect(result[0].isPending).toBe(true);
    expect(result[0].data).toContain(op);
  });

  it("keeps hasFailed op in regular section even when blockHeight is null", () => {
    const account = makeAccount("acc1");
    const { flattenedAccountsById, mainAccountById } = makeMaps([account]);
    const failedOp = makeOp("acc1", { blockHeight: null, hasFailed: true });
    const sections = [makeSection([failedOp])];

    const result = buildOperationsSections(
      sections,
      flattenedAccountsById,
      mainAccountById,
      btcSettings,
    );

    expect(result).toHaveLength(1);
    expect(result[0].isPending).toBeUndefined();
    expect(result[0].data).toContain(failedOp);
  });

  it("keeps hasFailed op in regular section even when confirmation count is insufficient", () => {
    const account = makeAccount("acc1");
    const { flattenedAccountsById, mainAccountById } = makeMaps([account]);
    // blockHeight 96 → 5 confirmations < 6, but hasFailed = true
    const failedOp = makeOp("acc1", { blockHeight: 96, hasFailed: true });
    const sections = [makeSection([failedOp])];

    const result = buildOperationsSections(
      sections,
      flattenedAccountsById,
      mainAccountById,
      btcSettings,
    );

    expect(result).toHaveLength(1);
    expect(result[0].isPending).toBeUndefined();
    expect(result[0].data).toContain(failedOp);
  });

  it("puts op in regular when accountId is unknown (safe fallback)", () => {
    const { flattenedAccountsById, mainAccountById } = makeMaps([]);
    const op = makeOp("unknown-account", { blockHeight: null });
    const sections = [makeSection([op])];

    const result = buildOperationsSections(
      sections,
      flattenedAccountsById,
      mainAccountById,
      btcSettings,
    );

    expect(result).toHaveLength(1);
    expect(result[0].isPending).toBeUndefined();
    expect(result[0].data).toContain(op);
  });

  it("pending section is always first", () => {
    const account = makeAccount("acc1");
    const { flattenedAccountsById, mainAccountById } = makeMaps([account]);
    const confirmedOp = makeOp("acc1", { blockHeight: 95 });
    const pendingOp = makeOp("acc1", { blockHeight: null });
    const day1 = new Date("2024-01-01");
    const day2 = new Date("2024-01-02");
    const sections = [makeSection([confirmedOp], day2), makeSection([pendingOp], day1)];

    const result = buildOperationsSections(
      sections,
      flattenedAccountsById,
      mainAccountById,
      btcSettings,
    );

    expect(result[0].isPending).toBe(true);
    expect(result[1].isPending).toBeUndefined();
  });

  it("prunes day sections that become empty after extracting pending ops", () => {
    const account = makeAccount("acc1");
    const { flattenedAccountsById, mainAccountById } = makeMaps([account]);
    // All ops in this section are pending → section is pruned from regular
    const pendingOp1 = makeOp("acc1", { blockHeight: null });
    const pendingOp2 = makeOp("acc1", { blockHeight: 96 });
    const sections = [makeSection([pendingOp1, pendingOp2])];

    const result = buildOperationsSections(
      sections,
      flattenedAccountsById,
      mainAccountById,
      btcSettings,
    );

    expect(result).toHaveLength(1);
    expect(result[0].isPending).toBe(true);
    expect(result[0].data).toHaveLength(2);
  });

  it("mixes pending and confirmed ops across multiple day sections", () => {
    const account = makeAccount("acc1");
    const { flattenedAccountsById, mainAccountById } = makeMaps([account]);
    const pendingOp = makeOp("acc1", { blockHeight: null });
    const confirmedOp = makeOp("acc1", { blockHeight: 95 });
    const sections = [makeSection([pendingOp, confirmedOp])];

    const result = buildOperationsSections(
      sections,
      flattenedAccountsById,
      mainAccountById,
      btcSettings,
    );

    expect(result).toHaveLength(2);
    expect(result[0].isPending).toBe(true);
    expect(result[0].data).toContain(pendingOp);
    expect(result[1].isPending).toBeUndefined();
    expect(result[1].data).toContain(confirmedOp);
  });

  it("uses confirmationsNb from settings over defaults", () => {
    // account.blockHeight = 100, op.blockHeight = 99 → 2 confirmations
    const account = makeAccount("acc1", 100, bitcoin);
    const { flattenedAccountsById, mainAccountById } = makeMaps([account]);
    const op = makeOp("acc1", { blockHeight: 99 });

    // With confirmationsNb = 1 → confirmed (2 >= 1)
    const settingsLow: Record<string, CurrencySettings> = {
      BTC: { confirmationsNb: 1 } as CurrencySettings,
    };
    const resultLow = buildOperationsSections(
      [makeSection([op])],
      flattenedAccountsById,
      mainAccountById,
      settingsLow,
    );
    expect(resultLow[0].isPending).toBeUndefined();

    // With confirmationsNb = 6 → pending (2 < 6)
    const resultHigh = buildOperationsSections(
      [makeSection([op])],
      flattenedAccountsById,
      mainAccountById,
      btcSettings,
    );
    expect(resultHigh[0].isPending).toBe(true);
  });

  it("resolves token account ops using the parent main account", () => {
    const parentAccount = makeAccount("eth-parent", 100, ethereum);
    const tokenAccount = {
      type: "TokenAccount",
      id: "token-acc",
      parentId: "eth-parent",
    } as unknown as AccountLike;
    const flattenedAccountsById = new Map<string, AccountLike>([
      ["eth-parent", parentAccount],
      ["token-acc", tokenAccount],
    ]);
    const mainAccountById = new Map<string, Account>([["eth-parent", parentAccount]]);
    const ethSettings: Record<string, CurrencySettings> = {
      ETH: { confirmationsNb: 6 } as CurrencySettings,
    };

    // blockHeight 96 → 5 confirmations < 6 on the parent ETH account → pending
    const op = makeOp("token-acc", { blockHeight: 96 });
    const result = buildOperationsSections(
      [makeSection([op])],
      flattenedAccountsById,
      mainAccountById,
      ethSettings,
    );

    expect(result[0].isPending).toBe(true);
    expect(result[0].data).toContain(op);
  });

  it("caches confirmationsNb per ticker — multiple ops of same currency do not recompute", () => {
    const account = makeAccount("acc1");
    const { flattenedAccountsById, mainAccountById } = makeMaps([account]);

    // Spy on the underlying defaults to verify it's only called once per currency
    const ops = Array.from({ length: 5 }, () => makeOp("acc1", { blockHeight: null }));
    const sections = [makeSection(ops)];

    // No settings → falls back to currencySettingsDefaults. All blockHeight=null → all pending.
    const result = buildOperationsSections(
      sections,
      flattenedAccountsById,
      mainAccountById,
      noSettings,
    );

    expect(result[0].isPending).toBe(true);
    expect(result[0].data).toHaveLength(5);
  });
});
