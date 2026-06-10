import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FlagDisplayState } from "../../../types";
import { SidebarTop } from "./SidebarTop.web";
import type { SidebarTopProps } from "./SidebarTop.web";

const baseDisplay: FlagDisplayState = {
  id: "mockFeature",
  resolved: { enabled: false },
  isOverridden: false,
};

const makeProps = (overrides: Partial<SidebarTopProps> = {}): SidebarTopProps => ({
  display: baseDisplay,
  onClose: jest.fn(),
  clearOverride: jest.fn(),
  toggleFeatureFlag: jest.fn(),
  ...overrides,
});

describe("SidebarTop", () => {
  it("renders the section header and flag id", () => {
    render(<SidebarTop {...makeProps()} />);
    expect(screen.getByText("Feature Flags")).toBeInTheDocument();
    expect(screen.getByText("mockFeature")).toBeInTheDocument();
  });

  it("shows 'Disabled' when the flag is off", () => {
    render(<SidebarTop {...makeProps()} />);
    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });

  it("shows 'Enabled' when the flag is on", () => {
    render(
      <SidebarTop {...makeProps({ display: { ...baseDisplay, resolved: { enabled: true } } })} />,
    );
    expect(screen.getByText("Enabled")).toBeInTheDocument();
  });

  it("reflects the disabled state on the switch", () => {
    render(<SidebarTop {...makeProps()} />);
    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("reflects the enabled state on the switch", () => {
    render(
      <SidebarTop {...makeProps({ display: { ...baseDisplay, resolved: { enabled: true } } })} />,
    );
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("calls toggleFeatureFlag with the toggled value when the switch is clicked", async () => {
    const toggleFeatureFlag = jest.fn();
    const user = userEvent.setup();
    render(<SidebarTop {...makeProps({ toggleFeatureFlag })} />);
    await user.click(screen.getByRole("switch"));
    expect(toggleFeatureFlag).toHaveBeenCalledWith(true);
  });

  it("calls onClose when the close icon is clicked", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    const { container } = render(<SidebarTop {...makeProps({ onClose })} />);
    await user.click(container.querySelector("svg")!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render the Restore button when the flag is not overridden", () => {
    render(<SidebarTop {...makeProps()} />);
    expect(screen.queryByRole("button", { name: "Restore" })).not.toBeInTheDocument();
  });

  it("renders the Restore button when the flag is overridden", () => {
    render(<SidebarTop {...makeProps({ display: { ...baseDisplay, isOverridden: true } })} />);
    expect(screen.getByRole("button", { name: "Restore" })).toBeInTheDocument();
  });

  it("calls clearOverride with the flag id when Restore is clicked", async () => {
    const clearOverride = jest.fn();
    const user = userEvent.setup();
    render(
      <SidebarTop
        {...makeProps({ clearOverride, display: { ...baseDisplay, isOverridden: true } })}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Restore" }));
    expect(clearOverride).toHaveBeenCalledWith("mockFeature");
  });
});
