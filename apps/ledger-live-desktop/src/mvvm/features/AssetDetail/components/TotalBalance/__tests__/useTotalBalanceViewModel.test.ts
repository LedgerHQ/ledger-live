import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
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
      () => useTotalBalanceViewModel(buildDistributionItem({ currency: btc })),
      { initialState },
    );

    expect(result.current.totalBalanceLabel).toBe("Total balance");
  });

  it("uses 0 for fiat display when countervalue is undefined", () => {
    const { result } = renderHook(
      () => useTotalBalanceViewModel(buildDistributionItem({ countervalue: undefined })),
      { initialState },
    );

    expect(result.current.fiatDisplayValue).toBe(0);
  });

  it("uses countervalue for fiat display when set", () => {
    const { result } = renderHook(
      () => useTotalBalanceViewModel(buildDistributionItem({ countervalue: 9_999.42 })),
      { initialState },
    );

    expect(result.current.fiatDisplayValue).toBe(9_999.42);
  });

  it("forwards locale, discreet, and showCode to the fiat formatter", () => {
    const { result } = renderHook(
      () => useTotalBalanceViewModel(buildDistributionItem({ currency: btc })),
      {
        initialState: { settings: { counterValue: "USD", locale: "de-DE", discreetMode: true } },
      },
    );

    result.current.fiatFormatter(12.34);

    expect(mockedFormatCurrencyUnitFragment).toHaveBeenCalledWith(
      expect.anything(),
      new BigNumber(12.34),
      expect.objectContaining({ locale: "de-DE", discreet: true, showCode: true }),
    );
  });

  it("exposes amount and crypto unit from the distribution item", () => {
    const item = buildDistributionItem({ amount: 15_000_000, currency: btc });
    const { result } = renderHook(() => useTotalBalanceViewModel(item), { initialState });

    expect(result.current.amount).toBe(15_000_000);
    expect(result.current.cryptoUnit).toBe(btc.units[0]);
  });

  it("maps discreet mode to hidden for AmountDisplay", () => {
    const { result } = renderHook(() => useTotalBalanceViewModel(buildDistributionItem()), {
      initialState: { settings: { counterValue: "USD", locale: "en-US", discreetMode: true } },
    });

    expect(result.current.hidden).toBe(true);
  });
});
