import { render, screen, userEvent } from "@support/jest-devtools/native";
import { RandomTab } from "./RandomTab";

describe("RandomTab (native)", () => {
  const COUNTS = ["1", "2", "5", "10", "25", "50", "100"] as const;

  it("renders all 7 count buttons", () => {
    render(<RandomTab onGenerate={jest.fn()} />);
    COUNTS.forEach(n => {
      expect(screen.getAllByText(n)[0]).toBeOnTheScreen();
    });
  });

  it("calls onGenerate with the numeric count when a button is pressed", async () => {
    const onGenerate = jest.fn();
    const user = userEvent.setup();
    render(<RandomTab onGenerate={onGenerate} />);
    await user.press(screen.getAllByText("25")[0]);
    expect(onGenerate).toHaveBeenCalledWith(25);
  });
});
