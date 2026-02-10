import React from "react";
import { screen, render } from "@tests/test-renderer";
import { DeeplinkInstallAppDrawer } from "../components/InstallDrawer";

const TEST_APP_MAP: Record<string, object> = {
  Bitcoin: { appName: "Bitcoin", displayName: "Bitcoin", analyticsName: "bitcoin" },
  RecoveryKeyUpdater: {
    appName: "Recovery Key Updater",
    displayName: "Recovery Key Updater",
    confirmationDescriptionKey: "deeplinkInstallApp.confirmation.recoveryKeyDescription",
    successDescriptionKey: "deeplinkInstallApp.success.recoveryKeyDescription",
    analyticsName: "recovery_key_updater",
  },
};

jest.mock("../constants/appInstallMap", () => ({
  getAppInstallConfig: (appKey: string) => TEST_APP_MAP[appKey] ?? null,
  isValidInstallApp: (appKey: string) => appKey in TEST_APP_MAP,
}));

describe("DeeplinkInstallAppDrawer", () => {
  it("should not render when drawer is closed", () => {
    render(<DeeplinkInstallAppDrawer />, {
      overrideInitialState: state => ({
        ...state,
        deeplinkInstallApp: {
          isDrawerOpen: false,
          appToInstall: "RecoveryKeyUpdater",
          selectedDevice: null,
        },
      }),
    });

    expect(screen.queryByText(/Install Recovery Key Updater/i)).toBeNull();
  });

  it("should render when drawer is open with valid app", () => {
    render(<DeeplinkInstallAppDrawer />, {
      overrideInitialState: state => ({
        ...state,
        deeplinkInstallApp: {
          isDrawerOpen: true,
          appToInstall: "RecoveryKeyUpdater",
          selectedDevice: null,
        },
      }),
    });

    expect(screen.getAllByText(/Install Recovery Key Updater/i).length).toBeGreaterThan(0);
  });

  it("should not render when drawer is open with invalid app", () => {
    render(<DeeplinkInstallAppDrawer />, {
      overrideInitialState: state => ({
        ...state,
        deeplinkInstallApp: {
          isDrawerOpen: true,
          appToInstall: "InvalidApp",
          selectedDevice: null,
        },
      }),
    });

    expect(screen.queryByText(/Install/i)).toBeNull();
  });
});
