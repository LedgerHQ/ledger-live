import { renderHook } from "@testing-library/react-hooks";

import { AmountRequired } from "@ledgerhq/errors";
import { useFromAmountError } from "./useSwapTransaction";

/**
 * @DEV: The useSwapTransaction hook is a composition hook. It doesn't own specific
 * logic, but it's composed of other hooks. That's why only the useFromAmountError
 * logic is tested here, it's the only logic owned by the useSwapTransaction hook.
 * All other lines are covered by other hooks tests.
 */
describe("useSwapTransaction", () => {
  test("useFromAmountError - returns nothing when no errors are caught", () => {
    const { result } = renderHook(() =>
      useFromAmountError({ gasPrice: undefined, amount: undefined })
    );

    expect(result.current).toBeUndefined();
  });

  test("useFromAmountError - returns the first error caught", () => {
    const gasPriceError = new Error("Gas price is too high");
    const amountError = new Error("Amount is too low");
    const tests = [
      {
        input: { gasPrice: gasPriceError, amount: undefined },
        output: gasPriceError,
      },
      {
        input: { gasPrice: undefined, amount: amountError },
        output: amountError,
      },
      {
        input: { gasPrice: gasPriceError, amount: amountError },
        output: gasPriceError,
      },
    ];

    tests.forEach(({ input, output }) => {
      const { result } = renderHook(() => useFromAmountError(input));
      expect(result.current).toEqual(output);
    });
  });

  test("useFromAmountError - do not return AmountRequired error", () => {
    const amountError = new AmountRequired("This error will be filtered");

    const { result } = renderHook(() =>
      useFromAmountError({ gasPrice: undefined, amount: amountError })
    );

    expect(result.current).toBeUndefined();
  });
});
