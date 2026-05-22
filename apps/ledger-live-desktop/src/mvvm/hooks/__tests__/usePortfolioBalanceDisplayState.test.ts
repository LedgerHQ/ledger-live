import { renderHook, withFlagOverrides } from "tests/testSetup";
import { usePortfolioBalanceDisplayState } from "../usePortfolioBalanceDisplayState";
import * as usePortfolioBalanceModule from "LLD/hooks/usePortfolioBalance";
import {
  defaultPortfolio,
  makePortfolioBalanceReturn,
  mockPortfolioBalanceInfo,
  mockCounterValue,
} from "LLD/hooks/__tests__/fixtures";
import { INITIAL_STATE } from "~/renderer/reducers/settings";

jest.mock("LLD/hooks/usePortfolioBalance");

const mockUsePortfolioBalance = jest.mocked(usePortfolioBalanceModule.usePortfolioBalance);

const initialState = {
  settings: {
    ...INITIAL_STATE,
    counterValue: "USD",
    counterValueCurrency: mockCounterValue,
  },
  ...withFlagOverrides({
    lwdWallet40: {
      enabled: true,
      params: { balanceRefreshRework: true },
    },
  }),
};

describe("usePortfolioBalanceDisplayState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolioBalance.mockReturnValue(makePortfolioBalanceReturn());
  });

  it("should request the Portfolio V4 day range by default", () => {
    renderHook(() => usePortfolioBalanceDisplayState(), { initialState });

    expect(mockUsePortfolioBalance).toHaveBeenCalledWith({ legacyRange: false });
  });

  it("should expose the display balance and value change as balanceInfo", () => {
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({
        portfolio: {
          ...defaultPortfolio,
          balanceHistory: [
            { date: new Date("2026-05-21"), value: mockPortfolioBalanceInfo.totalBalance },
          ],
          countervalueChange: mockPortfolioBalanceInfo.valueChange,
        },
      }),
    );

    const { result } = renderHook(() => usePortfolioBalanceDisplayState(), { initialState });

    expect(result.current.balanceInfo).toEqual(mockPortfolioBalanceInfo);
  });

  it("should pass legacyRange through when explicitly requested", () => {
    renderHook(() => usePortfolioBalanceDisplayState({ legacyRange: true }), { initialState });

    expect(mockUsePortfolioBalance).toHaveBeenCalledWith({ legacyRange: true });
  });
});
