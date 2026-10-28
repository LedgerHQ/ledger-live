import { act, renderHook } from "@testing-library/react";
import type { AccountPortfolioRequest, AccountPortfolioResult } from "../types";
import { useRunHistory } from "./useRunHistory";

const request: AccountPortfolioRequest = {
  action: "getPortfolio",
  portfolioId: "p",
  currency: "usd",
};
const ok: AccountPortfolioResult = {
  ok: true,
  durationMs: 1,
  sent: { method: "GET", url: "u" },
  body: {},
  currency: "usd",
};

describe("useRunHistory", () => {
  it("records a call and selects it", async () => {
    const { result } = renderHook(() => useRunHistory(async () => ok));
    await act(() => result.current.run(request));
    expect(result.current.history).toHaveLength(1);
    expect(result.current.selected?.request).toEqual(request);
    expect(result.current.running).toBeUndefined();
  });

  it("records a host that rejects as a failed call instead of throwing", async () => {
    const { result } = renderHook(() =>
      useRunHistory(async () => {
        throw new Error("down");
      }),
    );
    await act(() => result.current.run(request));
    expect(result.current.selected?.result).toMatchObject({
      ok: false,
      body: { name: "Error", message: "down" },
    });
    expect(result.current.running).toBeUndefined();
  });
});
