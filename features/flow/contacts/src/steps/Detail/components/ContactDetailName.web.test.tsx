import React from "react";
import { act, render, screen } from "@testing-library/react";
import { ContactDetailName } from "./ContactDetailName.web";

type TooltipProps = Readonly<{
  children: React.ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}>;

let onTooltipOpenChange: TooltipProps["onOpenChange"] | undefined;

jest.mock("@ledgerhq/lumen-ui-react", () => ({
  Tooltip: ({ children, onOpenChange, open }: TooltipProps) => {
    onTooltipOpenChange = onOpenChange;
    return (
      <div data-testid="contacts-detail-name-tooltip" data-open={String(open)}>
        {children}
      </div>
    );
  },
  TooltipTrigger: ({ children }: Readonly<{ children: React.ReactNode }>) => <>{children}</>,
  TooltipContent: ({ children }: Readonly<{ children: React.ReactNode }>) => <>{children}</>,
}));

function setTextMetrics(element: HTMLElement, scrollWidth: number, clientWidth: number) {
  Object.defineProperty(element, "scrollWidth", { configurable: true, value: scrollWidth });
  Object.defineProperty(element, "clientWidth", { configurable: true, value: clientWidth });
}

describe("ContactDetailName", () => {
  beforeEach(() => {
    onTooltipOpenChange = undefined;
  });

  it("should show the full name in a tooltip only when the title is truncated", () => {
    const name = "Z".repeat(64);
    render(<ContactDetailName name={name} />);

    const title = screen.getByTestId("contacts-detail-name");
    const tooltip = screen.getByTestId("contacts-detail-name-tooltip");

    expect(title).toHaveTextContent(name);
    expect(title).toHaveClass("min-w-0", "max-w-full", "truncate");

    setTextMetrics(title, 100, 100);
    act(() => onTooltipOpenChange!(true));
    expect(tooltip).toHaveAttribute("data-open", "false");

    setTextMetrics(title, 200, 100);
    act(() => onTooltipOpenChange!(true));
    expect(tooltip).toHaveAttribute("data-open", "true");

    act(() => onTooltipOpenChange!(false));
    expect(tooltip).toHaveAttribute("data-open", "false");
  });
});
