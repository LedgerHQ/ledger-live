import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import Default from "../Default";

jest.mock("electron", () => {
  const base = jest.requireActual<typeof import("../../../tests/mocks/electron")>(
    "../../../tests/mocks/electron",
  );
  return {
    ...base.default,
    ipcRenderer: {
      ...base.ipcRenderer,
      removeListener: jest.fn(),
    },
  };
});

jest.mock("~/renderer/store", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
  },
}));

jest.mock("../components/FirmwareUpdateBanner", () => ({
  __esModule: true,
  default: () => <div data-testid="firmware-update-banner-entry">FirmwareUpdateBannerEntry</div>,
}));

jest.mock("~/renderer/screens/dashboard", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () => React.createElement("div", { "data-testid": "dashboard-screen" }, "Dashboard"),
  };
});

jest.mock("@braze/web-sdk", () => ({
  getCachedContentCards: () => ({ cards: [] }),
  initialize: () => true,
  changeUser: () => {},
  requestContentCardsRefresh: () => {},
  subscribeToContentCardsUpdates: () => () => {},
  automaticallyShowInAppMessages: () => {},
  openSession: () => {},
  logCardDismissal: () => {},
  logContentCardClick: () => {},
}));

jest.mock("LLD/features/AppBlockers/components/AppVersionBlocker", () => {
  const React = require("react");
  return { AppVersionBlocker: ({ children }: { children: React.ReactNode }) => <>{children}</> };
});

jest.mock("~/renderer/components/IsNewVersion", () => () => null);

jest.mock("~/renderer/analytics/segment", () => ({
  updateIdentify: jest.fn(),
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
