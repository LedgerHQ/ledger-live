import { render, screen } from "@testing-library/react";
import { Pill } from "./Pill";

describe("Pill", () => {
  it("renders its children", () => {
    render(<Pill variant="success">Enabled</Pill>);
    expect(screen.getByText("Enabled")).toBeInTheDocument();
  });

  it.each([
    ["success", "bg-success", "text-success"],
    ["muted", "bg-muted", "text-muted"],
    ["active", "bg-active-subtle", "text-active"],
  ] as const)("applies palette classes for variant %s", (variant, bg, text) => {
    render(<Pill variant={variant}>label</Pill>);
    const el = screen.getByText("label");
    expect(el).toHaveClass(bg);
    expect(el).toHaveClass(text);
  });

  it.each([1, 2, 3, 4] as const)("applies body-%s class for size %s", size => {
    render(
      <Pill variant="muted" size={size}>
        sized
      </Pill>,
    );
    expect(screen.getByText("sized")).toHaveClass(`body-${size}`);
  });
});
