import React from "react";
import { render, screen } from "tests/testSetup";
import UnstakeRequiredModal from "../index";

describe("UnstakeRequiredModal (wrapper)", () => {
  beforeEach(() => {
    const node = document.createElement("div");
    node.id = "modals";
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.getElementById("modals")?.remove();
  });

  it("renders nothing when the modal is closed", () => {
    render(<UnstakeRequiredModal />);
    expect(screen.queryByText(/Unstake before/i)).not.toBeInTheDocument();
  });

  it("renders Body with the supplied data when the modal is open", async () => {
    render(<UnstakeRequiredModal />, {
      initialState: {
        modals: {
          MODAL_TEZOS_UNSTAKE_REQUIRED: {
            isOpened: true,
            data: { reason: "endDelegation" },
          },
        },
      },
    });
    expect(await screen.findByTestId("tezos-unstake-required-close-button")).toBeInTheDocument();
    expect(screen.getByText("Unstake before ending delegation")).toBeInTheDocument();
  });
});
