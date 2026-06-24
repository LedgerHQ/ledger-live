import BigNumber from "bignumber.js";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { initialState as countervaluesInitialState } from "@ledgerhq/live-countervalues/logic";
import type { CountervaluesSettings } from "@ledgerhq/live-countervalues/types";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import {
  BTC_ACCOUNT,
  EMPTY_BTC_ACCOUNT,
  ETH_ACCOUNT,
  ETH_ACCOUNT_WITH_USDC,
} from "LLD/features/__mocks__/accounts.mock";
import { usdcToken } from "LLD/features/__mocks__/useSelectAssetFlow.mock";
import historyReducer, {
  type HistoryState,
  markOperationsAsSeen,
  initHistory,
  lastSeenOperationDateSelector,
  hasUnreadOperationsSelector,
} from "../history";
import type { State } from "../index";
import type { CountervaluesState } from "../countervalues";

const settingsUnreadBase = {
  currenciesSettings: {},
  filterTokenOperationsZeroAmount: false,
};

/** Every op date matters for unread (max over flattened ops). */
function mapAllOperationsDate<T extends AccountLike>(accountLike: T, date: Date): T {
  return {
    ...accountLike,
    operations: accountLike.operations.map(op => ({ ...op, date })),
  };
}

function makeUnreadTestState(lastSeenDate: string | null, accounts: Account[]): State {
  // Selector input is typed as full State; tests only need the slices it reads.
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    accounts,
    history: { lastSeenOperationDate: lastSeenDate },
    settings: settingsUnreadBase,
    featureFlags: FEATURE_FLAGS_INITIAL_STATE,
  } as unknown as State;
}

function createCountervaluesState(): CountervaluesState {
  return {
    countervalues: {
      state: countervaluesInitialState,
      pending: false,
      error: null,
    },
    polling: {
      isPolling: true,
      triggerLoad: false,
    },
    userSettings: {
      trackingPairs: [],
      autofillGaps: true,
      refreshRate: 0,
      marketCapBatchingAfterRank: 0,
    } satisfies CountervaluesSettings,
  };
}

function createAccountWithUnreadZeroValueTokenOperation(): Account {
  const parentAccount = genAccount("history-test-dust-desktop", {
    currency: ETH_ACCOUNT.currency,
    operationsSize: 0,
    subAccountsCount: 0,
  });
  const tokenAccount = genTokenAccount(0, parentAccount, usdcToken);
  const tokenOperation = {
    id: "history-test-dust-zero-value-token-op",
    hash: "0xdust",
    type: "IN",
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: ["0xsender"],
    recipients: ["0xrecipient"],
    blockHash: "0xblock",
    blockHeight: 1,
    accountId: tokenAccount.id,
    date: new Date("2024-12-01T00:00:00.000Z"),
    extra: {},
  } satisfies Operation;

  return {
    ...parentAccount,
    subAccounts: [
      {
        ...tokenAccount,
        operations: [tokenOperation],
        operationsCount: 1,
      },
    ],
  };
}

function withDustPreferenceEnabled(state: State): State {
  return {
    ...state,
    settings: {
      ...state.settings,
      hideSmallValueTokenOperations: true,
    },
  };
}

function withDustFeatureEnabled(state: State): State {
  return {
    ...state,
    countervalues: createCountervaluesState(),
    featureFlags: {
      ...state.featureFlags,
      resolved: {
        ...state.featureFlags.resolved,
        lwdDustFiltering: {
          enabled: true,
        },
      },
    },
  };
}

describe("historyReducer", () => {
  it("initialises with null lastSeenOperationDate", () => {
    expect(historyReducer(undefined, { type: "@@INIT" })).toEqual({ lastSeenOperationDate: null });
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
    expect(
      lastSeenOperationDateSelector({
        history: { lastSeenOperationDate: "2024-06-01T00:00:00.000Z" },
      }),
    ).toBe("2024-06-01T00:00:00.000Z");
    expect(lastSeenOperationDateSelector({ history: { lastSeenOperationDate: null } })).toBeNull();
  });
});

describe("hasUnreadOperationsSelector", () => {
  it("returns false when lastSeenOperationDate is null", () => {
    expect(hasUnreadOperationsSelector(makeUnreadTestState(null, [BTC_ACCOUNT]))).toBe(false);
  });

  it("returns false when there are no accounts or operations", () => {
    const seen = "2024-06-01T00:00:00.000Z";
    expect(hasUnreadOperationsSelector(makeUnreadTestState(seen, []))).toBe(false);
    expect(hasUnreadOperationsSelector(makeUnreadTestState(seen, [EMPTY_BTC_ACCOUNT]))).toBe(false);
  });

  it("returns false when the most recent operation is not newer than lastSeenDate", () => {
    const seen = "2024-06-01T00:00:00.000Z";
    const old = mapAllOperationsDate(BTC_ACCOUNT, new Date("2024-01-01"));
    expect(hasUnreadOperationsSelector(makeUnreadTestState(seen, [old]))).toBe(false);
    const sameDate = new Date(seen);
    const same = mapAllOperationsDate(BTC_ACCOUNT, sameDate);
    expect(hasUnreadOperationsSelector(makeUnreadTestState(seen, [same]))).toBe(false);
  });

  it("returns true when any account has an operation newer than lastSeenDate", () => {
    const seen = "2024-06-01T00:00:00.000Z";
    const newer = mapAllOperationsDate(BTC_ACCOUNT, new Date("2024-12-01"));
    expect(hasUnreadOperationsSelector(makeUnreadTestState(seen, [newer]))).toBe(true);

    const old = mapAllOperationsDate(BTC_ACCOUNT, new Date("2024-01-01"));
    const newerOnEth = mapAllOperationsDate(ETH_ACCOUNT, new Date("2024-12-01"));
    expect(hasUnreadOperationsSelector(makeUnreadTestState(seen, [old, newerOnEth]))).toBe(true);
  });

  it("returns true when newest activity is on a token sub-account", () => {
    const mainOld = new Date("2020-01-01");
    const tokenNew = new Date("2024-12-01");
    const account: Account = {
      ...ETH_ACCOUNT_WITH_USDC,
      operations: ETH_ACCOUNT_WITH_USDC.operations.map(op => ({ ...op, date: mainOld })),
      subAccounts: ETH_ACCOUNT_WITH_USDC.subAccounts!.map(sa => ({
        ...sa,
        operations: sa.operations.map(op => ({ ...op, date: tokenNew })),
      })),
    };
    const lastSeen = "2024-06-01T00:00:00.000Z";
    expect(hasUnreadOperationsSelector(makeUnreadTestState(lastSeen, [account]))).toBe(true);
  });

  it("returns false when lastSeenOperationDate is in the future", () => {
    const future = new Date("2099-01-01").toISOString();
    expect(hasUnreadOperationsSelector(makeUnreadTestState(future, [BTC_ACCOUNT]))).toBe(false);
  });

  it("ignores the dust preference when the dust filter feature flag is disabled", () => {
    const accountWithDustOperation = createAccountWithUnreadZeroValueTokenOperation();

    expect(
      hasUnreadOperationsSelector(
        withDustPreferenceEnabled(
          makeUnreadTestState("2024-06-01T00:00:00.000Z", [accountWithDustOperation]),
        ),
      ),
    ).toBe(true);
  });

  it("filters dust operations when the dust preference and feature flag are enabled", () => {
    const accountWithDustOperation = createAccountWithUnreadZeroValueTokenOperation();

    expect(
      hasUnreadOperationsSelector(
        withDustFeatureEnabled(
          withDustPreferenceEnabled(
            makeUnreadTestState("2024-06-01T00:00:00.000Z", [accountWithDustOperation]),
          ),
        ),
      ),
    ).toBe(false);
  });
});
