/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { renderHook } from "tests/testSetup";
import { INITIAL_STATE as INITIAL_STATE_SETTINGS } from "~/renderer/reducers/settings";
import { useNetworkFees } from "../useNetworkFees";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { createMockAccount } from "../../screens/Recipient/__integrations__/__fixtures__/accounts";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";

jest.mock("@ledgerhq/live-common/bridge/impl");
jest.mock("@ledgerhq/ledger-wallet-framework/account/helpers");
jest.mock("@ledgerhq/live-common/bridge/descriptor/registry", () => ({
  getSendDescriptor: jest.fn(() => ({ fees: {}, inputs: {} })),
}));
jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features", () => ({
  sendFeatures: {
    hasFeePresets: jest.fn(() => false),
    shouldEstimateFeePresetsWithBridge: jest.fn(() => false),
    getFeePresetFallbackIds: jest.fn(() => []),
    canEstimateFeePresetsWithZeroAmount: jest.fn(() => false),
    getFeePresetOptions: jest.fn(() => []),
    getFeeCurrencyAccountId: jest.fn(() => null),
    getDefaultStrategyPatch: jest.fn(() => ({
      feesStrategy: undefined,
      fees: undefined,
    })),
    hasFeeRateLegend: jest.fn(() => false),
  },
}));
let mockDisplayMode: "fiat" | "crypto" = "fiat";
jest.mock("@ledgerhq/live-common/flows/send/amount/SendAmountDisplayModeContext", () => ({
  useSendAmountDisplayMode: () => ({
    displayMode: mockDisplayMode,
    setDisplayMode: jest.fn(),
  }),
}));
jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculateCountervalueCallback: jest.fn(() => (_from: unknown, value: unknown) => value),
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
  status?: Partial<TransactionStatus>;
  uiConfig?: {
    hasFeePresets?: boolean;
    hasCustomFees?: boolean;
    hasCoinControl?: boolean;
    hasDefaultStrategy?: boolean;
  };
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
    ...overrides?.status,
  } as TransactionStatus;
  const updateTransaction = jest.fn();

  return {
    account,
    parentAccount: null as Account | null,
    transaction,
    status,
    uiConfig: {
      hasFeePresets: overrides?.uiConfig?.hasFeePresets ?? false,
      hasCustomFees: overrides?.uiConfig?.hasCustomFees ?? false,
      hasCoinControl: overrides?.uiConfig?.hasCoinControl ?? false,
      hasDefaultStrategy: overrides?.uiConfig?.hasDefaultStrategy ?? false,
    } as never,
    transactionActions: { updateTransaction } as never,
    updateTransaction,
  };
}

describe("useNetworkFees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDisplayMode = "fiat";

    const bridge = {
      updateTransaction: (tx: Record<string, unknown>, patch: Record<string, unknown>) => ({
        ...tx,
        ...patch,
      }),
    };
    mockedGetAccountBridge.mockReturnValue(
      Object.assign(Promise.resolve(bridge), {
        status: "fulfilled",
        value: bridge,
      }) as never,
    );
  });

  it("returns showNetworkFees true", () => {
    const params = buildBaseParams({ uiConfig: { hasFeePresets: true } });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: {
        settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" },
      },
    });

    expect(result.current.showNetworkFees).toBe(true);
  });

  it("returns no preset options in feeSelector when uiConfig.hasFeePresets is false", () => {
    const params = buildBaseParams({ uiConfig: { hasFeePresets: false } });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: {
        settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" },
      },
    });

    expect(result.current.feeSelector.options).toHaveLength(0);
  });

  it("returns selectedFeeStrategy from transaction and correct feesRowStrategyLabel", () => {
    const mockedSendFeatures = jest.requireMock(
      "@ledgerhq/live-common/bridge/descriptor/send/features",
    ).sendFeatures;
    mockedSendFeatures.getFeePresetOptions.mockReturnValueOnce([
      { id: "slow", amount: new BigNumber(1_000) },
      { id: "medium", amount: new BigNumber(2_000) },
      { id: "fast", amount: new BigNumber(3_000) },
    ]);

    const params = buildBaseParams({
      transaction: { feesStrategy: "fast" },
      uiConfig: { hasFeePresets: true },
    });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: {
        settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" },
      },
    });

    expect(result.current.selectedFeeStrategy).toBe("fast");
    expect(result.current.feesRowStrategyLabel).toBe("Fast");
  });

  it("returns feesRowStrategyLabel Medium when selectedFeeStrategy is null", () => {
    const params = buildBaseParams({ uiConfig: { hasFeePresets: true } });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: {
        settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" },
      },
    });

    expect(result.current.selectedFeeStrategy).toBeNull();
    expect(result.current.feesRowStrategyLabel).toBe("Medium");
  });

  it("returns feesRowStrategyLabel Custom when selectedFeeStrategy is custom", () => {
    const params = buildBaseParams({
      transaction: { feesStrategy: "custom" },
      uiConfig: { hasFeePresets: true, hasCustomFees: true },
    });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: {
        settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" },
      },
    });

    expect(result.current.feesRowStrategyLabel).toBe("Custom");
  });

  it("returns feesRowStrategyLabel Default network fee for a preset-less coin with no override", () => {
    const params = buildBaseParams({
      uiConfig: {
        hasFeePresets: false,
        hasCustomFees: true,
        hasDefaultStrategy: true,
      },
    });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: {
        settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" },
      },
    });

    expect(result.current.feesRowStrategyLabel).toBe("Default network fee");
  });

  it("returns feesRowValue as -- when the fee is editable but unknown", () => {
    const params = buildBaseParams({
      uiConfig: { hasFeePresets: true, hasCustomFees: true },
    });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: {
        settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" },
      },
    });

    expect(result.current.feesRowValue).toBe("--");
  });

  it("follows the fiat⇄crypto toggle for the row value when fees are editable", () => {
    const params = buildBaseParams({
      uiConfig: { hasFeePresets: true, hasCustomFees: true },
      status: { estimatedFees: new BigNumber(1_000) },
    });

    const { result: fiat } = renderHook(() => useNetworkFees(params), {
      initialState: {
        settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" },
      },
    });
    expect(fiat.current.feesRowValue).toMatch(/\$/);
    expect(fiat.current.feesRowSecondaryValue).toBeNull();

    mockDisplayMode = "crypto";
    const { result: crypto } = renderHook(() => useNetworkFees(params), {
      initialState: {
        settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" },
      },
    });
    expect(crypto.current.feesRowValue).toMatch(/BTC/);
    expect(crypto.current.feesRowSecondaryValue).toBeNull();
  });

  it("exposes both values on the row when fees are not editable", () => {
    const params = buildBaseParams({
      uiConfig: {
        hasFeePresets: false,
        hasCustomFees: false,
        hasCoinControl: false,
      },
      status: { estimatedFees: new BigNumber(1_000) },
    });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: {
        settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" },
      },
    });

    expect(result.current.feeSelector.canOpen).toBe(false);
    expect(result.current.feesRowValue).toMatch(/\$/);
    expect(result.current.feesRowSecondaryValue).toMatch(/BTC/);
  });

  it("sub-labels presets with both amounts", () => {
    const mockedSendFeatures = jest.requireMock(
      "@ledgerhq/live-common/bridge/descriptor/send/features",
    ).sendFeatures;
    mockedSendFeatures.hasFeePresets.mockReturnValue(true);
    mockedSendFeatures.getFeePresetOptions.mockReturnValue([
      { id: "slow", amount: new BigNumber(1_000) },
      { id: "medium", amount: new BigNumber(2_000) },
    ]);

    const params = buildBaseParams({ uiConfig: { hasFeePresets: true } });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: {
        settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" },
      },
    });

    const slow = result.current.feeSelector.options.find(o => o.id === "slow");
    expect(slow?.sublabel).toContain(" · ");
    expect(slow?.sublabel).toMatch(/\$/);
    expect(slow?.sublabel).toMatch(/BTC/);
  });

  it("feeSelector option onSelect calls updateTransaction with bridge-updated transaction", () => {
    const mockedSendFeatures = jest.requireMock(
      "@ledgerhq/live-common/bridge/descriptor/send/features",
    ).sendFeatures;
    mockedSendFeatures.getFeePresetOptions.mockReturnValueOnce([
      { id: "slow", amount: new BigNumber(1_000) },
      { id: "medium", amount: new BigNumber(2_000) },
      { id: "fast", amount: new BigNumber(3_000) },
    ]);

    const params = buildBaseParams({
      transaction: { feesStrategy: "custom" },
      uiConfig: { hasFeePresets: true },
    });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: {
        settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" },
      },
    });

    const mediumOption = result.current.feeSelector.options.find(o => o.id === "medium");
    mediumOption?.onSelect();

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

  it("returns stable feeSelector options and canOpen", () => {
    const params = buildBaseParams({ uiConfig: { hasFeePresets: true } });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: {
        settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" },
      },
    });

    expect(result.current).toMatchObject({
      feesRowLabel: "Network fees",
      showNetworkFees: true,
      feeSelector: {
        options: expect.any(Array),
        selectedId: expect.any(String),
        canOpen: expect.any(Boolean),
      },
    });
  });

  it("appends a custom option that patches feesStrategy to custom when selected", () => {
    const onSelectCustomFees = jest.fn();
    const params = buildBaseParams({
      transaction: { feesStrategy: "medium" },
      uiConfig: { hasFeePresets: true, hasCustomFees: true },
    });

    const { result } = renderHook(() => useNetworkFees({ ...params, onSelectCustomFees }), {
      initialState: {
        settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" },
      },
    });

    const customOption = result.current.feeSelector.options.find(o => o.id === "custom");
    expect(customOption).toBeDefined();
    expect(customOption?.kind).toBe("custom");

    customOption?.onSelect();
    expect(onSelectCustomFees).toHaveBeenCalledTimes(1);
  });

  it("omits the custom option when onSelectCustomFees is not provided even if hasCustomFees", () => {
    const params = buildBaseParams({
      uiConfig: { hasFeePresets: true, hasCustomFees: true },
    });

    const { result } = renderHook(() => useNetworkFees(params), {
      initialState: {
        settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" },
      },
    });

    expect(result.current.feeSelector.options.some(o => o.id === "custom")).toBe(false);
  });

  it("appends a coinControl option only when hasCoinControl and onSelectCoinControl are both set", () => {
    const onSelectCoinControl = jest.fn();
    const params = buildBaseParams({
      uiConfig: { hasFeePresets: true, hasCoinControl: true },
    });

    const { result } = renderHook(() => useNetworkFees({ ...params, onSelectCoinControl }), {
      initialState: {
        settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" },
      },
    });

    const coinControlOption = result.current.feeSelector.options.find(o => o.id === "coinControl");
    expect(coinControlOption).toBeDefined();
    expect(coinControlOption?.selected).toBe(false);

    coinControlOption?.onSelect();
    expect(onSelectCoinControl).toHaveBeenCalledTimes(1);
  });
});
