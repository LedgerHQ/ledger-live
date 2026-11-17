import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AccountDiscoveryState, AccountDiscoveryToolProps } from "../types";
import AccountDiscovery from "./AccountDiscovery";

const idle: AccountDiscoveryState = {
  status: "idle",
  rows: [],
  counters: { derivations: 0, statusReads: 0 },
};

const props = (over: Partial<AccountDiscoveryToolProps> = {}): AccountDiscoveryToolProps => ({
  currencies: [
    { id: "ethereum", name: "Ethereum" },
    { id: "bitcoin", name: "Bitcoin" },
  ],
  state: idle,
  onScan: jest.fn(),
  onStop: jest.fn(),
  ...over,
});

describe("AccountDiscovery", () => {
  it("keeps the currency of the retained scan picked when reopened", async () => {
    const onScan = jest.fn();
    render(
      <AccountDiscovery
        {...props({ onScan, state: { ...idle, status: "done", currencyId: "bitcoin" } })}
      />,
    );
    expect(screen.getByLabelText("Currency")).toHaveValue("bitcoin");
    await userEvent.click(screen.getByRole("button", { name: "Scan" }));
    expect(onScan).toHaveBeenCalledWith("bitcoin");
  });

  it("scans the picked currency", async () => {
    const onScan = jest.fn();
    render(<AccountDiscovery {...props({ onScan })} />);
    await userEvent.selectOptions(screen.getByLabelText("Currency"), "bitcoin");
    await userEvent.click(screen.getByRole("button", { name: "Scan" }));
    expect(onScan).toHaveBeenCalledWith("bitcoin");
  });

  it("lists the accounts found with what the scan cost, and stops on demand", async () => {
    const onStop = jest.fn();
    const state: AccountDiscoveryState = {
      status: "scanning",
      rows: [
        {
          key: "a",
          derivationMode: "",
          index: 0,
          used: true,
          descriptor: "account:2:address:ethereum:main:0xabc:m/44h/60h/0h/0/0",
          foundAtMs: 1500,
        },
        {
          key: "b",
          derivationMode: "ethM",
          index: 1,
          used: false,
          gate: "onboarding",
          descriptor: "account:2:address:ethereum:main:0xdef:m/44h/60h/0h/1",
          foundAtMs: 20,
        },
      ],
      counters: { derivations: 3, statusReads: 2 },
    };
    render(<AccountDiscovery {...props({ state, onStop })} />);
    expect(
      screen.getByText("Scanning… 1 used account · 3 derivations, 2 status reads"),
    ).toBeVisible();
    expect(screen.getByText("default #0")).toBeVisible();
    expect(screen.getByText("· onboarding")).toBeVisible();
    expect(screen.getByText("+1.5 s")).toBeVisible();
    expect(screen.getByText("+20 ms")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(onStop).toHaveBeenCalled();
  });

  it("shows the error of a failed scan", () => {
    render(<AccountDiscovery {...props({ state: { ...idle, status: "error", error: "boom" } })} />);
    expect(screen.getByText("boom")).toBeVisible();
  });
});
