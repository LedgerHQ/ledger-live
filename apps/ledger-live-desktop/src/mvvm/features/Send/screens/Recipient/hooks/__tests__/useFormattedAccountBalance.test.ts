import { renderHook } from "@testing-library/react";
import { useFormattedAccountBalance } from "../useFormattedAccountBalance";
import { useSelector } from "LLD/hooks/redux";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { createMockAccount } from "../../__integrations__/__fixtures__/accounts";
import { BigNumber } from "bignumber.js";

jest.mock("LLD/hooks/redux");
jest.mock("@ledgerhq/live-common/currencies/index");
jest.mock("@ledgerhq/live-common/account/index");
jest.mock("@ledgerhq/live-countervalues-react");
jest.mock("~/renderer/hooks/useAccountUnit");

const mockedUseSelector = jest.mocked(useSelector);
const mockedUseMaybeAccountUnit = jest.mocked(useMaybeAccountUnit);
const mockedGetAccountCurrency = jest.mocked(getAccountCurrency);
const mockedFormatCurrencyUnit = jest.mocked(formatCurrencyUnit);
const mockedUseCalculate = jest.mocked(useCalculate);

const mockAccount = createMockAccount();

const mockCounterValueCurrency = {
  units: [{ code: "USD", name: "US Dollar", magnitude: 2 }],
};

const mockUnit = { code: "BTC", name: "Bitcoin", magnitude: 8 };

describe("useFormattedAccountBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSelector.mockReturnValue(mockCounterValueCurrency);
    mockedUseMaybeAccountUnit.mockReturnValue(mockUnit);
    mockedGetAccountCurrency.mockReturnValue(mockAccount.currency);
    mockedFormatCurrencyUnit.mockImplementation((unit, _value, _options) => {
      if (unit.code === "USD") return "$50,000";
      return "1 BTC";
    });
    mockedUseCalculate.mockReturnValue(50000);
  });

  it("returns formatted balance and counter value for valid account", () => {
    const { result } = renderHook(() => useFormattedAccountBalance(mockAccount));

    expect(result.current.formattedBalance).toBe("1 BTC");
    expect(result.current.formattedCounterValue).toBe("$50,000");
  });

  it("returns undefined for undefined account", () => {
    const { result } = renderHook(() => useFormattedAccountBalance(undefined));

    expect(result.current.formattedBalance).toBeUndefined();
    expect(result.current.formattedCounterValue).toBeUndefined();
  });

  it("returns undefined when unit is not available", () => {
    mockedUseMaybeAccountUnit.mockReturnValue(undefined);

    const { result } = renderHook(() => useFormattedAccountBalance(mockAccount));

    expect(result.current.formattedBalance).toBeUndefined();
    expect(result.current.formattedCounterValue).toBeUndefined();
  });

  it("returns undefined counter value when calculation returns non-number", () => {
    mockedUseCalculate.mockReturnValue(null);

    const { result } = renderHook(() => useFormattedAccountBalance(mockAccount));

    expect(result.current.formattedBalance).toBe("1 BTC");
    expect(result.current.formattedCounterValue).toBeUndefined();
  });

  it("calls formatCurrencyUnit with correct parameters", () => {
    renderHook(() => useFormattedAccountBalance(mockAccount));

    expect(mockedFormatCurrencyUnit).toHaveBeenCalledWith(mockUnit, mockAccount.balance, {
      showCode: true,
    });

    expect(mockedFormatCurrencyUnit).toHaveBeenCalledWith(
      mockCounterValueCurrency.units[0],
      expect.anything(),
      { showCode: true },
    );
  });

  it("calls useCalculate with correct parameters", () => {
    renderHook(() => useFormattedAccountBalance(mockAccount));

    expect(useCalculate).toHaveBeenCalledWith({
      from: mockAccount.currency,
      to: mockCounterValueCurrency,
      value: 100000000,
      disableRounding: true,
    });
  });

  it("handles zero balance correctly", () => {
    const zeroBalanceAccount = createMockAccount({ balance: new BigNumber(0) });

    mockedFormatCurrencyUnit.mockImplementation((unit, _value) => {
      if (unit.code === "USD") return "$0";
      return "0 BTC";
    });
    mockedUseCalculate.mockReturnValue(0);

    const { result } = renderHook(() => useFormattedAccountBalance(zeroBalanceAccount));

    expect(result.current.formattedBalance).toBe("0 BTC");
    expect(result.current.formattedCounterValue).toBe("$0");
  });

  it("memoizes values correctly", () => {
    const { result, rerender } = renderHook(() => useFormattedAccountBalance(mockAccount));

    const firstBalance = result.current.formattedBalance;
    const firstCounterValue = result.current.formattedCounterValue;

    rerender();

    expect(result.current.formattedBalance).toBe(firstBalance);
    expect(result.current.formattedCounterValue).toBe(firstCounterValue);
  });

  it("updates when account changes", () => {
    const { result, rerender } = renderHook(({ account }) => useFormattedAccountBalance(account), {
      initialProps: { account: mockAccount },
    });

    expect(result.current.formattedBalance).toBe("1 BTC");

    const newAccount = createMockAccount({ balance: new BigNumber(200000000) });

    mockedFormatCurrencyUnit.mockImplementation((unit, _value) => {
      if (unit.code === "USD") return "$100,000";
      return "2 BTC";
    });
    mockedUseCalculate.mockReturnValue(100000);

    rerender({ account: newAccount });

    expect(result.current.formattedBalance).toBe("2 BTC");
    expect(result.current.formattedCounterValue).toBe("$100,000");
  });
});
