import React from "react";
import { render, screen } from "@tests/test-renderer";
import { UpdateProgressScreen } from ".";

const UPDATING_DESCRIPTION =
  "Your Ledger Stax will restart automatically multiple times and you will be asked to unlock it with your PIN during installation.";

describe("UpdateProgressScreen", () => {
  it("shows the update index, the updating description and the progress", () => {
    render(
      <UpdateProgressScreen
        productName="Ledger Stax"
        progress={0.5}
        isRestoring={false}
        update={{ index: 2, count: 3 }}
      />,
    );

    expect(screen.getByText("Update 2/3")).toBeVisible();
    expect(screen.getByText(UPDATING_DESCRIPTION)).toBeVisible();
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

    expect(screen.getByText("Update 1/2")).toBeVisible();
  });

  it.each([
    [0, 0],
    [1, 1],
  ])("shows no title for %s/%s update(s)", (index, count) => {
    render(
      <UpdateProgressScreen
        productName="Ledger Stax"
        progress={0.3}
        isRestoring={false}
        update={{ index, count }}
      />,
    );

    expect(screen.queryByText(/Update \d+\/\d+/)).toBeNull();
    expect(screen.getByText(UPDATING_DESCRIPTION)).toBeVisible();
    expect(screen.getByTestId("os-update-progress-bar").props.accessibilityValue).toMatchObject({
      now: 30,
    });
  });

  it("shows the restore title and description, without the update index, when restoring", () => {
    render(
      <UpdateProgressScreen
        productName="Ledger Stax"
        progress={0.1}
        isRestoring
        update={{ index: 2, count: 3 }}
      />,
    );

    expect(screen.getByText("Reinstalling your settings...")).toBeVisible();
    expect(
      screen.getByText("Almost done. Your settings are being reinstalled on your Ledger Stax."),
    ).toBeVisible();
    expect(screen.queryByText(/Update \d+\/\d+/)).toBeNull();
  });
});
