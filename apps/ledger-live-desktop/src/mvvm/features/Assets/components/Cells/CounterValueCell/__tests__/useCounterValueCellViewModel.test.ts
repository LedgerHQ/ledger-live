import { renderHook } from "tests/testSetup";
import { useCounterValueCellViewModel } from "../useCounterValueCellViewModel";
import { formatCurrencyUnit, getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
import { useCalculate } from "@ledgerhq/live-countervalues-react";

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/currencies/index"),
  formatCurrencyUnit: jest.fn(),
}));

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculate: jest.fn(),
}));

const mockedFormatCurrencyUnit = jest.mocked(formatCurrencyUnit);
const mockedUseCalculate = jest.mocked(useCalculate);

const mockCurrency = getCryptoCurrencyById("bitcoin");

const initialState = {
  settings: { counterValue: "USD", locale: "en-US", discreetMode: false },
};

describe("useCounterValueCellViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseCalculate.mockReturnValue(5000000);
    mockedFormatCurrencyUnit.mockReturnValue("$50,000.00");
  });

  it("should return formatted counter value when calculation succeeds", () => {
    const { result } = renderHook(() => useCounterValueCellViewModel(mockCurrency, 150000000), {
      initialState,
    });

    expect(result.current.formattedCounterValue).toBe("$50,000.00");
  });

  it("should call useCalculate with correct parameters", () => {
    renderHook(() => useCounterValueCellViewModel(mockCurrency, 150000000), {
      initialState,
    });

    expect(mockedUseCalculate).toHaveBeenCalledWith(
      expect.objectContaining({
        from: mockCurrency,
        value: 150000000,
        disableRounding: true,
      }),
    );
  });

  it("should call formatCurrencyUnit with locale and discreet mode", () => {
    renderHook(() => useCounterValueCellViewModel(mockCurrency, 150000000), {
      initialState,
    });

    expect(mockedFormatCurrencyUnit).toHaveBeenCalledWith(
      expect.anything(),
      new BigNumber(5000000),
      { showCode: true, locale: "en-US", discreet: false },
    );
  });

  it("should pass discreet mode to formatCurrencyUnit when enabled", () => {
    mockedFormatCurrencyUnit.mockReturnValue("***");

    const { result } = renderHook(() => useCounterValueCellViewModel(mockCurrency, 150000000), {
      initialState: { settings: { counterValue: "USD", locale: "fr-FR", discreetMode: true } },
    });

    expect(mockedFormatCurrencyUnit).toHaveBeenCalledWith(
      expect.anything(),
      new BigNumber(5000000),
      { showCode: true, locale: "fr-FR", discreet: true },
    );
    expect(result.current.formattedCounterValue).toBe("***");
  });

  it("should return '-' when counterValue is undefined", () => {
    mockedUseCalculate.mockReturnValue(undefined);

    const { result } = renderHook(() => useCounterValueCellViewModel(mockCurrency, 150000000), {
      initialState,
    });

    expect(result.current.formattedCounterValue).toBe("-");
    expect(mockedFormatCurrencyUnit).not.toHaveBeenCalled();
  });

  it("should return '-' when counterValue is null", () => {
    mockedUseCalculate.mockReturnValue(null);

    const { result } = renderHook(() => useCounterValueCellViewModel(mockCurrency, 150000000), {
      initialState,
    });

    expect(result.current.formattedCounterValue).toBe("-");
    expect(mockedFormatCurrencyUnit).not.toHaveBeenCalled();
  });
});
