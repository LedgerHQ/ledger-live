import BigNumber from "bignumber.js";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import {
  CryptoCurrencyIdSchema,
  TokenCurrencyIdSchema,
  type TokenCurrency,
} from "@ledgerhq/ledger-wallet-framework/types";
import type { Operation, TokenAccount } from "@ledgerhq/types-live";
import {
  applyTokensToResources,
  mergeSubAccounts,
  resolveTokenSubAccounts,
  stripSubAccounts,
  subAccountsPatch,
} from "./tokens";
import type {
  ConcordiumAccount,
  ConcordiumResources,
  PltAccountToken,
  PltModuleState,
} from "../types";

const CURRENCY_ID = "concordium";
const ACCOUNT_ID = "js:2:concordium:pubkey:";
const TOKEN_ID = "t-USDT";

const makeToken = (contractAddress: string, magnitude = 6): TokenCurrency => ({
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse(`concordium/plt/${contractAddress.toLowerCase()}`),
  contractAddress,
  parentCurrencyId: CryptoCurrencyIdSchema.parse(CURRENCY_ID),
  tokenType: "plt",
  name: contractAddress,
  ticker: contractAddress,
  delisted: false,
  disableCountervalue: false,
  units: [{ name: contractAddress, code: contractAddress, magnitude }],
});

const makeEntry = ({
  tokenId = TOKEN_ID,
  balance = "1000000",
  decimals = 6,
  moduleState = {} as PltModuleState | string,
  accountState,
}: {
  tokenId?: string;
  balance?: string;
  decimals?: number;
  moduleState?: PltModuleState | string;
  accountState?: PltAccountToken["tokenAccountState"]["state"];
} = {}): PltAccountToken =>
  ({
    token: {
      tokenId,
      tokenState: {
        tokenModuleRef: "ref",
        decimals,
        totalSupply: { value: "1", decimals },
        moduleState,
      },
    },
    tokenAccountState: {
      balance: { value: balance, decimals },
      ...(accountState === undefined ? {} : { state: accountState }),
    },
  }) as PltAccountToken;

const useStore = (tokens: Record<string, TokenCurrency | undefined>) =>
  setCryptoAssetsStore({
    findTokenById: async () => undefined,
    getTokensSyncHash: async () => "hash",
    findTokenByAddressInCurrency: jest.fn(async (address: string) => tokens[address]),
  });

const resolve = (over: Partial<Parameters<typeof resolveTokenSubAccounts>[0]> = {}) =>
  resolveTokenSubAccounts({
    enableTokens: true,
    currencyId: CURRENCY_ID,
    accountId: ACCOUNT_ID,
    accountTokens: [makeEntry()],
    initialAccount: undefined,
    ...over,
  });

describe("resolveTokenSubAccounts", () => {
  beforeEach(() => {
    useStore({ [TOKEN_ID]: makeToken(TOKEN_ID) });
  });

  it("clears when the feature is off, whatever the chain reports", async () => {
    await expect(resolve({ enableTokens: false })).resolves.toEqual({ kind: "cleared" });
  });

  it("builds a sub-account for any curated token, with no token special-cased", async () => {
    useStore({ AAA: makeToken("AAA"), BBB: makeToken("BBB") });

    const result = await resolve({
      accountTokens: [
        makeEntry({ tokenId: "AAA", balance: "1" }),
        makeEntry({ tokenId: "BBB", balance: "2" }),
      ],
    });

    expect(result.kind).toBe("resolved");
    if (result.kind !== "resolved") return;
    expect(result.subAccounts.map(s => s.token.contractAddress)).toEqual(["AAA", "BBB"]);
    expect(result.subAccounts.map(s => s.balance.toString())).toEqual(["1", "2"]);
  });

  it("sets balance and spendableBalance from the chain value", async () => {
    const result = await resolve({ accountTokens: [makeEntry({ balance: "42" })] });

    if (result.kind !== "resolved") throw new Error("expected resolved");
    const [sub] = result.subAccounts;
    expect(sub.balance).toEqual(new BigNumber("42"));
    expect(sub.spendableBalance).toEqual(new BigNumber("42"));
    expect(sub.id).toBe(encodeTokenAccountId(ACCOUNT_ID, makeToken(TOKEN_ID)));
    expect(sub.parentId).toBe(ACCOUNT_ID);
  });

  it("skips a token that is not in the CAL, without failing the sync", async () => {
    useStore({});

    const result = await resolve();

    expect(result).toEqual({ kind: "resolved", subAccounts: [], tokens: {} });
  });

  it("publishes no balance for a token whose CAL magnitude disagrees with the chain", async () => {
    useStore({ [TOKEN_ID]: makeToken(TOKEN_ID, 8) });

    const result = await resolve({ accountTokens: [makeEntry({ decimals: 6 })] });

    expect(result).toEqual({ kind: "resolved", subAccounts: [], tokens: {} });
  });

  it("keeps an existing sub-account when the decimals disagree, rather than deleting it", async () => {
    const token = makeToken(TOKEN_ID, 8);
    const subId = encodeTokenAccountId(ACCOUNT_ID, token);
    useStore({ [TOKEN_ID]: token });

    const initialAccount = {
      subAccounts: [
        {
          type: "TokenAccount",
          id: subId,
          parentId: ACCOUNT_ID,
          token,
          balance: new BigNumber(5),
          spendableBalance: new BigNumber(5),
          creationDate: new Date(0),
          operations: [],
          operationsCount: 0,
          pendingOperations: [],
          balanceHistoryCache: {},
          swapHistory: [],
        },
      ],
    } as unknown as ConcordiumAccount;

    const result = await resolve({ initialAccount, accountTokens: [makeEntry({ decimals: 6 })] });

    if (result.kind !== "resolved") throw new Error("expected resolved");
    expect(result.subAccounts.map(s => s.id)).toEqual([subId]);
    expect(result.subAccounts[0].balance).toEqual(new BigNumber(5));
    // A data fault must not be reported as the account no longer holding it.
    expect(result.tokens).toEqual({});
  });

  describe("authority of the token list", () => {
    it("treats a missing accountTokens as no information and keeps what exists", async () => {
      await expect(resolve({ accountTokens: undefined })).resolves.toEqual({ kind: "unchanged" });
    });

    it("treats a non-array accountTokens as no information", async () => {
      await expect(
        resolve({ accountTokens: null as unknown as PltAccountToken[] }),
      ).resolves.toEqual({ kind: "unchanged" });
    });

    it("treats an empty array as authoritative, not as missing", async () => {
      const result = await resolve({ accountTokens: [] });

      expect(result).toEqual({ kind: "resolved", subAccounts: [], tokens: {} });
    });
  });

  it("keeps an existing sub-account when the balance is unusable, rather than showing NaN", async () => {
    const token = makeToken(TOKEN_ID);
    const subId = encodeTokenAccountId(ACCOUNT_ID, token);
    useStore({ [TOKEN_ID]: token });

    const broken = makeEntry();
    // The response is not schema-checked, so a missing value is reachable.
    (broken.tokenAccountState as { balance?: unknown }).balance = undefined;

    const initialAccount = {
      subAccounts: [{ id: subId, token, balance: new BigNumber(5), operations: [] }],
    } as unknown as ConcordiumAccount;

    const result = await resolve({ initialAccount, accountTokens: [broken] });

    if (result.kind !== "resolved") throw new Error("expected resolved");
    expect(result.subAccounts.map(s => s.id)).toEqual([subId]);
    expect(result.subAccounts[0].balance).toEqual(new BigNumber(5));
  });

  it("publishes no sub-account for an unusable balance when none existed before", async () => {
    const broken = makeEntry({ balance: "not-a-number" });

    const result = await resolve({ accountTokens: [broken] });

    expect(result).toEqual({ kind: "resolved", subAccounts: [], tokens: {} });
  });

  it("ignores a repeated token id rather than building two sub-accounts for it", async () => {
    const result = await resolve({
      accountTokens: [makeEntry({ balance: "1" }), makeEntry({ balance: "2" })],
    });

    if (result.kind !== "resolved") throw new Error("expected resolved");
    expect(result.subAccounts).toHaveLength(1);
    expect(result.subAccounts[0].balance).toEqual(new BigNumber("1"));
  });

  it("skips a malformed entry and still resolves the rest, rather than aborting the sync", async () => {
    useStore({ AAA: makeToken("AAA") });

    const result = await resolve({
      accountTokens: [
        { token: null } as unknown as PltAccountToken,
        {} as unknown as PltAccountToken,
        makeEntry({ tokenId: "AAA", balance: "3" }),
      ],
    });

    if (result.kind !== "resolved") throw new Error("expected resolved");
    expect(result.subAccounts.map(s => s.token.contractAddress)).toEqual(["AAA"]);
  });

  it("skips a token the user has blacklisted", async () => {
    const token = makeToken(TOKEN_ID);
    useStore({ [TOKEN_ID]: token });

    const result = await resolve({ blacklistedTokenIds: [token.id] });

    expect(result).toEqual({ kind: "resolved", subAccounts: [], tokens: {} });
  });

  it("does not blacklist a different token that happens to share a prefix", async () => {
    useStore({ [TOKEN_ID]: makeToken(TOKEN_ID) });

    const result = await resolve({ blacklistedTokenIds: ["concordium/plt/t-usd"] });

    if (result.kind !== "resolved") throw new Error("expected resolved");
    expect(result.subAccounts).toHaveLength(1);
  });

  it("skips a CAL entry with no units, which cannot be denominated", async () => {
    const unitless = { ...makeToken(TOKEN_ID), units: [] } as unknown as ReturnType<
      typeof makeToken
    >;
    useStore({ [TOKEN_ID]: unitless });

    const result = await resolve();

    expect(result).toEqual({ kind: "resolved", subAccounts: [], tokens: {} });
  });

  it("keeps known tokens when the CAL lookup itself fails, rather than failing the sync", async () => {
    // The injected store throws on a query error instead of returning undefined
    // (buildCryptoAssetsStore.ts), so a CAL outage rejects here.
    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      getTokensSyncHash: async () => "hash",
      findTokenByAddressInCurrency: jest.fn(async () => {
        throw new Error("CAL is down");
      }),
    });

    await expect(resolve()).resolves.toEqual({ kind: "unchanged" });
  });

  it("carries the prior token state over for a token it could not trust", async () => {
    const token = makeToken(TOKEN_ID, 8);
    useStore({ [TOKEN_ID]: token });

    const initialAccount = {
      subAccounts: [
        { id: encodeTokenAccountId(ACCOUNT_ID, token), token, balance: new BigNumber(5) },
      ],
      concordiumResources: { tokens: { [TOKEN_ID]: { transferStatus: "blocked", paused: true } } },
    } as unknown as ConcordiumAccount;

    const result = await resolve({ initialAccount, accountTokens: [makeEntry({ decimals: 6 })] });

    if (result.kind !== "resolved") throw new Error("expected resolved");
    // A preserved sub-account with no transferStatus would leave the send path
    // unable to tell whether the token is restricted.
    expect(result.tokens[TOKEN_ID]).toEqual({ transferStatus: "blocked", paused: true });
  });

  describe("transferStatus", () => {
    it("is blocked for a paused token even when the lists allow the account", async () => {
      const result = await resolve({
        accountTokens: [makeEntry({ moduleState: { paused: true } })],
      });

      if (result.kind !== "resolved") throw new Error("expected resolved");
      expect(result.tokens[TOKEN_ID]).toEqual({ transferStatus: "blocked", paused: true });
    });

    it("is allowed for a token that declares neither list nor pause", async () => {
      const result = await resolve();

      if (result.kind !== "resolved") throw new Error("expected resolved");
      expect(result.tokens[TOKEN_ID].transferStatus).toBe("allowed");
    });

    it("is blocked for an allow-list token the account is not on", async () => {
      const result = await resolve({
        accountTokens: [makeEntry({ moduleState: { allowList: true } })],
      });

      if (result.kind !== "resolved") throw new Error("expected resolved");
      expect(result.tokens[TOKEN_ID].transferStatus).toBe("blocked");
    });

    it("is unknown, and omits paused, when the module state did not decode", async () => {
      const result = await resolve({ accountTokens: [makeEntry({ moduleState: "a1b2c3" })] });

      if (result.kind !== "resolved") throw new Error("expected resolved");
      expect(result.tokens[TOKEN_ID]).toEqual({ transferStatus: "unknown" });
      expect(result.tokens[TOKEN_ID]).not.toHaveProperty("paused");
    });
  });
});

describe("mergeSubAccounts", () => {
  const token = makeToken(TOKEN_ID);
  const subId = encodeTokenAccountId(ACCOUNT_ID, token);

  // `date` is required: mergeOps sorts on it and compares `newOps[0].date >= o.date`,
  // so an undated operation is silently discarded.
  const operation = (id: string, date: Date): Operation =>
    ({ id, hash: id, accountId: subId, type: "IN", value: new BigNumber(1), date }) as Operation;

  const OLD_DATE = new Date("2026-01-01T00:00:00Z");
  const NEW_DATE = new Date("2026-02-01T00:00:00Z");

  const existing = (over: Partial<TokenAccount> = {}): TokenAccount =>
    ({
      type: "TokenAccount",
      id: subId,
      parentId: ACCOUNT_ID,
      token,
      balance: new BigNumber(1),
      spendableBalance: new BigNumber(1),
      creationDate: new Date(0),
      operations: [operation("old", OLD_DATE)],
      operationsCount: 1,
      pendingOperations: [],
      balanceHistoryCache: { HOUR: { latestDate: 1, balances: [1] } },
      swapHistory: [],
      ...over,
    }) as TokenAccount;

  const incoming = (over: Partial<TokenAccount> = {}): TokenAccount =>
    ({ ...existing(), balance: new BigNumber(9), operations: [], ...over }) as TokenAccount;

  it("returns the new list when there is nothing to merge against", () => {
    const next = [incoming()];
    expect(mergeSubAccounts(undefined, next)).toBe(next);
  });

  it("keeps previous operations and takes the new balance", () => {
    const [merged] = mergeSubAccounts(
      [existing()],
      [incoming({ operations: [operation("new", NEW_DATE)] })],
    );

    expect(merged.balance).toEqual(new BigNumber(9));
    expect(merged.operations.map(op => op.id).sort()).toEqual(["new", "old"]);
    expect(merged.operationsCount).toBe(2);
  });

  it("preserves balanceHistoryCache, which the balance-history recalculation keys on", () => {
    const previous = existing();
    const [merged] = mergeSubAccounts([previous], [incoming()]);

    expect(merged.balanceHistoryCache).toBe(previous.balanceHistoryCache);
    expect(merged.creationDate).toBe(previous.creationDate);
  });

  it("takes the token metadata from CAL rather than the stored copy", () => {
    const renamed = { ...token, name: "Renamed", ticker: "NEW" } as typeof token;
    const [merged] = mergeSubAccounts([existing()], [incoming({ token: renamed })]);

    expect(merged.token).toBe(renamed);
  });

  it("keeps a sub-account whose id is listed in keepIds even when absent", () => {
    const other = makeToken("KEPT");
    const keptId = encodeTokenAccountId(ACCOUNT_ID, other);
    const kept = existing({ id: keptId, token: other });

    const merged = mergeSubAccounts([kept, existing()], [incoming()], new Set([keptId]));

    expect(merged.map(s => s.id).sort()).toEqual([keptId, subId].sort());
  });

  it("drops a previous sub-account the chain no longer reports", () => {
    const other = makeToken("GONE");
    const stale = existing({ id: encodeTokenAccountId(ACCOUNT_ID, other), token: other });

    const merged = mergeSubAccounts([stale, existing()], [incoming()]);

    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe(subId);
  });
});

describe("applying a result to the account shape", () => {
  const resources: ConcordiumResources = {
    isOnboarded: true,
    credId: "",
    publicKey: "",
    identityIndex: 0,
    credNumber: 0,
    ipIdentity: 0,
    tokens: { [TOKEN_ID]: { transferStatus: "allowed" } },
  };

  it("omits subAccounts when unchanged, so the shallow sync spread keeps the previous array", () => {
    expect(subAccountsPatch({ kind: "unchanged" })).toEqual({});
    expect("subAccounts" in subAccountsPatch({ kind: "unchanged" })).toBe(false);
  });

  it("empties subAccounts when cleared", () => {
    expect(subAccountsPatch({ kind: "cleared" })).toEqual({ subAccounts: [] });
  });

  it("strips the subAccounts key entirely, since an empty array still renders a token section", () => {
    const stripped = stripSubAccounts({ id: "a", subAccounts: [] });

    expect("subAccounts" in stripped).toBe(false);
    expect(stripped).toEqual({ id: "a" });
  });

  it("leaves an account without subAccounts untouched", () => {
    const account: { id: string; subAccounts?: TokenAccount[] } = { id: "a" };
    expect(stripSubAccounts(account)).toBe(account);
  });

  it("removes the tokens key entirely when cleared, rather than setting it undefined", () => {
    const cleared = applyTokensToResources(resources, { kind: "cleared" });

    expect("tokens" in cleared).toBe(false);
  });

  it("leaves resources untouched when unchanged", () => {
    expect(applyTokensToResources(resources, { kind: "unchanged" })).toBe(resources);
  });
});

describe("initialAccount continuity", () => {
  it("merges against the previous sub-accounts on a re-sync", async () => {
    const token = makeToken(TOKEN_ID);
    const subId = encodeTokenAccountId(ACCOUNT_ID, token);
    useStore({ [TOKEN_ID]: token });

    const previousOp = {
      id: "kept",
      hash: "kept",
      accountId: subId,
      type: "IN",
      date: new Date("2026-01-01T00:00:00Z"),
    } as Operation;
    const initialAccount = {
      subAccounts: [
        {
          type: "TokenAccount",
          id: subId,
          parentId: ACCOUNT_ID,
          token,
          balance: new BigNumber(1),
          spendableBalance: new BigNumber(1),
          creationDate: new Date(0),
          operations: [previousOp],
          operationsCount: 1,
          pendingOperations: [],
          balanceHistoryCache: { HOUR: { latestDate: 1, balances: [1] } },
          swapHistory: [],
        },
      ],
    } as unknown as ConcordiumAccount;

    const result = await resolve({ initialAccount, accountTokens: [makeEntry({ balance: "77" })] });

    if (result.kind !== "resolved") throw new Error("expected resolved");
    expect(result.subAccounts[0].balance).toEqual(new BigNumber("77"));
    expect(result.subAccounts[0].operations.map(op => op.id)).toEqual(["kept"]);
  });
});
