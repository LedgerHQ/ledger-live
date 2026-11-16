import React from "react";
import { renderHook } from "@testing-library/react";
import { I18nTestProvider } from "@shared/i18n/testing";
import { usePaySuccessSummaryRows } from "../usePaySuccessSummaryRows";
import { PAY_SUCCESS_RESOURCES } from "./shared";

function renderSummaryRows(params: Parameters<typeof usePaySuccessSummaryRows>[0]) {
  return renderHook(() => usePaySuccessSummaryRows(params), {
    wrapper: ({ children }) => (
      <I18nTestProvider resources={PAY_SUCCESS_RESOURCES}>{children}</I18nTestProvider>
    ),
  }).result.current;
}

describe("usePaySuccessSummaryRows", () => {
  it("builds amount, estimated time and from rows when fromAccountName is set", () => {
    const rows = renderSummaryRows({
      amountFormatted: "100 USDC",
      estimatedTime: "~15s",
      fromAccountName: "Ethereum 1",
      networkIcon: { ledgerId: "ethereum", ticker: "ETH" },
    });

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ id: "amount", value: "100 USDC" });
    expect(rows[1]).toMatchObject({ id: "estimatedTime", value: "~15s" });
    expect(rows[2]).toMatchObject({
      id: "from",
      value: "Ethereum 1",
      trailingIcon: { ledgerId: "ethereum", ticker: "ETH" },
    });
  });

  it("returns an empty list when fromAccountName is not set", () => {
    expect(
      renderSummaryRows({
        amountFormatted: "100 USDC",
        fromAccountName: undefined,
      }),
    ).toEqual([]);
  });
});
