import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { DeeplinkInstallAppDrawer } from "../components/InstallDrawer";
import { State } from "~/reducers/types";

describe("DeeplinkInstallApp", () => {
  const defaultState: Partial<State> = {
    deeplinkInstallApp: {
      isDrawerOpen: false,
      appToInstall: null,
      selectedDevice: null,
    },
  };

  describe("DeeplinkInstallAppDrawer", () => {
    it("should not render when drawer is closed", () => {
      render(<DeeplinkInstallAppDrawer />, {
        overrideInitialState: state => ({
          ...state,
          ...defaultState,
        }),
      });

      // Drawer content should not be visible when closed
      expect(screen.queryByText("Install App")).toBeNull();
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

      // Should show the app name in the intro
      expect(screen.getByText(/Install Recovery Key Updater/i)).toBeTruthy();
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

      // Should not render anything for invalid app
      expect(screen.queryByText("Install App")).toBeNull();
    });
  });
});
