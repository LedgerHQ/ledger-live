/**
 * @jest-environment jsdom
 */
import "../../../__tests__/test-helpers/dom-polyfill";
import { renderHook } from "@testing-library/react";
import { AmountRequired, NotEnoughGas, NotEnoughGasSwap } from "@ledgerhq/errors";

import { useFromAmountStatusMessage } from "./useSwapTransaction";
import { Result } from "../../../bridge/useBridgeTransaction";
import { Transaction } from "../../../generated/types";
import BigNumber from "bignumber.js";
import { Account, AccountLike } from "@ledgerhq/types-live";

jest.mock("@ledgerhq/coin-framework/account/index", () => ({
  ...jest.requireActual("@ledgerhq/coin-framework/account/index"),
  getFeesUnit: () => ({
    name: "wei",
    code: "ETH",
    magnitude: 18,
    showAllDigits: false,
    prefixCode: false,
  }),
  getAccountCurrency: () => ({
    ticker: "ETH",
    name: "Ethereum",
  }),
}));

function generateTransactionWithError({
  account,
  parentAccount,
  errors,
  estimatedFees = BigNumber(0),
}: {
  errors: Record<string, Error | undefined>;
  estimatedFees?: BigNumber;
  account?: AccountLike;
  parentAccount?: Account;
}): Result<Transaction> {
  return {
    account,
    parentAccount,
    status: {
      errors,
      estimatedFees,
    },
  } as Result<Transaction>;
}

/**
 * @DEV: The useSwapTransaction hook is a composition hook. It doesn't own specific
 * logic, but it's composed of other hooks. That's why only the useFromAmountStatusMessage
 * logic is tested here, it's the only logic owned by the useSwapTransaction hook.
 * All other lines are covered by other hooks tests.
 */
describe("useSwapTransaction", () => {
  test("useFromAmountStatusMessage - returns nothing when no errors are caught", () => {
    const mockTransaction = generateTransactionWithError({ errors: {} });
    const { result } = renderHook(() =>
      useFromAmountStatusMessage(mockTransaction, ["gasPrice", "amount"]),
    );

    expect(result.current).toBeUndefined();
  });

  test("useFromAmountStatusMessage - returns the first error caught", () => {
    const gasPriceError = new Error("Gas price is too high");
    const amountError = new Error("Amount is too low");
    const notEnoughGasError = new NotEnoughGas();
    const tests = [
      {
        input: generateTransactionWithError({
          errors: { gasPrice: gasPriceError, amount: undefined },
        }),
        output: gasPriceError,
      },
      {
        input: generateTransactionWithError({
          errors: { gasPrice: undefined, amount: amountError },
        }),
        output: amountError,
      },
      {
        input: generateTransactionWithError({
          errors: { gasPrice: gasPriceError, amount: amountError },
        }),
        output: gasPriceError,
      },
      {
        input: generateTransactionWithError({
          errors: { gasPrice: notEnoughGasError },
        }),
        output: notEnoughGasError,
      },
      {
        input: generateTransactionWithError({
          errors: { gasPrice: notEnoughGasError },
        }),
        output: notEnoughGasError,
      },
    ];

    tests.forEach(({ input, output }) => {
      const { result } = renderHook(() =>
        useFromAmountStatusMessage(input, ["gasPrice", "amount"]),
      );
      expect(result.current).toEqual(output);
    });
  });

  test("useFromAmountStatusMessage - return NotEnoughGasSwap error if fields exist in tx", () => {
    const mockAccount = {} as Account;
    const input = generateTransactionWithError({
      errors: { gasPrice: new NotEnoughGas() },
      account: mockAccount,
    });
    const { result } = renderHook(() => useFromAmountStatusMessage(input, ["gasPrice"]));
    expect(result.current).toBeInstanceOf(NotEnoughGasSwap);
  });

  test("useFromAmountStatusMessage - do not return AmountRequired error", () => {
    const amountError = new AmountRequired("This error will be filtered");

    const { result } = renderHook(() =>
      useFromAmountStatusMessage(
        generateTransactionWithError({ errors: { gasPrice: undefined, amount: amountError } }),
        ["gasPrice", "amount"],
      ),
    );

    expect(result.current).toBeUndefined();
  });
});
