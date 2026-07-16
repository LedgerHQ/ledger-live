import { render, screen } from "jest/render.native";
import { FlagCountIndicator } from "./FlagCountIndicator.native";

describe("FlagCountIndicator (native)", () => {
  it("shows the filtered count out of the total", () => {
    render(
      <FlagCountIndicator
        filteredCount={3}
        counts={{ all: 10, enabled: 0, disabled: 0, overridden: 0 }}
      />,
    );
    expect(screen.getByText("3 of 10")).toBeOnTheScreen();
  });

  it("shows how many flags are overridden when some are", () => {
    render(
      <FlagCountIndicator
        filteredCount={0}
        counts={{ all: 10, enabled: 0, disabled: 0, overridden: 2 }}
      />,
    );
    expect(screen.getByText("2 overridden")).toBeOnTheScreen();
  });

  it("hides the overridden count when none are overridden", () => {
    render(
      <FlagCountIndicator
        filteredCount={0}
        counts={{ all: 10, enabled: 0, disabled: 0, overridden: 0 }}
      />,
    );
    expect(screen.queryByText(/overridden/)).toBeNull();
  });
});
