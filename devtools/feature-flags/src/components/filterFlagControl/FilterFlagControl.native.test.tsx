import { render, screen } from "jest/render.native";
import { FilterFlagControl } from "./FilterFlagControl";

describe("FilterFlagControl (native)", () => {
  it("exposes the All, Enabled, Disabled and Overridden filters", () => {
    render(<FilterFlagControl filter="all" setFilter={jest.fn()} />);
    expect(screen.getByText("All")).toBeOnTheScreen();
    expect(screen.getByText("Enabled")).toBeOnTheScreen();
    expect(screen.getByText("Disabled")).toBeOnTheScreen();
    expect(screen.getByText("Overridden")).toBeOnTheScreen();
  });
});
