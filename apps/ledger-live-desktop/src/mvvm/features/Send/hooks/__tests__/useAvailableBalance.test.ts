/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { renderHook } from "tests/testSetup";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { INITIAL_STATE as INITIAL_STATE_SETTINGS } from "~/renderer/reducers/settings";
import { useAvailableBalance } from "../useAvailableBalance";

jest.mock("@ledgerhq/live-common/account/index");
jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/currencies/index"),
  formatCurrencyUnit: jest.fn(),
}));
jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculate: jest.fn(),
}));

jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  ...jest.requireActual("~/renderer/hooks/useAccountUnit"),
  useMaybeAccountUnit: jest.fn(),
}));

const mockedUseCalculate = jest.mocked(useCalculate);
const mockedUseMaybeAccountUnit = jest.mocked(useMaybeAccountUnit);
const mockedFormatCurrencyUnit = jest.mocked(formatCurrencyUnit);

const initialState = {
  counterValue: "USD",
  locale: "en-US",
};

describe("useAvailableBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([null, undefined])(
    "should return no balance when no account provided (%s)",
    (account: null | undefined) => {
      const { result } = renderHook(() => useAvailableBalance(account), {
        initialState: {
          settings: { ...INITIAL_STATE_SETTINGS, ...initialState },
        },
      });
      expect(result.current).toBe("");
    },
  );

  it("should return balance from counter value formatted", () => {
    const counterValue = 1;
    mockedUseCalculate.mockReturnValueOnce(counterValue);
    mockedUseMaybeAccountUnit.mockReturnValueOnce({} as unknown as Unit);
    mockedFormatCurrencyUnit.mockImplementation((_unit, value, _options) => `${value}$`);

    const account = {
      spendableBalance: new BigNumber(2),
    } as unknown as AccountLike;
    const { result } = renderHook(() => useAvailableBalance(account), {
      initialState: {
        settings: { ...INITIAL_STATE_SETTINGS, ...initialState },
      },
    });
    expect(result.current).toBe(`${counterValue}$`);
  });

  it.each([null, undefined])(
    "should return balance from spendable balance formatted when no counter value (%s)",
    (counterValue: null | undefined) => {
      mockedUseCalculate.mockReturnValueOnce(counterValue);
      mockedUseMaybeAccountUnit.mockReturnValueOnce({} as unknown as Unit);
      mockedFormatCurrencyUnit.mockImplementation((_unit, value, _options) => `${value}$`);

      const spendableBalance = new BigNumber(2);
      const account = {
        spendableBalance,
      } as unknown as AccountLike;
      const { result } = renderHook(() => useAvailableBalance(account), {
        initialState: {
          settings: { ...INITIAL_STATE_SETTINGS, ...initialState },
        },
      });
      expect(result.current).toBe(`${spendableBalance}$`);
    },
  );

  it.each([null, undefined])(
    "should return no balance when no counter value (%s) nor unit for spendable balance",
    counterValue => {
      mockedUseCalculate.mockReturnValueOnce(counterValue);
      mockedUseMaybeAccountUnit.mockReturnValueOnce(undefined);
      mockedFormatCurrencyUnit.mockImplementation((_unit, value, _options) => `${value}$`);

      const spendableBalance = new BigNumber(2);
      const account = {
        spendableBalance,
      } as unknown as AccountLike;
      const { result } = renderHook(() => useAvailableBalance(account), {
        initialState: {
          settings: { ...INITIAL_STATE_SETTINGS, ...initialState },
        },
      });
      expect(result.current).toBe("");
    },
  );
});
