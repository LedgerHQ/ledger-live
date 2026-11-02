import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { formatFeeCurrencyAmount } from "../utils/networkFeesDisplay";
import { formatSponsoredFeeAmounts } from "./feeAmounts";
import { USDT_FEE_ASSET } from "./fixtures/usdt";

const TRX_UNIT = getCryptoCurrencyById("tron").units[0];
const USDT_UNIT = { name: "USDT", code: "USDT", magnitude: 6 };
const USD_UNIT = getFiatCurrencyByTicker("USD").units[0];
const QUOTE = { feeAsset: USDT_FEE_ASSET, value: 3_200_000n, originalValue: 6_430_000n };

const format = (sponsoredFeeFiat: BigNumber | null, standardFeeFiat: BigNumber | null) =>
  formatSponsoredFeeAmounts({
    quote: QUOTE,
    feeUnit: USDT_UNIT,
    nativeUnit: TRX_UNIT,
    fiatUnit: USD_UNIT,
    sponsoredFeeFiat,
    standardFeeFiat,
    locale: "en",
  });

describe("formatSponsoredFeeAmounts", () => {
  it("leads each option with its fiat fee, striking the standard one on the cheaper sponsored fee", () => {
    const standardFiat = formatFeeCurrencyAmount(USD_UNIT, new BigNumber(412), "en");

    expect(format(new BigNumber(320), new BigNumber(412))).toEqual({
      sponsored: {
        value: formatFeeCurrencyAmount(USD_UNIT, new BigNumber(320), "en"),
        secondaryValue: "3.2 USDT",
        originalValue: standardFiat,
      },
      standard: { value: standardFiat, secondaryValue: "6.43 TRX" },
    });
  });

  it("strikes nothing when the sponsored fee saves no fiat", () => {
    expect(format(new BigNumber(412), new BigNumber(412)).sponsored.originalValue).toBeNull();
  });

  it.each([
    ["there is no rate", null, null],
    ["only the standard fee has a rate", null, new BigNumber(412)],
    ["only the sponsored fee has a rate", new BigNumber(320), null],
  ])("strikes nothing when %s", (_, sponsoredFeeFiat, standardFeeFiat) => {
    expect(format(sponsoredFeeFiat, standardFeeFiat).sponsored.originalValue).toBeNull();
  });

  it("shows only the amount in its own unit when there is no rate", () => {
    expect(format(null, null)).toEqual({
      sponsored: { value: "3.2 USDT", secondaryValue: null, originalValue: null },
      standard: { value: "6.43 TRX", secondaryValue: null },
    });
  });
});
