/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { act, renderHook } from "@testing-library/react-native";
import { createMockAccount } from "../../screens/Recipient/hooks/__tests__/accounts";
import { useNetworkFees } from "../useNetworkFees";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import { useSelector } from "~/context/hooks";
const usdUnit = { name: "US Dollar", code: "USD", magnitude: 2 };
const mockCounterValueCurrency = {
  id: "USD",
  name: "US Dollar",
  ticker: "USD",
  units: [usdUnit],
};

const mockT = (key: string) => key;

jest.mock("~/context/hooks");
jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: mockT }),
  useLocale: () => ({ locale: "en" }),
}));
jest.mock("../useFeePresetOptions");
jest.mock("../useFeePresetFiatValues");
jest.mock("@ledgerhq/live-common/bridge/impl");
jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features");
jest.mock("@ledgerhq/ledger-wallet-framework/account/helpers");
jest.mock("@ledgerhq/live-countervalues-react");
jest.mock("LLM/hooks/useAccountUnit", () => ({
  useMaybeAccountUnit: jest.fn(() => ({ magnitude: 8, code: "BTC", name: "Bitcoin" })),
}));
jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/currencies/index"),
  formatCurrencyUnit: jest.fn(
    (_unit: unknown, value: BigNumber) => `FORMATTED_${value.toString()}`,
  ),
}));

const mockUseFeePresetOptions = jest.requireMock("../useFeePresetOptions").useFeePresetOptions;
const mockUseFeePresetFiatValues = jest.requireMock(
  "../useFeePresetFiatValues",
).useFeePresetFiatValues;
const { getMainAccount, getAccountCurrency } = jest.requireMock(
  "@ledgerhq/ledger-wallet-framework/account/helpers",
);
const { getAccountBridge } = jest.requireMock("@ledgerhq/live-common/bridge/impl");
const sendFeatures = jest.requireMock(
  "@ledgerhq/live-common/bridge/descriptor/send/features",
).sendFeatures;
const useCalculate = jest.requireMock("@ledgerhq/live-countervalues-react").useCalculate;

const mockUpdateTransaction = jest.fn();

function isAccount(account: unknown): account is Account {
  return (
    typeof account === "object" &&
    account !== null &&
    "type" in account &&
    (account as Account).type === "Account"
  );
}

function createTransaction(overrides?: Partial<Transaction>): Transaction {
  return {
    family: "bitcoin",
    amount: new BigNumber(0),
    recipient: "",
    ...overrides,
  } as Transaction;
}

function createTransactionStatus(overrides?: Partial<TransactionStatus>): TransactionStatus {
  return {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
    txInputs: [],
    ...overrides,
  } as TransactionStatus;
}

function buildParams(overrides?: {
  account?: Partial<Account>;
  transaction?: Partial<Transaction>;
  status?: Partial<TransactionStatus>;
  uiConfig?: Partial<SendFlowUiConfig>;
  onSelectCoinControl?: () => void;
}) {
  const account = createMockAccount(overrides?.account);
  getMainAccount.mockImplementation((acc: Account | unknown) => {
    if (!isAccount(acc)) throw new Error("TokenAccount not supported");
    return acc;
  });
  getAccountCurrency.mockReturnValue(account.currency);

  const transaction = createTransaction(overrides?.transaction);
  const status = createTransactionStatus(overrides?.status);
  const uiConfig: SendFlowUiConfig = {
    hasMemo: false,
    recipientSupportsDomain: false,
    hasFeePresets: false,
    hasCustomFees: false,
    hasCoinControl: false,
    ...overrides?.uiConfig,
  };
  const transactionActions: SendFlowTransactionActions = {
    updateTransaction: mockUpdateTransaction,
    setTransaction: jest.fn(),
    setRecipient: jest.fn(),
    setAccount: jest.fn(),
  };

  return {
    account,
    parentAccount: null as Account | null,
    transaction,
    status,
    uiConfig,
    transactionActions,
    onSelectCoinControl: overrides?.onSelectCoinControl,
  };
}

describe("useNetworkFees", () => {
  const defaultPresetOptions = [
    { id: "slow", amount: new BigNumber(1000), estimatedMs: undefined, disabled: undefined },
    { id: "medium", amount: new BigNumber(2000), estimatedMs: undefined, disabled: undefined },
    { id: "fast", amount: new BigNumber(3000), estimatedMs: undefined, disabled: undefined },
  ];
  const defaultFiatValues: Record<string, string | null> = {
    slow: "$1.00",
    medium: "$2.00",
    fast: "$3.00",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(useSelector)
      .mockReturnValue(mockCounterValueCurrency as ReturnType<typeof useSelector>);
    getAccountBridge.mockReturnValue({
      updateTransaction: jest.fn((tx: Transaction, patch: Partial<Transaction>) => ({
        ...tx,
        ...patch,
      })),
    });
    sendFeatures.shouldEstimateFeePresetsWithBridge = jest.fn(() => false);
    mockUseFeePresetOptions.mockReturnValue(defaultPresetOptions);
    mockUseFeePresetFiatValues.mockReturnValue(defaultFiatValues);
    useCalculate.mockReturnValue(undefined);
    mockUpdateTransaction.mockImplementation((fn: (tx: Transaction) => Transaction) => {
      const tx = createTransaction();
      return fn(tx);
    });
  });

  describe("view model shape", () => {
    it("returns the expected view model keys and types", () => {
      const params = buildParams();
      const { result } = renderHook(() => useNetworkFees(params));

      expect(result.current).toMatchObject({
        label: expect.any(String),
        value: expect.any(String),
        strategyLabel: expect.any(String),
        showFeePresets: false,
        selectedFeeStrategy: null,
        feePresetLabelsOptions: expect.any(Array),
        uiConfig: { hasCustomFees: false, hasCoinControl: false },
      });
      expect(typeof result.current.onSelectFeeStrategy).toBe("function");
      expect(result.current.feePresetLabelsOptions.length).toBe(3);
    });
  });

  describe("selectedFeeStrategy and showFeePresets", () => {
    it("selectedFeeStrategy equals transaction.feesStrategy when set", () => {
      const params = buildParams({ transaction: { feesStrategy: "medium" } });
      const { result } = renderHook(() => useNetworkFees(params));

      expect(result.current.selectedFeeStrategy).toBe("medium");
    });

    it("selectedFeeStrategy is null when transaction.feesStrategy is not set", () => {
      const params = buildParams();
      const { result } = renderHook(() => useNetworkFees(params));

      expect(result.current.selectedFeeStrategy).toBeNull();
    });

    it("showFeePresets equals uiConfig.hasFeePresets", () => {
      const params = buildParams({ uiConfig: { hasFeePresets: true } });
      const { result } = renderHook(() => useNetworkFees(params));

      expect(result.current.showFeePresets).toBe(true);
    });
  });

  describe("uiConfig passthrough", () => {
    it("passes hasCustomFees and hasCoinControl to view model", () => {
      const params = buildParams({
        uiConfig: { hasCustomFees: true, hasCoinControl: true },
      });
      const { result } = renderHook(() => useNetworkFees(params));

      expect(result.current.uiConfig).toEqual({
        hasCustomFees: true,
        hasCoinControl: true,
      });
    });
  });

  describe("onSelectFeeStrategy", () => {
    it("calls transactionActions.updateTransaction and bridge.updateTransaction with valid strategy", () => {
      const bridgeUpdateTransaction = jest.fn((tx: Transaction, patch: Partial<Transaction>) => ({
        ...tx,
        ...patch,
      }));
      getAccountBridge.mockReturnValue({ updateTransaction: bridgeUpdateTransaction });
      const params = buildParams();

      const { result } = renderHook(() => useNetworkFees(params));

      act(() => {
        result.current.onSelectFeeStrategy("fast");
      });

      expect(mockUpdateTransaction).toHaveBeenCalled();
      const updater = mockUpdateTransaction.mock.calls[0][0];
      const currentTx = createTransaction();
      const nextTx = updater(currentTx);
      expect(bridgeUpdateTransaction).toHaveBeenCalledWith(currentTx, { feesStrategy: "fast" });
      expect(nextTx.feesStrategy).toBe("fast");
    });

    it("updates with feesStrategy null when given invalid strategy", () => {
      const bridgeUpdateTransaction = jest.fn((tx: Transaction, patch: Partial<Transaction>) => ({
        ...tx,
        ...patch,
      }));
      getAccountBridge.mockReturnValue({ updateTransaction: bridgeUpdateTransaction });
      const params = buildParams();

      const { result } = renderHook(() => useNetworkFees(params));

      act(() => {
        result.current.onSelectFeeStrategy("invalid");
      });

      expect(mockUpdateTransaction).toHaveBeenCalled();
      const updater = mockUpdateTransaction.mock.calls[0][0];
      const currentTx = createTransaction();
      updater(currentTx);
      expect(bridgeUpdateTransaction).toHaveBeenCalledWith(currentTx, { feesStrategy: null });
    });
  });

  describe("onSelectCoinControl", () => {
    it("returns the provided onSelectCoinControl on the view model", () => {
      const onSelectCoinControl = jest.fn();
      const params = buildParams({ onSelectCoinControl });
      const { result } = renderHook(() => useNetworkFees(params));

      expect(result.current.onSelectCoinControl).toBe(onSelectCoinControl);
    });
  });

  describe("value (feesValue)", () => {
    it('returns "-" when status.estimatedFees is missing or lte 0', () => {
      const paramsNoFees = buildParams({
        status: { estimatedFees: undefined },
      });
      const { result: resultNo } = renderHook(() => useNetworkFees(paramsNoFees));
      expect(resultNo.current.value).toBe("-");

      const paramsZero = buildParams({
        status: { estimatedFees: new BigNumber(0) },
      });
      const { result: resultZero } = renderHook(() => useNetworkFees(paramsZero));
      expect(resultZero.current.value).toBe("-");
    });

    it("returns formatted fiat value when estimatedFees > 0 and countervalue present", () => {
      const { formatCurrencyUnit } = jest.requireMock("@ledgerhq/live-common/currencies/index");
      formatCurrencyUnit.mockReturnValue("$15.00 USD");
      useCalculate.mockReturnValue(500);

      const params = buildParams({
        status: { estimatedFees: new BigNumber(1000) },
      });
      const { result } = renderHook(() => useNetworkFees(params));

      expect(result.current.value).toBe("$15.00 USD");
      expect(formatCurrencyUnit).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(BigNumber),
        expect.objectContaining({ showCode: true, disableRounding: true, locale: "en" }),
      );
    });

    it("returns formatted account unit when estimatedFees > 0 and no countervalue", () => {
      const { formatCurrencyUnit } = jest.requireMock("@ledgerhq/live-common/currencies/index");
      formatCurrencyUnit.mockReturnValue("1000 BTC");
      useCalculate.mockReturnValue(undefined);

      const params = buildParams({
        status: { estimatedFees: new BigNumber(1000) },
      });
      const { result } = renderHook(() => useNetworkFees(params));

      expect(result.current.value).toBe("1000 BTC");
    });
  });

  describe("fee preset options mapping", () => {
    it("maps feePresetOptions with labels and fiatValues from child hooks", () => {
      mockUseFeePresetOptions.mockReturnValue(defaultPresetOptions);
      mockUseFeePresetFiatValues.mockReturnValue(defaultFiatValues);

      const params = buildParams();
      const { result } = renderHook(() => useNetworkFees(params));

      expect(result.current.feePresetLabelsOptions).toHaveLength(3);
      expect(result.current.feePresetLabelsOptions[0]).toMatchObject({
        id: "slow",
        label: expect.any(String),
        fiatValue: "$1.00",
        legendValue: null,
      });
      expect(result.current.feePresetLabelsOptions[1]).toMatchObject({
        id: "medium",
        fiatValue: "$2.00",
        legendValue: null,
      });
      expect(result.current.feePresetLabelsOptions[2]).toMatchObject({
        id: "fast",
        fiatValue: "$3.00",
        legendValue: null,
      });
    });
  });

  describe("EVM fallback presets", () => {
    it("calls useFeePresetFiatValues with fallbackPresetIds when hasFeePresets, evm family, and empty feePresetOptions", () => {
      mockUseFeePresetOptions.mockReturnValue([]);
      mockUseFeePresetFiatValues.mockReturnValue({});

      const params = buildParams({
        transaction: { family: "evm" } as Partial<Transaction>,
        uiConfig: { hasFeePresets: true },
      });

      renderHook(() => useNetworkFees(params));

      expect(mockUseFeePresetFiatValues).toHaveBeenCalledWith(
        expect.objectContaining({
          fallbackPresetIds: ["slow", "medium", "fast"],
        }),
      );
    });
  });
});
