import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountBalanceHistory from "./AccountBalanceHistory";
import type { AccountBalanceHistoryToolAccount } from "../types";

function makeAccount(
  overrides: Partial<AccountBalanceHistoryToolAccount> = {},
): AccountBalanceHistoryToolAccount {
  return { accountUUID: "uuid-1", reading: false, ...overrides };
}

const series = {
  assetId: "ethereum",
  pointCount: 3,
  firstDate: "2026-01-01T00:00:00.000Z",
  lastDate: "2026-01-03T00:00:00.000Z",
  firstBalance: "0 ETH",
  lastBalance: "1.5 ETH",
  values: [0, 1, 1.5],
};

function renderTool(accounts: AccountBalanceHistoryToolAccount[]) {
  const onRead = jest.fn();
  const onReadAll = jest.fn();
  const onRangeChange = jest.fn();
  const onCountervalueChange = jest.fn();
  render(
    <AccountBalanceHistory
      ranges={["day", "week", "month"]}
      range="week"
      onRangeChange={onRangeChange}
      accounts={accounts}
      onRead={onRead}
      onReadAll={onReadAll}
      fiat="USD"
      countervalue={false}
      onCountervalueChange={onCountervalueChange}
    />,
  );
  return { onRead, onReadAll, onRangeChange, onCountervalueChange };
}

describe("AccountBalanceHistory", () => {
  it("asks for the app's fiat when its checkbox is checked", async () => {
    const { onCountervalueChange } = renderTool([]);
    await userEvent.click(screen.getByRole("checkbox", { name: "USD" }));
    expect(onCountervalueChange).toHaveBeenCalledWith(true);
  });

  it("shows the last valued point and how many points are valued", async () => {
    renderTool([
      makeAccount({
        series: [
          { ...series, valuedCount: 2, lastCountervalue: "$4,500.00", countervalues: [10, 20] },
        ],
      }),
    ]);
    expect(screen.getByText("$4,500.00")).toBeVisible();
    await userEvent.click(screen.getByText("ethereum"));
    expect(screen.getByText(/2 valued/)).toBeVisible();
  });

  it("says when the accounts slice is empty", () => {
    renderTool([]);
    expect(screen.getByText("0 accounts")).toBeVisible();
    expect(screen.getByText("No account in the accounts slice.")).toBeVisible();
  });

  it("shows an account never read", () => {
    renderTool([makeAccount()]);
    expect(screen.getByText("1 account")).toBeVisible();
    expect(screen.getByText("uuid-1")).toBeVisible();
    expect(screen.getByText("never read")).toBeVisible();
  });

  it("shows each series with its last balance and sparkline, the answering source and the last error", () => {
    renderTool([
      makeAccount({
        sourceId: "full-sync",
        readAt: 0,
        error: "NetworkError: down",
        series: [
          series,
          { ...series, assetId: "ethereum/erc20/usd_tether__erc20_", values: [], pointCount: 0 },
        ],
      }),
    ]);
    expect(screen.getByText(/^full-sync · /)).toBeVisible();
    expect(screen.getByText("NetworkError: down")).toBeVisible();
    expect(screen.getAllByText("1.5 ETH")[0]).toBeVisible();
    expect(screen.getByTitle("ethereum balance over the range").closest("svg")).toBeVisible();
    expect(screen.getByText("ethereum/erc20/usd_tether__erc20_")).toBeVisible();
  });

  it("selects the range", async () => {
    const { onRangeChange } = renderTool([makeAccount()]);
    expect(screen.getByRole("combobox")).toHaveValue("week");
    await userEvent.selectOptions(screen.getByRole("combobox"), "month");
    expect(onRangeChange).toHaveBeenCalledWith("month");
  });

  it("reads the account of the clicked row", async () => {
    const { onRead } = renderTool([makeAccount(), makeAccount({ accountUUID: "uuid-2" })]);
    await userEvent.click(screen.getAllByRole("button", { name: "Read" })[1]);
    expect(onRead).toHaveBeenCalledWith("uuid-2");
  });

  it("disables Read while the account is being read", () => {
    renderTool([makeAccount({ reading: true })]);
    expect(screen.getByText("reading…")).toBeVisible();
    expect(screen.getByRole("button", { name: "Read" })).toBeDisabled();
  });

  it("reads every account on Read all", async () => {
    const { onReadAll } = renderTool([makeAccount()]);
    await userEvent.click(screen.getByRole("button", { name: "Read all" }));
    expect(onReadAll).toHaveBeenCalledTimes(1);
  });
});
