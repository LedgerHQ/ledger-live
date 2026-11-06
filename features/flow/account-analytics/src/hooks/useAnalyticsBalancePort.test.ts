import { renderHook } from "@testing-library/react";
import type { AnalyticsQueryContext } from "../types";
import { useAnalyticsBalancePort } from "./useAnalyticsBalancePort";
import {
  analyticsFiat,
  createMockAccount,
  createMockCountervalues,
} from "../analyticsSources.mock";

const eth = createMockAccount("port-eth");
const positions = [eth];
const countervalues = createMockCountervalues(positions);
const context: AnalyticsQueryContext = {
  assetId: null,
  accountId: null,
  fiatCurrencyId: analyticsFiat.ticker,
  positionIds: [eth.id],
  period: "1d",
  metric: "balance",
};
const readPortfolio = jest.fn(() => ({
  history: [{ timestamp: 1, amount: 5 }],
  positionIdsWithHistory: [eth.id],
  readVariation: () => ({ amount: 1, ratio: 0.2 }),
}));

function renderPort() {
  return renderHook(() =>
    useAnalyticsBalancePort({ positions, countervalues, fiat: analyticsFiat, readPortfolio }),
  );
}

describe("useAnalyticsBalancePort", () => {
  it("should read the balance of the requested context", async () => {
    const { result } = renderPort();
    await expect(
      result.current.loadBalance(context, { signal: new AbortController().signal }),
    ).resolves.toEqual({
      status: "ready",
      data: {
        amount: 5,
        variation: { amount: 1, ratio: 0.2 },
        history: [{ timestamp: 1, amount: 5 }],
      },
    });
    expect(readPortfolio).toHaveBeenCalledWith(positions, "day");
  });

  it("should skip the portfolio read once a newer selection aborted the request", async () => {
    readPortfolio.mockClear();
    const { result } = renderPort();
    const controller = new AbortController();
    const pending = result.current.loadBalance(context, { signal: controller.signal });
    controller.abort();
    await expect(pending).resolves.toEqual({ status: "unavailable" });
    expect(readPortfolio).not.toHaveBeenCalled();
  });

  it("should keep the port stable while its inputs do not change", () => {
    const { result, rerender } = renderPort();
    const port = result.current;
    rerender();
    expect(result.current).toBe(port);
  });
});
