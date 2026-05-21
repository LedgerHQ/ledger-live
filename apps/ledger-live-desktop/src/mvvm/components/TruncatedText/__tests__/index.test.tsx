import React from "react";
import { render, screen, act } from "tests/testSetup";
import { TruncatedText } from "../index";

type TooltipProps = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  children: React.ReactNode;
};

let capturedOnOpenChange: ((value: boolean) => void) | undefined;

// Radix Tooltip does not handle pointerLeave in JSDOM, so we mock
// lumen-ui-react to capture onOpenChange and drive it manually.
jest.mock("@ledgerhq/lumen-ui-react", () => ({
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

const TEXT = "Very long balance text that gets truncated in a narrow cell";

function getTriggerElement(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>(".truncate");
  if (!el) throw new Error("Trigger element not found");
  return el;
}

function setTruncationMetrics(el: HTMLElement, scrollWidth: number, clientWidth: number) {
  Object.defineProperty(el, "scrollWidth", { configurable: true, value: scrollWidth });
  Object.defineProperty(el, "clientWidth", { configurable: true, value: clientWidth });
}

describe("TruncatedText", () => {
  beforeEach(() => {
    capturedOnOpenChange = undefined;
  });

  it("should render the text with truncation styles and forward className", () => {
    const { container } = render(<TruncatedText text={TEXT} className="custom-class" />);
    const trigger = getTriggerElement(container);

    expect(trigger).toHaveTextContent(TEXT);
    expect(trigger).toHaveClass("custom-class", "truncate", "min-w-0", "max-w-full");
    expect(screen.getByTestId("tooltip-content")).toHaveTextContent(TEXT);
  });

  it("should open the tooltip only when the text overflows its container", () => {
    const { container } = render(<TruncatedText text={TEXT} />);
    const trigger = getTriggerElement(container);
    const tooltip = screen.getByTestId("tooltip");

    setTruncationMetrics(trigger, 100, 100);
    act(() => capturedOnOpenChange!(true));
    expect(tooltip).toHaveAttribute("data-open", "false");

    setTruncationMetrics(trigger, 200, 100);
    act(() => capturedOnOpenChange!(true));
    expect(tooltip).toHaveAttribute("data-open", "true");
  });

  it("should close the tooltip when onOpenChange receives false", () => {
    const { container } = render(<TruncatedText text={TEXT} />);
    const trigger = getTriggerElement(container);
    const tooltip = screen.getByTestId("tooltip");

    setTruncationMetrics(trigger, 200, 100);
    act(() => capturedOnOpenChange!(true));
    expect(tooltip).toHaveAttribute("data-open", "true");

    act(() => capturedOnOpenChange!(false));
    expect(tooltip).toHaveAttribute("data-open", "false");
  });
});
