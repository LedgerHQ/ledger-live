import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountAggregation from "./AccountAggregation";
import type { AccountAggregationToolProps, AggregationRun } from "../types";

const run: AggregationRun = {
  id: 1,
  startedAt: 0,
  durationMs: 120,
  force: true,
  accounts: 3,
  sources: [
    {
      sourceId: "portfolio",
      ok: 1,
      failed: 1,
      calls: [{ batch: true, accounts: 2, failed: 1, elapsedMs: 80 }],
    },
    {
      sourceId: "full-sync",
      ok: 1,
      failed: 0,
      calls: [{ batch: false, accounts: 1, failed: 0, elapsedMs: 40 }],
    },
  ],
  unanswered: 0,
  fiatTotal: "$4,500.00",
  unvalued: 1,
  totals: [{ assetId: "ethereum", balance: "1.5 ETH", fiat: "$4,500.00", accounts: 2 }],
  perAccount: [
    { accountUUID: "aaaaaaaa-1", label: "ethereum 0xab", sourceId: "portfolio", assets: 1 },
    {
      accountUUID: "bbbbbbbb-1",
      label: "polygon 0xab",
      error: "PortfolioAccountPendingError: Service account uninitialized",
      assets: 0,
    },
  ],
  payload: "{}",
};

function renderTool(overrides: Partial<AccountAggregationToolProps> = {}) {
  const props: AccountAggregationToolProps = {
    accountCount: 3,
    running: false,
    runs: [],
    onFetchTotalBalance: jest.fn(),
    onClear: jest.fn(),
    ...overrides,
  };
  render(<AccountAggregation {...props} />);
  return props;
}

describe("AccountAggregation", () => {
  it("fetches the total balance, forced unless unticked", async () => {
    const props = renderTool();
    await userEvent.click(screen.getByRole("button", { name: "Fetch total balance" }));
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Fetch total balance" }));
    expect(props.onFetchTotalBalance).toHaveBeenNthCalledWith(1, { force: true });
    expect(props.onFetchTotalBalance).toHaveBeenNthCalledWith(2, { force: false });
  });

  it("holds the button while a run is going", () => {
    renderTool({ running: true });
    expect(screen.getByRole("button", { name: "Fetch total balance" })).toBeDisabled();
  });

  it("shows the total countervalue first, and the accounts left out", () => {
    renderTool({ runs: [run] });
    expect(screen.getByTestId("fiat-total")).toHaveTextContent("$4,500.00");
    expect(screen.getByText("1 account failed, not counted")).toBeVisible();
    expect(screen.getByText("1 assets without a rate left out")).toBeVisible();
    expect(
      screen.getAllByText("PortfolioAccountPendingError: Service account uninitialized")[0],
    ).toBeVisible();
  });

  it("shows what each source answered and the totals", () => {
    renderTool({ runs: [run] });
    expect(screen.getAllByText("portfolio")[0]).toBeVisible();
    expect(screen.getByText(/readBatch\(2\) 80 ms/)).toBeVisible();
    expect(screen.getByText(/read\(1\) 40 ms/)).toBeVisible();
    expect(screen.getByText("1.5 ETH")).toBeVisible();
    expect(screen.getAllByText("$4,500.00")).toHaveLength(2);
  });
});
