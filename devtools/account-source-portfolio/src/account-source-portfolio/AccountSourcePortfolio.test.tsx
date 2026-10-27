import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountSourcePortfolio from "./AccountSourcePortfolio";
import type { PortfolioSourceToolProps } from "../types";

function renderTool(overrides: Partial<PortfolioSourceToolProps> = {}) {
  const props: PortfolioSourceToolProps = {
    serviceUrl: "https://portfolio",
    enabled: true,
    accounts: [
      {
        accountUUID: "aaaaaaaa-1",
        label: "ethereum 0xab",
        supported: true,
        registered: true,
        serverAccountId: "ethereum:0xab",
        serverStatus: "uninitialized",
        outcome: { status: "waiting", detail: "Service account uninitialized", rows: 0, at: 0 },
      },
      {
        accountUUID: "bbbbbbbb-1",
        label: "polygon 0xab",
        supported: true,
        registered: true,
        serverAccountId: "polygon:0xab",
        serverStatus: "synchronized",
        outcome: { status: "served", rows: 2, at: 0 },
      },
      { accountUUID: "cccccccc-1", label: "bitcoin xpub", supported: false, registered: false },
    ],
    extraRegistrations: [{ id: "reg-old", type: "evm", label: "0xdead" }],
    activity: [{ id: 0, at: 0, ok: true, summary: "Registered 1 addresses" }],
    busy: false,
    onToggleEnabled: jest.fn(),
    onRefresh: jest.fn(),
    onReconcile: jest.fn(),
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
    expect(screen.getAllByText("registered")).toHaveLength(2);
    expect(screen.getByText("not supported")).toBeVisible();
    expect(screen.getByText("ethereum:0xab")).toBeVisible();
    expect(screen.getByText("fell through: waiting")).toBeVisible();
    expect(screen.getByText("Service account uninitialized")).toBeVisible();
    expect(screen.getByText("served")).toBeVisible();
    expect(screen.getByText(/Reconcile removes it/)).toBeVisible();
    expect(screen.getByText("Registered 1 addresses")).toBeVisible();
  });

  it("runs the actions", async () => {
    const props = renderTool();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await userEvent.click(screen.getByRole("button", { name: "Reconcile" }));
    expect(props.onToggleEnabled).toHaveBeenCalledWith(false);
    expect(props.onRefresh).toHaveBeenCalled();
    expect(props.onReconcile).toHaveBeenCalled();
  });

  it("holds the service calls while one is going", () => {
    renderTool({ busy: true });
    expect(screen.getByRole("button", { name: "Reconcile" })).toBeDisabled();
    expect(screen.getByRole("checkbox")).toBeEnabled();
  });
});
