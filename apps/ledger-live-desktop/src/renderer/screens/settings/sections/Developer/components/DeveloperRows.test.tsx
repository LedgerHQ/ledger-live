import React from "react";
import { render, screen } from "tests/testSetup";
import DeveloperActionsRow from "./DeveloperActionsRow";
import DeveloperToggleInputRow from "./DeveloperToggleInputRow";
import DeveloperClassicRow from "./DeveloperClassicRow";
import DeveloperExpandableRow from "./DeveloperExpandableRow";
import DeveloperInfoRow from "./DeveloperInfoRow";
import DeveloperOpenRow from "./DeveloperOpenRow";

describe("Developer rows", () => {
  it("should render classic row content", () => {
    render(
      <DeveloperClassicRow title="Debug apps" desc="Enable debug apps" dataTestId="classic-row">
        <span>Toggle control</span>
      </DeveloperClassicRow>,
    );

    expect(screen.getByText("Debug apps")).toBeInTheDocument();
    expect(screen.getByText("Enable debug apps")).toBeInTheDocument();
    expect(screen.getByText("Toggle control")).toBeInTheDocument();
    expect(screen.getByTestId("classic-row")).toBeInTheDocument();
  });

  it("should render info row content", () => {
    render(<DeveloperInfoRow title="User ID" value="abc-123" dataTestId="info-row" />);

    expect(screen.getByText("User ID")).toBeInTheDocument();
    expect(screen.getByText("abc-123")).toBeInTheDocument();
    expect(screen.getByTestId("info-row")).toBeInTheDocument();
  });

  it("should show conditional controls when toggle input row is enabled", () => {
    render(
      <DeveloperToggleInputRow
        title="Catalog URL"
        desc="Use custom catalog URL"
        isEnabled
        onToggle={jest.fn()}
      >
        <span>Input controls</span>
      </DeveloperToggleInputRow>,
    );

    expect(screen.getByText("Input controls")).toBeInTheDocument();
  });

  it("should hide conditional controls when toggle input row is disabled", () => {
    render(
      <DeveloperToggleInputRow
        title="Catalog URL"
        desc="Use custom catalog URL"
        isEnabled={false}
        onToggle={jest.fn()}
      >
        <span>Input controls</span>
      </DeveloperToggleInputRow>,
    );

    expect(screen.queryByText("Input controls")).toBeNull();
  });

  it("should call onToggle when toggle input row switch changes", async () => {
    const onToggle = jest.fn();
    const { user } = render(
      <DeveloperToggleInputRow
        title="Catalog URL"
        desc="Use custom catalog URL"
        isEnabled
        onToggle={onToggle}
      >
        <span>Input controls</span>
      </DeveloperToggleInputRow>,
    );

    await user.click(screen.getByRole("switch"));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("should render expandable row and call onToggle", async () => {
    const onToggle = jest.fn();
    const { user } = render(
      <DeveloperExpandableRow
        title="Feature flags"
        desc="Feature flags description"
        expanded={false}
        onToggle={onToggle}
      />,
    );

    expect(screen.getByText("Feature flags")).toBeInTheDocument();
    expect(screen.getByText("Feature flags description")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /show/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("should call onOpen when open row CTA is clicked", async () => {
    const onOpen = jest.fn();
    const { user } = render(
      <DeveloperOpenRow
        title="Wallet sync"
        desc="Open wallet sync debugger"
        cta="Open"
        onOpen={onOpen}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("should render actions row and trigger each action", async () => {
    const onOpen = jest.fn();
    const onDelete = jest.fn();
    const { user } = render(
      <DeveloperActionsRow
        title="Local app"
        desc="Manage local app"
        actions={[
          { key: "open", label: "Open", onClick: onOpen },
          { key: "delete", label: "Delete", onClick: onDelete, appearance: "red" },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
