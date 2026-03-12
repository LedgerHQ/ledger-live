/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { renderHook } from "tests/testSetup";
import { INITIAL_STATE as INITIAL_STATE_SETTINGS } from "~/renderer/reducers/settings";
import { useNetworkFees } from "../useNetworkFees";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { createMockAccount } from "../../screens/Recipient/__integrations__/__fixtures__/accounts";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";

jest.mock("@ledgerhq/live-common/bridge/impl");
jest.mock("@ledgerhq/coin-framework/account/helpers");
jest.mock("@ledgerhq/live-common/bridge/descriptor", () => ({
  sendFeatures: {
    hasFeePresets: jest.fn(() => false),
    shouldEstimateFeePresetsWithBridge: jest.fn(() => false),
    getFeePresetOptions: jest.fn(() => []),
  },
  getSendDescriptor: jest.fn(() => ({ fees: {}, inputs: {} })),
}));

const mockedGetAccountBridge = jest.mocked(getAccountBridge);
const mockedGetMainAccount = jest.mocked(getMainAccount);
const mockedGetAccountCurrency = jest.mocked(getAccountCurrency);

function isAccount(account: unknown): account is Account {
  return (
    typeof account === "object" &&
    account !== null &&
    "type" in account &&
    (account as Account).type === "Account"
  );
}

function buildBaseParams(overrides?: {
  transaction?: Partial<Transaction>;
  uiConfig?: { hasFeePresets?: boolean };
}) {
  const currency = getCryptoCurrencyById("bitcoin");
  mockedGetAccountCurrency.mockReturnValue(currency);
  mockedGetMainAccount.mockImplementation((account: Account | unknown) => {
    if (!isAccount(account)) {
      throw new Error("TokenAccount is not supported by this test helper");
    }
    return account;
  });

  const account = createMockAccount({ id: "acc", currency });
  const transaction = {
    family: "bitcoin",
    recipient: "bc1q",
    amount: new BigNumber(0),
    useAllAmount: false,
    ...overrides?.transaction,
  } as Transaction;
  const status = {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  } as TransactionStatus;
  const updateTransaction = jest.fn();

  return {
    account,
    parentAccount: null as Account | null,
    transaction,
    status,
    uiConfig: { hasFeePresets: overrides?.uiConfig?.hasFeePresets ?? false } as never,
    transactionActions: { updateTransaction } as never,
    updateTransaction,
  };
}

describe("useNetworkFees", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedGetAccountBridge.mockReturnValue({
      updateTransaction: (tx: Record<string, unknown>, patch: Record<string, unknown>) => ({
        ...tx,
        ...patch,
      }),
    } as never);
  });

  it("returns showNetworkFees true and showFeePresets from uiConfig", () => {
    const params = buildBaseParams({ uiConfig: { hasFeePresets: true } });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: { settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" } },
    });

    expect(result.current.showNetworkFees).toBe(true);
    expect(result.current.showFeePresets).toBe(true);
  });

  it("returns showFeePresets false when uiConfig.hasFeePresets is false", () => {
    const params = buildBaseParams({ uiConfig: { hasFeePresets: false } });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: { settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" } },
    });

    expect(result.current.showFeePresets).toBe(false);
  });

  it("returns selectedFeeStrategy from transaction and correct feesRowStrategyLabel", () => {
    const params = buildBaseParams({
      transaction: { feesStrategy: "fast" },
      uiConfig: { hasFeePresets: true },
    });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: { settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" } },
    });

    expect(result.current.selectedFeeStrategy).toBe("fast");
    expect(result.current.feesRowStrategyLabel).toBe("Fast");
  });

  it("returns feesRowStrategyLabel Medium when selectedFeeStrategy is null", () => {
    const params = buildBaseParams({ uiConfig: { hasFeePresets: true } });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: { settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" } },
    });

    expect(result.current.selectedFeeStrategy).toBeNull();
    expect(result.current.feesRowStrategyLabel).toBe("Medium");
  });

  it("returns feesRowStrategyLabel Custom when selectedFeeStrategy is custom", () => {
    const params = buildBaseParams({
      transaction: { feesStrategy: "custom" },
      uiConfig: { hasFeePresets: true },
    });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: { settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" } },
    });

    expect(result.current.feesRowStrategyLabel).toBe("Custom");
  });

  it("returns feesRowValue as -- when no preset selected and no fee summary", () => {
    const params = buildBaseParams({ uiConfig: { hasFeePresets: true } });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: { settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" } },
    });

    expect(result.current.feesRowValue).toBe("--");
  });

  it("onSelectFeeStrategy calls updateTransaction with bridge-updated transaction", () => {
    const params = buildBaseParams({
      transaction: { feesStrategy: "custom" },
      uiConfig: { hasFeePresets: true },
    });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: { settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" } },
    });

    result.current.onSelectFeeStrategy("medium");

    expect(params.updateTransaction).toHaveBeenCalledTimes(1);
    const updater = params.updateTransaction.mock.calls[0][0];
    const currentTx = params.transaction;
    const patched = updater(currentTx);

    expect(patched.feesStrategy).toBe("medium");
    expect(patched.customGasLimit).toBeUndefined();
    expect(patched.gasPrice).toBeUndefined();
    expect(patched.maxFeePerGas).toBeUndefined();
    expect(patched.maxPriorityFeePerGas).toBeUndefined();
    expect(patched.feePerByte).toBeUndefined();
    expect(patched.customFeeRate).toBeUndefined();
    expect(patched.fees).toBeUndefined();
    expect(patched.customFees).toBeUndefined();
  });

  it("onSelectFeeStrategy ignores invalid strategy and passes null feesStrategy", () => {
    const params = buildBaseParams({
      transaction: { feesStrategy: "medium" },
      uiConfig: { hasFeePresets: true },
    });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: { settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" } },
    });

    result.current.onSelectFeeStrategy("invalid" as string);

    expect(params.updateTransaction).toHaveBeenCalledTimes(1);
    const updater = params.updateTransaction.mock.calls[0][0];
    const patched = updater(params.transaction);

    expect(patched.feesStrategy).toBeNull();
  });

  it("returns stable feePresetOptions, fiatByPreset, legendByPreset and onSelectFeeStrategy", () => {
    const params = buildBaseParams({ uiConfig: { hasFeePresets: true } });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: { settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" } },
    });

    expect(result.current).toMatchObject({
      feesRowLabel: "Network fees",
      showNetworkFees: true,
      feePresetOptions: expect.any(Array),
      fiatByPreset: expect.any(Object),
      legendByPreset: expect.any(Object),
    });
    expect(typeof result.current.onSelectFeeStrategy).toBe("function");
  });
});
