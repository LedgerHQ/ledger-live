/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { BigNumber } from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { SponsoredCoinApi } from "../../../bridge/generic-coin-framework/sponsored";
import { USDT_CONTRACT, USDT_FEE_ASSET as USDT_ASSET } from "./fixtures/usdt";
import { useSponsoredFeeQuote } from "./useSponsoredFeeQuote";

// Fiat is 1:1 with the asset's main unit so the expectations read as plain amounts.
jest.mock("@features/platform-market-countervalues", () => ({
  useCalculateCountervalueCallback:
    () => (from: { units: { magnitude: number }[] }, value: BigNumber) =>
      value.shiftedBy(-from.units[0].magnitude),
}));

const usdtAccount = {
  type: "TokenAccount",
  id: "usdt",
  token: { contractAddress: USDT_CONTRACT, units: [{ name: "USDT", code: "USDT", magnitude: 6 }] },
} as unknown as TokenAccount;

const mainAccount: Account = {
  ...genAccount("tron", { currency: getCryptoCurrencyById("tron") }),
  subAccounts: [usdtAccount],
};

const counterValueCurrency = getCryptoCurrencyById("bitcoin");

const makeSeam = (overrides: Partial<Record<keyof SponsoredCoinApi, unknown>> = {}) =>
  ({
    feeOptionId: "sponsored",
    listFeeOptions: jest.fn().mockResolvedValue([{ id: "sponsored", feeAsset: USDT_ASSET }]),
    estimateSponsoredFeeQuote: jest.fn().mockResolvedValue({
      feeAsset: USDT_ASSET,
      value: 3_200_000n,
      originalValue: 13_000_000n,
    }),
    ...overrides,
  }) as unknown as SponsoredCoinApi;

const intent = { type: "send" };

const render = (seam: SponsoredCoinApi | null, initialIntent: unknown = intent, refresh = false) =>
  renderHook(
    ({ currentIntent }) =>
      useSponsoredFeeQuote({
        mainAccount,
        seam,
        intent: currentIntent,
        refresh,
        counterValueCurrency,
      }),
    { initialProps: { currentIntent: initialIntent } },
  );

const quoteOf = (value: bigint) => ({ feeAsset: USDT_ASSET, value, originalValue: 13_000_000n });

describe("useSponsoredFeeQuote", () => {
  it("is unavailable without a seam", () => {
    const { result } = render(null);

    expect(result.current.available).toBe(false);
    expect(result.current.quote).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("quotes the sponsored fee and prices both fees and the saving", async () => {
    const { result } = render(makeSeam());

    await waitFor(() => expect(result.current.quote).not.toBeNull());
    expect(result.current.available).toBe(true);
    expect(result.current.feeAsset).toBe(USDT_ASSET);
    expect(result.current.feeTokenAccount).toBe(usdtAccount);
    expect(result.current.feeCurrencyTicker).toBe("USDT");
    expect(result.current.sponsoredFeeFiat?.toString()).toBe("3.2");
    expect(result.current.standardFeeFiat?.toString()).toBe("13");
    expect(result.current.savingsFiat?.toString()).toBe("9.8");
    expect(result.current.loading).toBe(false);
  });

  it("reports no saving when the sponsored fee costs more", async () => {
    const seam = makeSeam({
      estimateSponsoredFeeQuote: jest.fn().mockResolvedValue({
        feeAsset: USDT_ASSET,
        value: 20_000_000n,
        originalValue: 13_000_000n,
      }),
    });
    const { result } = render(seam);

    await waitFor(() => expect(result.current.quote).not.toBeNull());
    expect(result.current.savingsFiat).toBeNull();
  });

  it("keeps the option available while the intent rebuilds", async () => {
    const { result, rerender } = render(makeSeam());
    await waitFor(() => expect(result.current.quote).not.toBeNull());

    rerender({ currentIntent: null });

    expect(result.current.available).toBe(true);
    expect(result.current.quote).toBeNull();
  });

  it("withdraws the option when the intent build fails", async () => {
    const seam = makeSeam();
    const { result, rerender } = renderHook(
      ({ intentFailed }) =>
        useSponsoredFeeQuote({
          mainAccount,
          seam,
          intent: null,
          intentFailed,
          refresh: false,
          counterValueCurrency,
        }),
      { initialProps: { intentFailed: false } },
    );
    rerender({ intentFailed: true });

    expect(result.current.available).toBe(false);
    expect(seam.listFeeOptions).not.toHaveBeenCalled();
  });

  it("keeps the newest intent's quote when an older one resolves last", async () => {
    let resolveOld: (value: unknown) => void = () => undefined;
    const listFeeOptions = jest
      .fn()
      .mockImplementationOnce(() => new Promise(resolve => (resolveOld = resolve)))
      .mockResolvedValue([{ id: "sponsored", feeAsset: USDT_ASSET }]);
    const estimateSponsoredFeeQuote = jest
      .fn()
      .mockResolvedValue({ feeAsset: USDT_ASSET, value: 1_000_000n, originalValue: 13_000_000n });
    const { result, rerender } = render(makeSeam({ listFeeOptions, estimateSponsoredFeeQuote }));

    rerender({ currentIntent: { type: "send", amount: 2 } });
    await waitFor(() => expect(result.current.quote?.value).toBe(1_000_000n));
    await act(async () => resolveOld([{ id: "sponsored", feeAsset: USDT_ASSET }]));

    expect(estimateSponsoredFeeQuote).toHaveBeenCalledTimes(1);
    expect(result.current.quote?.value).toBe(1_000_000n);
  });

  it("is unavailable when the seam doesn't list the option", async () => {
    const seam = makeSeam({ listFeeOptions: jest.fn().mockResolvedValue([]) });
    const { result } = render(seam);

    await waitFor(() => expect(seam.listFeeOptions).toHaveBeenCalled());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.available).toBe(false);
    expect(seam.estimateSponsoredFeeQuote).not.toHaveBeenCalled();
  });

  it.each([
    ["listing the options", { listFeeOptions: jest.fn().mockRejectedValue(new Error("down")) }],
    ["quoting", { estimateSponsoredFeeQuote: jest.fn().mockRejectedValue(new Error("down")) }],
  ])("withdraws the option when %s fails", async (_label, overrides) => {
    const { result } = render(makeSeam(overrides));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.available).toBe(false);
    expect(result.current.feeAsset).toBeNull();
    expect(result.current.quote).toBeNull();
  });

  describe("refresh", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it("re-quotes every 30 s, keeping the last quote until the next one lands", async () => {
      let resolveRefresh: (value: unknown) => void = () => undefined;
      const estimateSponsoredFeeQuote = jest
        .fn()
        .mockResolvedValueOnce(quoteOf(3_200_000n))
        .mockImplementationOnce(() => new Promise(resolve => (resolveRefresh = resolve)));
      const { result } = render(makeSeam({ estimateSponsoredFeeQuote }), intent, true);
      await waitFor(() => expect(result.current.quote?.value).toBe(3_200_000n));

      await act(async () => {
        jest.advanceTimersByTime(30_000);
      });
      expect(estimateSponsoredFeeQuote).toHaveBeenCalledTimes(2);
      expect(result.current.quote?.value).toBe(3_200_000n);
      expect(result.current.loading).toBe(false);

      await act(async () => resolveRefresh(quoteOf(3_300_000n)));
      expect(result.current.quote?.value).toBe(3_300_000n);
    });

    it("waits for a slow refresh before re-quoting, so an older price never lands last", async () => {
      let resolveRefresh: (value: unknown) => void = () => undefined;
      const estimateSponsoredFeeQuote = jest
        .fn()
        .mockResolvedValueOnce(quoteOf(3_200_000n))
        .mockImplementationOnce(() => new Promise(resolve => (resolveRefresh = resolve)))
        .mockResolvedValue(quoteOf(3_400_000n));
      const { result } = render(makeSeam({ estimateSponsoredFeeQuote }), intent, true);
      await waitFor(() => expect(result.current.quote?.value).toBe(3_200_000n));

      await act(async () => {
        jest.advanceTimersByTime(60_000);
      });
      expect(estimateSponsoredFeeQuote).toHaveBeenCalledTimes(2);

      await act(async () => resolveRefresh(quoteOf(3_300_000n)));
      expect(result.current.quote?.value).toBe(3_300_000n);

      await act(async () => {
        jest.advanceTimersByTime(30_000);
      });
      expect(estimateSponsoredFeeQuote).toHaveBeenCalledTimes(3);
      await waitFor(() => expect(result.current.quote?.value).toBe(3_400_000n));
    });

    it("keeps the last quote when a refresh fails", async () => {
      const estimateSponsoredFeeQuote = jest
        .fn()
        .mockResolvedValueOnce(quoteOf(3_200_000n))
        .mockRejectedValueOnce(new Error("down"));
      const { result } = render(makeSeam({ estimateSponsoredFeeQuote }), intent, true);
      await waitFor(() => expect(result.current.quote?.value).toBe(3_200_000n));

      await act(async () => {
        jest.advanceTimersByTime(30_000);
      });

      expect(estimateSponsoredFeeQuote).toHaveBeenCalledTimes(2);
      expect(result.current.available).toBe(true);
      expect(result.current.quote?.value).toBe(3_200_000n);
    });

    it("does not re-quote unless asked to", async () => {
      const seam = makeSeam();
      const { result } = render(seam);
      await waitFor(() => expect(result.current.quote).not.toBeNull());

      await act(async () => {
        jest.advanceTimersByTime(60_000);
      });

      expect(seam.estimateSponsoredFeeQuote).toHaveBeenCalledTimes(1);
    });
  });
});
