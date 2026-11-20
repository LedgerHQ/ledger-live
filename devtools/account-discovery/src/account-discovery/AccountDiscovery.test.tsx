import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import type { AccountDiscoveryState, AccountDiscoveryToolProps } from "../types";
import AccountDiscovery from "./AccountDiscovery";

const ethereum = CryptoCurrencyIdSchema.parse("ethereum");
const bitcoin = CryptoCurrencyIdSchema.parse("bitcoin");

const idle: AccountDiscoveryState = {
  status: "idle",
  rows: [],
  counters: { derivations: 0, statusReads: 0 },
  selection: { completable: 0, addable: 0 },
  completion: { status: "idle" },
};

const props = (over: Partial<AccountDiscoveryToolProps> = {}): AccountDiscoveryToolProps => ({
  currencies: [
    { id: ethereum, name: "Ethereum" },
    { id: bitcoin, name: "Bitcoin" },
  ],
  state: idle,
  onScan: jest.fn(),
  onToggle: jest.fn(),
  onComplete: jest.fn(),
  onAdd: jest.fn(),
  ...over,
});

describe("AccountDiscovery", () => {
  it("keeps the currency of the retained scan picked when reopened", async () => {
    const onScan = jest.fn();
    render(
      <AccountDiscovery
        {...props({ onScan, state: { ...idle, status: "done", currencyId: bitcoin } })}
      />,
    );
    expect(screen.getByLabelText("Currency")).toHaveValue("bitcoin");
    await userEvent.click(screen.getByRole("button", { name: "Scan" }));
    expect(onScan).toHaveBeenCalledWith(bitcoin);
  });

  it("scans the picked currency", async () => {
    const onScan = jest.fn();
    render(<AccountDiscovery {...props({ onScan })} />);
    await userEvent.selectOptions(screen.getByLabelText("Currency"), "bitcoin");
    await userEvent.click(screen.getByRole("button", { name: "Scan" }));
    expect(onScan).toHaveBeenCalledWith(bitcoin);
  });

  it("lists the accounts found with what the scan cost", () => {
    const state: AccountDiscoveryState = {
      ...idle,
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
    render(<AccountDiscovery {...props({ state })} />);
    expect(
      screen.getByText("Scanning… 1 used account · 3 derivations, 2 status reads"),
    ).toBeVisible();
    expect(screen.getByText("default #0")).toBeVisible();
    expect(screen.getByText("· onboarding")).toBeVisible();
    expect(screen.getByText("+1.5 s")).toBeVisible();
    expect(screen.getByText("+20 ms")).toBeVisible();
  });

  describe("selection, completion and add", () => {
    const row = {
      derivationMode: "",
      used: true,
      descriptor: "account:2:address:aleo:main:aleo1a:m/44h/683h/0h/0h",
      foundAtMs: 10,
      needsCompletion: true,
    } as const;
    const state: AccountDiscoveryState = {
      ...idle,
      status: "done",
      rows: [
        { ...row, key: "a", index: 0, selected: true, completion: "completed" },
        { ...row, key: "b", index: 1, selected: true, completion: "refused" },
        { ...row, key: "c", index: 2, added: true },
      ],
      selection: { completable: 1, addable: 1 },
    };

    it("shows where each account stands, without its completed key", () => {
      render(<AccountDiscovery {...props({ state })} />);
      expect(screen.getByText("· completed")).toBeVisible();
      expect(screen.getByText("· refused")).toBeVisible();
      expect(screen.getByText("· added")).toBeVisible();
      expect(screen.getByLabelText("Select default #0")).toBeChecked();
      expect(screen.getByLabelText("Select default #2")).toBeDisabled();
    });

    it("toggles, completes and adds the selection", async () => {
      const onToggle = jest.fn();
      const onComplete = jest.fn();
      const onAdd = jest.fn();
      render(<AccountDiscovery {...props({ state, onToggle, onComplete, onAdd })} />);
      await userEvent.click(screen.getByLabelText("Select default #1"));
      await userEvent.click(screen.getByRole("button", { name: "Complete selected" }));
      await userEvent.click(screen.getByRole("button", { name: "Add 1" }));
      expect(onToggle).toHaveBeenCalledWith("b");
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onAdd).toHaveBeenCalledTimes(1);
    });

    it("shows why a completion failed", () => {
      const failed: AccountDiscoveryState = {
        ...state,
        rows: [
          {
            ...row,
            key: "a",
            index: 0,
            completion: "failed",
            completionError: "use the device and seed used for the scan",
          },
        ],
      };
      render(<AccountDiscovery {...props({ state: failed })} />);
      expect(screen.getByText("· failed: use the device and seed used for the scan")).toBeVisible();
    });

    it("locks the page while the completion runs", () => {
      render(
        <AccountDiscovery
          {...props({ state: { ...state, completion: { status: "completing" } } })}
        />,
      );
      expect(screen.getByText("Completing…")).toBeVisible();
      expect(screen.getByRole("button", { name: "Complete selected" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Add 1" })).toBeDisabled();
      expect(screen.getByLabelText("Select default #0")).toBeDisabled();
    });
  });

  it("shows the error of a failed scan", () => {
    render(<AccountDiscovery {...props({ state: { ...idle, status: "error", error: "boom" } })} />);
    expect(screen.getByText("boom")).toBeVisible();
  });
});
