import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountReceive from "./AccountReceive";
import type { AccountReceiveToolAccount } from "../types";

function makeAccount(
  overrides: Partial<AccountReceiveToolAccount> = {},
): AccountReceiveToolAccount {
  return { accountUUID: "uuid-1", reading: false, ...overrides };
}

function renderTool(accounts: AccountReceiveToolAccount[]) {
  const onRead = jest.fn();
  const onReadAll = jest.fn();
  render(<AccountReceive accounts={accounts} onRead={onRead} onReadAll={onReadAll} />);
  return { onRead, onReadAll };
}

describe("AccountReceive", () => {
  it("says when the accounts slice is empty", () => {
    renderTool([]);
    expect(screen.getByText("0 accounts")).toBeVisible();
    expect(screen.getByText("No account in the accounts slice.")).toBeVisible();
  });

  it("shows an account never read", () => {
    renderTool([makeAccount()]);
    expect(screen.getByText("1 account")).toBeVisible();
    expect(screen.getByText("never read")).toBeVisible();
  });

  it("shows the receive address, how the device confirms it, and the answering source", () => {
    renderTool([
      makeAccount({
        status: "ready",
        sourceId: "full-sync",
        readAt: 0,
        receive: {
          address: "ldg::1220ab",
          verification: "shows canton_9f3c at m/44h/6767h/0h/0h/0h",
        },
      }),
    ]);
    expect(screen.getByText("ldg::1220ab")).toBeVisible();
    expect(screen.getByText("device shows canton_9f3c at m/44h/6767h/0h/0h/0h")).toBeVisible();
    expect(screen.getByText(/^full-sync · /)).toBeVisible();
  });

  it("says when the device cannot confirm the address", () => {
    renderTool([makeAccount({ status: "ready", receive: { address: "0.0.1234" } })]);
    expect(screen.getByText("no device verification")).toBeVisible();
  });

  it("shows the shielded address next to the transparent one", () => {
    renderTool([
      makeAccount({
        status: "ready",
        receive: { address: "t1transparent" },
        shielded: { address: "u1shielded", verification: "shows u1shielded at m/44h/133h/0h/0/3" },
      }),
    ]);
    expect(screen.getByText("t1transparent")).toBeVisible();
    expect(screen.getByText("u1shielded")).toBeVisible();
  });

  it("says when the account needs its onboarding", () => {
    renderTool([makeAccount({ status: "onboardingRequired" })]);
    expect(screen.getByText("onboarding required before receiving")).toBeVisible();
  });

  it("shows the last error", () => {
    renderTool([makeAccount({ error: "NoAccountDataSourceError: none" })]);
    expect(screen.getByText("NoAccountDataSourceError: none")).toBeVisible();
  });

  it("reads one account, or all of them", async () => {
    const { onRead, onReadAll } = renderTool([makeAccount()]);
    await userEvent.click(screen.getByText("Read"));
    await userEvent.click(screen.getByText("Read all"));
    expect(onRead).toHaveBeenCalledWith("uuid-1");
    expect(onReadAll).toHaveBeenCalledTimes(1);
  });

  it("disables the read of an account being read", () => {
    renderTool([makeAccount({ reading: true })]);
    expect(screen.getByText("reading…")).toBeVisible();
    expect(screen.getByText("Read")).toBeDisabled();
  });
});
