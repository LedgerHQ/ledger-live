import BigNumber from "bignumber.js";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import { maticEth, usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { useHistoryOperations } from "../useHistoryOperations";
import { BTC_ACCOUNT, ETH_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";

jest.mock("@ledgerhq/live-countervalues/logic", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues/logic"),
  calculate: jest.fn(),
}));

const ZERO_VALUE_TOKEN_OP_ID = "zero-value-token-op-id";
const NON_ZERO_VALUE_TOKEN_OP_ID = "non-zero-value-token-op-id";
const SMALL_NON_ZERO_TOKEN_OP_ID = "small-non-zero-token-op-id";
const LARGE_NON_ZERO_TOKEN_OP_ID = "large-non-zero-token-op-id";
const SMALL_NATIVE_IN_OP_ID = "small-native-in-op-id";
const LARGE_NATIVE_IN_OP_ID = "large-native-in-op-id";
const SMALL_NATIVE_OUT_OP_ID = "small-native-out-op-id";
const LARGE_NATIVE_OUT_OP_ID = "large-native-out-op-id";

const mockCalculate = calculate as jest.MockedFunction<typeof calculate>;

function createTokenOperation(tokenAccountId: string, id: string, value: BigNumber): Operation {
  return {
    id,
    hash: id,
    type: "IN",
    value,
    fee: new BigNumber(0),
    senders: ["0xsender"],
    recipients: ["0xrecipient"],
    blockHash: "0xblock",
    blockHeight: 1,
    accountId: tokenAccountId,
    date: new Date(),
    extra: {},
  };
}

function createNativeOperation(
  accountId: string,
  id: string,
  type: Operation["type"],
  value: BigNumber,
): Operation {
  return {
    id,
    hash: id,
    type,
    value,
    fee: new BigNumber(0),
    senders: ["0xsender"],
    recipients: ["0xrecipient"],
    blockHash: "0xblock",
    blockHeight: 1,
    accountId,
    date: new Date(),
    extra: {},
  };
}

function createAccountWithTokenOperations(
  seed: string,
  operations: Array<{ id: string; value: BigNumber }>,
): Account {
  const ethRoot = genAccount(seed, {
    currency: ETH_ACCOUNT.currency,
    subAccountsCount: 0,
    operationsSize: 0,
  });
  const usdc = genTokenAccount(0, ethRoot, usdcToken);

  const tokenAccountWithOperations: TokenAccount = {
    ...usdc,
    operations: operations.map(({ id, value }) => createTokenOperation(usdc.id, id, value)),
    operationsCount: operations.length,
  };

  return {
    ...ethRoot,
    subAccounts: [tokenAccountWithOperations],
  };
}

function createAccountWithZeroValueTokenOperation(): Account {
  return createAccountWithTokenOperations("eth-zero-value-token", [
    { id: ZERO_VALUE_TOKEN_OP_ID, value: new BigNumber(0) },
    { id: NON_ZERO_VALUE_TOKEN_OP_ID, value: new BigNumber(1) },
  ]);
}

function createAccountWithNonZeroValueTokenOperations(): Account {
  return createAccountWithTokenOperations("eth-non-zero-value-token", [
    { id: SMALL_NON_ZERO_TOKEN_OP_ID, value: new BigNumber(1) },
    { id: LARGE_NON_ZERO_TOKEN_OP_ID, value: new BigNumber(2) },
  ]);
}

function createAccountWithNativeIncomingOperations(): Account {
  const account = genAccount("eth-native-incoming-dust", {
    currency: ETH_ACCOUNT.currency,
    subAccountsCount: 0,
    operationsSize: 0,
  });
  const operations = [
    createNativeOperation(account.id, SMALL_NATIVE_IN_OP_ID, "IN", new BigNumber(1)),
    createNativeOperation(account.id, LARGE_NATIVE_IN_OP_ID, "IN", new BigNumber(2)),
  ];

  return {
    ...account,
    operations,
    operationsCount: operations.length,
  };
}

function createAccountWithNativeOutgoingOperations(): Account {
  const account = genAccount("eth-native-outgoing-dust", {
    currency: ETH_ACCOUNT.currency,
    subAccountsCount: 0,
    operationsSize: 0,
  });
  const operations = [
    createNativeOperation(account.id, SMALL_NATIVE_OUT_OP_ID, "OUT", new BigNumber(1)),
    createNativeOperation(account.id, LARGE_NATIVE_OUT_OP_ID, "OUT", new BigNumber(2)),
  ];

  return {
    ...account,
    operations,
    operationsCount: operations.length,
  };
}

describe("useHistoryOperations", () => {
  beforeEach(() => {
    mockCalculate.mockReset();
  });

  it("returns an empty array when there are no accounts", () => {
    const { result } = renderHook(() => useHistoryOperations(), {
      initialState: { accounts: [], settings: INITIAL_STATE },
    });

    expect(result.current).toEqual([]);
  });

  it("collects, sorts, and shapes operations from multiple accounts", () => {
    const accounts = [BTC_ACCOUNT, ETH_ACCOUNT];

    const { result } = renderHook(() => useHistoryOperations(), {
      initialState: { accounts, settings: INITIAL_STATE },
    });

    const items = result.current;

    expect(items.length).toBeGreaterThanOrEqual(4);

    for (let i = 1; i < items.length; i++) {
      expect(items[i - 1].date.getTime()).toBeGreaterThanOrEqual(items[i].date.getTime());
    }

    expect(items[0]).toMatchObject({
      id: expect.any(String),
      date: expect.any(Date),
      type: expect.any(String),
      address: expect.any(String),
    });
    expect(items[0].operation).toBeDefined();
    expect(items[0].account).toBeDefined();
    expect(items[0].currency).toBeDefined();
    expect(items[0].amount).toBeDefined();
  });

  it("scopes operations to accountIds query when provided", () => {
    const { result } = renderHook(() => useHistoryOperations(), {
      initialState: { accounts: [BTC_ACCOUNT, ETH_ACCOUNT], settings: INITIAL_STATE },
      initialRoute: `/history?accountIds=${encodeURIComponent(ETH_ACCOUNT.id)}`,
    });

    const items = result.current;
    expect(items.length).toBeGreaterThan(0);
    expect(
      items.every(item => getMainAccount(item.account, item.parentAccount).id === ETH_ACCOUNT.id),
    ).toBe(true);
  });

  it("when accountIds references a token, excludes native and sibling-token operations", () => {
    const ethRoot = genAccount("eth-tok-scope", {
      currency: ETH_ACCOUNT.currency,
      subAccountsCount: 0,
      operationsSize: 2,
    });
    const usdc = genTokenAccount(0, ethRoot, usdcToken);
    const matic = genTokenAccount(1, ethRoot, maticEth);
    const ethTree = { ...ethRoot, subAccounts: [usdc, matic] };

    const { result } = renderHook(() => useHistoryOperations(), {
      initialState: { accounts: [ethTree], settings: INITIAL_STATE },
      initialRoute: `/history?accountIds=${encodeURIComponent(usdc.id)}`,
    });

    const items = result.current;
    expect(items.length).toBeGreaterThan(0);
    expect(items.every(item => item.account.id === usdc.id)).toBe(true);
  });

  it("keeps zero-value token operations when dust filtering is disabled", () => {
    const account = createAccountWithZeroValueTokenOperation();

    const { result } = renderHook(() => useHistoryOperations(), {
      initialState: {
        accounts: [account],
        settings: {
          ...INITIAL_STATE,
          filterTokenOperationsZeroAmount: false,
          hideSmallValueTokenOperations: false,
        },
      },
    });

    expect(result.current.map(item => item.operation.id)).toEqual(
      expect.arrayContaining([ZERO_VALUE_TOKEN_OP_ID, NON_ZERO_VALUE_TOKEN_OP_ID]),
    );
  });

  it("filters zero-value token operations when dust filtering is enabled", () => {
    const account = createAccountWithZeroValueTokenOperation();

    const { result } = renderHook(() => useHistoryOperations(), {
      initialState: {
        accounts: [account],
        settings: {
          ...INITIAL_STATE,
          filterTokenOperationsZeroAmount: false,
          hideSmallValueTokenOperations: true,
        },
        ...withFlagOverrides({ lwdDustFiltering: { enabled: true } }),
      },
    });

    expect(result.current.map(item => item.operation.id)).toEqual([NON_ZERO_VALUE_TOKEN_OP_ID]);
  });

  it("filters non-zero token operations below the dust countervalue threshold", () => {
    const account = createAccountWithNonZeroValueTokenOperations();
    mockCalculate.mockImplementation((_state, query) => {
      if (query.from === usdcToken && query.value === 1) return 0.5;
      if (query.from === usdcToken && query.value === 2) return 2;
      if (query.from.ticker === "USD") return 1;
      return null;
    });

    const { result } = renderHook(() => useHistoryOperations(), {
      initialState: {
        accounts: [account],
        settings: {
          ...INITIAL_STATE,
          filterTokenOperationsZeroAmount: false,
          hideSmallValueTokenOperations: true,
        },
        ...withFlagOverrides({ lwdDustFiltering: { enabled: true } }),
      },
    });

    expect(result.current.map(item => item.operation.id)).toEqual([LARGE_NON_ZERO_TOKEN_OP_ID]);
  });

  it("filters non-zero native incoming operations below the dust countervalue threshold", () => {
    const account = createAccountWithNativeIncomingOperations();
    mockCalculate.mockImplementation((_state, query) => {
      if (query.from === account.currency && query.value === 1) return 0.5;
      if (query.from === account.currency && query.value === 2) return 2;
      if (query.from.ticker === "USD") return 1;
      return null;
    });

    const { result } = renderHook(() => useHistoryOperations(), {
      initialState: {
        accounts: [account],
        settings: {
          ...INITIAL_STATE,
          filterTokenOperationsZeroAmount: false,
          hideSmallValueTokenOperations: true,
        },
        ...withFlagOverrides({ lwdDustFiltering: { enabled: true } }),
      },
    });

    expect(result.current.map(item => item.operation.id)).toEqual([LARGE_NATIVE_IN_OP_ID]);
  });

  it("filters non-zero native outgoing operations below the dust countervalue threshold", () => {
    const account = createAccountWithNativeOutgoingOperations();
    mockCalculate.mockImplementation((_state, query) => {
      if (query.from === account.currency && query.value === 1) return 0.5;
      if (query.from === account.currency && query.value === 2) return 2;
      if (query.from.ticker === "USD") return 1;
      return null;
    });

    const { result } = renderHook(() => useHistoryOperations(), {
      initialState: {
        accounts: [account],
        settings: {
          ...INITIAL_STATE,
          filterTokenOperationsZeroAmount: false,
          hideSmallValueTokenOperations: true,
        },
        ...withFlagOverrides({ lwdDustFiltering: { enabled: true } }),
      },
    });

    expect(result.current.map(item => item.operation.id)).toEqual([LARGE_NATIVE_OUT_OP_ID]);
  });

  it("keeps zero-value token operations when the dust feature flag is disabled", () => {
    const account = createAccountWithZeroValueTokenOperation();

    const { result } = renderHook(() => useHistoryOperations(), {
      initialState: {
        accounts: [account],
        settings: {
          ...INITIAL_STATE,
          filterTokenOperationsZeroAmount: false,
          hideSmallValueTokenOperations: true,
        },
      },
    });

    expect(result.current.map(item => item.operation.id)).toEqual(
      expect.arrayContaining([ZERO_VALUE_TOKEN_OP_ID, NON_ZERO_VALUE_TOKEN_OP_ID]),
    );
  });

  describe("isUnread flag", () => {
    it("is false for all operations when lastSeenOperationDate is null", () => {
      const accounts = [BTC_ACCOUNT];

      const { result } = renderHook(() => useHistoryOperations(), {
        initialState: {
          accounts,
          settings: INITIAL_STATE,
          history: { lastSeenOperationDate: null },
        },
      });

      expect(result.current.length).toBeGreaterThan(0);
      expect(result.current.every(item => item.isUnread === false)).toBe(true);
    });

    it("marks all operations as unread when lastSeenOperationDate is in the distant past", () => {
      const accounts = [BTC_ACCOUNT];
      // epoch = older than any real operation genAccount produces
      const epoch = new Date(0).toISOString();

      const { result } = renderHook(() => useHistoryOperations(), {
        initialState: {
          accounts,
          settings: INITIAL_STATE,
          history: { lastSeenOperationDate: epoch },
        },
      });

      expect(result.current.length).toBeGreaterThan(0);
      expect(result.current.every(item => item.isUnread === true)).toBe(true);
    });

    it("marks no operations as unread when lastSeenOperationDate is in the future", () => {
      const accounts = [BTC_ACCOUNT];
      const future = new Date("2099-01-01").toISOString();

      const { result } = renderHook(() => useHistoryOperations(), {
        initialState: {
          accounts,
          settings: INITIAL_STATE,
          history: { lastSeenOperationDate: future },
        },
      });

      expect(result.current.length).toBeGreaterThan(0);
      expect(result.current.every(item => item.isUnread === false)).toBe(true);
    });
  });
});
