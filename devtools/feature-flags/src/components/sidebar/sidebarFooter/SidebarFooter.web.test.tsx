import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarFooter } from "./SidebarFooter.web";
import type { SidebarFooterProps } from "./SidebarFooter.web";

const makeProps = (overrides: Partial<SidebarFooterProps> = {}): SidebarFooterProps => ({
  onClose: jest.fn(),
  onApplyOverride: jest.fn(),
  overrideDisabled: false,
  ...overrides,
});

describe("SidebarFooter", () => {
  it("renders the Cancel and Apply buttons", () => {
    render(<SidebarFooter {...makeProps()} />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<SidebarFooter {...makeProps({ onClose })} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onApplyOverride when Apply is clicked", async () => {
    const onApplyOverride = jest.fn();
    const user = userEvent.setup();
    render(<SidebarFooter {...makeProps({ onApplyOverride })} />);
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(onApplyOverride).toHaveBeenCalledTimes(1);
  });

  it("disables the Apply button when overrideDisabled is true", () => {
    render(<SidebarFooter {...makeProps({ overrideDisabled: true })} />);
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  });

  it("does not call onApplyOverride when the disabled Apply button is clicked", async () => {
    const onApplyOverride = jest.fn();
    const user = userEvent.setup();
    render(<SidebarFooter {...makeProps({ onApplyOverride, overrideDisabled: true })} />);
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(onApplyOverride).not.toHaveBeenCalled();
  });

  it("enables the Apply button when overrideDisabled is false", () => {
    render(<SidebarFooter {...makeProps({ overrideDisabled: false })} />);
    expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();
  });
});
