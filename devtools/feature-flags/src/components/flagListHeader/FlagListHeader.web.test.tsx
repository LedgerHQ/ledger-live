import { render, screen } from "@testing-library/react";
import { FlagListHeader } from "./FlagListHeader.web";

describe("FlagListHeader", () => {
  it("renders the filtered/total count", () => {
    render(<FlagListHeader overrideCount={0} numberOfFlags={10} numberOfFilteredFlags={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("of")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("does not render the override pill when overrideCount is 0", () => {
    render(<FlagListHeader overrideCount={0} numberOfFlags={10} numberOfFilteredFlags={3} />);
    expect(screen.queryByText(/overridden/)).not.toBeInTheDocument();
  });

  it("renders the override pill when overrideCount is greater than 0", () => {
    render(<FlagListHeader overrideCount={5} numberOfFlags={10} numberOfFilteredFlags={3} />);
    expect(screen.getByText("5 overridden")).toBeInTheDocument();
  });
});
