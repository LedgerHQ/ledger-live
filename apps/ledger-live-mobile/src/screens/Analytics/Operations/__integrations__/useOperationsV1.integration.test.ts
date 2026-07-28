import BigNumber from "bignumber.js";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useOperationsV1 } from "../useOperationsV1";
import { State } from "~/reducers/types";

jest.mock("@ledgerhq/live-countervalues/logic", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues/logic"),
  calculate: jest.fn(),
}));

const ETH = getCryptoCurrencyById("ethereum");
const mockCalculate = calculate as jest.MockedFunction<typeof calculate>;

const EVM_TOKEN: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd__coin",
  contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  parentCurrencyId: ETH.id,
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
};

const ZERO_VALUE_TOKEN_OP_ID = "zero-value-token-op-id";
const ZERO_VALUE_NATIVE_OP_ID = "zero-value-native-op-id";
const NON_ZERO_VALUE_NATIVE_OP_ID = "non-zero-value-native-op-id";
const SMALL_NATIVE_OUT_OP_ID = "small-native-out-op-id";
const LARGE_NATIVE_OUT_OP_ID = "large-native-out-op-id";

function createZeroValueTokenOperation(tokenAccountId: string): Operation {
  return {
    id: ZERO_VALUE_TOKEN_OP_ID,
    hash: "0xzero",
    type: "IN",
    value: new BigNumber(0),
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

function createAccountWithZeroValueTokenOperation(): Account {
  const parentAccount = genAccount("eth-zero-value-token", {
    currency: ETH,
    operationsSize: 0,
    tokensData: [EVM_TOKEN],
    tokenIds: [EVM_TOKEN.id],
  });

  const tokenAccount = parentAccount.subAccounts?.[0] as TokenAccount;
  if (!tokenAccount) throw new Error("expected one token subAccount");

  const zeroValueOp = createZeroValueTokenOperation(tokenAccount.id);

  const tokenAccountWithZeroOp: TokenAccount = {
    ...tokenAccount,
    operations: [
      zeroValueOp,
      { ...zeroValueOp, id: "non-zero-value-token-op-id", value: new BigNumber(1) },
    ],
    operationsCount: 2,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
  };

  return {
    ...parentAccount,
    subAccounts: [tokenAccountWithZeroOp],
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

function createAccountWithZeroValueNativeOperation(): Account {
  const account = genAccount("eth-zero-value-native", {
    currency: ETH,
    operationsSize: 0,
  });

  const zeroValueOp = createNativeOperation(
    account.id,
    ZERO_VALUE_NATIVE_OP_ID,
    "IN",
    new BigNumber(0),
  );

  return {
    ...account,
    operations: [
      zeroValueOp,
      {
        ...zeroValueOp,
        id: NON_ZERO_VALUE_NATIVE_OP_ID,
        hash: NON_ZERO_VALUE_NATIVE_OP_ID,
        value: new BigNumber(1),
      },
    ],
    operationsCount: 2,
  };
}

function createAccountWithNativeOutgoingDustOperations(): Account {
  const account = genAccount("eth-outgoing-dust", {
    currency: ETH,
    operationsSize: 0,
  });
  const smallOutgoingOperation = createNativeOperation(
    account.id,
    SMALL_NATIVE_OUT_OP_ID,
    "OUT",
    new BigNumber(1),
  );

  return {
    ...account,
    operations: [
      smallOutgoingOperation,
      {
        ...smallOutgoingOperation,
        id: LARGE_NATIVE_OUT_OP_ID,
        hash: LARGE_NATIVE_OUT_OP_ID,
        value: new BigNumber(2),
      },
    ],
    operationsCount: 2,
  };
}

const initialStateWithFilterEnabled = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    filterTokenOperationsZeroAmount: true,
  },
  featureFlags: {
    ...state.featureFlags,
    overrides: {
      ...state.featureFlags.overrides,
      addressPoisoningOperationsFilter: {
        enabled: true,
        params: { families: ["evm"] },
      },
    },
  },
});

const initialStateWithFilterEnabledButNoEvmFamily = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    filterTokenOperationsZeroAmount: true,
  },
  featureFlags: {
    ...state.featureFlags,
    overrides: {
      ...state.featureFlags.overrides,
      addressPoisoningOperationsFilter: {
        enabled: true,
        params: { families: ["algorand"] },
      },
    },
  },
});

const initialStateWithDustPreferenceEnabled = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    filterTokenOperationsZeroAmount: false,
    hideSmallValueTokenOperations: true,
  },
});

const initialStateWithDustFilterEnabled = withFlagOverrides(
  {
    lwmDustFiltering: {
      enabled: true,
    },
  },
  initialStateWithDustPreferenceEnabled,
);

const initialStateWithDesktopDustFilterEnabled = withFlagOverrides(
  {
    lwdDustFiltering: {
      enabled: true,
    },
  },
  initialStateWithDustPreferenceEnabled,
);

describe("useOperationsV1 integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should filter out token operations with 0 value (address poisoning) when filter is enabled", () => {
    const accountWithZeroValueTokenOp = createAccountWithZeroValueTokenOperation();

    const { result } = renderHook(() => useOperationsV1([accountWithZeroValueTokenOp], 50), {
      overrideInitialState: initialStateWithFilterEnabled,
    });

    expect(result.current.sections[0].data.length).toBe(1);
    expect(result.current.sections[0].data[0].id).toBe("non-zero-value-token-op-id");
  });

  it("should not filter zero-value token operations when families do not include the token family", () => {
    const accountWithZeroValueTokenOp = createAccountWithZeroValueTokenOperation();

    const { result } = renderHook(() => useOperationsV1([accountWithZeroValueTokenOp], 50), {
      overrideInitialState: initialStateWithFilterEnabledButNoEvmFamily,
    });

    expect(result.current.sections[0].data.length).toBe(2);
  });

  it("should not filter zero-value token operations when dust preference is enabled but the feature flag is disabled", () => {
    const accountWithZeroValueTokenOp = createAccountWithZeroValueTokenOperation();

    const { result } = renderHook(() => useOperationsV1([accountWithZeroValueTokenOp], 50), {
      overrideInitialState: initialStateWithDustPreferenceEnabled,
    });

    expect(result.current.sections[0].data).toHaveLength(2);
  });

  it("should not filter zero-value token operations when only the desktop dust filter param is enabled", () => {
    const accountWithZeroValueTokenOp = createAccountWithZeroValueTokenOperation();

    const { result } = renderHook(() => useOperationsV1([accountWithZeroValueTokenOp], 50), {
      overrideInitialState: initialStateWithDesktopDustFilterEnabled,
    });

    expect(result.current.sections[0].data).toHaveLength(2);
  });

  it("should filter out zero-value token operations when dust preference and feature flag are enabled", () => {
    const accountWithZeroValueTokenOp = createAccountWithZeroValueTokenOperation();

    const { result } = renderHook(() => useOperationsV1([accountWithZeroValueTokenOp], 50), {
      overrideInitialState: initialStateWithDustFilterEnabled,
    });

    expect(result.current.sections[0].data.length).toBe(1);
    expect(result.current.sections[0].data[0].id).toBe("non-zero-value-token-op-id");
  });

  it("should filter out zero-value native operations when dust preference and feature flag are enabled", () => {
    const accountWithZeroValueNativeOp = createAccountWithZeroValueNativeOperation();

    const { result } = renderHook(() => useOperationsV1([accountWithZeroValueNativeOp], 50), {
      overrideInitialState: initialStateWithDustFilterEnabled,
    });

    expect(result.current.sections[0].data.length).toBe(1);
    expect(result.current.sections[0].data[0].id).toBe(NON_ZERO_VALUE_NATIVE_OP_ID);
  });

  it("should filter out outgoing native operations below the dust threshold", () => {
    const accountWithNativeOutgoingDust = createAccountWithNativeOutgoingDustOperations();
    mockCalculate.mockImplementation((_state, query) => {
      if (query.from === ETH && query.value === 1) return 0.5;
      if (query.from === ETH && query.value === 2) return 2;
      if (query.from.ticker === "USD") return 1;
      return null;
    });

    const { result } = renderHook(() => useOperationsV1([accountWithNativeOutgoingDust], 50), {
      overrideInitialState: initialStateWithDustFilterEnabled,
    });

    expect(result.current.sections[0].data.length).toBe(1);
    expect(result.current.sections[0].data[0].id).toBe(LARGE_NATIVE_OUT_OP_ID);
  });
});
