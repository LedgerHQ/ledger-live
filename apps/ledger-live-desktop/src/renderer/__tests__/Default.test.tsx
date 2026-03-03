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

jest.mock("@braze/web-sdk", () => ({
  getCachedContentCards: () => ({ cards: [] }),
}));

jest.mock("LLD/features/AppBlockers/components/AppVersionBlocker", () => {
  return { AppVersionBlocker: ({ children }: { children: React.ReactNode }) => <>{children}</> };
});

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
          lastUsedVersion: __APP_VERSION__,
          vaultSigner: { enabled: false, host: "", token: "", workspace: "" },
          devicesModelList: [],
          anonymousUserNotifications: {},
          overriddenFeatureFlags: {},
          orderAccounts: "balance|desc",
          latestFirmware: { final: { name: "2.3.0" } },
        },
      },
      initialRoute: "/",
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("fw-update-banner")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
});
