import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
import { renderHook } from "tests/testSetup";
import { useCryptoBalanceTextViewModel } from "../useCryptoBalanceTextViewModel";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/currencies/index"),
  formatCurrencyUnitFragment: jest.fn(),
}));

const mockedFormatCurrencyUnitFragment = jest.mocked(formatCurrencyUnitFragment);

const initialState = {
  settings: { locale: "en-US", discreetMode: false },
};

describe("useCryptoBalanceTextViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses currency text as prefix when position is start", () => {
    mockedFormatCurrencyUnitFragment.mockReturnValue({
      currencyPosition: "start",
      currencyText: "€",
      integerPart: "1",
      decimalSeparator: ".",
      decimalPart: "00",
    });

    const { result } = renderHook(
      () => useCryptoBalanceTextViewModel({ amount: 1, cryptoUnit: BTC_ACCOUNT.currency.units[0] }),
      { initialState },
    );

    expect(result.current.prefixSymbol).toBe("€");
    expect(result.current.suffixSymbol).toBeNull();
  });

  it("uses currency text as suffix when position is end", () => {
    mockedFormatCurrencyUnitFragment.mockReturnValue({
      currencyPosition: "end",
      currencyText: "BTC",
      integerPart: "0",
      decimalSeparator: ".",
      decimalPart: "",
    });

    const { result } = renderHook(
      () => useCryptoBalanceTextViewModel({ amount: 0, cryptoUnit: BTC_ACCOUNT.currency.units[0] }),
      { initialState },
    );

    expect(result.current.suffixSymbol).toBe("BTC");
    expect(result.current.prefixSymbol).toBeNull();
  });

  it("drops symbol when currencyText is empty", () => {
    mockedFormatCurrencyUnitFragment.mockReturnValue({
      currencyPosition: "end",
      currencyText: "",
      integerPart: "1",
      decimalSeparator: ".",
      decimalPart: "",
    });

    const { result } = renderHook(
      () => useCryptoBalanceTextViewModel({ amount: 1, cryptoUnit: BTC_ACCOUNT.currency.units[0] }),
      { initialState },
    );

    expect(result.current.prefixSymbol).toBeNull();
    expect(result.current.suffixSymbol).toBeNull();
  });

  it("sets hasDecimals from decimalPart presence", () => {
    mockedFormatCurrencyUnitFragment.mockReturnValue({
      currencyPosition: "end",
      currencyText: "BTC",
      integerPart: "1",
      decimalSeparator: ".",
      decimalPart: "5",
    });

    const { result } = renderHook(
      () => useCryptoBalanceTextViewModel({ amount: 1, cryptoUnit: BTC_ACCOUNT.currency.units[0] }),
      { initialState },
    );

    expect(result.current.hasDecimals).toBe(true);
  });

  it("calls formatCurrencyUnitFragment with locale and discreet from store", () => {
    mockedFormatCurrencyUnitFragment.mockReturnValue({
      currencyPosition: "end",
      currencyText: "BTC",
      integerPart: "0",
      decimalSeparator: ".",
      decimalPart: "",
    });

    renderHook(
      () => useCryptoBalanceTextViewModel({ amount: 0, cryptoUnit: BTC_ACCOUNT.currency.units[0] }),
      {
        initialState: { settings: { locale: "fr-FR", discreetMode: true } },
      },
    );

    expect(mockedFormatCurrencyUnitFragment).toHaveBeenCalledWith(
      BTC_ACCOUNT.currency.units[0],
      new BigNumber(0),
      expect.objectContaining({ locale: "fr-FR", discreet: true, showCode: true }),
    );
  });
});
