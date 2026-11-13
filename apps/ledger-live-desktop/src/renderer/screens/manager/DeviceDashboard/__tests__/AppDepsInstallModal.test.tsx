import React from "react";
import type { App } from "@ledgerhq/types-live";
import { render, screen } from "tests/testSetup";
import AppDepsInstallModal from "../AppDepsInstallModal";

// oxlint-disable-next-line typescript/consistent-type-assertions
const app = { name: "Polygon", icon: "polygon" } as App;
// oxlint-disable-next-line typescript/consistent-type-assertions
const ethereum = { name: "Ethereum", icon: "ethereum" } as App;

describe("AppDepsInstallModal", () => {
  beforeEach(() => {
    const modals = document.createElement("div");
    modals.id = "modals";
    document.body.appendChild(modals);
  });
  afterEach(() => {
    document.getElementById("modals")?.remove();
  });

  it("hands the app over to installApp so the community disclaimer comes after it", async () => {
    const dispatch = jest.fn();
    const installApp = jest.fn();
    const onClose = jest.fn();
    const { user } = render(
      <AppDepsInstallModal
        app={app}
        dependencies={[ethereum]}
        dispatch={dispatch}
        installApp={installApp}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByTestId("modal-confirm-button"));

    expect(onClose).toHaveBeenCalled();
    expect(installApp).toHaveBeenCalledWith(app);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("installs directly when no installApp is given", async () => {
    const dispatch = jest.fn();
    const { user } = render(
      <AppDepsInstallModal
        app={app}
        dependencies={[ethereum]}
        dispatch={dispatch}
        onClose={jest.fn()}
      />,
    );

    await user.click(screen.getByTestId("modal-confirm-button"));

    expect(dispatch).toHaveBeenCalledWith({ type: "install", name: "Polygon" });
  });
});
