import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountSourcePortfolio from "./AccountSourcePortfolio";
import type { PortfolioSourceToolProps } from "../types";

function renderTool(overrides: Partial<PortfolioSourceToolProps> = {}) {
  const props: PortfolioSourceToolProps = {
    serviceUrl: "https://portfolio",
    enabled: true,
    serverStatuses: [{ status: "synchronized", count: 2 }],
    accounts: [
      {
        accountUUID: "aaaaaaaa-1",
        label: "ethereum 0xab",
        registration: '{ "type": "evm" }',
        registered: true,
        serverAccounts: [{ id: "ethereum:0xab", status: "synchronized" }],
        outcome: { outcome: "pending", detail: "ethereum:0xab is uninitialized", rows: 0, at: 0 },
      },
      { accountUUID: "bbbbbbbb-1", label: "solana 9x", registered: false, serverAccounts: [] },
    ],
    extraRegistrations: [{ id: "reg-old", type: "evm", label: "0xdead" }],
    activity: [{ id: 0, at: 0, kind: "register", ok: true, summary: "Registered 1: evm" }],
    busy: false,
    onToggleEnabled: jest.fn(),
    onRefresh: jest.fn(),
    onReconcile: jest.fn(),
    onClearActivity: jest.fn(),
    ...overrides,
  };
  render(<AccountSourcePortfolio {...props} />);
  return props;
}

describe("AccountSourcePortfolio", () => {
  it("explains how to turn it on when the service is not configured", () => {
    renderTool({ serviceUrl: "" });
    expect(screen.getByText(/PORTFOLIO_SERVICE_URL is empty/)).toBeVisible();
  });

  it("shows each account against the service, and what no account needs", () => {
    renderTool();
    expect(screen.getByText("registered")).toBeVisible();
    expect(screen.getByText("no strategy")).toBeVisible();
    expect(screen.getByText("pending")).toBeVisible();
    expect(screen.getByText("ethereum:0xab is uninitialized")).toBeVisible();
    expect(screen.getByText(/Reconcile removes it/)).toBeVisible();
    expect(screen.getByText(/2 synchronized/)).toBeVisible();
    expect(screen.getByText("Registered 1: evm")).toBeVisible();
  });

  it("runs the actions", async () => {
    const props = renderTool();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Reconcile" }));
    expect(props.onToggleEnabled).toHaveBeenCalledWith(false);
    expect(props.onReconcile).toHaveBeenCalled();
  });

  it("holds the service calls while one is going", () => {
    renderTool({ busy: true });
    expect(screen.getByRole("button", { name: "Reconcile" })).toBeDisabled();
    expect(screen.getByRole("checkbox")).toBeEnabled();
  });
});
