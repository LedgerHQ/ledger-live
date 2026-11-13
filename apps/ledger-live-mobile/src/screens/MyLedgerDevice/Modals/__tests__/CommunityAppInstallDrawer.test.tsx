import React from "react";
import type { App } from "@ledgerhq/types-live";
import { render, screen } from "@tests/test-renderer";
import CommunityAppInstallDrawer from "../CommunityAppInstallDrawer";

// oxlint-disable-next-line typescript/consistent-type-assertions
const cardano = { name: "Cardano ADA", authorName: "Vacuumlabs" } as App;

describe("CommunityAppInstallDrawer", () => {
  it("is not shown without a community app to install", () => {
    render(<CommunityAppInstallDrawer app={null} onInstall={jest.fn()} onClose={jest.fn()} />);
    expect(screen.queryByTestId("manager-community-install-disclaimer")).toBeNull();
  });

  it("shows the disclaimer and installs on confirm", async () => {
    const onInstall = jest.fn();
    const { user } = render(
      <CommunityAppInstallDrawer app={cardano} onInstall={onInstall} onClose={jest.fn()} />,
    );

    expect(await screen.findByText("Community app")).toBeVisible();
    expect(
      screen.getByText(/Ledger does not develop, review, audit, endorse or maintain/),
    ).toBeVisible();

    await user.press(screen.getByTestId("community-install-confirm"));
    expect(onInstall).toHaveBeenCalled();
  });

  it("cancels with Don't install", async () => {
    const onInstall = jest.fn();
    const onClose = jest.fn();
    const { user } = render(
      <CommunityAppInstallDrawer app={cardano} onInstall={onInstall} onClose={onClose} />,
    );

    await user.press(await screen.findByText("Don't install"));
    expect(onClose).toHaveBeenCalled();
    expect(onInstall).not.toHaveBeenCalled();
  });
});
