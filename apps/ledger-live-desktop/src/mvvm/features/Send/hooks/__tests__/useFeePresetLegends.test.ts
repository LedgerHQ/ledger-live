/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { renderHook } from "tests/testSetup";
import type { CryptoCurrency, CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getSendDescriptor } from "@ledgerhq/live-common/bridge/descriptor/registry";
import type { SendDescriptor } from "@ledgerhq/live-common/bridge/descriptor/types";
import { useFeePresetLegends } from "../useFeePresetLegends";
import type { FeePresetOption } from "../useFeePresetOptions";

jest.mock("@ledgerhq/live-common/bridge/descriptor/registry", () => ({
  getSendDescriptor: jest.fn(),
}));

const mockedGetSendDescriptor = jest.mocked(getSendDescriptor);

const currency = {
  type: "CryptoCurrency",
  id: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  units: [{ code: "BTC", magnitude: 8, name: "BTC" }],
} as unknown as CryptoCurrency;

const litecoin = {
  type: "CryptoCurrency",
  id: "litecoin",
  name: "Litecoin",
  ticker: "LTC",
  units: [
    { code: "LTC", magnitude: 8, name: "Litecoin" },
    { code: "litoshi", magnitude: 0, name: "litoshi" },
  ],
} as unknown as CryptoCurrency;

describe("useFeePresetLegends", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns fee rate legends when descriptor config is feeRate from presetAmount", () => {
    mockedGetSendDescriptor.mockReturnValue({
      fees: {
        hasPresets: true,
        hasCustom: false,
        presets: {
          legend: { type: "feeRate", unit: "sat/vbyte", valueFrom: "presetAmount" },
        },
      },
      inputs: {},
    } as unknown as SendDescriptor);

    const feePresetOptions = [
      { id: "slow", amount: new BigNumber(2.9) },
      { id: "medium", amount: new BigNumber(5) },
      { id: "invalid", amount: new BigNumber(NaN) },
    ] satisfies readonly FeePresetOption[];

    const { result } = renderHook(() => useFeePresetLegends({ currency, feePresetOptions }));

    expect(result.current).toEqual({
      slow: "2 sat/vbyte",
      medium: "5 sat/vbyte",
    });
  });

  it("resolves fee rate unit from currency when descriptor provides a unit resolver", () => {
    mockedGetSendDescriptor.mockReturnValue({
      fees: {
        hasPresets: true,
        hasCustom: false,
        presets: {
          legend: {
            type: "feeRate",
            unit: (selectedCurrency: CryptoOrTokenCurrency) =>
              `${selectedCurrency.units.find(unit => unit.magnitude === 0)?.code}/vbyte`,
            valueFrom: "presetAmount",
          },
        },
      },
      inputs: {},
    } as unknown as SendDescriptor);

    const feePresetOptions = [
      { id: "slow", amount: new BigNumber(2) },
    ] satisfies readonly FeePresetOption[];

    const { result } = renderHook(() =>
      useFeePresetLegends({ currency: litecoin, feePresetOptions }),
    );

    expect(result.current).toEqual({
      slow: "2 litoshi/vbyte",
    });
  });

  it("returns empty map when descriptor has no legend config", () => {
    mockedGetSendDescriptor.mockReturnValue({
      fees: { hasPresets: true, hasCustom: false },
      inputs: {},
    } as unknown as SendDescriptor);

    const feePresetOptions = [
      { id: "slow", amount: new BigNumber(2) },
    ] satisfies readonly FeePresetOption[];
    const { result } = renderHook(() => useFeePresetLegends({ currency, feePresetOptions }));

    expect(result.current).toEqual({});
  });
});
