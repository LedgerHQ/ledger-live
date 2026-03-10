import React from "react";
import { render, screen } from "tests/testSetup";
import FirmwareUpdateBannerEntry from "../FirmwareUpdateBanner";
import type { FirmwareUpdateContext } from "@ledgerhq/types-live";
import { track } from "~/renderer/analytics/segment";

const firmwareWithVersion = (name = "2.2.0") => ({
  osu: {},
  final: { name },
  shouldFlashMCU: false,
});

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
          lwdWallet40: { enabled: true, params: { mainNavigation: true } },
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
            settings: { latestFirmware: firmwareWithVersion() },
          }),
          initialRoute: "/",
        });

        expect(screen.getByTestId("topbar-os-update-button")).toBeVisible();
      });

      it("tracks banner_impression on portfolio page", () => {
        jest.mocked(track).mockClear();
        render(<FirmwareUpdateBannerEntry />, {
          initialState: initialState({
            settings: { latestFirmware: firmwareWithVersion() },
          }),
          initialRoute: "/",
        });

        expect(track).toHaveBeenCalledWith("banner_impression", {
          banner: "OS update",
          page: "portfolio",
        });
      });

      it("tracks button_clicked and navigates when topbar button is clicked", async () => {
        jest.mocked(track).mockClear();
        const { user } = render(<FirmwareUpdateBannerEntry />, {
          initialState: initialState({
            settings: { latestFirmware: firmwareWithVersion() },
          }),
          initialRoute: "/",
        });

        await user.click(screen.getByTestId("topbar-os-update-button"));

        expect(track).toHaveBeenCalledWith("button_clicked", {
          page: "portfolio",
          banner: "OS update",
          button: "click(update)",
        });
      });
    });

    describe("When user is on manager page", () => {
      it("renders new Card banner with update warning and version", () => {
        render(<FirmwareUpdateBannerEntry right={<button>OSUpdate</button>} />, {
          initialState: initialState({
            settings: { latestFirmware: firmwareWithVersion("2.2.0") },
          }),
          initialRoute: "/manager",
        });

        expect(screen.getByTestId("fw-update-banner")).toBeVisible();
        expect(screen.getByText("Ledger OS update available")).toBeVisible();
        expect(screen.getByText("Version 2.2.0")).toBeVisible();
      });

      it("renders old warning text and hides version when old prop is true", () => {
        render(<FirmwareUpdateBannerEntry old right={<button>OSUpdate</button>} />, {
          initialState: initialState({
            settings: { latestFirmware: firmwareWithVersion("2.2.0") },
          }),
          initialRoute: "/manager",
        });

        expect(screen.getByTestId("fw-update-banner")).toBeVisible();
        expect(
          screen.getByText(
            "Device firmware version too old to be updated. Contact Ledger Support for a replacement.",
          ),
        ).toBeVisible();
        expect(screen.queryByText("Version 2.2.0")).toBeNull();
      });

      it("renders custom right content when provided", () => {
        render(<FirmwareUpdateBannerEntry right={<button>CustomCTA</button>} />, {
          initialState: initialState({
            settings: { latestFirmware: firmwareWithVersion() },
          }),
          initialRoute: "/manager",
        });

        expect(screen.getByRole("button", { name: "CustomCTA" })).toBeVisible();
      });

      it("tracks banner_impression on my ledger page", () => {
        jest.mocked(track).mockClear();
        render(<FirmwareUpdateBannerEntry right={<button>OSUpdate</button>} />, {
          initialState: initialState({
            settings: { latestFirmware: firmwareWithVersion() },
          }),
          initialRoute: "/manager",
        });

        expect(track).toHaveBeenCalledWith("banner_impression", {
          banner: "OS update",
          page: "my ledger",
        });
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
      expect(screen.queryByRole("button", { name: /Go to My Ledger/i })).toBeNull();
    });

    it("renders legacy banner with CTA when latestFirmware is set and not in manager", () => {
      render(<FirmwareUpdateBannerEntry />, {
        initialState: initialState({
          settings: { latestFirmware: firmwareWithVersion() },
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
          settings: { latestFirmware: firmwareWithVersion() },
        }),
        initialRoute: "/",
      });
      await user.click(screen.getByRole("button"));
    });
  });
});
