import React from "react";
import { act, render, screen } from "tests/testSetup";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { AggregatedAccountNameCell } from "../AggregatedAccountNameCell";

type TooltipProps = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  children: React.ReactNode;
};

let capturedOnOpenChange: ((value: boolean) => void) | undefined;

// Radix Tooltip does not handle hover in JSDOM, so we capture onOpenChange and drive it manually.
jest.mock("@ledgerhq/lumen-ui-react", () => ({
  ...jest.requireActual("@ledgerhq/lumen-ui-react"),
  Tooltip: ({ open, onOpenChange, children }: TooltipProps) => {
    capturedOnOpenChange = onOpenChange;
    return (
      <div data-testid="tooltip" data-open={String(open)}>
        {children}
      </div>
    );
  },
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
}));

const account = { type: "Account", currency: getCryptoCurrencyById("bitcoin") } as Account;

const renderCell = (tag?: string) =>
  render(
    <table>
      <tbody>
        <tr>
          <AggregatedAccountNameCell account={account} displayName="BTC Gold" tag={tag} />
        </tr>
      </tbody>
    </table>,
  );

function setTruncationMetrics(element: HTMLElement, scrollWidth: number, clientWidth: number) {
  Object.defineProperty(element, "scrollWidth", { configurable: true, value: scrollWidth });
  Object.defineProperty(element, "clientWidth", { configurable: true, value: clientWidth });
}

describe("AggregatedAccountNameCell", () => {
  beforeEach(() => {
    capturedOnOpenChange = undefined;
  });

  it("shows the address type next to the name of the account", () => {
    renderCell("Native segwit");

    expect(screen.getByText("BTC Gold")).toBeInTheDocument();
    expect(screen.getAllByText("Native segwit")[0]).toBeInTheDocument();
  });

  it("shows only the name when the account has no address type", () => {
    renderCell();

    expect(screen.getByText("BTC Gold")).toBeInTheDocument();
    expect(screen.queryByText("Native segwit")).toBeNull();
    expect(screen.queryByTestId("tooltip")).toBeNull();
  });

  it("shows the full address type in a tooltip only when the tag is cut", () => {
    renderCell("Native segwit");
    const tagLabel = screen.getAllByText("Native segwit")[0];
    const tooltip = screen.getByTestId("tooltip");
    expect(screen.getByTestId("tooltip-content")).toHaveTextContent("Native segwit");

    setTruncationMetrics(tagLabel, 80, 80);
    act(() => capturedOnOpenChange!(true));
    expect(tooltip).toHaveAttribute("data-open", "false");

    setTruncationMetrics(tagLabel, 80, 40);
    act(() => capturedOnOpenChange!(true));
    expect(tooltip).toHaveAttribute("data-open", "true");

    act(() => capturedOnOpenChange!(false));
    expect(tooltip).toHaveAttribute("data-open", "false");
  });
});
