import { render, screen } from "@testing-library/react";
import { FlagEnableIndicator } from "./FlagEnableIndicator.web";

describe("FlagEnableIndicator", () => {
  it("renders 'On' with success styling when enabled", () => {
    const { container } = render(<FlagEnableIndicator enabled={true} />);
    expect(screen.getByText("On")).toBeInTheDocument();
    expect(container.querySelector(".bg-success")).toBeInTheDocument();
    expect(container.querySelector(".bg-success-strong")).toBeInTheDocument();
  });

  it("renders 'Off' with muted styling when disabled", () => {
    const { container } = render(<FlagEnableIndicator enabled={false} />);
    expect(screen.getByText("Off")).toBeInTheDocument();
    expect(container.querySelector(".bg-muted")).toBeInTheDocument();
    expect(container.querySelector(".bg-muted-strong")).toBeInTheDocument();
  });
});
