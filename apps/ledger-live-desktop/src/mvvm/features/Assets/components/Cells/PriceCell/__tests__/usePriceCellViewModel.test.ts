import { renderHook } from "tests/testSetup";
import { usePriceCellViewModel } from "../usePriceCellViewModel";
import {
  formatCurrencyUnit,
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
} from "@ledgerhq/live-common/currencies/index";
import { usePrice } from "~/renderer/hooks/usePrice";
import { BigNumber } from "bignumber.js";

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/currencies/index"),
  formatCurrencyUnit: jest.fn(),
}));

jest.mock("~/renderer/hooks/usePrice");

const mockedFormatCurrencyUnit = jest.mocked(formatCurrencyUnit);
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
    mockedFormatCurrencyUnit.mockReturnValue("$50,000.00");
  });

  it("should return formatted price when counterValue is valid", () => {
    const { result } = renderHook(() => usePriceCellViewModel(mockCurrency));

    expect(result.current.formattedPrice).toBe("$50,000.00");
  });

  it("should return '-' when counterValue is undefined", () => {
    mockedUsePrice.mockReturnValue(mockUsePriceReturn(undefined));

    const { result } = renderHook(() => usePriceCellViewModel(mockCurrency));

    expect(result.current.formattedPrice).toBe("-");
    expect(mockedFormatCurrencyUnit).not.toHaveBeenCalled();
  });

  it("should use subMagnitude 0 and no disableRounding when price >= 1", () => {
    renderHook(() => usePriceCellViewModel(mockCurrency));

    expect(mockedFormatCurrencyUnit).toHaveBeenCalledWith(
      mockCounterValueCurrency.units[0],
      new BigNumber(50000),
      { showCode: true, disableRounding: false, subMagnitude: 0 },
    );
  });

  it("should use subMagnitude 1 and disableRounding when price < 1", () => {
    mockedUsePrice.mockReturnValue(mockUsePriceReturn(new BigNumber(0.5)));

    renderHook(() => usePriceCellViewModel(mockCurrency));

    expect(mockedFormatCurrencyUnit).toHaveBeenCalledWith(
      mockCounterValueCurrency.units[0],
      new BigNumber(0.5),
      { showCode: true, disableRounding: true, subMagnitude: 1 },
    );
  });

  it("should format placeholderPrice when provided with a high value", () => {
    mockedFormatCurrencyUnit.mockReturnValue("USD 43,000.00");

    const { result } = renderHook(() => usePriceCellViewModel(mockCurrency, 43000));

    expect(result.current.formattedPrice).toBe("USD 43,000.00");
    const expectedValue = new BigNumber(43000).times(10 ** usdMagnitude);
    expect(mockedFormatCurrencyUnit).toHaveBeenCalledWith(
      mockCounterValueCurrency.units[0],
      expectedValue,
      { showCode: true, disableRounding: false, subMagnitude: 0 },
    );
  });

  it("should format placeholderPrice with subMagnitude for small values", () => {
    mockedFormatCurrencyUnit.mockReturnValue("USD 0.07");

    const { result } = renderHook(() => usePriceCellViewModel(mockCurrency, 0.07));

    expect(result.current.formattedPrice).toBe("USD 0.07");
    const expectedValue = new BigNumber(0.07).times(10 ** usdMagnitude);
    expect(mockedFormatCurrencyUnit).toHaveBeenCalledWith(
      mockCounterValueCurrency.units[0],
      expectedValue,
      { showCode: true, disableRounding: true, subMagnitude: 1 },
    );
  });

  it("should use placeholderPrice over counterValue when both are available", () => {
    mockedUsePrice.mockReturnValue(mockUsePriceReturn(new BigNumber(50000)));
    mockedFormatCurrencyUnit.mockReturnValue("USD 43,000.00");

    const { result } = renderHook(() => usePriceCellViewModel(mockCurrency, 43000));

    expect(result.current.formattedPrice).toBe("USD 43,000.00");
    const expectedValue = new BigNumber(43000).times(10 ** usdMagnitude);
    expect(mockedFormatCurrencyUnit).toHaveBeenCalledWith(
      mockCounterValueCurrency.units[0],
      expectedValue,
      expect.objectContaining({ showCode: true }),
    );
  });
});
