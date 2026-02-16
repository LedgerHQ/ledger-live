import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { MainAppLayout } from "./Default";

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

jest.mock("electron", () => ({
  ipcRenderer: { send: jest.fn() },
}));

jest.mock("~/renderer/screens/platform", () => ({
  LiveApp: () => null,
}));

const tourEnabledFlags = {
  lwdWallet40: {
    enabled: true,
    params: { tour: true, mainNavigation: true, marketBanner: true },
  },
};

describe("MainAppLayout", () => {
  describe("Wallet V4 Tour dialog", () => {
    it("should show Wallet V4 Tour dialog when on Portfolio with tour enabled and not seen", async () => {
      render(<MainAppLayout />, {
        initialRoute: "/",
        initialState: {
          settings: {
            hasSeenWalletV4Tour: false,
            overriddenFeatureFlags: tourEnabledFlags,
          },
        },
      });

      await waitFor(() => {
        expect(screen.getByRole("dialog", { name: /wallet v4 tour/i })).toBeInTheDocument();
      });
    });

    it("should not show Wallet V4 Tour dialog when on non-Portfolio page", async () => {
      render(<MainAppLayout />, {
        initialRoute: "/settings",
        initialState: {
          settings: {
            hasSeenWalletV4Tour: false,
            overriddenFeatureFlags: tourEnabledFlags,
          },
        },
      });

      await waitFor(() => {
        expect(screen.queryByRole("dialog", { name: /wallet v4 tour/i })).not.toBeInTheDocument();
      });
    });

    it("should not show Wallet V4 Tour dialog when wallet 40 is disabled", async () => {
      render(<MainAppLayout />, {
        initialRoute: "/",
        initialState: {
          settings: {
            hasSeenWalletV4Tour: false,
            overriddenFeatureFlags: {
              lwdWallet40: { enabled: false, params: {} },
            },
          },
        },
      });

      expect(screen.queryByRole("dialog", { name: /wallet v4 tour/i })).not.toBeInTheDocument();
    });

    it("should not show Wallet V4 Tour dialog when tour already seen", async () => {
      render(<MainAppLayout />, {
        initialRoute: "/",
        initialState: {
          settings: {
            hasSeenWalletV4Tour: true,
            overriddenFeatureFlags: tourEnabledFlags,
          },
        },
      });

      expect(screen.queryByRole("dialog", { name: /wallet v4 tour/i })).not.toBeInTheDocument();
    });
  });

  describe("layout", () => {
    it("should use wallet 40 layout (flex div) when on Portfolio and wallet 40 enabled", async () => {
      const { container } = render(<MainAppLayout />, {
        initialRoute: "/",
        initialState: {
          settings: {
            hasSeenWalletV4Tour: true,
            overriddenFeatureFlags: tourEnabledFlags,
          },
        },
      });

      await waitFor(() => {
        const wallet40Layout = container.querySelector(".bg-canvas.flex.size-full");
        expect(wallet40Layout).toBeInTheDocument();
      });
    });

    it("should use legacy layout (Box) when wallet 40 disabled", async () => {
      const { container } = render(<MainAppLayout />, {
        initialRoute: "/",
        initialState: {
          settings: {
            overriddenFeatureFlags: {
              lwdWallet40: { enabled: false, params: {} },
            },
          },
        },
      });

      const box = container.querySelector("[class*='background']");
      expect(box).toBeInTheDocument();
    });
  });
});
