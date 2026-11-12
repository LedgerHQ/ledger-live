import { act, renderHook } from "@testing-library/react";
import {
  toAccountAssetPickerSources,
  usePickAccountAssets,
  type AccountAssetPickerFormatting,
} from "./usePickAccountAssets";

type Asset = Readonly<{
  currency: Readonly<{
    id: string;
    name: string;
    ticker: string;
    units: readonly [string];
  }>;
  account: Readonly<{ balance: Readonly<{ toNumber: () => number }> }>;
}>;

const bitcoin: Asset = {
  currency: { id: "bitcoin", name: "Bitcoin", ticker: "BTC", units: ["sat"] },
  account: { balance: { toNumber: () => 2 } },
};

const ethereum: Asset = {
  currency: { id: "ethereum", name: "Ethereum", ticker: "ETH", units: ["wei"] },
  account: { balance: { toNumber: () => 3 } },
};

type CalculateCountervalue = AccountAssetPickerFormatting<Asset>["calculateCountervalue"];

const noRates: CalculateCountervalue = () => null;

const ratesLoaded: CalculateCountervalue = currency => ({
  toNumber: () => (currency.id === "ethereum" ? 9_000 : 40_000),
});

const formatting = (
  calculateCountervalue: CalculateCountervalue,
): AccountAssetPickerFormatting<Asset> => ({
  locale: "en",
  discreet: false,
  counterValueUnit: "usd",
  calculateCountervalue,
  formatAmount: (unit, amount) => `${amount.toNumber()} ${unit}`,
});

describe("toAccountAssetPickerSources", () => {
  it("should format this account's balance and countervalue", () => {
    const [source] = toAccountAssetPickerSources(
      [bitcoin],
      formatting(() => ({ toNumber: () => 40_000 })),
    );

    expect(source).toEqual({
      item: bitcoin,
      sortValue: 40_000,
      row: {
        id: "bitcoin",
        ledgerId: "bitcoin",
        name: "Bitcoin",
        ticker: "BTC",
        cryptoAmount: "2 sat",
        countervalue: "40000 usd",
      },
    });
  });

  it("should omit the countervalue when the account has no rate", () => {
    const [source] = toAccountAssetPickerSources(
      [bitcoin],
      formatting(() => null),
    );

    expect(source?.sortValue).toBe(0);
    expect(source?.row.countervalue).toBeUndefined();
    expect(source?.row.cryptoAmount).toBe("2 sat");
  });
});

describe("usePickAccountAssets", () => {
  it("should pick the only asset without opening the picker", () => {
    const { result } = renderHook(() =>
      usePickAccountAssets<Asset>({ ...formatting(() => null), testID: "picker" }),
    );
    const onPicked = jest.fn();

    act(() => result.current.pickAsset([bitcoin], onPicked));

    expect(onPicked).toHaveBeenCalledWith(bitcoin);
    expect(result.current.pickerProps.open).toBe(false);
    expect(result.current.pickerProps.testID).toBe("picker");
  });

  it("should refresh countervalues and order when rates change while the picker is open", () => {
    const { result, rerender } = renderHook(
      ({ calculateCountervalue }) => usePickAccountAssets<Asset>(formatting(calculateCountervalue)),
      { initialProps: { calculateCountervalue: noRates } },
    );

    act(() => result.current.pickAsset([ethereum, bitcoin], jest.fn()));
    expect(result.current.pickerProps.rows.map(row => row.countervalue)).toEqual([
      undefined,
      undefined,
    ]);

    rerender({ calculateCountervalue: ratesLoaded });

    expect(result.current.pickerProps.open).toBe(true);
    expect(result.current.pickerProps.rows.map(row => [row.id, row.countervalue])).toEqual([
      ["bitcoin", "40000 usd"],
      ["ethereum", "9000 usd"],
    ]);
  });

  it("should leave the picker test id unset when none is given", () => {
    const { result } = renderHook(() => usePickAccountAssets<Asset>(formatting(() => null)));

    expect(result.current.pickerProps.testID).toBeUndefined();
  });
});
