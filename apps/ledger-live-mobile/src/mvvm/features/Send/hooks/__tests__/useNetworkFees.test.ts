/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { act, renderHook } from "@testing-library/react-native";
import { createMockAccount } from "../../screens/Recipient/hooks/__tests__/accounts";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
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
let mockDisplayMode: "fiat" | "crypto" = "fiat";
jest.mock("@ledgerhq/live-common/flows/send/amount/SendAmountDisplayModeContext", () => ({
  useSendAmountDisplayMode: () => ({
    displayMode: mockDisplayMode,
    setDisplayMode: jest.fn(),
  }),
}));

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
    hasDefaultStrategy: false,
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

function mockCore(overrides?: {
  feeStrategyOptions?: ReadonlyArray<{
    id: string;
    kind: "preset" | "default";
    sublabelFiat: string | null;
    sublabelCrypto: string | null;
    sublabelLegend: string | null;
  }>;
  selectedFeeStrategyId?: string;
  selectedFeeStrategy?: string | null;
  feesRowValue?: string;
  feesRowSecondaryValue?: string | null;
  hasCustomFees?: boolean;
  hasCoinControl?: boolean;
  onSelectFeeStrategyId?: jest.Mock;
}) {
  mockUseNetworkFeesCore.mockReturnValue({
    feeStrategyOptions: overrides?.feeStrategyOptions ?? [
      {
        id: "slow",
        kind: "preset",
        sublabelFiat: "$1.00",
        sublabelCrypto: "1 BTC",
        sublabelLegend: null,
      },
      {
        id: "medium",
        kind: "preset",
        sublabelFiat: "$2.00",
        sublabelCrypto: "2 BTC",
        sublabelLegend: null,
      },
      {
        id: "fast",
        kind: "preset",
        sublabelFiat: "$3.00",
        sublabelCrypto: "3 BTC",
        sublabelLegend: null,
      },
    ],
    selectedFeeStrategyId: overrides?.selectedFeeStrategyId ?? "",
    selectedFeeStrategy: overrides?.selectedFeeStrategy ?? null,
    onSelectFeeStrategyId: overrides?.onSelectFeeStrategyId ?? jest.fn(),
    feesRowValue: overrides?.feesRowValue ?? "-",
    feesRowSecondaryValue: overrides?.feesRowSecondaryValue ?? null,
    hasCustomFees: overrides?.hasCustomFees ?? false,
    hasCoinControl: overrides?.hasCoinControl ?? false,
  });
}

describe("useNetworkFees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useSelector).mockReturnValue({
      id: "USD",
      ticker: "USD",
      units: [{ name: "US Dollar", code: "USD", magnitude: 2 }],
    });
    mockCore();
  });

  it("returns the expected mobile view model shape", () => {
    const { result } = renderHook(() => useNetworkFees(buildParams()));

    expect(result.current).toMatchObject({
      label: "send.fees.title",
      value: "-",
      strategyLabel: "send.fees.medium",
      selectedFeeStrategy: null,
      displayOptions: expect.any(Array),
      canOpenSelector: true,
    });
    expect(result.current.displayOptions).toHaveLength(3);
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

  it("maps fee strategy options with translated labels and combined sublabels", () => {
    const { result } = renderHook(() => useNetworkFees(buildParams()));

    expect(result.current.displayOptions[0]).toEqual({
      id: "slow",
      kind: "preset",
      label: "send.fees.slow",
      sublabel: "$1.00 · 1 BTC",
      selected: false,
      onSelect: expect.any(Function),
    });
  });

  it("marks the option matching selectedFeeStrategyId as selected", () => {
    mockCore({ selectedFeeStrategyId: "fast", selectedFeeStrategy: "fast" });

    const { result } = renderHook(() =>
      useNetworkFees(buildParams({ uiConfig: { hasFeePresets: true } })),
    );

    const fast = result.current.displayOptions.find(o => o.id === "fast");
    const slow = result.current.displayOptions.find(o => o.id === "slow");
    expect(fast?.selected).toBe(true);
    expect(slow?.selected).toBe(false);
  });

  it("uses the core row value and selected strategy label", () => {
    mockCore({
      feeStrategyOptions: [],
      selectedFeeStrategyId: "fast",
      selectedFeeStrategy: "fast",
      feesRowValue: "$15.00",
    });

    const { result } = renderHook(() =>
      useNetworkFees(buildParams({ uiConfig: { hasFeePresets: true } })),
    );

    expect(result.current.value).toBe("$15.00");
    expect(result.current.strategyLabel).toBe("send.fees.fast");
  });

  it("forwards the core's secondary value for a read-only fee", () => {
    mockCore({
      feeStrategyOptions: [],
      feesRowValue: "$0.10",
      feesRowSecondaryValue: "0.00056 SOL",
    });

    const { result } = renderHook(() => useNetworkFees(buildParams()));

    expect(result.current.value).toBe("$0.10");
    expect(result.current.secondaryValue).toBe("0.00056 SOL");
    expect(result.current.canOpenSelector).toBe(false);
  });

  it("uses the default-network-fee label when selectedFeeStrategyId is 'default' (preset-less coin)", () => {
    mockCore({
      feeStrategyOptions: [
        {
          id: "default",
          kind: "default",
          sublabelFiat: null,
          sublabelCrypto: null,
          sublabelLegend: null,
        },
      ],
      selectedFeeStrategyId: "default",
      selectedFeeStrategy: null,
    });

    const { result } = renderHook(() =>
      useNetworkFees(buildParams({ uiConfig: { hasFeePresets: false, hasCustomFees: true } })),
    );

    expect(result.current.strategyLabel).toBe("send.fees.defaultNetworkFee");
  });

  it("appends a custom option only when hasCustomFees and onSelectCustomFees are both set", () => {
    const onSelectCustomFees = jest.fn();
    mockCore({ hasCustomFees: true });

    const { result } = renderHook(() =>
      useNetworkFees(buildParams({ onSelectCustomFees, uiConfig: { hasCustomFees: true } })),
    );

    const custom = result.current.displayOptions.find(o => o.id === "custom");
    expect(custom).toBeDefined();
    expect(custom?.kind).toBe("custom");

    custom?.onSelect();
    expect(onSelectCustomFees).toHaveBeenCalled();
  });

  it("omits the custom option when onSelectCustomFees is not provided even if hasCustomFees", () => {
    mockCore({ hasCustomFees: true });

    const { result } = renderHook(() =>
      useNetworkFees(buildParams({ uiConfig: { hasCustomFees: true } })),
    );

    expect(result.current.displayOptions.some(o => o.id === "custom")).toBe(false);
  });

  it("appends a coinControl option only when hasCoinControl and onSelectCoinControl are both set", () => {
    const onSelectCoinControl = jest.fn();
    mockCore({ hasCoinControl: true });

    const { result } = renderHook(() =>
      useNetworkFees(buildParams({ onSelectCoinControl, uiConfig: { hasCoinControl: true } })),
    );

    const coinControl = result.current.displayOptions.find(o => o.id === "coinControl");
    expect(coinControl).toBeDefined();
    expect(coinControl?.selected).toBe(false);

    coinControl?.onSelect();
    expect(onSelectCoinControl).toHaveBeenCalled();
  });

  it("canOpenSelector is false when there are no options at all", () => {
    mockCore({
      feeStrategyOptions: [],
      hasCustomFees: false,
      hasCoinControl: false,
    });

    const { result } = renderHook(() => useNetworkFees(buildParams()));

    expect(result.current.canOpenSelector).toBe(false);
    expect(result.current.displayOptions).toHaveLength(0);
  });

  it("delegates onSelect to the core onSelectFeeStrategyId", () => {
    const onSelectFeeStrategyId = jest.fn();
    mockCore({ onSelectFeeStrategyId });

    const { result } = renderHook(() => useNetworkFees(buildParams()));

    act(() => {
      result.current.displayOptions[2].onSelect();
    });

    expect(onSelectFeeStrategyId).toHaveBeenCalledWith("fast");
  });
});
