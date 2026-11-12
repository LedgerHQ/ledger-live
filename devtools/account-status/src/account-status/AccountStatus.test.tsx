import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountStatus from "./AccountStatus";
import type { AccountStatusToolAccount } from "../types";

function makeAccount(overrides: Partial<AccountStatusToolAccount> = {}): AccountStatusToolAccount {
  return { accountUUID: "uuid-1", reading: false, assets: [], ...overrides };
}

function renderTool(accounts: AccountStatusToolAccount[]) {
  const onRead = jest.fn();
  const onReadAll = jest.fn();
  const onReadAsset = jest.fn();
  render(
    <AccountStatus
      accounts={accounts}
      onRead={onRead}
      onReadAll={onReadAll}
      onReadAsset={onReadAsset}
    />,
  );
  return { onRead, onReadAll, onReadAsset };
}

describe("AccountStatus", () => {
  it("says when the accounts slice is empty", () => {
    renderTool([]);
    expect(screen.getByText("0 accounts")).toBeVisible();
    expect(screen.getByText("No account in the accounts slice.")).toBeVisible();
  });

  it("shows an account never read", () => {
    renderTool([makeAccount()]);
    expect(screen.getByText("1 account")).toBeVisible();
    expect(screen.getByText("never read")).toBeVisible();
    expect(screen.queryByText("yes")).toBeNull();
    expect(screen.queryByText("no")).toBeNull();
  });

  it("shows whether the account was used, its gate and send gate, and the answering source", () => {
    renderTool([
      makeAccount({
        sourceId: "coin-module",
        readAt: 0,
        used: false,
        gate: "onboarding",
        sendGate: "onboarding",
      }),
    ]);
    expect(screen.getByText("no")).toBeVisible();
    expect(screen.getByText("onboarding")).toBeVisible();
    expect(screen.getByText("send: onboarding")).toBeVisible();
    expect(screen.getByText(/^coin-module · /)).toBeVisible();
  });

  it("shows each asset read with its gate and receive gate, and its error", () => {
    renderTool([
      makeAccount({
        used: true,
        gate: "none",
        sendGate: "none",
        assets: [
          {
            assetId: "stellar/asset/usdc",
            reading: false,
            readAt: 0,
            sourceId: "full-sync",
            gate: "activation · trustline",
            receiveGate: "activation · trustline",
          },
          { assetId: "stellar/asset/bad", reading: false, error: "Error: not a token" },
        ],
      }),
    ]);
    expect(screen.getByText("stellar/asset/usdc")).toBeVisible();
    expect(screen.getByText("activation · trustline")).toBeVisible();
    expect(screen.getByText("receive: activation · trustline")).toBeVisible();
    expect(screen.getByText("Error: not a token")).toBeVisible();
  });

  it("reads one account, all of them, and an asset typed in", async () => {
    const { onRead, onReadAll, onReadAsset } = renderTool([makeAccount()]);
    await userEvent.click(screen.getByRole("button", { name: "Read" }));
    await userEvent.click(screen.getByRole("button", { name: "Read all" }));
    await userEvent.type(screen.getByLabelText("Asset id"), " ethereum/erc20/usd__coin ");
    await userEvent.click(screen.getByRole("button", { name: "Read asset" }));
    expect(onRead).toHaveBeenCalledWith("uuid-1");
    expect(onReadAll).toHaveBeenCalled();
    expect(onReadAsset).toHaveBeenCalledWith("uuid-1", "ethereum/erc20/usd__coin");
  });

  it("asks no asset for an empty id", async () => {
    const { onReadAsset } = renderTool([makeAccount()]);
    await userEvent.click(screen.getByRole("button", { name: "Read asset" }));
    expect(onReadAsset).not.toHaveBeenCalled();
  });

  it("does not read again an account being read", () => {
    renderTool([makeAccount({ reading: true })]);
    expect(screen.getByText("reading…")).toBeVisible();
    expect(screen.getByRole("button", { name: "Read" })).toBeDisabled();
  });
});
