/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { formatSponsoredFeeAmounts } from "./feeAmounts";
import { USDT_FEE_ASSET } from "./fixtures/usdt";
import { useSponsoredFeeAmounts } from "./useSponsoredFeeAmounts";

const TRX_UNIT = getCryptoCurrencyById("tron").units[0];
const USDT_UNIT = { name: "USDT", code: "USDT", magnitude: 6 };
const USD_UNIT = getFiatCurrencyByTicker("USD").units[0];
const QUOTE = { feeAsset: USDT_FEE_ASSET, value: 3_200_000n, originalValue: 6_430_000n };

type Params = Parameters<typeof useSponsoredFeeAmounts>[0];

const baseParams: Params = {
  quote: QUOTE,
  nativeUnit: TRX_UNIT,
  fiatUnit: USD_UNIT,
  savingsFiat: new BigNumber(92),
  sponsoredFeeFiat: new BigNumber(320),
  standardFeeFiat: new BigNumber(412),
  locale: "en",
};

const render = (overrides: Partial<Params> = {}) =>
  renderHook(() => useSponsoredFeeAmounts({ ...baseParams, ...overrides }));

describe("useSponsoredFeeAmounts", () => {
  it("prices the sponsored fee in the fee asset's unit and the standard fee in the account's", () => {
    const { result } = render();

    expect(result.current.sponsoredFeeAmounts).toEqual(
      formatSponsoredFeeAmounts({
        quote: QUOTE,
        feeUnit: USDT_UNIT,
        nativeUnit: TRX_UNIT,
        fiatUnit: USD_UNIT,
        sponsoredFeeFiat: new BigNumber(320),
        standardFeeFiat: new BigNumber(412),
        locale: "en",
      }),
    );
  });

  it.each([
    ["no quote", { quote: null }],
    ["no account unit", { nativeUnit: null }],
  ])("has no fee amounts with %s", (_, overrides) => {
    const { result } = render(overrides);

    expect(result.current.sponsoredFeeAmounts).toBeNull();
  });

  it("formats a positive saving in the countervalue", () => {
    const { result } = render();

    expect(result.current.savingsFiatFormatted).toBe("$0.92");
  });

  it.each([
    ["zero", new BigNumber(0)],
    ["missing", null],
  ])("hides a saving that is %s", (_, savingsFiat) => {
    const { result } = render({ savingsFiat });

    expect(result.current.savingsFiatFormatted).toBeNull();
  });
});
