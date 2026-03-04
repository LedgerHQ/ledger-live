/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { act } from "@testing-library/react";
import { renderHook } from "tests/testSetup";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { AccountLike } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCustomFeesViewModel } from "../useCustomFeesViewModel";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";

// Mock dependencies
jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === "newSendFlow.customFees.maxFeeBelowPriorityFee") {
        return "Max fee must be greater than or equal to max priority fee";
      }
      if (key === "newSendFlow.customFees.invalidValue") {
        return "Enter a valid number";
      }
      if (key === "newSendFlow.customFees.belowMinimum") {
        return `Minimum is ${params?.min}`;
      }
      return key;
    },
  }),
}));

jest.mock("LLD/hooks/redux", () => {
  const actual = jest.requireActual("LLD/hooks/redux");
  return {
    ...actual,
    useSelector: (selector: unknown) => {
      const { counterValueCurrencySelector, localeSelector } = jest.requireActual(
        "~/renderer/reducers/settings",
      );

      if (selector === counterValueCurrencySelector) {
        return { ticker: "USD", units: [{ code: "USD", magnitude: 2 }] };
      }
      if (selector === localeSelector) {
        return "en";
      }
      return actual.useSelector(selector);
    },
  };
});

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculate: () => 100,
}));

jest.mock("@ledgerhq/live-common/bridge/descriptor", () => ({
  sendFeatures: {
    getCustomFeeConfig: (currency: CryptoOrTokenCurrency) => {
      if (currency.id === "ethereum") {
        return {
          inputs: [
            { key: "maxPriorityFeePerGas", type: "number", unitLabel: "Gwei" },
            { key: "maxFeePerGas", type: "number", unitLabel: "Gwei" },
            { key: "gasLimit", type: "number", unitLabel: "Gwei" },
          ],
          getInitialValues: () => ({
            maxPriorityFeePerGas: "2",
            maxFeePerGas: "10",
            gasLimit: "21000",
          }),
          buildTransactionPatch: (values: Record<string, string>) => ({
            maxPriorityFeePerGas: new BigNumber(values.maxPriorityFeePerGas).times("1e9"),
            maxFeePerGas: new BigNumber(values.maxFeePerGas).times("1e9"),
            customGasLimit: new BigNumber(values.gasLimit),
          }),
        };
      }
      return null;
    },
    hasCustomAssets: () => false,
    getCustomAssetsConfig: () => null,
  },
}));

function createMockAccount(): AccountLike {
  return {
    id: "ethereum-account-1",
    type: "Account",
    currency: { id: "ethereum", name: "Ethereum" },
    balance: new BigNumber(1000000000000000000),
  } as unknown as AccountLike;
}

function createMockTransaction(): Transaction {
  return {
    family: "evm",
    type: 2,
    gasLimit: new BigNumber(21000),
    amount: new BigNumber(0),
    recipient: "0xRecipient",
  } as unknown as Transaction;
}

function createMockStatus(): TransactionStatus {
  return {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(210000000000000),
  } as unknown as TransactionStatus;
}

function createMockCurrency(): CryptoOrTokenCurrency {
  return {
    id: "ethereum",
    name: "Ethereum",
    type: "CryptoCurrency",
  } as unknown as CryptoOrTokenCurrency;
}

function createMockTransactionActions(): SendFlowTransactionActions {
  return {
    updateTransaction: jest.fn(),
  } as unknown as SendFlowTransactionActions;
}

describe("useCustomFeesViewModel - EIP-1559 Validation", () => {
  it("should disable confirm when maxFeePerGas is less than maxPriorityFeePerGas", () => {
    const account = createMockAccount();
    const transaction = createMockTransaction();
    const status = createMockStatus();
    const currency = createMockCurrency();
    const transactionActions = createMockTransactionActions();

    const { result } = renderHook(() =>
      useCustomFeesViewModel({
        account,
        parentAccount: null,
        transaction,
        status,
        currency,
        transactionActions,
        onConfirm: jest.fn(),
        onBack: jest.fn(),
      }),
    );

    // Initially valid (maxFee: 10, maxPriority: 2)
    expect(result.current.isConfirmDisabled).toBe(false);

    // Set maxFeePerGas lower than maxPriorityFeePerGas
    act(() => {
      result.current.onInputChange("maxFeePerGas", "1");
    });

    // Should be disabled
    expect(result.current.isConfirmDisabled).toBe(true);

    // Find the maxFeePerGas input and check for error
    const maxFeeInput = result.current.inputs.find(input => input.key === "maxFeePerGas");
    expect(maxFeeInput?.error).toBe("Max fee must be greater than or equal to max priority fee");
  });

  it("should enable confirm when maxFeePerGas equals maxPriorityFeePerGas", () => {
    const account = createMockAccount();
    const transaction = createMockTransaction();
    const status = createMockStatus();
    const currency = createMockCurrency();
    const transactionActions = createMockTransactionActions();

    const { result } = renderHook(() =>
      useCustomFeesViewModel({
        account,
        parentAccount: null,
        transaction,
        status,
        currency,
        transactionActions,
        onConfirm: jest.fn(),
        onBack: jest.fn(),
      }),
    );

    // Set both to the same value
    act(() => {
      result.current.onInputChange("maxPriorityFeePerGas", "5");
      result.current.onInputChange("maxFeePerGas", "5");
    });

    // Should be enabled (equal is valid)
    expect(result.current.isConfirmDisabled).toBe(false);

    // Check no error on maxFeePerGas
    const maxFeeInput = result.current.inputs.find(input => input.key === "maxFeePerGas");
    expect(maxFeeInput?.error).toBeNull();
  });

  it("should enable confirm when maxFeePerGas is greater than maxPriorityFeePerGas", () => {
    const account = createMockAccount();
    const transaction = createMockTransaction();
    const status = createMockStatus();
    const currency = createMockCurrency();
    const transactionActions = createMockTransactionActions();

    const { result } = renderHook(() =>
      useCustomFeesViewModel({
        account,
        parentAccount: null,
        transaction,
        status,
        currency,
        transactionActions,
        onConfirm: jest.fn(),
        onBack: jest.fn(),
      }),
    );

    // Set maxFeePerGas higher than maxPriorityFeePerGas
    act(() => {
      result.current.onInputChange("maxPriorityFeePerGas", "3");
      result.current.onInputChange("maxFeePerGas", "15");
    });

    // Should be enabled
    expect(result.current.isConfirmDisabled).toBe(false);

    // Check no error on maxFeePerGas
    const maxFeeInput = result.current.inputs.find(input => input.key === "maxFeePerGas");
    expect(maxFeeInput?.error).toBeNull();
  });

  it("should not call onConfirm when confirm is disabled due to violation", () => {
    const account = createMockAccount();
    const transaction = createMockTransaction();
    const status = createMockStatus();
    const currency = createMockCurrency();
    const transactionActions = createMockTransactionActions();
    const onConfirm = jest.fn();

    const { result } = renderHook(() =>
      useCustomFeesViewModel({
        account,
        parentAccount: null,
        transaction,
        status,
        currency,
        transactionActions,
        onConfirm,
        onBack: jest.fn(),
      }),
    );

    // Create violation
    act(() => {
      result.current.onInputChange("maxFeePerGas", "1");
    });

    // Try to confirm
    act(() => {
      result.current.onConfirm();
    });

    // Should not have been called
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("should attach insufficient balance error to maxFeePerGas input", () => {
    const account = createMockAccount();
    const transaction = createMockTransaction();
    const status = {
      ...createMockStatus(),
      errors: {
        insufficientBalanceFees: new Error("Not enough balance for fees"),
      },
    } as TransactionStatus;
    const currency = createMockCurrency();
    const transactionActions = createMockTransactionActions();

    const { result } = renderHook(() =>
      useCustomFeesViewModel({
        account,
        parentAccount: null,
        transaction,
        status,
        currency,
        transactionActions,
        onConfirm: jest.fn(),
        onBack: jest.fn(),
      }),
    );

    const maxPriorityInput = result.current.inputs.find(
      input => input.key === "maxPriorityFeePerGas",
    );
    const maxFeeInput = result.current.inputs.find(input => input.key === "maxFeePerGas");

    expect(maxPriorityInput?.error).toBeNull();
    expect(maxFeeInput?.error).toBe("newSendFlow.insufficientBalanceFees");
  });
});
