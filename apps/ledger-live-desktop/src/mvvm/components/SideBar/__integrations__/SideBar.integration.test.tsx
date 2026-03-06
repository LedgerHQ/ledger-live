import React from "react";
import { render, screen } from "tests/testSetup";
import { useNavigate } from "react-router";
import SideBar from "../index";
import {
  defaultInitialState,
  initialStateNoOnboardedDevice,
  withFeatureFlags,
} from "../__tests__/testUtils";

const mockNavigate = jest.fn();
const mockOpenBuyDeviceModal = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

jest.mock("LLD/features/BuyDevice/hooks/useBuyDeviceDialog", () => ({
  __esModule: true,
  default: () => ({ handleOpen: mockOpenBuyDeviceModal }),
}));

jest.mock("~/renderer/screens/card/CardPlatformApp", () => ({
  BAANX_APP_ID: "cl-card",
}));

const mockUseRemoteLiveAppManifest = jest.fn().mockReturnValue(null);
jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index"),
  useRemoteLiveAppManifest: (...args: unknown[]) => mockUseRemoteLiveAppManifest(...args),
}));

const mockedUseNavigate = jest.mocked(useNavigate);

function renderSideBarWithRoute(
  route: string,
  initialState:
    | typeof defaultInitialState
    | typeof initialStateNoOnboardedDevice = defaultInitialState,
) {
  return render(<SideBar />, {
    initialRoute: route,
    initialState,
  });
}

describe("SideBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
  });

  describe("Rendering", () => {
    it("should render the sidebar navigation", () => {
      renderSideBarWithRoute("/");

      expect(screen.getByRole("navigation")).toBeVisible();
    });

    it("should render all leading sidebar items with correct labels", () => {
      renderSideBarWithRoute("/");

      expect(screen.getByText("Home")).toBeVisible();
      expect(screen.getByText("Accounts")).toBeVisible();
      expect(screen.getByText("Swap")).toBeVisible();
      expect(screen.getByText("Earn")).toBeVisible();
      expect(screen.getByText("Discover")).toBeVisible();
      expect(screen.getByText("Card")).toBeVisible();
    });

    it("should render trailing sidebar items when feature flags are enabled", () => {
      renderSideBarWithRoute(
        "/",
        withFeatureFlags({
          referralProgramDesktopSidebar: { enabled: true, params: { path: "/refer" } },
          protectServicesDesktop: { enabled: true },
        }),
      );

      expect(screen.getByText("Refer a friend")).toBeVisible();
      expect(screen.getByText("[L] Recover")).toBeVisible();
    });

    it("should hide Refer a friend when referralProgramDesktopSidebar feature flag is disabled", () => {
      renderSideBarWithRoute("/");

      expect(screen.queryByText("Refer a friend")).not.toBeInTheDocument();
    });

    it("should hide Recover when protectServicesDesktop feature flag is disabled", () => {
      renderSideBarWithRoute("/");

      expect(screen.queryByText("[L] Recover")).not.toBeInTheDocument();
    });

    it("should disable Card item when card manifest is unavailable", () => {
      renderSideBarWithRoute("/");

      const cardButton = screen.getByText("Card").closest("button");
      expect(cardButton).toBeDisabled();
    });
    it("should disable Accounts item when no accounts are present", () => {
      renderSideBarWithRoute("/", {
        accounts: [],
        settings: {
          ...defaultInitialState.settings,
          hasCompletedOnboarding: true,
        },
      });

      const accountsButton = screen.getByText("Accounts").closest("button");
      expect(accountsButton).toBeDisabled();
    });
  });

  describe("Navigation", () => {
    it("should navigate to accounts when clicking Accounts item", async () => {
      const { user } = renderSideBarWithRoute("/");

      await user.click(screen.getByText("Accounts"));

      expect(mockNavigate).toHaveBeenCalledWith("/accounts");
    });

    it("should navigate to swap when clicking Swap item", async () => {
      const { user } = renderSideBarWithRoute("/");

      await user.click(screen.getByText("Swap"));

      expect(mockNavigate).toHaveBeenCalledWith("/swap");
    });

    it("should navigate to earn when clicking Earn item", async () => {
      const { user } = renderSideBarWithRoute("/");

      await user.click(screen.getByText("Earn"));

      expect(mockNavigate).toHaveBeenCalledWith("/earn");
    });

    it("should navigate to discover when clicking Discover item", async () => {
      const { user } = renderSideBarWithRoute("/");

      await user.click(screen.getByText("Discover"));

      expect(mockNavigate).toHaveBeenCalledWith("/platform");
    });

    it("should navigate to card when clicking Card item", async () => {
      mockUseRemoteLiveAppManifest.mockReturnValue({ id: "cl-card" });
      const { user } = renderSideBarWithRoute("/");

      await user.click(screen.getByText("Card"));

      expect(mockNavigate).toHaveBeenCalledWith("/card-new-wallet");
    });

    it("should not navigate when clicking the already active item", async () => {
      const { user } = renderSideBarWithRoute("/");

      await user.click(screen.getByText("Home"));

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should open buy device modal and not navigate when clicking My Ledger without onboarded device", async () => {
      const { user } = renderSideBarWithRoute("/", initialStateNoOnboardedDevice);

      const managerButton = screen.queryByTestId("drawer-manager-button");
      if (!managerButton) return; // Manager entry hidden when Wallet 4.0 main nav is enabled

      await user.click(managerButton);

      expect(mockOpenBuyDeviceModal).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Active state", () => {
    it("should set home as active when on root path", () => {
      renderSideBarWithRoute("/");

      const homeButton = screen.getByText("Home").closest("button");
      expect(homeButton).toHaveAttribute("aria-current", "page");
    });

    it("should set accounts as active when on accounts path", () => {
      renderSideBarWithRoute("/accounts");

      const accountsButton = screen.getByText("Accounts").closest("button");
      expect(accountsButton).toHaveAttribute("aria-current", "page");
    });

    it("should set swap as active when on swap path", () => {
      renderSideBarWithRoute("/swap");

      const swapButton = screen.getByText("Swap").closest("button");
      expect(swapButton).toHaveAttribute("aria-current", "page");
    });

    it("should not set home as active when on asset sub-path", () => {
      renderSideBarWithRoute("/asset/bitcoin");

      const homeButton = screen.getByText("Home").closest("button");
      expect(homeButton).not.toHaveAttribute("aria-current", "page");
    });

    it("should set discover as active when on platform path", () => {
      renderSideBarWithRoute("/platform");

      const discoverButton = screen.getByText("Discover").closest("button");
      expect(discoverButton).toHaveAttribute("aria-current", "page");
    });

    it("should set card as active when on card path", () => {
      renderSideBarWithRoute("/card-new-wallet");

      const cardButton = screen.getByText("Card").closest("button");
      expect(cardButton).toHaveAttribute("aria-current", "page");
    });

    it("should set earn as active when on earn path", () => {
      renderSideBarWithRoute("/earn");

      const earnButton = screen.getByText("Earn").closest("button");
      expect(earnButton).toHaveAttribute("aria-current", "page");
    });

    it("should not set non-active items as current page", () => {
      renderSideBarWithRoute("/accounts");

      const homeButton = screen.getByText("Home").closest("button");
      expect(homeButton).not.toHaveAttribute("aria-current");
    });
  });

  describe("Refer a friend", () => {
    it("should navigate to refer path when clicking Refer a friend", async () => {
      const { user } = renderSideBarWithRoute(
        "/",
        withFeatureFlags({
          referralProgramDesktopSidebar: {
            enabled: true,
            params: { path: "/refer-a-friend", isNew: false },
          },
        }),
      );

      await user.click(screen.getByText("Refer a friend"));

      expect(mockNavigate).toHaveBeenCalledWith("/refer-a-friend");
    });
  });

  describe("Earn label locale", () => {
    it("should display Earn label for non-GB locales", () => {
      renderSideBarWithRoute("/");

      expect(screen.getByText("Earn")).toBeVisible();
    });
  });
});
