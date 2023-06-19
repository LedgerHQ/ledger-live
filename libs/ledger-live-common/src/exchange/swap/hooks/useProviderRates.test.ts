import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { act, renderHook } from "@testing-library/react-hooks";
import BigNumber from "bignumber.js";
import { useProviderRates } from ".";
import { getExchangeRates } from "..";
import {
  SwapExchangeRateAmountTooHigh,
  SwapExchangeRateAmountTooLow,
  SwapExchangeRateAmountTooLowOrTooHigh,
} from "../../../errors";
import { genAccount } from "../../../mock/account";
import { mockGetExchangeRates } from "../mock";

jest.mock("..");
import { setSupportedCurrencies } from "../../../currencies";
setSupportedCurrencies(["ethereum"]);

const BTC = getCryptoCurrencyById("bitcoin");
const ETH = getCryptoCurrencyById("ethereum");
const fromAccount = genAccount("from-account", {
  currency: ETH,
});

const mockedGetExchangeRates = jest.mocked(getExchangeRates, true);
const mockedRatesPromise = mockGetExchangeRates(
  { fromAccount } as any,
  { amount: new BigNumber(1) } as any,
  BTC,
);

describe("useProviderRates", () => {
  let mockedRates;
  const baseInitalProps = {
    fromState: { account: fromAccount } as any,
    toState: { currency: ETH } as any,
    transaction: { amount: new BigNumber(1) } as any,
  };

  beforeAll(async () => {
    mockedRates = await mockedRatesPromise;
  });

  beforeEach(() => {
    mockedGetExchangeRates.mockReset();
  });

  it("should fetch and store the rates", async () => {
    mockedGetExchangeRates.mockResolvedValue(mockedRatesPromise);
    const setExchangeRate = jest.fn();

    const { result, waitForNextUpdate } = renderHook(useProviderRates, {
      initialProps: {
        ...baseInitalProps,
        setExchangeRate,
      },
    });

    expect(result.current.rates.status).toBe("loading");

    await waitForNextUpdate({ timeout: 1000 });

    // Check mock
    expect(mockedGetExchangeRates).toHaveBeenCalledTimes(1);
    // Check callback
    expect(setExchangeRate).toHaveBeenCalledTimes(1);
    expect(setExchangeRate.mock.calls[0][0]).toBe(mockedRates[0]);
    // Check result
    const { rates } = result.current;
    expect(rates.error).toBeUndefined();
    expect(rates.status).toBe("success");
    expect(rates.value).toMatchObject(mockedRates);
  });

  it("should not fetch the rates if the conditions are not met", async () => {
    const testProps = [
      // No account
      {
        ...baseInitalProps,
        fromState: { account: null } as any,
      },
      // No currency
      {
        ...baseInitalProps,
        toState: { currency: null } as any,
      },
      // No transaction
      {
        ...baseInitalProps,
        transaction: null,
      },
      // Amount <= 0
      {
        ...baseInitalProps,
        transaction: { amount: new BigNumber(0) } as any,
      },
      // Nothing
      {} as any,
    ];

    testProps.forEach(initialProps => {
      renderHook(useProviderRates, {
        initialProps,
      });
      expect(mockedGetExchangeRates).toHaveBeenCalledTimes(0);
    });
  });

  it("should refetch the rates if a dependency has been updated", async () => {
    mockedGetExchangeRates.mockResolvedValue(mockedRatesPromise);

    const { waitForNextUpdate, rerender } = renderHook(useProviderRates, {
      initialProps: baseInitalProps,
    });

    await waitForNextUpdate({ timeout: 1000 });
    expect(mockedGetExchangeRates).toHaveBeenCalledTimes(1);
    mockedGetExchangeRates.mockClear();

    rerender();
    expect(mockedGetExchangeRates).toHaveBeenCalledTimes(0);

    rerender({
      ...baseInitalProps,
      fromState: { account: { ...fromAccount } } as any,
    });
    await waitForNextUpdate({ timeout: 1000 });
    expect(mockedGetExchangeRates).toHaveBeenCalledTimes(1);
    mockedGetExchangeRates.mockClear();

    rerender({ ...baseInitalProps, toState: { currency: { ...ETH } } as any });
    await waitForNextUpdate({ timeout: 1000 });
    expect(mockedGetExchangeRates).toHaveBeenCalledTimes(1);
    mockedGetExchangeRates.mockClear();

    rerender({
      ...baseInitalProps,
      transaction: { amount: new BigNumber(2) } as any,
    });
    await waitForNextUpdate({ timeout: 1000 });
    expect(mockedGetExchangeRates).toHaveBeenCalledTimes(1);
  });

  it("should refetch with the corrected selected rate", async () => {
    const setExchangeRate = jest.fn();

    mockedGetExchangeRates.mockResolvedValue(mockedRatesPromise);

    const { result, waitForNextUpdate } = renderHook(useProviderRates, {
      initialProps: { ...baseInitalProps, setExchangeRate },
    });

    mockedGetExchangeRates.mockClear();

    act(() => {
      result.current.refetchRates();
    });
    await waitForNextUpdate({ timeout: 1000 });

    expect(setExchangeRate).toBeCalledWith(
      expect.objectContaining({
        provider: "changelly",
        tradeMethod: "fixed",
      }),
    );

    act(() => {
      result.current.updateSelectedRate({
        rate: new BigNumber(1),
        toAmount: new BigNumber(1),
        magnitudeAwareRate: new BigNumber(1),
        provider: "changelly",
        providerType: "CEX",
        tradeMethod: "float",
      });
      result.current.refetchRates();
    });
    await waitForNextUpdate({ timeout: 1000 });

    expect(setExchangeRate).toBeCalledWith(
      expect.objectContaining({
        provider: "changelly",
        tradeMethod: "float",
      }),
    );
  });

  it("should refetch the rates if refetchRates is called", async () => {
    const { result, waitForNextUpdate } = renderHook(useProviderRates, {
      initialProps: baseInitalProps,
    });

    await waitForNextUpdate({ timeout: 1000 });
    expect(mockedGetExchangeRates).toHaveBeenCalledTimes(1);
    mockedGetExchangeRates.mockClear();

    act(() => {
      result.current.refetchRates();
    });
    await waitForNextUpdate({ timeout: 1000 });
    expect(mockedGetExchangeRates).toHaveBeenCalledTimes(1);
  });

  it("should filter out errored rates", async () => {
    const mockedRatesWithSingleError = mockedRates.map((rate, index) =>
      index === 0
        ? {
            ...rate,
            error: new Error("kaboom"),
          }
        : rate,
    );
    mockedGetExchangeRates.mockResolvedValue(mockedRatesWithSingleError);

    const { result, waitForNextUpdate } = renderHook(useProviderRates, {
      initialProps: baseInitalProps,
    });
    await waitForNextUpdate({ timeout: 1000 });
    expect(result.current.rates.value).not.toContain(mockedRatesWithSingleError[0]);
    expect(result.current.rates.value?.length).toEqual(3);
    expect(result.current.rates.status).toBe("success");
  });

  it("should dispatch an error if all the rates contain an error", async () => {
    const error = new Error("kaboom");
    const mockedRatesWithError = mockedRates.map(rate => ({
      ...rate,
      error,
    }));
    mockedGetExchangeRates.mockResolvedValue(mockedRatesWithError);
    const { result, waitForNextUpdate } = renderHook(useProviderRates, {
      initialProps: baseInitalProps,
    });
    await waitForNextUpdate({ timeout: 1000 });
    expect(result.current.rates.status).toBe("error");
    expect(result.current.rates.error).toBe(error);
    expect(result.current.rates.value).toBeUndefined();
  });

  // FIXME: errors don't appear to be sorted by amount. Changing the amounts has no effect on the test passing or failing
  it("should sort SwapExchangeRateAmountTooLow based on amount", async () => {
    const swapExchangeRateAmountTooLowError1 = new SwapExchangeRateAmountTooLow(undefined, {
      amount: new BigNumber(1),
    });

    const swapExchangeRateAmountTooLowError2 = new SwapExchangeRateAmountTooLow(undefined, {
      amount: new BigNumber(2),
    });

    const swapExchangeRateAmountTooLowError3 = new SwapExchangeRateAmountTooLow(undefined, {
      amount: new BigNumber(2.5),
    });

    const swapExchangeRateAmountTooLowError4 = new SwapExchangeRateAmountTooLow(undefined, {
      amount: new BigNumber(0.5),
    });

    mockedRates[0].error = swapExchangeRateAmountTooLowError1;
    mockedRates[1].error = swapExchangeRateAmountTooLowError2;
    mockedRates[2].error = swapExchangeRateAmountTooLowError3;
    mockedRates[3].error = swapExchangeRateAmountTooLowError4;

    mockedGetExchangeRates.mockResolvedValue(mockedRates);
    const { result, waitForNextUpdate } = renderHook(useProviderRates, {
      initialProps: baseInitalProps,
    });
    await waitForNextUpdate({ timeout: 1000 });
    expect(result.current.rates.status).toBe("error");
    expect(result.current.rates.error).toStrictEqual(swapExchangeRateAmountTooLowError4);
    expect(result.current.rates.value).toBeUndefined();
  });

  it("should sort SwapExchangeRateAmountTooHigh based on amount", async () => {
    const swapExchangeRateAmountTooHighError1 = new SwapExchangeRateAmountTooHigh(undefined, {
      amount: new BigNumber(1),
    });

    const swapExchangeRateAmountTooHighError2 = new SwapExchangeRateAmountTooHigh(undefined, {
      amount: new BigNumber(2),
    });

    const swapExchangeRateAmountTooHighError3 = new SwapExchangeRateAmountTooHigh(undefined, {
      amount: new BigNumber(2.5),
    });

    const swapExchangeRateAmountTooHighError4 = new SwapExchangeRateAmountTooHigh(undefined, {
      amount: new BigNumber(0.5),
    });

    mockedRates[0].error = swapExchangeRateAmountTooHighError1;
    mockedRates[1].error = swapExchangeRateAmountTooHighError2;
    mockedRates[2].error = swapExchangeRateAmountTooHighError3;
    mockedRates[3].error = swapExchangeRateAmountTooHighError4;

    mockedGetExchangeRates.mockResolvedValue(mockedRates);
    const { result, waitForNextUpdate } = renderHook(useProviderRates, {
      initialProps: baseInitalProps,
    });
    await waitForNextUpdate({ timeout: 1000 });
    expect(result.current.rates.status).toBe("error");
    expect(result.current.rates.error).toBe(swapExchangeRateAmountTooHighError3);
    expect(result.current.rates.value).toBeUndefined();
  });

  it("SwapExchangeRateAmountTooLow should take precedence over standard errors", async () => {
    const swapExchangeRateAmountTooLowError = new SwapExchangeRateAmountTooLow(undefined, {
      amount: new BigNumber(1),
    });

    const standardError = new Error("Error");

    mockedRates[0].error = standardError;
    mockedRates[1].error = swapExchangeRateAmountTooLowError;
    mockedRates[2].error = standardError;
    mockedRates[3].error = standardError;

    mockedGetExchangeRates.mockResolvedValue(mockedRates);
    const { result, waitForNextUpdate } = renderHook(useProviderRates, {
      initialProps: baseInitalProps,
    });
    await waitForNextUpdate({ timeout: 1000 });
    expect(result.current.rates.status).toBe("error");
    expect(result.current.rates.error).toBe(swapExchangeRateAmountTooLowError);
    expect(result.current.rates.value).toBeUndefined();
  });

  it("SwapExchangeRateAmountTooHigh should take precedence over standard errors", async () => {
    const SwapExchangeRateAmountTooHighError = new SwapExchangeRateAmountTooHigh(undefined, {
      amount: new BigNumber(1),
    });

    const standardError = new Error("Error");

    mockedRates[0].error = standardError;
    mockedRates[1].error = SwapExchangeRateAmountTooHighError;
    mockedRates[2].error = standardError;
    mockedRates[3].error = standardError;

    mockedGetExchangeRates.mockResolvedValue(mockedRates);
    const { result, waitForNextUpdate } = renderHook(useProviderRates, {
      initialProps: baseInitalProps,
    });
    await waitForNextUpdate({ timeout: 1000 });
    expect(result.current.rates.status).toBe("error");
    expect(result.current.rates.error).toBe(SwapExchangeRateAmountTooHighError);
    expect(result.current.rates.value).toBeUndefined();
  });

  it("SwapExchangeRateAmountTooLowOrTooHigh should take precedence over SwapExchangeRateAmountTooLow", async () => {
    const swapExchangeRateAmountTooLowError = new SwapExchangeRateAmountTooLow(undefined, {
      amount: new BigNumber(1),
    });

    const swapExchangeRateAmountTooLowOrTooHighError = new SwapExchangeRateAmountTooLowOrTooHigh(
      undefined,
      {
        message: "",
      },
    ) as Error;

    mockedRates[0].error = swapExchangeRateAmountTooLowOrTooHighError;
    mockedRates[1].error = swapExchangeRateAmountTooLowError;

    mockedGetExchangeRates.mockResolvedValue(mockedRates);
    const { result, waitForNextUpdate } = renderHook(useProviderRates, {
      initialProps: baseInitalProps,
    });
    await waitForNextUpdate({ timeout: 1000 });
    expect(result.current.rates.status).toBe("error");
    expect(result.current.rates.error).toBe(swapExchangeRateAmountTooLowOrTooHighError);
    expect(result.current.rates.value).toBeUndefined();
  });

  it("should call 'onNoRates' if there are no rates returned by the server", async () => {
    const onNoRates = jest.fn(() => {});
    mockedGetExchangeRates.mockResolvedValue([]);

    const { result, waitForNextUpdate } = renderHook(useProviderRates, {
      initialProps: { ...baseInitalProps, onNoRates },
    });
    await waitForNextUpdate({ timeout: 1000 });
    expect(result.current.rates.value).toMatchObject([]);
    expect(result.current.rates.status).toBe("success");
    expect(onNoRates).toHaveBeenCalledTimes(1);
  });
});
