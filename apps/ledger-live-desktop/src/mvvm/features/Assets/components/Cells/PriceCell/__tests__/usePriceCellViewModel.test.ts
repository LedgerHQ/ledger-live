import { renderHook } from "tests/testSetup";
import { usePriceCellViewModel } from "../usePriceCellViewModel";
import {
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
} from "@ledgerhq/live-common/currencies/index";
import { formatFiatPrice } from "LLD/utils/fiatPriceFormat";
import { usePrice } from "~/renderer/hooks/usePrice";
import { BigNumber } from "bignumber.js";

jest.mock("LLD/utils/fiatPriceFormat", () => ({
  ...jest.requireActual("LLD/utils/fiatPriceFormat"),
  formatFiatPrice: jest.fn(),
}));

jest.mock("~/renderer/hooks/usePrice");

const mockedFormatFiatPrice = jest.mocked(formatFiatPrice);
const mockedUsePrice = jest.mocked(usePrice);

const mockCurrency = getCryptoCurrencyById("bitcoin");
const mockCounterValueCurrency = getFiatCurrencyByTicker("USD");

const usdMagnitude = mockCounterValueCurrency.units[0].magnitude;

const mockUsePriceReturn = (counterValue: BigNumber | undefined) => ({
  counterValue,
  counterValueCurrency: mockCounterValueCurrency,
  effectiveUnit: mockCurrency.units[0],
  valueNum: 100000000,
});

describe("usePriceCellViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUsePrice.mockReturnValue(mockUsePriceReturn(new BigNumber(50000)));
    mockedFormatFiatPrice.mockReturnValue("$50,000.00");
  });

  it("should return formatted price when counterValue is valid", () => {
    const { result } = renderHook(() => usePriceCellViewModel(mockCurrency));

    expect(result.current.formattedPrice).toBe("$50,000.00");
  });

  it("should return '-' when counterValue is undefined", () => {
    mockedUsePrice.mockReturnValue(mockUsePriceReturn(undefined));

    const { result } = renderHook(() => usePriceCellViewModel(mockCurrency));

    expect(result.current.formattedPrice).toBe("-");
    expect(mockedFormatFiatPrice).not.toHaveBeenCalled();
  });

  it("delegates rounding policy to formatFiatPrice (high-value counterValue)", () => {
    renderHook(() => usePriceCellViewModel(mockCurrency));

    expect(mockedFormatFiatPrice).toHaveBeenCalledWith(
      mockCounterValueCurrency.units[0],
      new BigNumber(50000),
      { showCode: true },
    );
  });

  it("delegates rounding policy to formatFiatPrice (sub-dollar counterValue)", () => {
    mockedUsePrice.mockReturnValue(mockUsePriceReturn(new BigNumber(0.5)));

    renderHook(() => usePriceCellViewModel(mockCurrency));

    expect(mockedFormatFiatPrice).toHaveBeenCalledWith(
      mockCounterValueCurrency.units[0],
      new BigNumber(0.5),
      { showCode: true },
    );
  });

  it("should fall back to placeholderPrice (high value) when counterValue is undefined", () => {
    mockedUsePrice.mockReturnValue(mockUsePriceReturn(undefined));
    mockedFormatFiatPrice.mockReturnValue("USD 43,000.00");

    const { result } = renderHook(() => usePriceCellViewModel(mockCurrency, 43000));

    expect(result.current.formattedPrice).toBe("USD 43,000.00");
    const expectedValue = new BigNumber(43000).times(10 ** usdMagnitude);
    expect(mockedFormatFiatPrice).toHaveBeenCalledWith(
      mockCounterValueCurrency.units[0],
      expectedValue,
      { showCode: true },
    );
  });

  it("should fall back to placeholderPrice for small values when counterValue is undefined", () => {
    mockedUsePrice.mockReturnValue(mockUsePriceReturn(undefined));
    mockedFormatFiatPrice.mockReturnValue("USD 0.07");

    const { result } = renderHook(() => usePriceCellViewModel(mockCurrency, 0.07));

    expect(result.current.formattedPrice).toBe("USD 0.07");
    const expectedValue = new BigNumber(0.07).times(10 ** usdMagnitude);
    expect(mockedFormatFiatPrice).toHaveBeenCalledWith(
      mockCounterValueCurrency.units[0],
      expectedValue,
      { showCode: true },
    );
  });

  it("forwards micro-cap counterValues to formatFiatPrice (e.g. 0.000591 cents = $0.00000591)", () => {
    mockedUsePrice.mockReturnValue(mockUsePriceReturn(new BigNumber(0.000591)));

    renderHook(() => usePriceCellViewModel(mockCurrency));

    expect(mockedFormatFiatPrice).toHaveBeenCalledWith(
      mockCounterValueCurrency.units[0],
      new BigNumber(0.000591),
      { showCode: true },
    );
  });

  it("should use counterValue over placeholderPrice when both are available", () => {
    mockedUsePrice.mockReturnValue(mockUsePriceReturn(new BigNumber(50000)));
    mockedFormatFiatPrice.mockReturnValue("$50,000.00");

    const { result } = renderHook(() => usePriceCellViewModel(mockCurrency, 43000));

    expect(result.current.formattedPrice).toBe("$50,000.00");
    expect(mockedFormatFiatPrice).toHaveBeenCalledWith(
      mockCounterValueCurrency.units[0],
      new BigNumber(50000),
      expect.objectContaining({ showCode: true }),
    );
  });
});
