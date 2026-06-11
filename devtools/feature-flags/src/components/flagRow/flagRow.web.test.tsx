import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FlagDisplayState } from "../../types";
import { FlagRow } from "../../components";

const baseDisplay: FlagDisplayState = {
  id: "mockFeature",
  resolved: { enabled: false },
  isOverridden: false,
};

describe("FlagRow", () => {
  it("renders the flag id and 'Off' indicator when disabled", () => {
    render(<FlagRow display={baseDisplay} setOverride={jest.fn()} onSelect={jest.fn()} />);
    expect(screen.getByText("mockFeature")).toBeInTheDocument();
    expect(screen.getByText("Off")).toBeInTheDocument();
  });

  it("renders 'On' indicator when enabled", () => {
    render(
      <FlagRow
        display={{ ...baseDisplay, resolved: { enabled: true } }}
        setOverride={jest.fn()}
        onSelect={jest.fn()}
      />,
    );
    expect(screen.getByText("On")).toBeInTheDocument();
  });

  it("applies overridden background classes when isOverridden", () => {
    const { container } = render(
      <FlagRow
        display={{ ...baseDisplay, isOverridden: true }}
        setOverride={jest.fn()}
        onSelect={jest.fn()}
      />,
    );
    expect(container.querySelector(".bg-active-subtle")).toBeInTheDocument();
  });

  it("applies default hover classes when not overridden", () => {
    const { container } = render(
      <FlagRow display={baseDisplay} setOverride={jest.fn()} onSelect={jest.fn()} />,
    );
    expect(container.querySelector(".hover\\:bg-muted-hover")).toBeInTheDocument();
    expect(container.querySelector(".bg-active-subtle")).not.toBeInTheDocument();
  });

  it("calls setOverride with toggled enabled value when switch is clicked", async () => {
    const setOverride = jest.fn();
    const user = userEvent.setup();
    render(<FlagRow display={baseDisplay} setOverride={setOverride} onSelect={jest.fn()} />);
    await user.click(screen.getByRole("switch"));
    expect(setOverride).toHaveBeenCalledWith("mockFeature", { enabled: true });
  });

  it("merges existing override fields when toggling", async () => {
    const setOverride = jest.fn();
    const user = userEvent.setup();
    render(
      <FlagRow
        display={{
          ...baseDisplay,
          resolved: { enabled: true, params: "value" },
          isOverridden: true,
        }}
        setOverride={setOverride}
        onSelect={jest.fn()}
      />,
    );
    await user.click(screen.getByRole("switch"));
    expect(setOverride).toHaveBeenCalledWith("mockFeature", { params: "value", enabled: false });
  });

  describe("selection", () => {
    it("calls onSelect when the row body is clicked", async () => {
      const onSelect = jest.fn();
      const user = userEvent.setup();
      render(<FlagRow display={baseDisplay} setOverride={jest.fn()} onSelect={onSelect} />);
      await user.click(screen.getByText("mockFeature"));
      expect(onSelect).toHaveBeenCalled();
    });

    it("does not call onSelect when the switch is clicked", async () => {
      const onSelect = jest.fn();
      const user = userEvent.setup();
      render(<FlagRow display={baseDisplay} setOverride={jest.fn()} onSelect={onSelect} />);
      await user.click(screen.getByRole("switch"));
      expect(onSelect).not.toHaveBeenCalled();
    });
  });
});
