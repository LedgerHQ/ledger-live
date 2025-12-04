import React from "react";
import { render, screen } from "@testing-library/react";
import { userEvent } from "tests/testSetup";
import { DialogProvider, useDialog } from "./index";

function Trigger() {
  const { openDialog, closeDialog } = useDialog();
  return (
    <div>
      <button
        onClick={() =>
          openDialog(
            <>
              <span data-testid="dialog-content">dialog content</span>
              <button onClick={() => closeDialog()}>manual-close</button>
            </>,
          )
        }
      >
        open
      </button>
    </div>
  );
}

describe("DialogProvider", () => {
  it("opens dialog with provided content", async () => {
    const user = userEvent;
    render(
      <DialogProvider>
        <Trigger />
      </DialogProvider>,
    );

    expect(screen.queryByTestId("dialog-content")).not.toBeInTheDocument();

    await user.click(screen.getByText("open"));

    expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
  });

  it("closes dialog and clears content after animation delay", async () => {
    const user = userEvent;
    render(
      <DialogProvider>
        <Trigger />
      </DialogProvider>,
    );

    await user.click(screen.getByText("open"));

    expect(screen.getByTestId("dialog-content")).toBeInTheDocument();

    await user.click(screen.getByText("manual-close"));

    expect(screen.queryByTestId("dialog-content")).not.toBeInTheDocument();
  });
});
