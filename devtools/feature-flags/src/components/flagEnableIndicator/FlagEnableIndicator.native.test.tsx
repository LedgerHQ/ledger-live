import { render, screen } from "@support/jest-devtools-fixtures/native";
import { FlagEnableIndicator } from "./FlagEnableIndicator";

describe("FlagEnableIndicator (native)", () => {
  it("shows 'On' when enabled", () => {
    render(<FlagEnableIndicator enabled={true} />);
    expect(screen.getByText("On")).toBeOnTheScreen();
  });

  it("shows 'Off' when disabled", () => {
    render(<FlagEnableIndicator enabled={false} />);
    expect(screen.getByText("Off")).toBeOnTheScreen();
  });
});
