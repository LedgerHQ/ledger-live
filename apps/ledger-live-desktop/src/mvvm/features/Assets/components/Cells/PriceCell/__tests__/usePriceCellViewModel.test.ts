import { renderHook } from "tests/testSetup";
import { usePriceCellViewModel } from "../usePriceCellViewModel";
import {
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
} from "@ledgerhq/live-common/currencies/index";
import { formatPrice } from "@ledgerhq/live-currency-format";
import { usePrice } from "~/renderer/hooks/usePrice";
import { BigNumber } from "bignumber.js";

jest.mock("@ledgerhq/live-currency-format", () => ({
  ...jest.requireActual("@ledgerhq/live-currency-format"),
  formatPrice: jest.fn(),
}));

jest.mock("~/renderer/hooks/usePrice");

const mockedFormatPrice = jest.mocked(formatPrice);
const mockedUsePrice = jest.mocked(usePrice);

const mockCurrency = getCryptoCurrencyById("bitcoin");
const mockCounterValueCurrency = getFiatCurrencyByTicker("USD");

const usdUnit = mockCounterValueCurrency.units[0];
const usdMagnitude = usdUnit.magnitude;

const atoms = (fiat: number): BigNumber => new BigNumber(fiat).times(10 ** usdMagnitude);

const mockUsePriceReturn = (counterValue: BigNumber | undefined) => ({
  counterValue,
  counterValueCurrency: mockCounterValueCurrency,
  effectiveUnit: mockCurrency.units[0],
  valueNum: 100000000,
});

describe("usePriceCellViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUsePrice.mockReturnValue(mockUsePriceReturn(atoms(50_000)));
    mockedFormatPrice.mockReturnValue("$50,000.00");
  });

  it("prefers marketPrice over counterValue when both are available", () => {
    mockedUsePrice.mockReturnValue(mockUsePriceReturn(atoms(50_000)));
    mockedFormatPrice.mockReturnValue("$43,000.00");

    const { result } = renderHook(() => usePriceCellViewModel(mockCurrency, 43_000));

    expect(result.current.formattedPrice).toBe("$43,000.00");
    expect(mockedFormatPrice).toHaveBeenCalledWith(
      usdUnit,
      atoms(43_000),
      expect.objectContaining({ showCode: true }),
    );
  });

  it("formats a sub-dollar marketPrice", () => {
    mockedFormatPrice.mockReturnValue("$0.07");

    const { result } = renderHook(() => usePriceCellViewModel(mockCurrency, 0.07));

    expect(result.current.formattedPrice).toBe("$0.07");
    expect(mockedFormatPrice).toHaveBeenCalledWith(
      usdUnit,
      atoms(0.07),
      expect.objectContaining({ showCode: true }),
    );
  });

  it("falls back to counterValue when marketPrice is undefined", () => {
    const { result } = renderHook(() => usePriceCellViewModel(mockCurrency));

    expect(result.current.formattedPrice).toBe("$50,000.00");
    expect(mockedFormatPrice).toHaveBeenCalledWith(
      usdUnit,
      atoms(50_000),
      expect.objectContaining({ showCode: true }),
    );
  });

  it("returns '-' when neither marketPrice nor counterValue is available", () => {
    mockedUsePrice.mockReturnValue(mockUsePriceReturn(undefined));

    const { result } = renderHook(() => usePriceCellViewModel(mockCurrency));

    expect(result.current.formattedPrice).toBe("-");
    expect(mockedFormatPrice).not.toHaveBeenCalled();
  });
});
