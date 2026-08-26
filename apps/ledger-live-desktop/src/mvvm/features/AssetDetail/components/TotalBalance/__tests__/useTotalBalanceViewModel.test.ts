import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import { renderHook } from "tests/testSetup";
import { buildDistributionItem } from "tests/utils/distributionTestUtils";
import { useTotalBalanceViewModel } from "../useTotalBalanceViewModel";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/currencies/index"),
  formatCurrencyUnitFragment: jest.fn(),
}));

const mockedFormatCurrencyUnitFragment = jest.mocked(formatCurrencyUnitFragment);

const btc = BTC_ACCOUNT.currency;

const initialState = {
  settings: { counterValue: "USD", locale: "en-US", discreetMode: false },
};

describe("useTotalBalanceViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFormatCurrencyUnitFragment.mockReturnValue({
      integerPart: "0",
      decimalSeparator: ".",
      currencyPosition: "end",
      decimalPart: "",
      currencyText: "",
    });
  });

  it("exposes the translated total balance label", () => {
    const { result } = renderHook(
      () => useTotalBalanceViewModel(buildDistributionItem({ currency: btc, countervalue: 0 })),
      { initialState },
    );

    expect(result.current.totalBalanceLabel).toBe("Total balance");
  });

  it("does not format a missing countervalue as zero", () => {
    const { result } = renderHook(
      () => useTotalBalanceViewModel(buildDistributionItem({ countervalue: undefined })),
      { initialState },
    );

    expect(mockedFormatCurrencyUnitFragment).not.toHaveBeenCalled();
    expect(result.current.fiatAvailable).toBe(false);
    expect(result.current.fiatAriaLabel).toBe("-");
  });

  it("forwards locale, discreet and full precision options in the fragment formatter", () => {
    renderHook(
      () => useTotalBalanceViewModel(buildDistributionItem({ currency: btc, countervalue: 0 })),
      {
        initialState: {
          settings: {
            counterValue: "USD",
            locale: "de-DE",
            discreetMode: true,
          },
        },
      },
    );

    expect(mockedFormatCurrencyUnitFragment).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        locale: "de-DE",
        discreet: true,
        showCode: true,
        disableRounding: true,
        showAllDigits: true,
      }),
    );
  });

  it("uses the total balance label as fiat aria label when discreet mode is enabled", () => {
    const { result } = renderHook(
      () => useTotalBalanceViewModel(buildDistributionItem({ countervalue: 0 })),
      {
        initialState: {
          settings: {
            counterValue: "USD",
            locale: "en-US",
            discreetMode: true,
          },
        },
      },
    );

    expect(result.current.fiatAriaLabel).toBe("Total balance");
  });

  it("exposes amount and crypto unit from the distribution item", () => {
    const item = buildDistributionItem({ amount: 15_000_000, currency: btc });
    const { result } = renderHook(() => useTotalBalanceViewModel(item), {
      initialState,
    });

    expect(result.current.amount).toBe(15_000_000);
    expect(result.current.cryptoUnit).toBe(btc.units[0]);
  });
});
