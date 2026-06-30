/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { renderHook } from "@testing-library/react-native";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { useSelector } from "~/context/hooks";
import { createMockAccount } from "../../../Recipient/hooks/__tests__/accounts";
import { useCustomFeesViewModel } from "../useCustomFeesViewModel";

const usdCurrency = {
  id: "USD",
  name: "US Dollar",
  ticker: "USD",
  units: [{ code: "USD", magnitude: 2, name: "US Dollar" }],
};

jest.mock("~/context/hooks");
jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === "send.newSendFlow.customFees.feePerByte") {
        return `Fee amount (${params?.unit})`;
      }

      return key;
    },
  }),
  useLocale: () => ({ locale: "en" }),
}));
jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculateCountervalueCallback: () => () => new BigNumber(100),
}));

const mockCustomFeeConfig = {
  inputs: [
    {
      key: "feePerByte",
      type: "number",
      unitLabel: (currency: CryptoOrTokenCurrency) =>
        `${currency.units.find(unit => unit.magnitude === 0)?.code}/vbyte`,
    },
  ],
  getInitialValues: () => ({
    feePerByte: "2",
  }),
  buildTransactionPatch: (values: Record<string, string>) => ({
    feePerByte: new BigNumber(values.feePerByte),
  }),
};

jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/descriptor/send/features"),
  sendFeatures: {
    getCustomFeeConfig: () => mockCustomFeeConfig,
    getCustomAssetsConfig: () => null,
  },
}));

function createTransaction(): Transaction {
  return {
    family: "bitcoin",
    amount: new BigNumber(0),
    recipient: "",
  } as Transaction;
}

function createStatus(): TransactionStatus {
  return {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(1000),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
    txInputs: [],
  } as TransactionStatus;
}

const litecoin = getCryptoCurrencyById("litecoin");

function createTransactionActions(): SendFlowTransactionActions {
  return {
    updateTransaction: jest.fn(),
    setTransaction: jest.fn(),
    setRecipient: jest.fn(),
    setAccount: jest.fn(),
  };
}

describe("useCustomFeesViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useSelector).mockReturnValue(usdCurrency as ReturnType<typeof useSelector>);
  });

  it("resolves dynamic custom fee unit labels from the selected currency", () => {
    const account = createMockAccount({
      currency: litecoin,
    } as Partial<Account>);

    const { result } = renderHook(() =>
      useCustomFeesViewModel({
        account,
        parentAccount: null,
        transaction: createTransaction(),
        status: createStatus(),
        currency: litecoin,
        transactionActions: createTransactionActions(),
        onConfirm: jest.fn(),
      }),
    );

    expect(result.current.inputs[0].label).toBe("Fee amount (litoshi/vbyte)");
  });
});
