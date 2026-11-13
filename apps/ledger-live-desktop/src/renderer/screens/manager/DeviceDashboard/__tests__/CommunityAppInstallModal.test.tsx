import React from "react";
import type { App } from "@ledgerhq/types-live";
import { render, screen } from "tests/testSetup";
import CommunityAppInstallModal from "../CommunityAppInstallModal";

// oxlint-disable-next-line typescript/consistent-type-assertions
const cardano = { name: "Cardano ADA", authorName: "Vacuumlabs" } as App;

describe("CommunityAppInstallModal", () => {
  // Modals render in the #modals portal of the app shell
  beforeEach(() => {
    const modals = document.createElement("div");
    modals.id = "modals";
    document.body.appendChild(modals);
  });
  afterEach(() => {
    document.getElementById("modals")?.remove();
  });

  it("renders nothing without a community app to install", () => {
    render(<CommunityAppInstallModal dispatch={jest.fn()} onClose={jest.fn()} />);
    expect(screen.queryByTestId("manager-community-install-disclaimer")).toBeNull();
  });

  it("shows the disclaimer and installs the app on confirm", async () => {
    const dispatch = jest.fn();
    const onClose = jest.fn();
    const { user } = render(
      <CommunityAppInstallModal app={cardano} dispatch={dispatch} onClose={onClose} />,
    );

    expect(screen.getByText("Community app")).toBeVisible();
    expect(screen.getByTestId("manager-community-install-disclaimer")).toHaveTextContent(
      "Ledger does not develop, review, audit, endorse or maintain these applications",
    );

    await user.click(screen.getByTestId("modal-confirm-button"));

    expect(dispatch).toHaveBeenCalledWith({ type: "install", name: "Cardano ADA" });
    expect(onClose).toHaveBeenCalled();
  });

  it("cancels the install", async () => {
    const dispatch = jest.fn();
    const onClose = jest.fn();
    const { user } = render(
      <CommunityAppInstallModal app={cardano} dispatch={dispatch} onClose={onClose} />,
    );

    await user.click(screen.getByTestId("modal-cancel-button"));

    expect(dispatch).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
