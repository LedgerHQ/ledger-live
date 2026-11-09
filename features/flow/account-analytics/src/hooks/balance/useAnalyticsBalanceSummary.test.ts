import { renderHook } from "@testing-library/react";
import type { AnalyticsBalanceData } from "../../types";
import { useAnalyticsBalanceSummary } from "./useAnalyticsBalanceSummary";
import {
  analyticsFiat,
  createAnalyticsAccount,
  createAnalyticsCountervalues,
} from "../../analyticsSources.mock";

const eth = createAnalyticsAccount("summary-eth");
const input = {
  positions: [eth],
  countervalues: createAnalyticsCountervalues([eth]),
  fiat: analyticsFiat,
};
const data: AnalyticsBalanceData = {
  amount: 1,
  variation: { amount: 0, ratio: null },
  history: [{ timestamp: 1, amount: 1 }],
};

describe("useAnalyticsBalanceSummary", () => {
  it("should read the current balance of the selected positions", () => {
    const { result } = renderHook(() =>
      useAnalyticsBalanceSummary(
        {
          balance: { status: "ready", data },
          context: { positionIds: [eth.id] },
          catalogStatus: "ready",
        },
        input,
      ),
    );
    expect(result.current).toMatchObject({
      current: { status: "ready", data: 20000 },
      data,
      isCurrentAvailable: true,
    });
  });

  it("should report the current balance of a removed position as unavailable", () => {
    const { result } = renderHook(() =>
      useAnalyticsBalanceSummary(
        {
          balance: { status: "loading" },
          context: { positionIds: ["removed"] },
          catalogStatus: "ready",
        },
        input,
      ),
    );
    expect(result.current).toMatchObject({
      current: { status: "unavailable" },
      showHeaderStatus: true,
      isChartLoading: true,
    });
  });
});
