import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountBalance from "./AccountBalance";
import type { AccountBalanceToolAccount } from "../types";

function makeAccount(
  overrides: Partial<AccountBalanceToolAccount> = {},
): AccountBalanceToolAccount {
  return { accountUUID: "uuid-1", reading: false, ...overrides };
}

function renderTool(accounts: AccountBalanceToolAccount[]) {
  const onRead = jest.fn();
  const onReadAll = jest.fn();
  render(<AccountBalance accounts={accounts} onRead={onRead} onReadAll={onReadAll} />);
  return { onRead, onReadAll };
}

describe("AccountBalance", () => {
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

  it("shows the rows, the answering source and the last error", () => {
    renderTool([
      makeAccount({
        sourceId: "full-sync",
        readAt: 0,
        error: "NetworkError: down",
        rows: [
          { assetId: "ethereum", balance: "1 ETH", spendableBalance: "0.4 ETH", empty: false },
          { assetId: "bitcoin", balance: "2 BTC", empty: false },
        ],
      }),
    ]);
    expect(screen.getByText(/^full-sync · /)).toBeVisible();
    expect(screen.getByText("NetworkError: down")).toBeVisible();
    expect(screen.getByText("1 ETH")).toBeVisible();
    expect(screen.getByText("spendable 0.4 ETH")).toBeVisible();
    expect(screen.getByText("2 BTC")).toBeVisible();
    expect(screen.getAllByText(/^spendable/)).toHaveLength(1);
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
