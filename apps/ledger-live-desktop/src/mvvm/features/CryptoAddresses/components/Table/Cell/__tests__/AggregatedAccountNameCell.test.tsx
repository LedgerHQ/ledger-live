import React from "react";
import { act, render, screen } from "tests/testSetup";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { AggregatedAccountNameCell } from "../AggregatedAccountNameCell";

const account = { type: "Account", currency: getCryptoCurrencyById("bitcoin") } as Account;

const TOOLTIP_DELAY_MS = 2000;

const renderCell = (tag?: string) =>
  render(
    <table>
      <tbody>
        <tr>
          <AggregatedAccountNameCell account={account} displayName="BTC Gold" tag={tag} />
        </tr>
      </tbody>
    </table>,
    { userEventOptions: { advanceTimers: jest.advanceTimersByTime } },
  );

function setLabelWidths(label: HTMLElement, scrollWidth: number, clientWidth: number) {
  Object.defineProperty(label, "scrollWidth", { configurable: true, value: scrollWidth });
  Object.defineProperty(label, "clientWidth", { configurable: true, value: clientWidth });
}

const isInTooltip = (element: HTMLElement) => element.closest("[role='tooltip']") !== null;

describe("AggregatedAccountNameCell", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the address type next to the name of the account", () => {
    renderCell("Native segwit");

    expect(screen.getByText("BTC Gold")).toBeInTheDocument();
    expect(screen.getByText("Native segwit")).toBeInTheDocument();
  });

  it("shows only the name when the account has no address type", () => {
    renderCell();

    expect(screen.getByText("BTC Gold")).toBeInTheDocument();
    expect(screen.queryByText("Native segwit")).toBeNull();
  });

  it("shows the full address type in a tooltip when the tag is cut", async () => {
    const { user } = renderCell("Native segwit");
    const label = screen.getByText("Native segwit");
    setLabelWidths(label, 80, 40);

    await user.hover(label);
    act(() => {
      jest.advanceTimersByTime(TOOLTIP_DELAY_MS);
    });

    expect(screen.getAllByText("Native segwit").some(isInTooltip)).toBe(true);
  });

  it("does not show a tooltip when the tag fits", async () => {
    const { user } = renderCell("Native segwit");
    const label = screen.getByText("Native segwit");
    setLabelWidths(label, 80, 80);

    await user.hover(label);
    act(() => {
      jest.advanceTimersByTime(TOOLTIP_DELAY_MS);
    });

    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(screen.getAllByText("Native segwit").some(isInTooltip)).toBe(false);
  });
});
