import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FlagDisplayState } from "../../types";
import { Sidebar } from "./Sidebar.web";
import type { SidebarProps } from "./Sidebar.web";

const baseDisplay: FlagDisplayState = {
  id: "mockFeature",
  resolved: { enabled: false },
  isOverridden: false,
};

const resolvedJson = JSON.stringify({ enabled: false }, null, 2);

const makeProps = (overrides: Partial<SidebarProps> = {}): SidebarProps => ({
  setOverride: jest.fn(),
  display: baseDisplay,
  onClose: jest.fn(),
  clearOverride: jest.fn(),
  ...overrides,
});

describe("Sidebar", () => {
  it("renders the selected flag id", () => {
    render(<Sidebar {...makeProps()} />);
    expect(screen.getByText("mockFeature")).toBeInTheDocument();
  });

  it("seeds the JSON editor with the resolved value", () => {
    render(<Sidebar {...makeProps()} />);
    expect(screen.getByRole("textbox")).toHaveValue(resolvedJson);
  });

  it("calls onClose when the footer Cancel button is clicked", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<Sidebar {...makeProps({ onClose })} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the darken-screen overlay is clicked", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    const { container } = render(<Sidebar {...makeProps({ onClose })} />);
    await user.click(container.querySelector(".fixed")!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("disables Apply while the editor matches the resolved value", () => {
    render(<Sidebar {...makeProps()} />);
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  });

  it("enables Apply once the editor holds a different valid value", () => {
    render(<Sidebar {...makeProps()} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: '{ "enabled": true }' } });
    expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();
  });

  it("applies the edited value via setOverride when Apply is clicked", async () => {
    const setOverride = jest.fn();
    const user = userEvent.setup();
    render(<Sidebar {...makeProps({ setOverride })} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: '{ "enabled": true }' } });
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(setOverride).toHaveBeenCalledWith("mockFeature", { enabled: true });
  });

  it("toggles the flag via setOverride when the switch is clicked", async () => {
    const setOverride = jest.fn();
    const user = userEvent.setup();
    render(<Sidebar {...makeProps({ setOverride })} />);
    await user.click(screen.getByRole("switch"));
    expect(setOverride).toHaveBeenCalledWith("mockFeature", { enabled: true });
  });

  it("does not show Restore when the flag is not overridden", () => {
    render(<Sidebar {...makeProps()} />);
    expect(screen.queryByRole("button", { name: "Restore" })).not.toBeInTheDocument();
  });

  it("clears the override via clearOverride when Restore is clicked", async () => {
    const clearOverride = jest.fn();
    const user = userEvent.setup();
    render(
      <Sidebar
        {...makeProps({ clearOverride, display: { ...baseDisplay, isOverridden: true } })}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Restore" }));
    expect(clearOverride).toHaveBeenCalledWith("mockFeature");
  });
});
