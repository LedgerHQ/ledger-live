import React from "react";
import { render, screen } from "@tests/test-renderer";
import { UpdateProgressScreen } from ".";

describe("UpdateProgressScreen", () => {
  it("shows the update title, the update count and the progress", () => {
    render(
      <UpdateProgressScreen
        productName="Ledger Stax"
        progress={0.5}
        isRestoring={false}
        update={{ index: 2, count: 3 }}
      />,
    );

    expect(screen.getByText("Updating your Ledger Stax")).toBeVisible();
    expect(screen.getByText("Update 2 of 3")).toBeVisible();
    expect(screen.getByTestId("os-update-progress-bar").props.accessibilityValue).toMatchObject({
      now: 50,
    });
  });

  it("shows the index as soon as there are two updates", () => {
    render(
      <UpdateProgressScreen
        productName="Ledger Stax"
        progress={0.2}
        isRestoring={false}
        update={{ index: 1, count: 2 }}
      />,
    );

    expect(screen.getByText("Update 1 of 2")).toBeVisible();
  });

  it.each([
    [0, 0],
    [1, 1],
  ])("only shows the progress bar, without the index, for %s/%s update(s)", (index, count) => {
    render(
      <UpdateProgressScreen
        productName="Ledger Stax"
        progress={0.3}
        isRestoring={false}
        update={{ index, count }}
      />,
    );

    expect(screen.getByText("Updating your Ledger Stax")).toBeVisible();
    expect(screen.queryByText(/Update \d+ of \d+/)).toBeNull();
    expect(screen.getByTestId("os-update-progress-bar").props.accessibilityValue).toMatchObject({
      now: 30,
    });
  });

  it("shows the restore title and no update count when restoring", () => {
    render(<UpdateProgressScreen productName="Ledger Stax" progress={0.1} isRestoring />);

    expect(screen.getByText("Restoring your apps and settings")).toBeVisible();
    expect(screen.queryByText(/Update \d+ of \d+/)).toBeNull();
  });
});
