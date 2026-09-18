import { render, screen, fireEvent } from "@support/jest-devtools/web";
import { RandomTab } from "./RandomTab";

describe("RandomTab", () => {
  const COUNTS = ["1", "2", "5", "10", "25", "50", "100"] as const;

  it("renders all 7 count buttons", () => {
    render(<RandomTab onGenerate={jest.fn()} />);
    COUNTS.forEach(n => {
      expect(screen.getByRole("button", { name: n })).toBeInTheDocument();
    });
  });

  it("calls onGenerate with the numeric count when a button is clicked", () => {
    const onGenerate = jest.fn();
    render(<RandomTab onGenerate={onGenerate} />);
    fireEvent.click(screen.getByRole("button", { name: "25" }));
    expect(onGenerate).toHaveBeenCalledWith(25);
  });

  it("calls onGenerate once per button click", () => {
    const onGenerate = jest.fn();
    render(<RandomTab onGenerate={onGenerate} />);
    COUNTS.forEach(n => fireEvent.click(screen.getByRole("button", { name: n })));
    expect(onGenerate).toHaveBeenCalledTimes(7);
  });
});
