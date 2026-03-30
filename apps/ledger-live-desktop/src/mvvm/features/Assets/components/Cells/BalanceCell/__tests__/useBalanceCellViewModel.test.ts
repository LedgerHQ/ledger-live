import { renderHook } from "tests/testSetup";
import { useBalanceCellViewModel } from "../useBalanceCellViewModel";
import { formatCurrencyUnit, getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/currencies/index"),
  formatCurrencyUnit: jest.fn(),
}));

const mockedFormatCurrencyUnit = jest.mocked(formatCurrencyUnit);

const mockCurrency = getCryptoCurrencyById("bitcoin");

describe("useBalanceCellViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFormatCurrencyUnit.mockReturnValue("1.5 BTC");
  });

  it("should return formatted balance", () => {
    const { result } = renderHook(() => useBalanceCellViewModel(mockCurrency, 150000000), {
      initialState: { settings: { locale: "en-US", discreetMode: false } },
    });

    expect(result.current.formattedBalance).toBe("1.5 BTC");
  });

  it("should call formatCurrencyUnit with locale and discreet mode", () => {
    renderHook(() => useBalanceCellViewModel(mockCurrency, 150000000), {
      initialState: { settings: { locale: "en-US", discreetMode: false } },
    });

    expect(mockedFormatCurrencyUnit).toHaveBeenCalledWith(
      mockCurrency.units[0],
      new BigNumber(150000000),
      { showCode: true, locale: "en-US", discreet: false },
    );
  });

  it("should pass discreet mode to formatCurrencyUnit when enabled", () => {
    mockedFormatCurrencyUnit.mockReturnValue("***");

    const { result } = renderHook(() => useBalanceCellViewModel(mockCurrency, 150000000), {
      initialState: { settings: { locale: "fr-FR", discreetMode: true } },
    });

    expect(mockedFormatCurrencyUnit).toHaveBeenCalledWith(
      mockCurrency.units[0],
      new BigNumber(150000000),
      { showCode: true, locale: "fr-FR", discreet: true },
    );
    expect(result.current.formattedBalance).toBe("***");
  });
});
