import BigNumber from "bignumber.js";
import {
  WithdrawAddressScreeningError,
  WithdrawApiError,
  WithdrawLowLiquidityError,
  WithdrawMinimumAmountError,
  WithdrawSubmitUnknownOutcomeError,
  toWithdrawError,
} from "./errors";
import { errorBody } from "./__fixtures__/responses";

describe("toWithdrawError", () => {
  it("maps FROM_CURRENCY_MINIMUM_AMOUNT_ERROR and keeps the minimum when returned", () => {
    const error = toWithdrawError({
      status: 400,
      body: errorBody("FROM_CURRENCY_MINIMUM_AMOUNT_ERROR", { minAmount: "5" }),
    });

    expect(error).toBeInstanceOf(WithdrawMinimumAmountError);
    expect(error).toMatchObject({ minAmount: new BigNumber(5) });
  });

  it("maps FROM_CURRENCY_MINIMUM_AMOUNT_ERROR without a minimum", () => {
    const error = toWithdrawError({
      status: 400,
      body: errorBody("FROM_CURRENCY_MINIMUM_AMOUNT_ERROR"),
    });

    expect(error).toBeInstanceOf(WithdrawMinimumAmountError);
    expect(error).toMatchObject({ minAmount: undefined });
  });

  it("keeps the error code but drops a minimum sent as a JSON number", () => {
    const error = toWithdrawError({
      status: 400,
      body: errorBody("FROM_CURRENCY_MINIMUM_AMOUNT_ERROR", { minAmount: 0.1 + 0.2 }),
    });

    expect(error).toBeInstanceOf(WithdrawMinimumAmountError);
    expect(error).toMatchObject({ minAmount: undefined });
  });

  it("maps SWAP_QUOTE_LOW_LIQUIDITY", () => {
    expect(
      toWithdrawError({ status: 400, body: errorBody("SWAP_QUOTE_LOW_LIQUIDITY") }),
    ).toBeInstanceOf(WithdrawLowLiquidityError);
  });

  it.each(["ADDRESS_SCREENING_FAILED", "invalidDestinationAddress"])(
    "maps %s to the blocking address screening error",
    code => {
      expect(toWithdrawError({ status: 400, body: errorBody(code) })).toBeInstanceOf(
        WithdrawAddressScreeningError,
      );
    },
  );

  it("maps a 502 SUBMIT_FAILED_ERROR to an unknown outcome", () => {
    expect(toWithdrawError({ status: 502, body: errorBody("SUBMIT_FAILED_ERROR") })).toBeInstanceOf(
      WithdrawSubmitUnknownOutcomeError,
    );
  });

  it("maps any other error to a generic API error carrying status and code", () => {
    const error = toWithdrawError({ status: 500, body: errorBody("SOMETHING_ELSE") });

    expect(error).toBeInstanceOf(WithdrawApiError);
    expect(error).toMatchObject({ status: 500, code: "SOMETHING_ELSE" });
  });

  it("maps an unparsable body to a generic API error", () => {
    const error = toWithdrawError({ status: 503, body: "<html>Bad gateway</html>" });

    expect(error).toBeInstanceOf(WithdrawApiError);
    expect(error).toMatchObject({ status: 503, code: undefined });
  });
});
