import BigNumber from "bignumber.js";
import type { AccountLike, Operation, TokenAccount } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { genAccount } from "@ledgerhq/coin-framework/lib/mocks/account";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import {
  calculate,
  initialState as countervaluesInitialState,
} from "@ledgerhq/live-countervalues/logic";
import { useAddressPoisoningOperationsFamilies } from "@ledgerhq/live-common/hooks/useAddressPoisoningOperationsFamilies";
import { renderHook } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { useSmallValueOperationsFilter } from "./useSmallValueOperationsFilter";

jest.mock("@ledgerhq/live-common/market/state-manager/api", () => ({
  marketApi: {
    reducerPath: "marketApi",
    reducer: (state = {}) => state,
    middleware: () => (next: (action: unknown) => unknown) => (action: unknown) => next(action),
  },
}));
jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCountervaluesState: jest.fn(),
}));
jest.mock("@ledgerhq/live-countervalues/logic", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues/logic"),
  calculate: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/hooks/useAddressPoisoningOperationsFamilies", () => ({
  useAddressPoisoningOperationsFamilies: jest.fn(),
}));

const mockUseCountervaluesState = jest.mocked(useCountervaluesState);
const mockCalculate = jest.mocked(calculate);
const mockUseAddressPoisoningOperationsFamilies = jest.mocked(
  useAddressPoisoningOperationsFamilies,
);

const ETH = getCryptoCurrencyById("ethereum");

const EVM_TOKEN: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd__coin",
  contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  parentCurrency: ETH,
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
};

function createTokenAccount(overrides: Partial<TokenAccount> = {}): TokenAccount {
  const parentAccount = genAccount("eth-token-test", {
    currency: ETH,
    operationsSize: 0,
    tokensData: [EVM_TOKEN],
    tokenIds: [EVM_TOKEN.id],
  });
  const tokenAccount = parentAccount.subAccounts?.[0] as TokenAccount;
  if (!tokenAccount) throw new Error("expected one token subAccount");
  return { ...tokenAccount, ...overrides };
}

function createOperation(overrides: Partial<Operation> = {}): Operation {
  return {
    id: "op-1",
    hash: "0xhash",
    type: "IN",
    value: new BigNumber(1_000_000),
    fee: new BigNumber(0),
    senders: ["0xsender"],
    recipients: ["0xrecipient"],
    blockHash: "0xblock",
    blockHeight: 1,
    accountId: "account-id",
    date: new Date(),
    extra: {},
    ...overrides,
  };
}

const defaultInitialState = {
  settings: {
    filterTokenOperationsZeroAmount: true,
    filterTokenOperationsThreshold: 0.5,
    counterValue: "EUR",
    overriddenFeatureFlags: {
      ...INITIAL_STATE.overriddenFeatureFlags,
      lldHideSmallValueTokenOperations: {
        enabled: true,
      },
    },
  },
};

const defaultInitialStateWithThreshold = {
  settings: defaultInitialState.settings,
};

describe("useSmallValueOperationsFilter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCountervaluesState.mockReturnValue(countervaluesInitialState);
    mockUseAddressPoisoningOperationsFamilies.mockReturnValue(["evm"]);
    // USD magnitude 2: return cents. 50 cents => 0.5 USD.
    mockCalculate.mockReturnValue(50);
  });

  it("should show operation when filter is disabled", () => {
    const tokenAccount = createTokenAccount();
    const operation = createOperation({ type: "IN", value: new BigNumber(1) });

    const { result } = renderHook(() => useSmallValueOperationsFilter(), {
      initialState: {
        ...defaultInitialState,
        settings: {
          ...defaultInitialState.settings,
          filterTokenOperationsZeroAmount: false,
        },
      },
    });

    expect(result.current.filterOperations(operation, tokenAccount)).toBe(true);
    expect(result.current.isSmallValueFilterEnabled).toBe(false);
  });

  it("should keep legacy poisoning filter behavior when small value feature flag is disabled", () => {
    const tokenAccount = createTokenAccount();
    const operation = createOperation({ type: "IN" });
    mockCalculate.mockReturnValue(25);

    const { result } = renderHook(() => useSmallValueOperationsFilter(), {
      initialState: {
        settings: {
          ...defaultInitialState.settings,
          overriddenFeatureFlags: {
            ...INITIAL_STATE.overriddenFeatureFlags,
            lldHideSmallValueTokenOperations: {
              enabled: false,
            },
          },
        },
      },
    });

    expect(result.current.filterOperations(operation, tokenAccount)).toBe(true);
  });

  it("should still hide zero-value operation when threshold is 0", () => {
    const tokenAccount = createTokenAccount();
    const operation = createOperation({ type: "IN", value: new BigNumber(0) });

    const { result } = renderHook(() => useSmallValueOperationsFilter(), {
      initialState: {
        settings: {
          ...defaultInitialState.settings,
          filterTokenOperationsThreshold: 0,
        },
      },
    });

    expect(result.current.filterOperations(operation, tokenAccount)).toBe(false);
  });

  it("should show operation when account is not a TokenAccount", () => {
    const mainAccount = genAccount("main-eth", { currency: ETH, operationsSize: 0 });
    const operation = createOperation({ type: "IN" });

    const { result } = renderHook(() => useSmallValueOperationsFilter(), {
      initialState: defaultInitialState,
    });

    expect(result.current.filterOperations(operation, mainAccount as AccountLike)).toBe(true);
  });

  it("should show operation when operation type is not IN", () => {
    const tokenAccount = createTokenAccount();
    const operation = createOperation({ type: "OUT" });

    const { result } = renderHook(() => useSmallValueOperationsFilter(), {
      initialState: defaultInitialState,
    });

    expect(result.current.filterOperations(operation, tokenAccount)).toBe(true);
  });

  it("should show operation when family is not in addressPoisoningFamilies", () => {
    mockUseAddressPoisoningOperationsFamilies.mockReturnValue(["algorand"]);
    const tokenAccount = createTokenAccount();
    const operation = createOperation({ type: "IN" });

    const { result } = renderHook(() => useSmallValueOperationsFilter(), {
      initialState: defaultInitialState,
    });

    expect(result.current.filterOperations(operation, tokenAccount)).toBe(true);
  });

  it("should hide zero-value IN token operation", () => {
    const tokenAccount = createTokenAccount();
    const operation = createOperation({ type: "IN", value: new BigNumber(0) });

    const { result } = renderHook(() => useSmallValueOperationsFilter(), {
      initialState: defaultInitialState,
    });

    expect(result.current.filterOperations(operation, tokenAccount)).toBe(false);
  });

  it("should show self-transfer operation even when the value is zero", () => {
    const tokenAccount = createTokenAccount();
    const operation = createOperation({
      type: "IN",
      value: new BigNumber(0),
      senders: ["0xself"],
      recipients: ["0xself"],
    });

    const { result } = renderHook(() => useSmallValueOperationsFilter(), {
      initialState: defaultInitialStateWithThreshold,
    });

    expect(result.current.filterOperations(operation, tokenAccount)).toBe(true);
  });

  it("should show operation when value exceeds MAX_SAFE_INTEGER (no lossy conversion)", () => {
    const tokenAccount = createTokenAccount();
    const operation = createOperation({
      type: "IN",
      value: new BigNumber(Number.MAX_SAFE_INTEGER).plus(1),
    });

    const { result } = renderHook(() => useSmallValueOperationsFilter(), {
      initialState: defaultInitialStateWithThreshold,
    });

    expect(result.current.filterOperations(operation, tokenAccount)).toBe(true);
    expect(mockCalculate).not.toHaveBeenCalled();
  });

  it("should show operation when countervalue is missing", () => {
    mockCalculate.mockReturnValue(undefined);
    const tokenAccount = createTokenAccount();
    const operation = createOperation({ type: "IN" });

    const { result } = renderHook(() => useSmallValueOperationsFilter(), {
      initialState: defaultInitialStateWithThreshold,
    });

    expect(result.current.filterOperations(operation, tokenAccount)).toBe(true);
  });

  it("should hide operation when fiat value is below threshold", () => {
    const tokenAccount = createTokenAccount();
    const operation = createOperation({ type: "IN" });
    mockCalculate.mockReturnValue(25);

    const { result } = renderHook(() => useSmallValueOperationsFilter(), {
      initialState: defaultInitialStateWithThreshold,
    });

    expect(result.current.filterOperations(operation, tokenAccount)).toBe(false);
  });

  it("should hide operation when USD value is equal to threshold", () => {
    const tokenAccount = createTokenAccount();
    const operation = createOperation({ type: "IN" });
    mockCalculate.mockReturnValue(50);

    const { result } = renderHook(() => useSmallValueOperationsFilter(), {
      initialState: defaultInitialStateWithThreshold,
    });

    expect(result.current.filterOperations(operation, tokenAccount)).toBe(false);
  });

  it("should show operation when USD value is above threshold", () => {
    const tokenAccount = createTokenAccount();
    const operation = createOperation({ type: "IN" });
    mockCalculate.mockReturnValue(51);

    const { result } = renderHook(() => useSmallValueOperationsFilter(), {
      initialState: defaultInitialStateWithThreshold,
    });

    expect(result.current.filterOperations(operation, tokenAccount)).toBe(true);
  });

  it("should compare against canonical USD even when another countervalue is selected", () => {
    const tokenAccount = createTokenAccount();
    const operation = createOperation({ type: "IN" });
    mockCalculate.mockReturnValue(49);

    const { result } = renderHook(() => useSmallValueOperationsFilter(), {
      initialState: {
        settings: {
          ...defaultInitialState.settings,
          counterValue: "JPY",
        },
      },
    });

    expect(result.current.filterOperations(operation, tokenAccount)).toBe(false);
    expect(mockCalculate).toHaveBeenCalledWith(
      countervaluesInitialState,
      expect.objectContaining({
        from: EVM_TOKEN,
        to: expect.objectContaining({ ticker: "USD" }),
      }),
    );
  });

  it("should use threshold 0 when threshold is not finite", () => {
    const tokenAccount = createTokenAccount();
    const operation = createOperation({ type: "IN" });
    mockCalculate.mockReturnValue(1);

    const { result } = renderHook(() => useSmallValueOperationsFilter(), {
      initialState: {
        settings: {
          ...defaultInitialStateWithThreshold.settings,
          filterTokenOperationsThreshold: NaN,
        },
      },
    });

    expect(result.current.filterOperations(operation, tokenAccount)).toBe(true);
  });

  it("should show operation when addressPoisoningFamilies is null", () => {
    mockUseAddressPoisoningOperationsFamilies.mockReturnValue(null);
    const tokenAccount = createTokenAccount();
    const operation = createOperation({ type: "IN" });

    const { result } = renderHook(() => useSmallValueOperationsFilter(), {
      initialState: defaultInitialState,
    });

    expect(result.current.filterOperations(operation, tokenAccount)).toBe(true);
  });
});
