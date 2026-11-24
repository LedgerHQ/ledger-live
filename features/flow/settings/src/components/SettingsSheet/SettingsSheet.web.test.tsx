import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsSheet } from "./SettingsSheet";

describe("SettingsSheet", () => {
  it("shows the title, the description and the content when open", () => {
    render(
      <SettingsSheet
        isOpen
        title="Select your region"
        description="Updates date and number formats"
        onClose={jest.fn()}
        testID="region-sheet"
      >
        <p>Algeria</p>
      </SettingsSheet>,
    );

    expect(screen.getByTestId("region-sheet")).toBeInTheDocument();
    expect(screen.getByText("Select your region")).toBeInTheDocument();
    expect(screen.getByText("Updates date and number formats")).toBeInTheDocument();
    expect(screen.getByText("Algeria")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    render(
      <SettingsSheet isOpen={false} title="Select your region" onClose={jest.fn()} testID="sheet">
        <p>Algeria</p>
      </SettingsSheet>,
    );

    expect(screen.queryByTestId("sheet")).not.toBeInTheDocument();
    expect(screen.queryByText("Algeria")).not.toBeInTheDocument();
  });

  it("closes from its close button", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<SettingsSheet isOpen title="Select your region" onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close while it cannot close", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<SettingsSheet isOpen title="Select your region" onClose={onClose} canClose={false} />);

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).not.toHaveBeenCalled();
  });
});
