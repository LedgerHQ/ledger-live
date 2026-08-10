import React from "react";
import { render, screen } from "tests/testSetup";
import ModularDialogRoot from "../ModularDialogRoot";

describe("ModularDialogRoot", () => {
  it("should not render the global dialog for embedded presentation", () => {
    render(<ModularDialogRoot />, {
      initialState: {
        modularDialog: {
          isOpen: true,
          dialogParams: {
            presentation: "embedded",
          },
        },
      },
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
