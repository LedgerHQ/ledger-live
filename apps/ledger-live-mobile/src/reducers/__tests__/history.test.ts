import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import historyReducer, {
  type HistoryState,
  markOperationsAsSeen,
  initHistory,
  lastSeenOperationDateSelector,
  hasUnreadOperationsSelector,
} from "../history";
import type { State } from "../types";

const SEEN = "2024-06-01T00:00:00.000Z";

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");

const BTC_ACCOUNT = genAccount("history-test-btc", { currency: bitcoin, operationsSize: 3 });
const ETH_ACCOUNT = genAccount("history-test-eth", { currency: ethereum, operationsSize: 3 });
const EMPTY_BTC_ACCOUNT = genAccount("history-test-btc-empty", {
  currency: bitcoin,
  operationsSize: 0,
});

function mapAllOperationsDate<T extends AccountLike>(accountLike: T, date: Date): T {
  return {
    ...accountLike,
    operations: accountLike.operations.map(op => ({ ...op, date })),
  };
}

function makeState(lastSeenDate: string | null, accounts: Account[]): State {
  return {
    accounts: { active: accounts },
    history: { lastSeenOperationDate: lastSeenDate },
    settings: { filterTokenOperationsZeroAmount: false },
    featureFlags: FEATURE_FLAGS_INITIAL_STATE,
  } as unknown as State;
}

describe("historyReducer", () => {
  it("initialises with null lastSeenOperationDate", () => {
    expect(historyReducer(undefined, { type: "@@INIT" })).toEqual({
      lastSeenOperationDate: null,
    });
  });

  it("markOperationsAsSeen sets a current ISO timestamp", () => {
    const before = new Date().toISOString();
    const state = historyReducer(undefined, markOperationsAsSeen());
    const after = new Date().toISOString();

    expect(state.lastSeenOperationDate! >= before).toBe(true);
    expect(state.lastSeenOperationDate! <= after).toBe(true);
  });

  it("initHistory replaces state with the payload", () => {
    const payload: HistoryState = { lastSeenOperationDate: "2024-03-15T12:00:00.000Z" };
    expect(historyReducer(undefined, initHistory(payload))).toEqual(payload);
  });
});

describe("lastSeenOperationDateSelector", () => {
  it("returns the stored date string or null", () => {
    expect(lastSeenOperationDateSelector({ history: { lastSeenOperationDate: SEEN } })).toBe(SEEN);
    expect(lastSeenOperationDateSelector({ history: { lastSeenOperationDate: null } })).toBeNull();
  });
});

describe("hasUnreadOperationsSelector", () => {
  it("returns false when no operations should be marked as unread", () => {
    expect(hasUnreadOperationsSelector(makeState(null, [BTC_ACCOUNT]))).toBe(false);
    expect(hasUnreadOperationsSelector(makeState(SEEN, []))).toBe(false);
    expect(hasUnreadOperationsSelector(makeState(SEEN, [EMPTY_BTC_ACCOUNT]))).toBe(false);

    const old = mapAllOperationsDate(BTC_ACCOUNT, new Date("2024-01-01"));
    expect(hasUnreadOperationsSelector(makeState(SEEN, [old]))).toBe(false);

    const same = mapAllOperationsDate(BTC_ACCOUNT, new Date(SEEN));
    expect(hasUnreadOperationsSelector(makeState(SEEN, [same]))).toBe(false);

    const future = new Date("2099-01-01").toISOString();
    expect(hasUnreadOperationsSelector(makeState(future, [BTC_ACCOUNT]))).toBe(false);
  });

  it("returns true when any account has an operation newer than lastSeenDate", () => {
    const newer = mapAllOperationsDate(BTC_ACCOUNT, new Date("2024-12-01"));
    expect(hasUnreadOperationsSelector(makeState(SEEN, [newer]))).toBe(true);

    const old = mapAllOperationsDate(BTC_ACCOUNT, new Date("2024-01-01"));
    const newerOnEth = mapAllOperationsDate(ETH_ACCOUNT, new Date("2024-12-01"));
    expect(hasUnreadOperationsSelector(makeState(SEEN, [old, newerOnEth]))).toBe(true);
  });

  it("returns true when only an internal sub-operation is newer than lastSeenDate", () => {
    const old = mapAllOperationsDate(ETH_ACCOUNT, new Date("2024-01-01"));
    const [rootOp, ...rest] = old.operations;
    const internalOp = { ...rootOp, id: `${rootOp.id}-i0`, date: new Date("2024-12-01") };
    const accountWithInternal: Account = {
      ...old,
      operations: [{ ...rootOp, internalOperations: [internalOp] }, ...rest],
    };
    expect(hasUnreadOperationsSelector(makeState(SEEN, [accountWithInternal]))).toBe(true);
  });

  it("returns true when only an NFT sub-operation is newer than lastSeenDate", () => {
    const old = mapAllOperationsDate(ETH_ACCOUNT, new Date("2024-01-01"));
    const [rootOp, ...rest] = old.operations;
    const nftOp = { ...rootOp, id: `${rootOp.id}-n0`, date: new Date("2024-12-01") };
    const accountWithNft: Account = {
      ...old,
      operations: [{ ...rootOp, nftOperations: [nftOp] }, ...rest],
    };
    expect(hasUnreadOperationsSelector(makeState(SEEN, [accountWithNft]))).toBe(true);
  });
});
