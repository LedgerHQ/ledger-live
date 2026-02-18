import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import Default from "../Default";

jest.mock("electron", () => {
  const base = jest.requireActual<typeof import("../../../tests/mocks/electron")>(
    "../../../tests/mocks/electron",
  );
  return {
    ipcRenderer: {
      ...base.ipcRenderer,
      removeListener: jest.fn(),
    },
  };
});

jest.mock("~/renderer/store", () => ({}));

jest.mock("../components/FirmwareUpdateBanner", () => ({
  __esModule: true,
  default: () => <div data-testid="firmware-update-banner-entry">FirmwareUpdateBannerEntry</div>,
}));

jest.mock("@braze/web-sdk", () => ({
  getCachedContentCards: () => ({ cards: [] }),
}));

jest.mock("LLD/features/AppBlockers/components/AppVersionBlocker", () => {
  const React = require("react");
  return { AppVersionBlocker: ({ children }: { children: React.ReactNode }) => <>{children}</> };
});

jest.mock("~/renderer/components/IsNewVersion", () => () => null);

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
  useTrack: () => jest.fn(),
}));

describe("Default", () => {
  beforeAll(() => {
    Element.prototype.scrollTo = jest.fn();
  });

  afterAll(() => {
    delete (Element.prototype as { scrollTo?: unknown }).scrollTo;
  });

  it("renders FirmwareUpdateBannerEntry in main layout when shouldDisplayWallet40MainNav is false", async () => {
    render(<Default />, {
      initialState: {
        devices: { currentDevice: null, devices: [] },
        settings: {
          hasCompletedOnboarding: true,
          vaultSigner: { enabled: false, host: "", token: "", workspace: "" },
          devicesModelList: [],
          anonymousUserNotifications: {},
          overriddenFeatureFlags: {},
          orderAccounts: "balance|desc",
        },
      },
      initialRoute: "/",
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("firmware-update-banner-entry")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
});
