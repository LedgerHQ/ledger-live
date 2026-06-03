import React from "react";
import { render, screen, act } from "tests/testSetup";
import { AwarenessModalClampedText } from "../AwarenessModalClampedText";

type TooltipProps = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  children: React.ReactNode;
};

let capturedOnOpenChange: ((value: boolean) => void) | undefined;

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

const TEXT = "Very long awareness modal text that should be clamped in the layout";

function getTriggerElement(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>("[data-testid='awareness-modal-clamped-text']");
  if (!el) throw new Error("Trigger element not found");
  return el;
}

describe("AwarenessModalClampedText", () => {
  beforeEach(() => {
    capturedOnOpenChange = undefined;
  });

  it("should apply single-line truncation styles", () => {
    const { container } = render(
      <AwarenessModalClampedText text={TEXT} maxLines={1} className="custom-class" />,
    );

    const trigger = getTriggerElement(container);
    expect(trigger).toHaveTextContent(TEXT);
    expect(trigger).toHaveClass("custom-class", "truncate", "min-w-0", "max-w-full");
    expect(trigger).toHaveStyle({ display: "block" });
    expect(trigger.style.getPropertyValue("-webkit-line-clamp")).toBe("");
  });

  it("should apply multiline webkit line clamp styles", () => {
    const { container } = render(
      <AwarenessModalClampedText text={TEXT} maxLines={3} className="custom-class" />,
    );

    const trigger = getTriggerElement(container);
    expect(trigger).toHaveClass("custom-class", "min-w-0", "max-w-full");
    expect(trigger).not.toHaveClass("truncate");
    expect(trigger).toHaveStyle({ display: "-webkit-box", overflow: "hidden" });
    expect(trigger.style.getPropertyValue("-webkit-line-clamp")).toBe("3");
  });

  it("should open the tooltip when multiline text overflows vertically", () => {
    const { container } = render(<AwarenessModalClampedText text={TEXT} maxLines={2} />);
    const trigger = getTriggerElement(container);
    const tooltip = screen.getByTestId("tooltip");

    Object.defineProperty(trigger, "scrollHeight", { configurable: true, value: 80 });
    Object.defineProperty(trigger, "clientHeight", { configurable: true, value: 40 });
    act(() => capturedOnOpenChange!(true));
    expect(tooltip).toHaveAttribute("data-open", "true");
  });
});
