import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import BigNumber from "bignumber.js";
import { renderHook, act } from "@tests/test-renderer";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { useAccountItemModelHook } from "./useAccountItemModel";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => {
  const { defaultIsAccountEmpty } = jest.requireActual(
    "@ledgerhq/live-common/bridge/defaultBridgeExtensions",
  );
  return {
    useAccountBridge: jest.fn(),
    useAccountBridgeOrNull: jest.fn(),
    useAccountBridgeMany: jest.fn((accounts: Account[]) =>
      accounts.map(() => ({ isAccountEmpty: defaultIsAccountEmpty })),
    ),
  };
});

// The O(N) scan useAccountItemModel performs when no parent is passed.
jest.mock("@ledgerhq/ledger-wallet-framework/account/index", () => {
  const actual = jest.requireActual("@ledgerhq/ledger-wallet-framework/account/index");
  return {
    ...actual,
    getParentAccount: jest.fn(actual.getParentAccount),
  };
});
import { getParentAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import { accountsSelector } from "~/reducers/accounts";
import type { State } from "~/reducers/types";

const ethereum = getCryptoCurrencyById("ethereum");

const PARENT = genAccount("parent-account", { currency: ethereum, operationsSize: 0 });

const TOKEN: TokenAccount = {
  type: "TokenAccount",
  id: "token-1",
  parentId: PARENT.id,
  operations: [],
  operationsCount: 0,
  pendingOperations: [],
  balance: BigNumber(0),
  spendableBalance: BigNumber(0),
  creationDate: new Date(),
  swapHistory: [],
  balanceHistoryCache: {
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
    WEEK: { latestDate: null, balances: [] },
  },
  token: {
    type: "TokenCurrency",
    id: "ethereum/erc20/token",
    name: "Token",
    ticker: "TKN",
    units: [],
    contractAddress: "0x0",
    tokenType: "erc20",
    parentCurrencyId: "ethereum",
  },
};

const BASE_PROPS = {
  balance: BigNumber(0),
} as const;

describe("useAccountItemModel", () => {
  beforeEach(() => {
    (getParentAccount as jest.Mock).mockClear();
  });

  it("uses the provided parentAccount without the O(N) getParentAccount scan", () => {
    const { result } = renderHook(() =>
      useAccountItemModelHook({ account: TOKEN, ...BASE_PROPS, parentAccount: PARENT }),
    );

    expect(getParentAccount).not.toHaveBeenCalled();
    expect(result.current.formattedAddress).toBe(formatAddress(PARENT.freshAddress));
  });

  it("falls back to a getParentAccount scan when no parentAccount is provided", () => {
    const { result } = renderHook(
      () => useAccountItemModelHook({ account: TOKEN, ...BASE_PROPS }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { ...state.accounts, active: [PARENT] },
        }),
      },
    );

    expect(getParentAccount).toHaveBeenCalled();
    expect(result.current.formattedAddress).toBe(formatAddress(PARENT.freshAddress));
  });
});
