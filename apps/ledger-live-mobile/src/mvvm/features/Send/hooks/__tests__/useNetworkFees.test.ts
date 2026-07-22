/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { act, renderHook } from "@testing-library/react-native";
import { createMockAccount } from "../../screens/Recipient/hooks/__tests__/accounts";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { useNetworkFees } from "../useNetworkFees";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import { useSelector } from "~/context/hooks";

const mockT = (key: string) => key;

jest.mock("~/context/hooks");
jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: mockT }),
  useLocale: () => ({ locale: "en" }),
}));
jest.mock("@ledgerhq/live-countervalues-react", () => ({
  useCalculateCountervalueCallback: jest.fn(() => jest.fn()),
}));
jest.mock("@ledgerhq/live-common/flows/send/hooks/useNetworkFeesCore");

const mockUseNetworkFeesCore = jest.requireMock(
  "@ledgerhq/live-common/flows/send/hooks/useNetworkFeesCore",
).useNetworkFeesCore;

const mockUpdateTransaction = jest.fn();

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
  onSelectCustomFees?: () => void;
}) {
  const account = createMockAccount(overrides?.account);
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
    onSelectCustomFees: overrides?.onSelectCustomFees,
  };
}

describe("useNetworkFees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useSelector).mockReturnValue({
      id: "USD",
      ticker: "USD",
      units: [{ name: "US Dollar", code: "USD", magnitude: 2 }],
    });
    mockUseNetworkFeesCore.mockReturnValue({
      feePresetOptions: [
        { id: "slow", amount: new BigNumber(1000) },
        { id: "medium", amount: new BigNumber(2000) },
        { id: "fast", amount: new BigNumber(3000) },
      ],
      fiatByPreset: {
        slow: "$1.00",
        medium: "$2.00",
        fast: "$3.00",
      },
      selectedFeeStrategy: null,
      selectedPresetFiatValue: null,
      onSelectFeeStrategy: jest.fn(),
      displayFeesValue: "-",
      showFeePresets: false,
      showFeeCurrencyAmount: false,
    });
  });

  it("returns the expected mobile view model shape", () => {
    const { result } = renderHook(() => useNetworkFees(buildParams()));

    expect(result.current).toMatchObject({
      label: "send.fees.title",
      value: "-",
      strategyLabel: "send.fees.medium",
      showFeePresets: false,
      selectedFeeStrategy: null,
      feePresetLabelsOptions: expect.any(Array),
      uiConfig: { hasCustomFees: false, hasCoinControl: false },
    });
    expect(result.current.feePresetLabelsOptions).toHaveLength(3);
  });

  it("exposes no networkFeesInfo for a non-TRON currency", () => {
    const { result } = renderHook(() => useNetworkFees(buildParams()));
    expect(result.current.networkFeesInfo).toBeNull();
  });

  it("exposes the TRON fee explanation derived from the status breakdown", () => {
    const tron = getCryptoCurrencyById("tron");
    const sufficient = renderHook(() =>
      useNetworkFees(
        buildParams({
          account: { currency: tron },
          transaction: { family: "tron" },
          status: {
            energyRequired: new BigNumber(0),
            energyAvailable: new BigNumber(0),
            bandwidthRequired: new BigNumber(270),
            bandwidthAvailable: new BigNumber(1500),
          },
        }),
      ),
    );
    expect(sufficient.result.current.networkFeesInfo?.translationKey).toBe("tronFees.sufficient");

    const insufficient = renderHook(() =>
      useNetworkFees(
        buildParams({
          account: { currency: tron },
          transaction: { family: "tron" },
          status: {
            estimatedFees: new BigNumber(13_740_900),
            energyRequired: new BigNumber(65000),
            energyAvailable: new BigNumber(0),
            bandwidthRequired: new BigNumber(270),
            bandwidthAvailable: new BigNumber(1500),
          },
        }),
      ),
    );
    expect(insufficient.result.current.networkFeesInfo?.translationKey).toBe(
      "tronFees.insufficient",
    );
  });

  it("maps fee preset options with translated labels and fiat values", () => {
    const { result } = renderHook(() => useNetworkFees(buildParams()));

    expect(result.current.feePresetLabelsOptions[0]).toEqual({
      id: "slow",
      label: "send.fees.slow",
      fiatValue: "$1.00",
      legendValue: null,
    });
  });

  it("uses core displayFeesValue and selected strategy label", () => {
    mockUseNetworkFeesCore.mockReturnValue({
      feePresetOptions: [],
      fiatByPreset: {},
      selectedFeeStrategy: "fast",
      selectedPresetFiatValue: "$3.00",
      onSelectFeeStrategy: jest.fn(),
      displayFeesValue: "$15.00 USD",
      showFeePresets: true,
      showFeeCurrencyAmount: false,
    });

    const { result } = renderHook(() =>
      useNetworkFees(buildParams({ uiConfig: { hasFeePresets: true } })),
    );

    expect(result.current.value).toBe("$15.00 USD");
    expect(result.current.strategyLabel).toBe("send.fees.fast");
    expect(result.current.showFeePresets).toBe(true);
  });

  it("forwards onSelectCoinControl and onSelectCustomFees", () => {
    const onSelectCoinControl = jest.fn();
    const onSelectCustomFees = jest.fn();
    const { result } = renderHook(() =>
      useNetworkFees(buildParams({ onSelectCoinControl, onSelectCustomFees })),
    );

    expect(result.current.onSelectCoinControl).toBe(onSelectCoinControl);
    expect(result.current.onSelectCustomFees).toBe(onSelectCustomFees);
  });

  it("delegates onSelectFeeStrategy to the core hook", () => {
    const onSelectFeeStrategy = jest.fn();
    mockUseNetworkFeesCore.mockReturnValue({
      feePresetOptions: [],
      fiatByPreset: {},
      selectedFeeStrategy: null,
      selectedPresetFiatValue: null,
      onSelectFeeStrategy,
      displayFeesValue: "-",
      showFeePresets: false,
      showFeeCurrencyAmount: false,
    });

    const { result } = renderHook(() => useNetworkFees(buildParams()));

    act(() => {
      result.current.onSelectFeeStrategy("fast");
    });

    expect(onSelectFeeStrategy).toHaveBeenCalledWith("fast");
  });
});
