import { useAccountPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import { ActionsList } from "..";
import ContextMenuContext from "../../ContextMenuContext";
import { MY_WALLET_TRACKING_BUTTON, MY_WALLET_TRACKING_PAGE_NAME } from "../../../constants";

const HELP_LABEL = "Help";
const RECOVER_LABEL = "[L] Recover";
const BACKUP_LABEL = "Backup";
const REFER_LABEL = "Referral";
const MY_WALLET_ROUTE = "/my-wallet";
const REFER_PATH = "/refer-a-friend";

const mockNavigate = jest.fn();
const mockClose = jest.fn();
const mockNavigateTo = jest.fn();
const mockGoBack = jest.fn();
const mockOnRecoverClick = jest.fn();

jest.mock("@ledgerhq/live-common/hooks/recoverFeatureFlag", () => ({
  useAccountPath: jest.fn(),
}));

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
  resetStore: jest.fn(),
}));

const mockUseAccountPath = jest.mocked(useAccountPath);
const mockTrack = jest.mocked(track);

const protectEnabled = withFlagOverrides({
  protectServicesDesktop: {
    enabled: true,
    params: { protectId: "protect-id" },
  },
});

const backupHubEnabled = withFlagOverrides({
  protectServicesDesktop: {
    enabled: true,
    params: { protectId: "protect-id" },
  },
  lwdBackupHub: { enabled: true },
});

const renderActionsList = (options?: Parameters<typeof render>[1]) =>
  render(
    <ContextMenuContext.Provider
      value={{
        close: mockClose,
        view: "myWallet",
        direction: "forward",
        navigateTo: mockNavigateTo,
        goBack: mockGoBack,
      }}
    >
      <ActionsList onRecoverClick={mockOnRecoverClick} />
    </ContextMenuContext.Provider>,
    options,
  );
const getButton = (name: string) => screen.getByRole("button", { name });

describe("ActionsList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccountPath.mockReturnValue(undefined);
  });

  it("shows only help by default", () => {
    renderActionsList();

    expect(screen.getByTestId("my-wallet-actions-list")).toBeVisible();
    expect(getButton(HELP_LABEL)).toBeVisible();
  });

  it("shows recover when the feature is enabled", () => {
    renderActionsList({ initialState: protectEnabled });

    expect(getButton(RECOVER_LABEL)).toBeVisible();
  });

  it("relabels the tile to Backup when the Backup Hub flag is enabled", () => {
    renderActionsList({ initialState: backupHubEnabled });

    expect(getButton(BACKUP_LABEL)).toBeVisible();
    expect(screen.queryByRole("button", { name: RECOVER_LABEL })).not.toBeInTheDocument();
  });

  it("fires the injected onRecoverClick callback without navigating itself", async () => {
    const { user } = renderActionsList({
      initialState: withFlagOverrides({
        protectServicesDesktop: {
          enabled: true,
          params: { openRecoverFromSidebar: true, protectId: "protect-id" },
        },
      }),
    });

    await user.click(getButton(RECOVER_LABEL));

    expect(mockOnRecoverClick).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });

  it("navigates to help settings and tracks the click", async () => {
    const { user } = renderActionsList({ initialRoute: MY_WALLET_ROUTE });

    await user.click(getButton(HELP_LABEL));

    expect(mockNavigate).toHaveBeenCalledWith("/settings/help");
    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: MY_WALLET_TRACKING_BUTTON.help,
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });
  });

  it("shows refer when the feature is enabled", () => {
    renderActionsList({
      initialState: withFlagOverrides({
        referralProgramDesktopSidebar: {
          enabled: true,
          params: { path: REFER_PATH },
        },
      }),
    });

    expect(getButton(REFER_LABEL)).toBeVisible();
  });

  it("navigates to the refer path and tracks the click", async () => {
    const { user } = renderActionsList({
      initialRoute: MY_WALLET_ROUTE,
      initialState: withFlagOverrides({
        referralProgramDesktopSidebar: {
          enabled: true,
          params: { path: REFER_PATH },
        },
      }),
    });

    await user.click(getButton(REFER_LABEL));

    expect(mockNavigate).toHaveBeenCalledWith(REFER_PATH);
    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: MY_WALLET_TRACKING_BUTTON.referral,
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });
  });
});
