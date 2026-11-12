import BigNumber from "bignumber.js";
import type { Unit } from "@domain/entity-currency-unit";
import {
  SwapExchangeRateAmountTooHigh,
  SwapExchangeRateAmountTooLow,
  SwapGenericAPIError,
} from "../../../errors";
import type { ExchangeRateErrors, ExchangeRateResponseRaw } from "../types";
import { enrichRatesResponse } from "./enrichRatesResponse";
import { inferError } from "./inferRatesError";

const unitFrom: Unit = { name: "bitcoin", code: "BTC", magnitude: 8 };
const unitTo: Unit = { name: "ether", code: "ETH", magnitude: 18 };

// Provider payloads come from JSON, so fields may hold anything at runtime
const fromApi = <T>(payload: object): T => JSON.parse(JSON.stringify(payload));

const floatRate = {
  status: "success",
  provider: "changelly",
  providerType: "CEX",
  tradeMethod: "float",
  from: "bitcoin",
  to: "ethereum",
  amountFrom: "1",
  amountTo: "20",
  payoutNetworkFees: "0.5",
  minAmountFrom: "0.1",
};

const minMaxError = {
  status: "error",
  provider: "changelly",
  providerType: "CEX",
  tradeMethod: "float",
  from: "bitcoin",
  to: "ethereum",
  amountRequested: "5",
  minAmountFrom: "1",
  maxAmountFrom: "2",
};

describe("enrichRatesResponse", () => {
  it("enriches a readable provider rate", () => {
    const [rate] = enrichRatesResponse([fromApi(floatRate)], unitTo, unitFrom);

    expect(rate.error).toBeUndefined();
    expect(rate.rate).toEqual(new BigNumber("19.5"));
    expect(rate.toAmount).toEqual(new BigNumber("19.5").shiftedBy(18));
    expect(rate.payoutNetworkFees).toEqual(new BigNumber("0.5").shiftedBy(18));
  });

  it.each([
    ["amountTo", undefined],
    ["amountTo", null],
    ["amountTo", ""],
    ["amountFrom", "abc"],
    ["payoutNetworkFees", null],
  ])("turns a rate with %s %p into an errored entry, keeping the others", (field, value) => {
    const response: ExchangeRateResponseRaw[] = [
      fromApi({ ...floatRate, provider: "broken", [field]: value }),
      fromApi(floatRate),
    ];

    const [broken, valid] = enrichRatesResponse(response, unitTo, unitFrom);

    expect(broken.error).toBeInstanceOf(SwapGenericAPIError);
    expect(broken.rate).toBeUndefined();
    expect(broken.toAmount).toEqual(new BigNumber(0));
    expect(valid.error).toBeUndefined();
    expect(valid.rate).toEqual(new BigNumber("19.5"));
  });

  it("turns a fixed rate with an unreadable rate into an errored entry", () => {
    const [rate] = enrichRatesResponse(
      [
        fromApi({
          ...floatRate,
          tradeMethod: "fixed",
          rateId: "id",
          expirationTime: "1",
          rate: "",
        }),
      ],
      unitTo,
      unitFrom,
    );

    expect(rate.error).toBeInstanceOf(SwapGenericAPIError);
  });
});

describe("inferError", () => {
  it("reports an amount below the minimum", () => {
    const error = inferError(fromApi({ ...minMaxError, amountRequested: "0.5" }), unitFrom);

    expect(error).toBeInstanceOf(SwapExchangeRateAmountTooLow);
    expect(error).toMatchObject({ amount: new BigNumber(1) });
  });

  it("reports an amount above the maximum", () => {
    const error = inferError(fromApi(minMaxError), unitFrom);

    expect(error).toBeInstanceOf(SwapExchangeRateAmountTooHigh);
    expect(error).toMatchObject({ amount: new BigNumber(2) });
  });

  it("reports the maximum when only the maximum is returned", () => {
    const response: ExchangeRateErrors = fromApi({ ...minMaxError, minAmountFrom: undefined });

    const error = inferError(response, unitFrom);

    expect(error).toBeInstanceOf(SwapExchangeRateAmountTooHigh);
    expect(error).toMatchObject({ amount: new BigNumber(2) });
  });

  it.each([null, "", "abc"])(
    "falls back to a generic error when the bound to report is %p",
    maxAmountFrom => {
      const error = inferError(fromApi({ ...minMaxError, maxAmountFrom }), unitFrom);

      expect(error).toBeInstanceOf(SwapGenericAPIError);
    },
  );
});
