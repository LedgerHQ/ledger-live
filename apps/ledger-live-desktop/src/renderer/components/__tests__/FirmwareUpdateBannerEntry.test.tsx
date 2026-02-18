import React from "react";
import { render, screen } from "tests/testSetup";
import FirmwareUpdateBannerEntry from "../FirmwareUpdateBanner";
import type { FirmwareUpdateContext } from "@ledgerhq/types-live";

describe("FirmwareUpdateBannerEntry", () => {
  describe("When wallet40 feature flag is enabled", () => {
    const initialState = (overrides: Record<string, unknown> = {}) => ({
      application: { hasPassword: false },
      accounts: [],
      devices: { currentDevice: null, devices: [] },
      ...overrides,
      settings: {
        discreetMode: false,
        vaultSigner: { enabled: false, host: "", token: "", workspace: "" },
        devicesModelList: [],
        anonymousUserNotifications: {},
        latestFirmware: null as FirmwareUpdateContext | null,
        overriddenFeatureFlags: {
          lwdWallet40: { enabled: true },
        },
        ...(overrides.settings as Record<string, unknown> | undefined),
      },
    });

    describe("when user is not on manager page", () => {
      it("renders nothing when latestFirmware is null", () => {
        render(<FirmwareUpdateBannerEntry />, {
          initialState: initialState(),
        });

        expect(screen.queryByTestId("topbar-os-update-button")).toBeNull();
      });

      it("renders OS update button when latestFirmware is set", () => {
        render(<FirmwareUpdateBannerEntry />, {
          initialState: initialState({
            settings: {
              latestFirmware: {
                osu: {},
                final: { name: "2.2.0" },
                shouldFlashMCU: false,
              },
            },
          }),
          initialRoute: "/",
        });

        expect(screen.getByTestId("topbar-os-update-button")).toBeVisible();
      });

      it("dispatches osUpdateRequested when OS update button is clicked", async () => {
        const { store, user } = render(<FirmwareUpdateBannerEntry />, {
          initialState: initialState({
            settings: {
              latestFirmware: {
                osu: {},
                final: { name: "2.2.0" },
                shouldFlashMCU: false,
              },
            },
          }),
          initialRoute: "/",
        });

        const button = screen.getByTestId("topbar-os-update-button");
        await user.click(button);

        expect(store.getState().manager.osUpdateRequested).toBe(true);
      });
    });

    describe("When user is on manager page", () => {
      it("renders legacy banner with CTA", () => {
        render(<FirmwareUpdateBannerEntry right={<button>OSUpdate</button>} />, {
          initialState: initialState({
            settings: {
              latestFirmware: {
                osu: {},
                final: { name: "2.2.0" },
                shouldFlashMCU: false,
              },
            },
          }),
          initialRoute: "/manager",
        });

        expect(screen.getByTestId("fw-update-banner")).toBeVisible();
      });
    });
  });

  describe("When wallet40 feature flag is disabled", () => {
    const initialState = (overrides: Record<string, unknown> = {}) => ({
      application: { hasPassword: false },
      accounts: [],
      devices: { currentDevice: null, devices: [] },
      ...overrides,
      settings: {
        discreetMode: false,
        vaultSigner: { enabled: false, host: "", token: "", workspace: "" },
        devicesModelList: [],
        anonymousUserNotifications: {},
        latestFirmware: null as FirmwareUpdateContext | null,
        overriddenFeatureFlags: {
          lwdWallet40: { enabled: false },
        },
        ...(overrides.settings as Record<string, unknown> | undefined),
      },
    });

    it("renders nothing when latestFirmware is null and not in manager", () => {
      render(<FirmwareUpdateBannerEntry />, {
        initialState: initialState(),
        initialRoute: "/",
      });
      expect(
        screen.queryByRole("button", { name: /manager\.firmware\.banner\.cta|Update/i }),
      ).toBeNull();
    });

    it("renders legacy banner with CTA when latestFirmware is set and not in manager", () => {
      render(<FirmwareUpdateBannerEntry />, {
        initialState: initialState({
          settings: {
            latestFirmware: {
              osu: {},
              final: { name: "2.2.0" },
              shouldFlashMCU: false,
            },
          },
        }),
        initialRoute: "/",
      });
      const banner = document.getElementById("fw-update-banner");
      expect(banner).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("legacy CTA button triggers onClick without throwing", async () => {
      const { user } = render(<FirmwareUpdateBannerEntry />, {
        initialState: initialState({
          settings: {
            latestFirmware: {
              osu: {},
              final: { name: "2.2.0" },
              shouldFlashMCU: false,
            },
          },
        }),
        initialRoute: "/",
      });
      await user.click(screen.getByRole("button"));
    });
  });
});
