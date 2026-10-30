import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountOperation from "./AccountOperation";
import type { AccountOperationToolAccount, AccountOperationToolWindow } from "../types";

function makeAccount(
  overrides: Partial<AccountOperationToolWindow> & { accountUUID?: string } = {},
  others: AccountOperationToolWindow[] = [],
): AccountOperationToolAccount {
  const { accountUUID = "uuid-1", ...window } = overrides;
  return {
    accountUUID,
    windows: [
      { queryKey: "", label: "default", reading: false, hasMore: false, ...window },
      ...others,
    ],
  };
}

const row = {
  id: "ethereum-0xa-OUT",
  hash: "0xa",
  type: "OUT",
  assetId: "ethereum",
  value: "1 ETH",
  fee: "0.01 ETH",
  date: "2026-01-02T00:00:00.000Z",
  pending: false,
  failed: false,
  child: false,
};

function renderTool(accounts: AccountOperationToolAccount[]) {
  const onRead = jest.fn();
  const onReadMore = jest.fn();
  const onReadAll = jest.fn();
  render(
    <AccountOperation
      accounts={accounts}
      assetIds={["ethereum", "ethereum/erc20/usd__coin"]}
      onRead={onRead}
      onReadMore={onReadMore}
      onReadAll={onReadAll}
    />,
  );
  return { onRead, onReadMore, onReadAll };
}

describe("AccountOperation", () => {
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
    expect(screen.queryByRole("button", { name: "Read more" })).toBeNull();
  });

  it("shows the rows, their status, the answering source and the last error", () => {
    renderTool([
      makeAccount({
        sourceId: "full-sync",
        readAt: 0,
        error: "NetworkError: down",
        rows: [
          { ...row, id: "pending", pending: true },
          row,
          { ...row, id: "failed", type: "FEES", failed: true, child: true },
        ],
      }),
    ]);
    expect(screen.getByText(/^3 operations · full-sync · /)).toBeVisible();
    expect(screen.getByText("NetworkError: down")).toBeVisible();
    expect(screen.getByText("pending")).toBeVisible();
    expect(screen.getByText("failed")).toBeVisible();
    expect(screen.getByText("FEES")).toBeVisible();
    expect(screen.getAllByText("1 ETH")).toHaveLength(3);
  });

  it("reads the account of the clicked row", async () => {
    const { onRead } = renderTool([makeAccount(), makeAccount({ accountUUID: "uuid-2" })]);
    await userEvent.click(screen.getAllByRole("button", { name: "Read" })[1]);
    expect(onRead).toHaveBeenCalledWith("uuid-2", "");
  });

  it("reads the next page when the source has one", async () => {
    const { onReadMore } = renderTool([makeAccount({ hasMore: true, rows: [row], readAt: 0 })]);
    await userEvent.click(screen.getByRole("button", { name: "Read more" }));
    expect(onReadMore).toHaveBeenCalledWith("uuid-1", "");
  });

  it("shows each query's window with its countervalues, and reads it by its key", async () => {
    const queryKey = '{"countervalue":"USD","filterAsset":"ethereum"}';
    const { onRead } = renderTool([
      makeAccount({}, [
        {
          queryKey,
          label: "filter ethereum · USD",
          reading: false,
          hasMore: false,
          readAt: 0,
          rows: [{ ...row, countervalues: ["$12.34"] }],
        },
      ]),
    ]);
    expect(screen.getByText("default")).toBeVisible();
    expect(screen.getByText("filter ethereum · USD")).toBeVisible();
    expect(screen.getByText("$12.34")).toBeVisible();
    await userEvent.click(screen.getAllByRole("button", { name: "Read" })[1]);
    expect(onRead).toHaveBeenCalledWith("uuid-1", queryKey);
  });

  it("disables Read and Read more while the account is being read", () => {
    renderTool([makeAccount({ reading: true, hasMore: true })]);
    expect(screen.getByText("reading…")).toBeVisible();
    expect(screen.getByRole("button", { name: "Read" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Read more" })).toBeDisabled();
  });

  it("reads every account on Read all, with no options by default", async () => {
    const { onReadAll } = renderTool([makeAccount()]);
    await userEvent.click(screen.getByRole("button", { name: "Read all" }));
    expect(onReadAll).toHaveBeenCalledWith({});
  });

  it("reads every account with the options filled in the header", async () => {
    const { onReadAll } = renderTool([makeAccount()]);
    await userEvent.type(screen.getByLabelText("Limit"), "50");
    await userEvent.type(screen.getByLabelText("Filter asset"), "ethereum/erc20/usd__coin");
    await userEvent.type(screen.getByLabelText("Countervalue"), "eur");
    await userEvent.click(screen.getByRole("button", { name: "Read all" }));
    expect(onReadAll).toHaveBeenCalledWith({
      limit: 50,
      filterAsset: "ethereum/erc20/usd__coin",
      countervalue: "EUR",
    });
  });
});
