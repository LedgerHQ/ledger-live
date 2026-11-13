import React from "react";
import { initState } from "@ledgerhq/live-common/apps/logic";
import { deviceInfo155, mockListAppsResult } from "@ledgerhq/live-common/apps/mock";
import { render, screen } from "@tests/test-renderer";
import AppInstallButton from "../AppInstallButton";
import { AppsInstallUninstallWithDependenciesContextProvider } from "../../AppsInstallUninstallWithDependenciesContext";

const renderButton = (appName: string, installed = "") => {
  const state = initState(
    mockListAppsResult("Bitcoin, Ethereum, Polygon", installed, deviceInfo155),
  );
  const app = state.apps.find(({ name }) => name === appName)!;
  const context = {
    setAppWithDependenciesToInstall: jest.fn(),
    setAppWithDependentsToUninstall: jest.fn(),
    installApp: jest.fn(),
  };
  const storageWarning = jest.fn();
  const view = render(
    <AppsInstallUninstallWithDependenciesContextProvider value={context}>
      <AppInstallButton
        app={app}
        state={state}
        notEnoughMemoryToInstall={false}
        storageWarning={storageWarning}
      />
    </AppsInstallUninstallWithDependenciesContextProvider>,
  );
  return { ...view, app, context };
};

describe("AppInstallButton", () => {
  it("installs an app without dependencies through installApp (community disclaimer)", async () => {
    const { user, app, context } = renderButton("Bitcoin");

    await user.press(screen.getByTestId("app-Bitcoin-notInstalled"));

    expect(context.installApp).toHaveBeenCalledWith(app);
    expect(context.setAppWithDependenciesToInstall).not.toHaveBeenCalled();
  });

  it("asks for the dependencies first, the disclaimer comes after them", async () => {
    const { user, context } = renderButton("Polygon");

    await user.press(screen.getByTestId("app-Polygon-notInstalled"));

    expect(context.setAppWithDependenciesToInstall).toHaveBeenCalled();
    expect(context.installApp).not.toHaveBeenCalled();
  });
});
